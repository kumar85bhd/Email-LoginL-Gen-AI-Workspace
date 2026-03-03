import logging
import json
import os
from fastapi import Header, HTTPException, status
from backend.database import SessionLocal

logger = logging.getLogger(__name__)

ADMIN_USER_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "admin_user.json")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(x_user_email: str = Header(None, alias="X-User-Email")):
    if not x_user_email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not identified"
        )
    return {"email": x_user_email}

def get_current_admin_user(x_user_email: str = Header(None, alias="X-User-Email")):
    if not x_user_email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not identified"
        )
    
    is_admin = False
    try:
        if os.path.exists(ADMIN_USER_PATH):
            with open(ADMIN_USER_PATH, "r") as f:
                admin_emails = json.load(f)
                if x_user_email in admin_emails:
                    is_admin = True
    except Exception as e:
        logger.error(f"Error reading admin_user.json: {e}")
        
    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )
    return {"email": x_user_email, "is_admin": True}
