import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './TopNav.css';

function TopNav() {
  const { isLoggedIn, isAdmin, username, onLogout } = useAuth();

  return (
    <header className="topnav">
      <Link to="/" className="topnav-logo">WithCluade</Link>
      <nav className="topnav-nav">
        {isLoggedIn ? (
          <>
            {isAdmin && (
              <Link to="/admin" className="btn-outline">관리자</Link>
            )}
            <Link to="/profile" className="btn-outline">
              <span className="nav-username">{username}</span> 내 정보
            </Link>
            <button className="btn-outline" onClick={onLogout}>로그아웃</button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn-outline">로그인</Link>
            <Link to="/signup" className="btn-primary">회원가입</Link>
          </>
        )}
      </nav>
    </header>
  );
}

export default TopNav;
