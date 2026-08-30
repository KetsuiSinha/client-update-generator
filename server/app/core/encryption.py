from cryptography.fernet import Fernet
from typing import Optional
from app.core.config import settings


def get_encryption_key() -> bytes:
    """Get encryption key for token storage.

    Key must be set via ENCRYPTION_KEY environment variable.
    Never generate a new key at runtime - this would invalidate all stored tokens.
    """
    key_str: Optional[str] = getattr(settings, 'ENCRYPTION_KEY', None)
    if not key_str:
        raise ValueError(
            "ENCRYPTION_KEY must be set in environment or .env file. "
            "Do not generate a new key at runtime - this invalidates all stored tokens."
        )
    return key_str.encode() if isinstance(key_str, str) else key_str


def encrypt_token(token: str) -> str:
    """Encrypt a token for secure storage."""
    key = get_encryption_key()
    f = Fernet(key)
    return f.encrypt(token.encode()).decode()


def decrypt_token(encrypted_token: str) -> str:
    """Decrypt a token for use."""
    key = get_encryption_key()
    f = Fernet(key)
    return f.decrypt(encrypted_token.encode()).decode()