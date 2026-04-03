from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import model
import crud
from database import engine, SessionLocal, Base
from router import auth, users, posts, admin, codes

Base.metadata.create_all(bind=engine)

def _seed():
    db = SessionLocal()
    try:
        crud.seed_codes(db)
    finally:
        db.close()
_seed()

app = FastAPI(title="User API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(posts.router)
app.include_router(admin.router)
app.include_router(codes.router)
