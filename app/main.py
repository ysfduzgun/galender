import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .database import Base, main_engine, MainSessionLocal
from .models import User
from .core.security import get_password_hash
from .routers import auth, notes

Base.metadata.create_all(bind=main_engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-seed default admin user
    db = MainSessionLocal()
    try:
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            db.add(User(username="admin", hashed_password=get_password_hash("admin")))
            db.commit()
    finally:
        db.close()
    yield

app = FastAPI(title="Galender API", description="Markdown Calendar Backend", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(notes.router, prefix="/api/notes", tags=["notes"])

frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
os.makedirs(frontend_dir, exist_ok=True)

# Mount statics. html=True automatically serves index.html for root path
app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
