"""Small async document store backed by Postgres.

The API was originally written against MongoDB.  Keeping this adapter narrow
lets the production deployment use Neon without changing the public API or the
admin data model.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Any, Iterable

from psycopg.rows import dict_row
from psycopg.types.json import Jsonb
from psycopg_pool import AsyncConnectionPool


@dataclass
class WriteResult:
    matched_count: int = 0
    deleted_count: int = 0


def _matches(document: dict[str, Any], query: dict[str, Any]) -> bool:
    for key, expected in query.items():
        actual = document.get(key)
        if isinstance(expected, dict) and "$ne" in expected:
            if actual == expected["$ne"]:
                return False
        elif actual != expected:
            return False
    return True


def _project(document: dict[str, Any], projection: dict[str, int] | None) -> dict[str, Any]:
    if not projection:
        return dict(document)
    included = {key for key, enabled in projection.items() if enabled and key != "_id"}
    if included:
        return {key: document[key] for key in included if key in document}
    return {key: value for key, value in document.items() if projection.get(key, 1)}


class PostgresCursor:
    def __init__(self, collection: "PostgresCollection", query: dict[str, Any], projection: dict[str, int] | None):
        self.collection = collection
        self.query = query
        self.projection = projection
        self.sort_fields: list[tuple[str, int]] = []

    def sort(self, fields: str | Iterable[tuple[str, int]], direction: int = 1) -> "PostgresCursor":
        self.sort_fields = [(fields, direction)] if isinstance(fields, str) else list(fields)
        return self

    async def to_list(self, limit: int) -> list[dict[str, Any]]:
        documents = await self.collection._all_documents()
        documents = [document for document in documents if _matches(document, self.query)]
        for field, direction in reversed(self.sort_fields):
            documents.sort(key=lambda document: (document.get(field) is None, document.get(field)), reverse=direction < 0)
        return [_project(document, self.projection) for document in documents[:limit]]


class PostgresCollection:
    def __init__(self, store: "PostgresStore", name: str):
        self.store = store
        self.name = name

    async def _all_documents(self) -> list[dict[str, Any]]:
        async with self.store.pool.connection() as connection:
            async with connection.cursor(row_factory=dict_row) as cursor:
                await cursor.execute("select data from documents where collection = %s", (self.name,))
                return [row["data"] for row in await cursor.fetchall()]

    async def count_documents(self, query: dict[str, Any]) -> int:
        return sum(1 for document in await self._all_documents() if _matches(document, query))

    async def find_one(self, query: dict[str, Any], projection: dict[str, int] | None = None) -> dict[str, Any] | None:
        for document in await self._all_documents():
            if _matches(document, query):
                return _project(document, projection)
        return None

    def find(self, query: dict[str, Any], projection: dict[str, int] | None = None) -> PostgresCursor:
        return PostgresCursor(self, query, projection)

    async def insert_one(self, document: dict[str, Any]) -> WriteResult:
        stored = dict(document)
        document_id = str(stored.get("_id") or stored.get("id") or uuid.uuid4())
        async with self.store.pool.connection() as connection:
            await connection.execute(
                "insert into documents (collection, document_id, data) values (%s, %s, %s)",
                (self.name, document_id, Jsonb(stored)),
            )
        return WriteResult(matched_count=1)

    async def insert_many(self, documents: Iterable[dict[str, Any]]) -> WriteResult:
        count = 0
        for document in documents:
            await self.insert_one(document)
            count += 1
        return WriteResult(matched_count=count)

    async def update_one(self, query: dict[str, Any], update: dict[str, Any], upsert: bool = False) -> WriteResult:
        current = await self.find_one(query)
        if current is None:
            if not upsert:
                return WriteResult()
            current = dict(query)
        current.update(update.get("$set", {}))
        document_id = str(current.get("_id") or current.get("id") or uuid.uuid4())
        async with self.store.pool.connection() as connection:
            await connection.execute(
                """
                insert into documents (collection, document_id, data)
                values (%s, %s, %s)
                on conflict (collection, document_id)
                do update set data = excluded.data, updated_at = now()
                """,
                (self.name, document_id, Jsonb(current)),
            )
        return WriteResult(matched_count=1)

    async def update_many(self, query: dict[str, Any], update: dict[str, Any]) -> WriteResult:
        matches = [document for document in await self._all_documents() if _matches(document, query)]
        for document in matches:
            await self.update_one({"id": document.get("id"), "_id": document.get("_id")}, update)
        return WriteResult(matched_count=len(matches))

    async def delete_one(self, query: dict[str, Any]) -> WriteResult:
        document = await self.find_one(query)
        if document is None:
            return WriteResult()
        document_id = str(document.get("_id") or document.get("id"))
        async with self.store.pool.connection() as connection:
            result = await connection.execute(
                "delete from documents where collection = %s and document_id = %s",
                (self.name, document_id),
            )
        return WriteResult(deleted_count=result.rowcount)

    async def delete_many(self, query: dict[str, Any]) -> WriteResult:
        matches = [document for document in await self._all_documents() if _matches(document, query)]
        deleted = 0
        for document in matches:
            result = await self.delete_one({"id": document.get("id"), "_id": document.get("_id")})
            deleted += result.deleted_count
        return WriteResult(deleted_count=deleted)

    async def create_index(self, *args: Any, **kwargs: Any) -> None:
        # The shared table already has a composite primary key and a GIN index.
        return None


class PostgresStore:
    def __init__(self, dsn: str):
        self.pool = AsyncConnectionPool(
            conninfo=dsn,
            min_size=0,
            max_size=5,
            open=False,
            kwargs={"autocommit": True},
        )

    def __getattr__(self, name: str) -> PostgresCollection:
        if name.startswith("_"):
            raise AttributeError(name)
        return PostgresCollection(self, name)

    async def initialize(self) -> None:
        await self.pool.open(wait=True)
        async with self.pool.connection() as connection:
            await connection.execute(
                """
                create table if not exists documents (
                    collection text not null,
                    document_id text not null,
                    data jsonb not null,
                    updated_at timestamptz not null default now(),
                    primary key (collection, document_id)
                )
                """
            )
            await connection.execute(
                "create index if not exists documents_data_gin on documents using gin (data jsonb_path_ops)"
            )
            await connection.execute(
                """
                create table if not exists uploaded_images (
                    id text primary key,
                    filename text not null,
                    content_type text not null,
                    size integer not null,
                    content bytea not null,
                    created_at timestamptz not null default now()
                )
                """
            )

    async def command(self, command: str) -> dict[str, int]:
        if command != "ping":
            raise ValueError(f"Unsupported database command: {command}")
        async with self.pool.connection() as connection:
            await connection.execute("select 1")
        return {"ok": 1}

    async def save_upload(self, upload_id: str, filename: str, content_type: str, content: bytes) -> None:
        async with self.pool.connection() as connection:
            await connection.execute(
                "insert into uploaded_images (id, filename, content_type, size, content) values (%s, %s, %s, %s, %s)",
                (upload_id, filename, content_type, len(content), content),
            )

    async def get_upload(self, upload_id: str) -> dict[str, Any] | None:
        async with self.pool.connection() as connection:
            async with connection.cursor(row_factory=dict_row) as cursor:
                await cursor.execute(
                    "select filename, content_type, size, content from uploaded_images where id = %s",
                    (upload_id,),
                )
                return await cursor.fetchone()

    async def close(self) -> None:
        await self.pool.close()
