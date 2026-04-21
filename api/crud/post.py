from sqlalchemy.orm import Session
from model import User, Post, Attachment
from schema import PostCreate, PostUpdate


def _attach(post: Post, db: Session) -> Post:
    post.attachments = db.query(Attachment).filter(Attachment.post_id == post.id).all()
    return post


def _apply_filters(q, category: str = None, search: str = None):
    if category:
        q = q.filter(Post.category == category)
    if search:
        keyword = f"%{search}%"
        q = q.filter(Post.title.ilike(keyword) | Post.content.ilike(keyword))
    return q


def count_posts(db: Session, category: str = None, search: str = None) -> int:
    return _apply_filters(db.query(Post), category, search).count()


def create_post(db: Session, user_id: int, post: PostCreate) -> Post:
    db_post = Post(title=post.title, content=post.content, category=post.category, user_id=user_id)
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return _attach(db_post, db)


def get_posts(db: Session, skip: int = 0, limit: int = 10, category: str = None, search: str = None) -> list:
    q = db.query(Post, User.username).join(User, Post.user_id == User.id)
    q = _apply_filters(q, category, search)
    rows = q.order_by(Post.id.desc()).offset(skip).limit(limit).all()
    result = []
    for post, username in rows:
        post.username = username
        _attach(post, db)
        result.append(post)
    return result


def get_post(db: Session, post_id: int) -> Post | None:
    row = (
        db.query(Post, User.username)
        .join(User, Post.user_id == User.id)
        .filter(Post.id == post_id)
        .first()
    )
    if not row:
        return None
    post, username = row
    post.username = username
    return _attach(post, db)


def update_post(db: Session, post_id: int, user_id: int, data: PostUpdate) -> Post | None:
    post = db.query(Post).filter(Post.id == post_id, Post.user_id == user_id).first()
    if not post:
        return None
    if data.title is not None:
        post.title = data.title
    if data.content is not None:
        post.content = data.content
    if data.category is not None:
        post.category = data.category
    db.commit()
    db.refresh(post)
    return _attach(post, db)


def admin_update_post(db: Session, post_id: int, data: PostUpdate) -> Post | None:
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        return None
    if data.title is not None:
        post.title = data.title
    if data.content is not None:
        post.content = data.content
    if data.category is not None:
        post.category = data.category
    db.commit()
    db.refresh(post)
    return _attach(post, db)


def delete_post(db: Session, post_id: int, user_id: int, is_admin: bool = False) -> bool:
    query = db.query(Post).filter(Post.id == post_id)
    if not is_admin:
        query = query.filter(Post.user_id == user_id)
    post = query.first()
    if not post:
        return False
    db.delete(post)
    db.commit()
    return True


# ── Attachment CRUD ──

def create_attachment(db: Session, post_id: int, filename: str, stored_name: str, file_size: int, mime_type: str) -> Attachment:
    att = Attachment(post_id=post_id, filename=filename, stored_name=stored_name, file_size=file_size, mime_type=mime_type)
    db.add(att)
    db.commit()
    db.refresh(att)
    return att


def get_attachment(db: Session, attachment_id: int) -> Attachment | None:
    return db.query(Attachment).filter(Attachment.id == attachment_id).first()


def delete_attachment(db: Session, attachment_id: int, user_id: int, is_admin: bool = False) -> Attachment | None:
    att = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not att:
        return None
    post = db.query(Post).filter(Post.id == att.post_id).first()
    if not is_admin and (not post or post.user_id != user_id):
        return None
    db.delete(att)
    db.commit()
    return att
