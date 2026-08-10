"""Unit tests for admin credential storage and recovery codes.

These run against an in-memory stand-in for the document store, so no Neon
connection (and no production data) is involved.
"""

import pytest

from backend.admin_auth import (
    AdminCredentialStore,
    generate_recovery_code,
    hash_secret,
    normalize_recovery_code,
    verify_secret,
)


class FakeCollection:
    def __init__(self):
        self.documents: dict[str, dict] = {}

    async def find_one(self, query):
        return self.documents.get(query["_id"])

    async def insert_one(self, document):
        self.documents[document["_id"]] = dict(document)

    async def update_one(self, query, update):
        document = self.documents.setdefault(query["_id"], {"_id": query["_id"]})
        document.update(update.get("$set", {}))


class FakeDb:
    def __init__(self):
        self.admin_credentials = FakeCollection()


@pytest.fixture
def store():
    return AdminCredentialStore(FakeDb(), "karan", "seed-password-123")


# ---------- hashing ----------

def test_hash_is_salted_and_verifies():
    first = hash_secret("hunter2-hunter2")
    second = hash_secret("hunter2-hunter2")
    assert first != second, "each hash must use a fresh salt"
    assert verify_secret("hunter2-hunter2", first)
    assert verify_secret("hunter2-hunter2", second)


def test_hash_rejects_wrong_and_malformed_input():
    encoded = hash_secret("correct-horse-battery")
    assert not verify_secret("wrong-horse-battery", encoded)
    assert not verify_secret("anything", None)
    assert not verify_secret("anything", "")
    assert not verify_secret("anything", "not-an-encoded-hash")
    assert not verify_secret("anything", "md5$1$abc$def")


def test_recovery_codes_are_grouped_and_normalized():
    code = generate_recovery_code()
    assert len(code.split("-")) == 4
    # Retyped in lowercase, with spaces and no dashes, must still match.
    assert normalize_recovery_code(code.lower().replace("-", " ")) == normalize_recovery_code(code)


# ---------- credential store ----------

@pytest.mark.asyncio
async def test_seeds_from_environment_once(store):
    first = await store.ensure_seeded()
    assert await store.verify_password("seed-password-123")

    # A second call must not re-hash and overwrite an updated password.
    await store.set_password("a-brand-new-password")
    second = await store.ensure_seeded()
    assert second["password_hash"] != first["password_hash"]
    assert await store.verify_password("a-brand-new-password")
    assert not await store.verify_password("seed-password-123")


@pytest.mark.asyncio
async def test_reset_with_valid_code_changes_password(store):
    code = await store.issue_recovery_code()
    assert await store.has_recovery_code()

    assert await store.reset_password_with_code(code, "recovered-password-1")
    assert await store.verify_password("recovered-password-1")


@pytest.mark.asyncio
async def test_recovery_code_is_single_use(store):
    code = await store.issue_recovery_code()
    assert await store.reset_password_with_code(code, "recovered-password-1")

    # Replaying the same code must not work, and must not change the password.
    assert not await store.reset_password_with_code(code, "attacker-password-9")
    assert await store.verify_password("recovered-password-1")
    assert not await store.has_recovery_code()


@pytest.mark.asyncio
async def test_wrong_code_leaves_password_intact(store):
    await store.issue_recovery_code()
    assert not await store.reset_password_with_code("AAAAA-BBBBB-CCCCC-DDDDD", "attacker-password-9")
    assert await store.verify_password("seed-password-123")
    assert await store.has_recovery_code(), "a failed attempt must not burn the code"


@pytest.mark.asyncio
async def test_reset_accepts_loosely_typed_code(store):
    code = await store.issue_recovery_code()
    typed = code.lower().replace("-", "")
    assert await store.reset_password_with_code(typed, "recovered-password-1")


@pytest.mark.asyncio
async def test_issuing_a_new_code_invalidates_the_old_one(store):
    old = await store.issue_recovery_code()
    new = await store.issue_recovery_code()
    assert not await store.reset_password_with_code(old, "attacker-password-9")
    assert await store.reset_password_with_code(new, "recovered-password-1")
