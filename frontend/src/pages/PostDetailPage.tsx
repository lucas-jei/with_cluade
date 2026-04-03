import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { postAPI, userAPI, attachmentAPI } from '../api';
import type { Post, User } from '../types';
import './BoardPage.css';

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const backUrl = (location.state as { from?: string })?.from || '/board';
  const [post, setPost] = useState<Post | null>(null);
  const [me, setMe] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    Promise.all([
      postAPI.getPost(postId!),
      token ? userAPI.getMe() : Promise.resolve(null),
    ])
      .then(([p, u]) => { setPost(p); setMe(u); })
      .finally(() => setLoading(false));
  }, [postId]);

  const handleDelete = async () => {
    if (!window.confirm('게시글을 삭제하시겠습니까?')) return;
    try {
      await postAPI.deletePost(postId!);
      navigate(backUrl);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const canEdit = me && post && (me.id === post.user_id);
  const canDelete = me && post && (me.id === post.user_id || me.is_admin);

  if (loading) return <div className="board-container"><p className="loading">불러오는 중...</p></div>;
  if (!post) return <div className="board-container"><p className="empty">게시글을 찾을 수 없습니다.</p></div>;

  return (
    <div className="board-container">
      <div className="board-header">
        <h1>게시판</h1>
        <button className="btn-back" onClick={() => navigate(backUrl)}>← 목록으로</button>
      </div>

      <div className="post-detail">
        <div className="post-title-row">
          <h2>{post.title}</h2>
          <div className="post-buttons">
            {canEdit && <Link to={`/board/${post.id}/edit`} className="btn-edit">수정</Link>}
            {canDelete && <button className="btn-delete" onClick={handleDelete}>삭제</button>}
          </div>
        </div>
        <div className="post-meta">
          <span className={`category-badge cat-${post.category}`}>{post.category}</span>
          <span>{post.username}</span>
          <span>{new Date(post.created_at).toLocaleString('ko-KR')}</span>
          {post.updated_at && <span>(수정됨)</span>}
        </div>
        <div className="post-content">{post.content}</div>

        {post.attachments.length > 0 && (
          <div className="post-attachments">
            <p className="attachment-label">첨부파일 ({post.attachments.length})</p>
            <ul className="attachment-list">
              {post.attachments.map((att) => (
                <li key={att.id} className="attachment-item">
                  <button
                    className="attachment-download"
                    onClick={() => attachmentAPI.download(att.id)}
                  >
                    {att.filename}
                  </button>
                  <span className="attachment-size">{formatBytes(att.file_size)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default PostDetailPage;
