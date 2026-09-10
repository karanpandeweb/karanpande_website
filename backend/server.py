import os
import sys
import asyncio
import re
import logging
import uuid
import jwt
import secrets
import time
from pathlib import Path
from typing import List, Optional, Literal
from datetime import datetime, timedelta, timezone

# Add project root and backend dir to sys.path so imports work in any Vercel execution mode
_current_dir = Path(__file__).resolve().parent
_root_dir = _current_dir.parent
for _p in [str(_root_dir), str(_current_dir)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

try:
    from backend.postgres_store import PostgresStore
    from backend.admin_auth import AdminCredentialStore
except (ImportError, ModuleNotFoundError):
    from postgres_store import PostgresStore
    from admin_auth import AdminCredentialStore

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, Response, JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ConfigDict

ROOT_DIR = _current_dir
load_dotenv(ROOT_DIR / ".env")


def get_env_var(name: str, default: str = "") -> str:
    value = os.environ.get(name, "").strip().strip("'\"")
    return value if value else default


DATABASE_URL = get_env_var("DATABASE_URL")
ADMIN_USERNAME = get_env_var("ADMIN_USERNAME", "karan")
ADMIN_PASSWORD = get_env_var("ADMIN_PASSWORD", "")
JWT_SECRET = get_env_var("JWT_SECRET", "kp_portfolio_jwt_secret_change_in_env_32chars_min")
JWT_ALGO = "HS256"
JWT_EXP_HOURS = 24 * 7
LOGIN_WINDOW_SECONDS = 15 * 60
LOGIN_MAX_ATTEMPTS = 5
login_attempts: dict[str, list[float]] = {}

client = PostgresStore(DATABASE_URL or "postgresql://localhost:5432/dummy")
db = client
# ADMIN_PASSWORD seeds the stored credential on first run; after a reset the
# database is the source of truth and the variable is ignored.
admin_credentials = AdminCredentialStore(db, ADMIN_USERNAME, ADMIN_PASSWORD)

app = FastAPI(title="Karan Pande Photography API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

logger = logging.getLogger("kp")
logging.basicConfig(level=logging.INFO)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    logger.exception("Unhandled error on %s %s: %s", request.method, request.url.path, exc)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Server error",
            "exception_type": type(exc).__name__,
            "exception_message": str(exc),
            "traceback": traceback.format_exc().splitlines(),
        },
    )


# ---------- Types ----------
Category = Literal["wedding", "pre-wedding", "cinematic"]
MediaKind = Literal["image", "video"]
ImageFit = Literal["cover", "contain"]
ImagePosition = Literal["center", "top", "bottom", "left", "right"]


def slugify(s: str) -> str:
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s or "album"


