import os
# Generate a proper Fernet key and set it
from cryptography.fernet import Fernet
key = Fernet.generate_key()
os.environ["ENCRYPTION_KEY"] = key.decode()

from app.core.encryption import encrypt_token, decrypt_token, get_encryption_key
from app.core.config import settings


def test_encrypt_decrypt_roundtrip():
    """Tokens should encrypt and decrypt correctly."""
    key = get_encryption_key()
    original = "test-access-token-12345"
    encrypted = encrypt_token(original)
    decrypted = decrypt_token(encrypted)
    assert decrypted == original, f"Expected {original}, got {decrypted}"


def test_encryption_key_from_env():
    """ENCRYPTION_KEY must be set in config."""
    key = get_encryption_key()
    assert key is not None


def test_jwt_token_creation():
    """JWT access tokens should be createable and decodable."""
    from app.core.security import create_access_token, decode_token

    token = create_access_token(data={"sub": "1", "type": "access"})
    payload = decode_token(token)
    assert payload.get("sub") == "1"
    assert payload.get("type") == "access"


def test_jwt_refresh_token_creation():
    """JWT refresh tokens should be createable and decodable."""
    from app.core.security import create_refresh_token, decode_token

    token = create_refresh_token(data={"sub": "1"})
    payload = decode_token(token)
    assert payload.get("sub") == "1"
    assert payload.get("type") == "refresh"


def test_jwt_invalid_token():
    """Invalid tokens should raise ValueError."""
    from app.core.security import decode_token

    try:
        decode_token("invalid-token-that-does-not-exist")
        assert False, "Expected ValueError for invalid token"
    except ValueError:
        pass  # Expected