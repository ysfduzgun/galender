from pydantic import BaseModel, Field
from datetime import date

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int

    class Config:
        orm_mode = True

class PasswordChange(BaseModel):
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str | None = None

class NoteRequest(BaseModel):
    content: str

class NoteResponse(BaseModel):
    date: str
    file_path: str
    content: str
