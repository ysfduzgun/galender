import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import schemas, database, models
from ..core.auth import get_current_user

router = APIRouter()

def get_user_db_session(current_user: models.User = Depends(get_current_user)):
    engine = database.get_user_engine(current_user.username)
    database.UserBase.metadata.create_all(bind=engine)
    SessionLocal = database.sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=list[dict])
def list_notes(db: Session = Depends(get_user_db_session), current_user: models.User = Depends(get_current_user)):
    # Get all notes dates for calendar marking
    notes = db.query(models.Note).all()
    return [{"date": n.date} for n in notes]

@router.get("/{date}", response_model=schemas.NoteResponse)
def get_note(date: str, db: Session = Depends(get_user_db_session), current_user: models.User = Depends(get_current_user)):
    note = db.query(models.Note).filter(models.Note.date == date).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
        
    if not os.path.exists(note.file_path):
        raise HTTPException(status_code=404, detail="Markdown file is missing")
        
    with open(note.file_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    return schemas.NoteResponse(date=date, file_path=note.file_path, content=content)

@router.post("/{date}", response_model=schemas.NoteResponse)
def save_note(date: str, note_req: schemas.NoteRequest, db: Session = Depends(get_user_db_session), current_user: models.User = Depends(get_current_user)):
    year = date.split('-')[0]
    notes_dir = os.path.join(database.DATA_DIR, current_user.username, "notes", year)
    os.makedirs(notes_dir, exist_ok=True)
    file_path = os.path.join(notes_dir, f"{date}.md")
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(note_req.content)
        
    note = db.query(models.Note).filter(models.Note.date == date).first()
    if note:
        note.file_path = file_path
    else:
        note = models.Note(date=date, file_path=file_path)
        db.add(note)
    
    db.commit()
    db.refresh(note)
    
    return schemas.NoteResponse(date=date, file_path=note.file_path, content=note_req.content)
