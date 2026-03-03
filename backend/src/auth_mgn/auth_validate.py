import os
import jwt
from jwt.algorithms import RSAAlgorithm
import json

# Module-level cache for the public key
PUBLIC_KEY_CACHE = None

def load_public_key():
    global PUBLIC_KEY_CACHE
    if PUBLIC_KEY_CACHE:
        return PUBLIC_KEY_CACHE

    cert_path = os.environ.get("SSO_CERT_PATH")
    if not cert_path:
        # In mock mode, we might not have a cert path, which is fine if we don't call this
        if os.environ.get("SSO_MOCK_MODE", "false").lower() == "true":
             return None
        raise ValueError("SSO_CERT_PATH environment variable is not set")
    
    if not os.path.exists(cert_path):
        raise FileNotFoundError(f"Certificate file not found at {cert_path}")
        
    with open(cert_path, "r") as f:
        PUBLIC_KEY_CACHE = f.read()
        return PUBLIC_KEY_CACHE

def validate_token(token: str):
    mock_mode = os.environ.get("SSO_MOCK_MODE", "false").lower() == "true"
    
    if mock_mode:
        # Deterministic Mock Mode
        if token == "mock-admin-token":
            return {
                "email": "admin@company.com",
                "name": "Mock Admin",
                "exp": 9999999999
            }
        elif token == "mock-user-token":
             return {
                "email": "user@company.com",
                "name": "Mock User",
                "exp": 9999999999
            }
        else:
            # Reject arbitrary tokens in hardened mock mode
            raise ValueError("Invalid mock token")

    public_key = load_public_key()
    if not public_key:
         raise ValueError("Public key not available")
    
    try:
        # Verify signature using RS256
        payload = jwt.decode(token, public_key, algorithms=["RS256"], options={"verify_signature": True, "verify_exp": True})
        if "email" not in payload:
             raise ValueError("Token missing email claim")
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except jwt.InvalidTokenError as e:
        raise ValueError(f"Invalid token: {str(e)}")
