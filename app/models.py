from sqlalchemy import Column, Integer, String
from .database import Base, UserBase

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)

class Note(UserBase):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(String, unique=True, index=True) # format YYYY-MM-DD
    file_path = Column(String)
