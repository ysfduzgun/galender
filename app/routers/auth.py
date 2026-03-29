import os
import shutil
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from .. import schemas, database, models
from ..core import security
from ..core.auth import get_current_admin_user

router = APIRouter()

@router.get("/users", response_model=list[schemas.UserResponse])
def get_all_users(db: Session = Depends(database.get_main_db), admin: models.User = Depends(get_current_admin_user)):
    return db.query(models.User).all()

@router.post("/users", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(database.get_main_db), admin: models.User = Depends(get_current_admin_user)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = security.get_password_hash(user.password)
    db_user = models.User(username=user.username, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Pre-emptively initialize user's DB
    user_db_engine = database.get_user_engine(user.username)
    database.UserBase.metadata.create_all(bind=user_db_engine)
    
    return db_user

@router.delete("/users/{username}")
def delete_user(username: str, db: Session = Depends(database.get_main_db), admin: models.User = Depends(get_current_admin_user)):
    if username == "admin":
        raise HTTPException(status_code=400, detail="Cannot delete admin user")
    
    db_user = db.query(models.User).filter(models.User.username == username).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    db.delete(db_user)
    db.commit()
    
    # Archive data directory
    user_dir = os.path.join(database.DATA_DIR, username)
    if os.path.exists(user_dir):
        archive_dir = os.path.join(database.DATA_DIR, "archive")
        os.makedirs(archive_dir, exist_ok=True)
        date_str = datetime.now().strftime("%Y%m%d%H%M%S")
        target_dir = os.path.join(archive_dir, f"{username}-{date_str}")
        shutil.move(user_dir, target_dir)
        
    return {"message": "User deleted and archived"}

@router.put("/users/{username}/password")
def change_password(username: str, data: schemas.PasswordChange, db: Session = Depends(database.get_main_db), admin: models.User = Depends(get_current_admin_user)):
    db_user = db.query(models.User).filter(models.User.username == username).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    db_user.hashed_password = security.get_password_hash(data.password)
    db.commit()
    return {"message": "Password updated successfully"}

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_main_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}