# ---------- Models ----------
class MediaItem(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    category: Category
    kind: MediaKind
    url: str
    poster: Optional[str] = None
    title: str = ""
    caption: str = ""
    order: int = 0
    album_id: Optional[str] = None
    fit: ImageFit = "cover"
    position: ImagePosition = "center"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class MediaCreate(BaseModel):
    category: Category
    kind: MediaKind
    url: str
    poster: Optional[str] = None
    title: str = ""
    caption: str = ""
    order: int = 0
    album_id: Optional[str] = None
    fit: ImageFit = "cover"
    position: ImagePosition = "center"


class MediaUpdate(BaseModel):
    url: Optional[str] = None
    poster: Optional[str] = None
    title: Optional[str] = None
    caption: Optional[str] = None
    order: Optional[int] = None
    kind: Optional[MediaKind] = None
    category: Optional[Category] = None
    album_id: Optional[str] = None
    fit: Optional[ImageFit] = None
    position: Optional[ImagePosition] = None


class Album(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    category: Category
    slug: str
    name: str
    cover: str = ""
    description: str = ""
    location: str = ""
    date: str = ""  # e.g. "Nov 2024"
    order: int = 0
    cover_fit: ImageFit = "cover"
    cover_position: ImagePosition = "center"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class AlbumCreate(BaseModel):
    category: Category
    name: str
    cover: str = ""
    description: str = ""
    location: str = ""
    date: str = ""
    order: int = 0
    slug: Optional[str] = None
    cover_fit: ImageFit = "cover"
    cover_position: ImagePosition = "center"


class AlbumUpdate(BaseModel):
    name: Optional[str] = None
    cover: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    date: Optional[str] = None
    order: Optional[int] = None
    slug: Optional[str] = None
    cover_fit: Optional[ImageFit] = None
    cover_position: Optional[ImagePosition] = None


class Testimonial(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    author: str
    role: str = ""
    quote: str
    rating: int = 5
    avatar: str = ""
    order: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class TestimonialCreate(BaseModel):
    author: str
    role: str = ""
    quote: str
    rating: int = 5
    avatar: str = ""
    order: int = 0


class TestimonialUpdate(BaseModel):
    author: Optional[str] = None
    role: Optional[str] = None
    quote: Optional[str] = None
    rating: Optional[int] = None
    avatar: Optional[str] = None
    order: Optional[int] = None


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    username: str


class PasswordResetRequest(BaseModel):
    username: str
    recovery_code: str
    new_password: str = Field(min_length=12, max_length=200)


class RecoveryCodeResponse(BaseModel):
    """The plaintext code is returned exactly once, at generation."""
    recovery_code: str


class RecoveryStatusResponse(BaseModel):
    has_recovery_code: bool
    issued_at: Optional[str] = None


class FeaturedFrame(BaseModel):
    url: str
    title: str = "Featured frame"
    fit: ImageFit = "cover"
    position: ImagePosition = "center"


DEFAULT_FEATURED_FRAMES = [
    FeaturedFrame(url="/assets/placeholders/ai-wedding-bride.jpg", title="Before the vows"),
    FeaturedFrame(url="/assets/placeholders/ai-prewedding-field.jpg", title="Blue hour"),
    FeaturedFrame(url="/assets/placeholders/ai-cinematic-baraat.jpg", title="Baraat in motion"),
    FeaturedFrame(url="https://images.unsplash.com/photo-1665960213508-48f07086d49c?auto=format&fit=crop&w=1600&q=85", title="Mandap light"),
    FeaturedFrame(url="https://images.pexels.com/photos/35069916/pexels-photo-35069916.jpeg?auto=compress&cs=tinysrgb&w=1600", title="By the sea"),
]


class SiteSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    hero_video_url: str = "https://videos.pexels.com/video-files/5849887/5849887-uhd_2560_1440_24fps.mp4"
    hero_poster_url: str = "/assets/placeholders/ai-hero-wedding.jpg"
    hero_headline_1: str = "Stories that feel"
    hero_headline_2: str = "like your own."
    hero_subtitle: str = "Karan Pande photographs weddings, pre-wedding stories and cinematic films across India — quiet, editorial, and unhurried."
    about_photo_url: str = "https://images.unsplash.com/photo-1554080353-a576cf803bda?auto=format&fit=crop&w=1200&q=80"
    about_bio_1: str = "I photograph weddings, pre-wedding stories, and cinematic films out of a small studio in Pune. Six years in, I'm still moved by the same three things — first looks, the last dance, and the way sunlight lands on a mother's hand."
    about_bio_2: str = "My work sits somewhere between documentary and editorial. I don't direct much, I don't re-shoot the vows, and I don't chase trends in colour. I photograph what actually happens — quietly, on foot, and close enough to hear you laugh."
    phone: str = "+91 98000 00000"
    whatsapp: str = "+91 98000 00000"
    email: str = "hello@karanpande.in"
    instagram: str = "karanpande"
    location: str = "Pune, Maharashtra · India"
    featured_frames: List[FeaturedFrame] = Field(default_factory=lambda: [frame.model_copy() for frame in DEFAULT_FEATURED_FRAMES])


class SiteSettingsUpdate(BaseModel):
    hero_video_url: Optional[str] = None
    hero_poster_url: Optional[str] = None
    hero_headline_1: Optional[str] = None
    hero_headline_2: Optional[str] = None
    hero_subtitle: Optional[str] = None
    about_photo_url: Optional[str] = None
    about_bio_1: Optional[str] = None
    about_bio_2: Optional[str] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    email: Optional[str] = None
    instagram: Optional[str] = None
    location: Optional[str] = None
    featured_frames: Optional[List[FeaturedFrame]] = None


# ---------- Auth ----------
def create_token(username: str) -> str:
    payload = {
        "sub": username,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXP_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


def require_admin(creds: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> str:
    if creds is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        data = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGO])
        if data.get("sub") != ADMIN_USERNAME:
            raise HTTPException(status_code=401, detail="Invalid token subject")
        return data["sub"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def enforce_login_rate_limit(client_key: str) -> None:
    now = time.monotonic()
    recent = [stamp for stamp in login_attempts.get(client_key, []) if now - stamp < LOGIN_WINDOW_SECONDS]
    if len(recent) >= LOGIN_MAX_ATTEMPTS:
        raise HTTPException(status_code=429, detail="Too many sign-in attempts. Try again in 15 minutes.")
    recent.append(now)
    login_attempts[client_key] = recent


async def validate_album_assignment(album_id: Optional[str], category: Category) -> None:
    if not album_id:
        return
    album = await db.albums.find_one({"id": album_id}, {"_id": 0, "category": 1})
    if not album:
        raise HTTPException(status_code=400, detail="Selected album does not exist")
    if album["category"] != category:
        raise HTTPException(status_code=400, detail="Media category must match its album category")


# ---------- Seed data ----------
def _img(u):
    return u if "?" in u else u + "?auto=format&fit=crop&w=1600&q=80"


SEED_ALBUMS: List[dict] = [
    # Wedding
    {"category": "wedding", "name": "Aarav & Meera", "cover": "https://images.unsplash.com/photo-1630526720753-aa4e71acf67d?auto=format&fit=crop&w=1600&q=80", "location": "Udaipur, RJ", "date": "Feb 2025", "description": "A three-day royal wedding in the courtyards of Udaipur.", "order": 1},
    {"category": "wedding", "name": "Rohan & Priya", "cover": "https://images.unsplash.com/photo-1665960213508-48f07086d49c?auto=format&fit=crop&w=1600&q=80", "location": "Pune, MH", "date": "Nov 2024", "description": "A neighbourhood wedding lit only by lamps and family.", "order": 2},
    {"category": "wedding", "name": "Kabir & Ananya", "cover": "https://images.pexels.com/photos/35069916/pexels-photo-35069916.jpeg?auto=compress&cs=tinysrgb&w=1600", "location": "Goa", "date": "Dec 2024", "description": "A beachside ceremony with saltwater and vermilion.", "order": 3},
    # Pre-wedding
    {"category": "pre-wedding", "name": "Ishaan & Riya", "cover": "https://images.unsplash.com/photo-1715285977619-6d9357168f46?auto=format&fit=crop&w=1600&q=80", "location": "Jaisalmer dunes", "date": "Jan 2025", "description": "A day of gold hour walks across cold desert.", "order": 1},
    {"category": "pre-wedding", "name": "Vikram & Naina", "cover": "https://images.unsplash.com/photo-1653688529238-1326ab9eeab9?auto=format&fit=crop&w=1600&q=80", "location": "Coorg", "date": "Oct 2024", "description": "Coffee plantations, mist, and quiet laughter.", "order": 2},
    # Cinematic
    {"category": "cinematic", "name": "Aarav × Meera — Film", "cover": "https://images.pexels.com/photos/33419097/pexels-photo-33419097.jpeg?auto=compress&cs=tinysrgb&w=1600", "location": "Udaipur", "date": "Feb 2025", "description": "A monsoon wedding film cut to a live sitar score.", "order": 1},
    {"category": "cinematic", "name": "The First Dance", "cover": "https://images.pexels.com/photos/10603895/pexels-photo-10603895.jpeg?auto=compress&cs=tinysrgb&w=1600", "location": "Mumbai", "date": "Sep 2024", "description": "A candlelit reception told in one long take.", "order": 2},
]

# Media items keyed by album name (resolved after album insert)
SEED_MEDIA_BY_ALBUM: dict = {
    "Aarav & Meera": [
        {"kind": "image", "url": "https://images.unsplash.com/photo-1630526720753-aa4e71acf67d?auto=format&fit=crop&w=1800&q=80", "title": "The Vows"},
        {"kind": "image", "url": "https://images.unsplash.com/photo-1599462616558-2b75fd26a283?auto=format&fit=crop&w=1800&q=80", "title": "First Look"},
        {"kind": "image", "url": "https://images.unsplash.com/photo-1722952934708-749c22eb2e58?auto=format&fit=crop&w=1800&q=80", "title": "Baraat"},
        {"kind": "image", "url": "https://images.pexels.com/photos/32060316/pexels-photo-32060316.jpeg?auto=compress&cs=tinysrgb&w=1800", "title": "Bidaai"},
    ],
    "Rohan & Priya": [
        {"kind": "image", "url": "https://images.unsplash.com/photo-1665960213508-48f07086d49c?auto=format&fit=crop&w=1800&q=80", "title": "Mandap Light"},
        {"kind": "image", "url": "https://images.unsplash.com/photo-1599462616558-2b75fd26a283?auto=format&fit=crop&w=1800&q=80", "title": "Together"},
        {"kind": "image", "url": "https://images.pexels.com/photos/35069916/pexels-photo-35069916.jpeg?auto=compress&cs=tinysrgb&w=1800", "title": "Sindoor"},
    ],
    "Kabir & Ananya": [
        {"kind": "image", "url": "https://images.pexels.com/photos/35069916/pexels-photo-35069916.jpeg?auto=compress&cs=tinysrgb&w=1800", "title": "By the sea"},
        {"kind": "image", "url": "https://images.unsplash.com/photo-1722952934708-749c22eb2e58?auto=format&fit=crop&w=1800&q=80", "title": "Salt & vermilion"},
        {"kind": "image", "url": "https://images.pexels.com/photos/32060316/pexels-photo-32060316.jpeg?auto=compress&cs=tinysrgb&w=1800", "title": "Sunset walk"},
    ],
    "Ishaan & Riya": [
        {"kind": "image", "url": "https://images.unsplash.com/photo-1715285977619-6d9357168f46?auto=format&fit=crop&w=1800&q=80", "title": "Dunes"},
        {"kind": "image", "url": "https://images.unsplash.com/photo-1715285978388-312252ee23de?auto=format&fit=crop&w=1800&q=80", "title": "Hand in Hand"},
        {"kind": "image", "url": "https://images.unsplash.com/photo-1715285977526-5574f70b0d3d?auto=format&fit=crop&w=1800&q=80", "title": "Wildflowers"},
    ],
    "Vikram & Naina": [
        {"kind": "image", "url": "https://images.unsplash.com/photo-1653688529238-1326ab9eeab9?auto=format&fit=crop&w=1800&q=80", "title": "Golden Hour"},
        {"kind": "image", "url": "https://images.unsplash.com/photo-1715285977526-5574f70b0d3d?auto=format&fit=crop&w=1800&q=80", "title": "Plantation"},
        {"kind": "image", "url": "https://images.unsplash.com/photo-1715285978388-312252ee23de?auto=format&fit=crop&w=1800&q=80", "title": "Mist"},
    ],
    "Aarav × Meera — Film": [
        {"kind": "video", "url": "https://videos.pexels.com/video-files/5849887/5849887-uhd_2560_1440_24fps.mp4",
         "poster": "https://images.pexels.com/photos/33419097/pexels-photo-33419097.jpeg?auto=compress&cs=tinysrgb&w=1600",
         "title": "Full film", "caption": "5 min · sitar score"},
    ],
    "The First Dance": [
        {"kind": "video", "url": "https://videos.pexels.com/video-files/3205827/3205827-uhd_2560_1440_25fps.mp4",
         "poster": "https://images.pexels.com/photos/10603895/pexels-photo-10603895.jpeg?auto=compress&cs=tinysrgb&w=1600",
         "title": "First Dance", "caption": "A single take, candlelit"},
    ],
}


SEED_TESTIMONIALS: List[dict] = [
    {"author": "Aarav & Meera", "role": "Wedding, Udaipur", "quote": "Karan didn't just photograph our wedding — he remembered it for us. Every image feels like the moment we lived, only softer, slower, more beautiful.", "rating": 5, "order": 1},
    {"author": "Rohan & Priya", "role": "Wedding, Pune", "quote": "We asked for honest, un-posed photographs. Karan gave us something better — a small book of our two families that we open every anniversary.", "rating": 5, "order": 2},
    {"author": "Ishaan & Riya", "role": "Pre-Wedding, Jaisalmer", "quote": "The most patient photographer we've worked with. He waited three hours for the light to turn and it was worth every minute.", "rating": 5, "order": 3},
    {"author": "Kabir & Ananya", "role": "Wedding film, Goa", "quote": "Our film feels like a short movie of our life, not a highlights reel. Friends have watched it more than we have.", "rating": 5, "order": 4},
]


async def seed_if_empty():
    # Admin credential — hashed from the environment on first run only
    await admin_credentials.ensure_seeded()

    # Media + Albums migration/seed
    album_count = await db.albums.count_documents({})
    if album_count == 0:
        logger.info("Reseeding albums + media…")
        await db.media.delete_many({})
        await db.albums.delete_many({})

        name_to_id: dict = {}
        for a in SEED_ALBUMS:
            album = Album(slug=slugify(a["name"]), **a)
            await db.albums.insert_one(album.model_dump())
            name_to_id[a["name"]] = album.id

        for album_name, items in SEED_MEDIA_BY_ALBUM.items():
            album_id = name_to_id.get(album_name)
            if not album_id:
                continue
            album = next(a for a in SEED_ALBUMS if a["name"] == album_name)
            for idx, m in enumerate(items):
                media = MediaItem(
                    category=album["category"],
                    kind=m.get("kind", "image"),
                    url=m["url"],
                    poster=m.get("poster"),
                    title=m.get("title", ""),
                    caption=m.get("caption", ""),
                    order=idx + 1,
                    album_id=album_id,
                )
                await db.media.insert_one(media.model_dump())

    # Testimonials
    t_count = await db.testimonials.count_documents({})
    if t_count == 0:
        docs = [Testimonial(**t).model_dump() for t in SEED_TESTIMONIALS]
        await db.testimonials.insert_many(docs)

    # Settings
    settings_doc = await db.settings.find_one({"_id": "site"})
    if not settings_doc:
        default = SiteSettings().model_dump()
        default["_id"] = "site"
        await db.settings.insert_one(default)


# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"message": "Karan Pande Photography API"}


@api_router.get("/health")
async def health():
    try:
        await db.command("ping")
    except Exception as exc:
        logger.error("Database health check failed: %s", exc)
        raise HTTPException(status_code=503, detail="Database unavailable")
    return {"status": "ok", "database": "connected"}


# --- Auth
@api_router.post("/admin/login", response_model=LoginResponse)
async def admin_login(body: LoginRequest, request: Request):
    client_key = request.client.host if request.client else "unknown"
    enforce_login_rate_limit(client_key)
    username_ok = secrets.compare_digest(body.username.encode(), ADMIN_USERNAME.encode())
    password_ok = await admin_credentials.verify_password(body.password)
    if not username_ok or not password_ok:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    login_attempts.pop(client_key, None)
    return LoginResponse(token=create_token(body.username), username=body.username)


@api_router.post("/admin/password/reset", response_model=LoginResponse)
async def reset_admin_password(body: PasswordResetRequest, request: Request):
    """Set a new password using the one-time recovery code.

    Rate limited on the same budget as sign-in, because the recovery code
    is the only thing standing between a guesser and the dashboard.
    """
    client_key = f"reset:{request.client.host if request.client else 'unknown'}"
    enforce_login_rate_limit(client_key)

    if not await admin_credentials.has_recovery_code():
        raise HTTPException(
            status_code=409,
            detail="No recovery code has been generated. Sign in and create one from Site settings.",
        )

    username_ok = secrets.compare_digest(body.username.encode(), ADMIN_USERNAME.encode())
    reset_ok = username_ok and await admin_credentials.reset_password_with_code(
        body.recovery_code, body.new_password
    )
    if not reset_ok:
        raise HTTPException(status_code=401, detail="Invalid username or recovery code")

    login_attempts.pop(client_key, None)
    logger.info("Admin password reset via recovery code")
    return LoginResponse(token=create_token(ADMIN_USERNAME), username=ADMIN_USERNAME)


@api_router.get("/admin/recovery-code", response_model=RecoveryStatusResponse)
async def recovery_code_status(user: str = Depends(require_admin)):
    credential = await admin_credentials.ensure_seeded()
    return RecoveryStatusResponse(
        has_recovery_code=bool(credential.get("recovery_code_hash")),
        issued_at=credential.get("recovery_code_issued_at"),
    )


@api_router.post("/admin/recovery-code", response_model=RecoveryCodeResponse)
async def create_recovery_code(user: str = Depends(require_admin)):
    """Issue a fresh code, replacing any previous one."""
    code = await admin_credentials.issue_recovery_code()
    logger.info("New admin recovery code issued")
    return RecoveryCodeResponse(recovery_code=code)


@api_router.get("/admin/me")
async def admin_me(user: str = Depends(require_admin)):
    return {"username": user}


# --- Media (kept for backwards-compat; now typically filtered by album)
@api_router.get("/media", response_model=List[MediaItem])
async def list_all_media():
    return await db.media.find({}, {"_id": 0}).sort([("category", 1), ("order", 1)]).to_list(2000)


@api_router.get("/media/{category}", response_model=List[MediaItem])
async def list_media(category: Category):
    return await db.media.find({"category": category}, {"_id": 0}).sort("order", 1).to_list(2000)


@api_router.post("/admin/media", response_model=MediaItem)
async def create_media(body: MediaCreate, user: str = Depends(require_admin)):
    await validate_album_assignment(body.album_id, body.category)
    item = MediaItem(**body.model_dump())
    await db.media.insert_one(item.model_dump())
    return item


@api_router.put("/admin/media/{item_id}", response_model=MediaItem)
async def update_media(item_id: str, body: MediaUpdate, user: str = Depends(require_admin)):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    current = await db.media.find_one({"id": item_id}, {"_id": 0})
    if not current:
        raise HTTPException(status_code=404, detail="Media not found")
    await validate_album_assignment(updates.get("album_id", current.get("album_id")), updates.get("category", current["category"]))
    res = await db.media.update_one({"id": item_id}, {"$set": updates})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Media not found")
    return await db.media.find_one({"id": item_id}, {"_id": 0})


@api_router.delete("/admin/media/{item_id}")
async def delete_media(item_id: str, user: str = Depends(require_admin)):
    res = await db.media.delete_one({"id": item_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Media not found")
    return {"deleted": item_id}


# --- Albums
@api_router.get("/albums", response_model=List[Album])
async def list_all_albums():
    return await db.albums.find({}, {"_id": 0}).sort([("category", 1), ("order", 1)]).to_list(500)


@api_router.get("/albums/{category}", response_model=List[Album])
async def list_albums(category: Category):
    return await db.albums.find({"category": category}, {"_id": 0}).sort("order", 1).to_list(500)


@api_router.get("/albums/{category}/{slug}")
async def get_album_with_media(category: Category, slug: str):
    album = await db.albums.find_one({"category": category, "slug": slug}, {"_id": 0})
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
    media = await db.media.find({"album_id": album["id"]}, {"_id": 0}).sort("order", 1).to_list(500)
    return {"album": album, "media": media}


@api_router.post("/admin/albums", response_model=Album)
async def create_album(body: AlbumCreate, user: str = Depends(require_admin)):
    payload = body.model_dump()
    payload["slug"] = payload.get("slug") or slugify(payload["name"])
    if await db.albums.find_one({"category": payload["category"], "slug": payload["slug"]}):
        raise HTTPException(status_code=409, detail="An album with this URL already exists in the category")
    album = Album(**payload)
    await db.albums.insert_one(album.model_dump())
    return album


@api_router.put("/admin/albums/{album_id}", response_model=Album)
async def update_album(album_id: str, body: AlbumUpdate, user: str = Depends(require_admin)):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    if updates.get("name") and not updates.get("slug"):
        updates["slug"] = slugify(updates["name"])
    if updates.get("slug"):
        current = await db.albums.find_one({"id": album_id}, {"_id": 0})
        if not current:
            raise HTTPException(status_code=404, detail="Album not found")
        duplicate = await db.albums.find_one({"category": current["category"], "slug": updates["slug"], "id": {"$ne": album_id}})
        if duplicate:
            raise HTTPException(status_code=409, detail="An album with this URL already exists in the category")
    res = await db.albums.update_one({"id": album_id}, {"$set": updates})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Album not found")
    return await db.albums.find_one({"id": album_id}, {"_id": 0})


@api_router.delete("/admin/albums/{album_id}")
async def delete_album(album_id: str, user: str = Depends(require_admin)):
    res = await db.albums.delete_one({"id": album_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Album not found")
    # unlink orphan media (do not delete photos, just clear album)
    await db.media.update_many({"album_id": album_id}, {"$set": {"album_id": None}})
    return {"deleted": album_id}


# --- Testimonials
@api_router.get("/testimonials", response_model=List[Testimonial])
async def list_testimonials():
    return await db.testimonials.find({}, {"_id": 0}).sort("order", 1).to_list(200)


@api_router.post("/admin/testimonials", response_model=Testimonial)
async def create_testimonial(body: TestimonialCreate, user: str = Depends(require_admin)):
    t = Testimonial(**body.model_dump())
    await db.testimonials.insert_one(t.model_dump())
    return t


@api_router.put("/admin/testimonials/{tid}", response_model=Testimonial)
async def update_testimonial(tid: str, body: TestimonialUpdate, user: str = Depends(require_admin)):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    res = await db.testimonials.update_one({"id": tid}, {"$set": updates})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    return await db.testimonials.find_one({"id": tid}, {"_id": 0})


@api_router.delete("/admin/testimonials/{tid}")
async def delete_testimonial(tid: str, user: str = Depends(require_admin)):
    res = await db.testimonials.delete_one({"id": tid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    return {"deleted": tid}


# --- Settings
@api_router.get("/settings", response_model=SiteSettings)
async def get_settings():
    doc = await db.settings.find_one({"_id": "site"}, {"_id": 0})
    return doc or SiteSettings().model_dump()


@api_router.put("/admin/settings", response_model=SiteSettings)
async def update_settings(body: SiteSettingsUpdate, user: str = Depends(require_admin)):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    await db.settings.update_one({"_id": "site"}, {"$set": updates}, upsert=True)
    return await db.settings.find_one({"_id": "site"}, {"_id": 0})


# --- Direct image uploads for non-technical studio users
MAX_UPLOAD_BYTES = 4 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


@api_router.post("/admin/upload")
async def upload_image(file: UploadFile = File(...), user: str = Depends(require_admin)):
    suffix = ALLOWED_IMAGE_TYPES.get(file.content_type or "")
    if not suffix:
        raise HTTPException(status_code=400, detail="Please choose a JPG, PNG, or WebP image")
    content = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Image is too large after optimization. Maximum size is 4 MB")
    upload_id = uuid.uuid4().hex
    filename = f"{upload_id}{suffix}"
    await db.save_upload(upload_id, filename, file.content_type or "application/octet-stream", content)
    return {"url": f"/api/uploads/{upload_id}", "filename": filename, "size": len(content)}


@api_router.get("/uploads/{upload_id}")
async def get_uploaded_image(upload_id: str):
    upload = await db.get_upload(upload_id)
    if not upload:
        raise HTTPException(status_code=404, detail="Image not found")
    return Response(
        content=bytes(upload["content"]),
        media_type=upload["content_type"],
        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )


@api_router.get("/health")
async def health_check():
    db_ok = False
    db_detail = "uninitialized"
    if DATABASE_URL and "dummy" not in DATABASE_URL:
        try:
            res = await client.command("ping")
            db_ok = res.get("ok") == 1
            db_detail = "connected"
        except Exception as e:
            db_detail = f"error: {e}"
    else:
        db_detail = "DATABASE_URL is not configured in Vercel Environment Variables"

    return {
        "status": "ok" if db_ok else "warning",
        "database": db_detail,
        "environment_variables": {
            "DATABASE_URL": bool(DATABASE_URL and "dummy" not in DATABASE_URL),
            "ADMIN_USERNAME": bool(ADMIN_USERNAME),
            "ADMIN_PASSWORD": bool(ADMIN_PASSWORD),
            "JWT_SECRET": bool(JWT_SECRET and not JWT_SECRET.startswith("kp_portfolio_")),
        },
    }


app.include_router(api_router)

FRONTEND_BUILD_DIR = ROOT_DIR.parent / "frontend" / "build"
if FRONTEND_BUILD_DIR.exists():
    app.mount("/static", StaticFiles(directory=FRONTEND_BUILD_DIR / "static"), name="static")

    @app.get("/{catchall:path}")
    async def serve_frontend(catchall: str):
        if catchall.startswith("api"):
            raise HTTPException(status_code=404, detail="Not Found")
        index_file = FRONTEND_BUILD_DIR / "index.html"
        if index_file.exists():
            return FileResponse(index_file)
        raise HTTPException(status_code=404, detail="Index file not found")
else:
    @app.get("/")
    async def fallback_root():
        return {
            "status": "online",
            "message": "Karan Pande Photography API is running",
            "health": "/api/health",
            "docs": "/docs",
        }

cors_origins = [origin.strip() for origin in os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    if not DATABASE_URL or "dummy" in DATABASE_URL:
        logger.warning("DATABASE_URL is not configured. Backend starting in degraded mode.")
        return

    async def _init_bg():
        try:
            await client.initialize()
            await db.albums.create_index([("category", 1), ("slug", 1)], unique=True)
            await db.albums.create_index("id", unique=True)
            await db.media.create_index("id", unique=True)
            await db.media.create_index([("album_id", 1), ("order", 1)])
            await db.testimonials.create_index("id", unique=True)
            await seed_if_empty()
            logger.info("Database initialized and seeded successfully.")
        except Exception as e:
            logger.warning("Database background initialization notice: %s", e)

    asyncio.create_task(_init_bg())


@app.on_event("shutdown")
async def on_shutdown():
    if client and getattr(client, "pool", None) and not client.pool.closed:
        try:
            await client.close()
        except Exception:
            pass
