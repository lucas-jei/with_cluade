import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { postAPI, codeAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import type { Code, Post } from '../types';
import { getCategoryStyle } from '../utils/categoryColor';
import TopNav from '../components/TopNav';
import './MainPage.css';

interface BoardSectionProps {
  category: Code;
  posts: Post[];
  isLoggedIn: boolean;
}

function BoardSection({ category, posts, isLoggedIn }: BoardSectionProps) {
  return (
    <div className="board-section">
      <div className="board-section-header">
        <span className="category-badge" style={getCategoryStyle(category.code)}>{category.name}</span>
      </div>

      <ul className="board-section-list">
        {posts.length === 0 ? (
          <li className="board-section-empty">등록된 게시글이 없습니다.</li>
        ) : (
          posts.map((post) => (
            <li key={post.id} className="board-section-item">
              <Link to={`/board/${post.id}`} className="board-section-title">
                {post.title}
                {post.attachments.length > 0 && (
                  <span className="attachment-indicator" title={`첨부파일 ${post.attachments.length}개`}>
                    📎{post.attachments.length}
                  </span>
                )}
              </Link>
              <span className="board-section-meta">
                {post.username} · {new Date(post.created_at).toLocaleDateString('ko-KR')}
              </span>
            </li>
          ))
        )}
      </ul>

      <div className="board-section-footer">
        <Link to={`/board?category=${category.code}`} className="more-link">
          게시판 바로가기 →
        </Link>
      </div>
    </div>
  );
}

function MainPage() {
  const { isLoggedIn } = useAuth();
  const [categories, setCategories] = useState<Code[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    codeAPI.getCodes('BOARD_CATEGORY').then(setCategories);
    postAPI.getPosts(0, 50).then(setPosts);
  }, []);

  const postsByCategory = (code: string) =>
    posts.filter((p) => p.category === code).slice(0, 5);

  return (
    <div className="main-container">
      <TopNav />

      {!isLoggedIn && (
        <div className="main-banner">
          <p>서비스를 이용하려면 <Link to="/login">로그인</Link>하거나 <Link to="/signup">회원가입</Link>해주세요.</p>
        </div>
      )}

      <section className="board-sections">
        {categories.map((cat) => (
          <BoardSection
            key={cat.id}
            category={cat}
            posts={postsByCategory(cat.code)}
            isLoggedIn={isLoggedIn}
          />
        ))}
      </section>
    </div>
  );
}

export default MainPage;
