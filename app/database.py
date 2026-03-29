import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
os.makedirs(DATA_DIR, exist_ok=True)

MAIN_DB_URL = f"sqlite:///{os.path.join(DATA_DIR, 'main.db')}"

Base = declarative_base()
UserBase = declarative_base()

main_engine = create_engine(MAIN_DB_URL, connect_args={"check_same_thread": False})
MainSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=main_engine)

def get_main_db():
    db = MainSessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_user_engine(username: str):
    user_dir = os.path.join(DATA_DIR, username)
    os.makedirs(user_dir, exist_ok=True)
    user_db_path = os.path.join(user_dir, f"{username}.db")
    url = f"sqlite:///{user_db_path}"
    return create_engine(url, connect_args={"check_same_thread": False})

def get_user_db(username: str):
    engine = get_user_engine(username)
    UserBase.metadata.create_all(bind=engine) # Ensure tables exist for user
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
