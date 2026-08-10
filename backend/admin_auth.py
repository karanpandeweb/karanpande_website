"""Admin credential storage and recovery codes.

The admin password used to live only in the ADMIN_PASSWORD environment
variable. A serverless function cannot rewrite its own environment, so a
password reset had nowhere to persist to. The credential now lives in the
`admin_credentials` collection, seeded once from the environment so an
existing deployment keeps working with the password it already has.

Hashing is PBKDF2-HMAC-SHA256 from the standard library — no new
dependency to install, and no native build step in the Vercel bundle.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import secrets
from datetime import datetime, timezone
from typing import Any, Optional

CREDENTIAL_ID = "admin"

PBKDF2_ITERATIONS = 600_000
SALT_BYTES = 16
# 4 groups of 5 from an unambiguous alphabet, so the code stays readable
# when it is written down or read aloud over the phone.
RECOVERY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
RECOVERY_GROUPS = 4
RECOVERY_GROUP_SIZE = 5


def hash_secret(raw: str) -> str:
    """Return `pbkdf2_sha256$iterations$salt$hash`, all base64."""
    salt = secrets.token_bytes(SALT_BYTES)
    digest = hashlib.pbkdf2_hmac("sha256", raw.encode(), salt, PBKDF2_ITERATIONS)
    return "$".join(
        [
            "pbkdf2_sha256",
            str(PBKDF2_ITERATIONS),
            base64.b64encode(salt).decode(),
            base64.b64encode(digest).decode(),
        ]
    )


def verify_secret(raw: str, encoded: Optional[str]) -> bool:
    """Constant-time check of `raw` against an encoded hash."""
    if not encoded:
        return False
    try:
        algorithm, iterations, salt_b64, hash_b64 = encoded.split("$")
        if algorithm != "pbkdf2_sha256":
            return False
        expected = base64.b64decode(hash_b64)
        candidate = hashlib.pbkdf2_hmac(
            "sha256", raw.encode(), base64.b64decode(salt_b64), int(iterations)
        )
    except (ValueError, TypeError):
        return False
    return hmac.compare_digest(candidate, expected)


def generate_recovery_code() -> str:
    """A one-time code such as `K3TQF-9PXHM-2WRJD-BN47S`."""
    groups = [
        "".join(secrets.choice(RECOVERY_ALPHABET) for _ in range(RECOVERY_GROUP_SIZE))
        for _ in range(RECOVERY_GROUPS)
    ]
    return "-".join(groups)


def normalize_recovery_code(code: str) -> str:
    """Accept lowercase, spaces, and missing dashes — people retype these."""
    return "".join(ch for ch in code.upper() if ch.isalnum())


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class AdminCredentialStore:
    """Reads and writes the single admin credential document."""

    def __init__(self, db: Any, username: str, seed_password: str):
        self._db = db
        self._username = username
        self._seed_password = seed_password

    async def ensure_seeded(self) -> dict[str, Any]:
        """Create the credential from the environment on first run."""
        existing = await self._db.admin_credentials.find_one({"_id": CREDENTIAL_ID})
        if existing:
            return existing
        document = {
            "_id": CREDENTIAL_ID,
            "username": self._username,
            "password_hash": hash_secret(self._seed_password),
            "recovery_code_hash": None,
            "recovery_code_issued_at": None,
            "password_updated_at": _now(),
        }
        await self._db.admin_credentials.insert_one(document)
        return document

    async def verify_password(self, password: str) -> bool:
        credential = await self.ensure_seeded()
        return verify_secret(password, credential.get("password_hash"))

    async def set_password(self, password: str) -> None:
        await self.ensure_seeded()
        await self._db.admin_credentials.update_one(
            {"_id": CREDENTIAL_ID},
            {"$set": {"password_hash": hash_secret(password), "password_updated_at": _now()}},
        )

    async def has_recovery_code(self) -> bool:
        credential = await self.ensure_seeded()
        return bool(credential.get("recovery_code_hash"))

    async def issue_recovery_code(self) -> str:
        """Generate, store the hash, and return the code. Shown once only."""
        await self.ensure_seeded()
        code = generate_recovery_code()
        await self._db.admin_credentials.update_one(
            {"_id": CREDENTIAL_ID},
            {
                "$set": {
                    "recovery_code_hash": hash_secret(normalize_recovery_code(code)),
                    "recovery_code_issued_at": _now(),
                }
            },
        )
        return code

    async def reset_password_with_code(self, code: str, new_password: str) -> bool:
        """Consume the recovery code and set a new password.

        The code is single-use: a successful reset clears it, so a leaked
        code cannot be replayed. A new one must be issued from Site
        Settings afterwards.
        """
        credential = await self.ensure_seeded()
        stored = credential.get("recovery_code_hash")
        if not verify_secret(normalize_recovery_code(code), stored):
            return False
        await self._db.admin_credentials.update_one(
            {"_id": CREDENTIAL_ID},
            {
                "$set": {
                    "password_hash": hash_secret(new_password),
                    "password_updated_at": _now(),
                    "recovery_code_hash": None,
                    "recovery_code_issued_at": None,
                }
            },
        )
        return True
