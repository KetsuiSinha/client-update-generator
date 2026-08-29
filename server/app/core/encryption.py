from cryptography.fernet import Fernet
from app.core.config import settings

# Generate a key if not present (in production, use a stable key from env)
def get_encryption_key() -> bytes:
    """Get or generate encryption key for token storage."""
    key = getattr(settings, 'ENCRYPTION_KEY', None)
    if key:
        return key.encode() if isinstance(key, str) else key
    # Generate a new key for development (in production, set ENCRYPTION_KEY in .env)
    return Fernet.generate_key()


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