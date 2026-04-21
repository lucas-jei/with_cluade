import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './TopNav.css';

function getTokenExpiry(): number | null {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

function SessionTimer() {
  const [expiry, setExpiry] = useState<number | null>(getTokenExpiry);
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const syncExpiry = () => setExpiry(getTokenExpiry());
    // 다른 탭에서의 변경 감지
    window.addEventListener('storage', syncExpiry);
    // 같은 탭 내 토큰 갱신 감지 (5초마다 확인)
    const syncId = setInterval(syncExpiry, 5000);
    return () => { window.removeEventListener('storage', syncExpiry); clearInterval(syncId); };
  }, []);

  useEffect(() => {
    if (!expiry) { setRemaining(null); return; }
    const tick = () => setRemaining(Math.max(0, expiry - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiry]);

  if (remaining === null) return null;

  const totalSec = Math.floor(remaining / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const timeStr = h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
  const isWarning = totalSec <= 300;

  return (
    <span className={`session-timer${isWarning ? ' session-timer-warning' : ''}`}>
      세션 {timeStr}
    </span>
  );
}

interface TopNavProps {
  title?: string;
  backTo?: string;
  backLabel?: string;
}

function TopNav({ title, backTo, backLabel = '← 메인으로' }: TopNavProps) {
  const { isLoggedIn, isAdmin, username, onLogout } = useAuth();

  return (
    <header className="topnav">
      <div className="topnav-left">
        <Link to="/" className="topnav-logo">WithCluade</Link>
        {title && (
          <>
            <span className="topnav-divider">/</span>
            <span className="topnav-title">{title}</span>
          </>
        )}
      </div>
      <nav className="topnav-nav">
        {backTo && (
          <Link to={backTo} className="btn-back-nav">{backLabel}</Link>
        )}
        {isLoggedIn ? (
          <>
            <SessionTimer />
            {isAdmin && (
              <Link to="/admin" className="btn-outline">관리자</Link>
            )}
            <Link to="/memos" className="btn-outline">메모</Link>
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
