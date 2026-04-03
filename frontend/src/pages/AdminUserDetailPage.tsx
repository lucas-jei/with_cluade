import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminAPI } from '../api';
import type { User, Session } from '../types';
import './AdminUserDetailPage.css';

function AdminUserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      adminAPI.getUser(userId!),
      adminAPI.getUserSessions(userId!),
    ])
      .then(([u, s]) => { setUser(u); setSessions(s); })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleToggle = async (field: 'is_active' | 'is_admin') => {
    if (!user) return;
    try {
      const updated = await adminAPI.updateUser(userId!, { [field]: !user[field] });
      setUser(updated);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleForceLogout = async (sessionId: string) => {
    if (!window.confirm('이 세션을 강제 만료하시겠습니까?')) return;
    try {
      await adminAPI.forceLogout(sessionId);
      setSessions((prev) =>
        prev.map((s) => s.session_id === sessionId ? { ...s, is_active: false } : s)
      );
    } catch (err) {
      alert((err as Error).message);
    }
  };

  if (loading) return <div className="detail-container"><p className="loading">불러오는 중...</p></div>;
  if (error) return <div className="detail-container"><p className="error-message">{error}</p></div>;
  if (!user) return null;

  return (
    <div className="detail-container">
      <div className="detail-header">
        <h1>회원 상세정보</h1>
        <button className="btn-back" onClick={() => navigate('/admin')}>← 목록으로</button>
      </div>

      <div className="detail-card">
        <h2>기본 정보</h2>
        <div className="info-grid">
          <div className="info-row">
            <span className="info-label">ID</span>
            <span className="info-value">{user.id}</span>
          </div>
          <div className="info-row">
            <span className="info-label">사용자 이름</span>
            <span className="info-value">{user.username}</span>
          </div>
          <div className="info-row">
            <span className="info-label">이메일</span>
            <span className="info-value">{user.email}</span>
          </div>
          <div className="info-row">
            <span className="info-label">가입일</span>
            <span className="info-value">{new Date(user.created_at).toLocaleString('ko-KR')}</span>
          </div>
          <div className="info-row">
            <span className="info-label">활성 상태</span>
            <span className="info-value">
              <span className={`badge ${user.is_active ? 'active' : 'expired'}`}>
                {user.is_active ? '활성' : '비활성'}
              </span>
              <button className="btn-toggle" onClick={() => handleToggle('is_active')}>
                {user.is_active ? '비활성화' : '활성화'}
              </button>
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">관리자 여부</span>
            <span className="info-value">
              <span className={`badge ${user.is_admin ? 'admin' : 'normal'}`}>
                {user.is_admin ? '관리자' : '일반'}
              </span>
              <button className="btn-toggle" onClick={() => handleToggle('is_admin')}>
                {user.is_admin ? '권한 해제' : '권한 부여'}
              </button>
            </span>
          </div>
        </div>
      </div>

      <div className="detail-card">
        <h2>세션 내역</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>IP</th>
              <th>접속 환경</th>
              <th>로그인 시각</th>
              <th>만료 시각</th>
              <th>상태</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 && (
              <tr><td colSpan={6} className="empty">세션 내역이 없습니다.</td></tr>
            )}
            {sessions.map((s) => (
              <tr key={s.id} className={!s.is_active ? 'inactive' : ''}>
                <td>{s.ip_address || '-'}</td>
                <td className="cell-ellipsis">{s.user_agent || '-'}</td>
                <td>{new Date(s.created_at).toLocaleString('ko-KR')}</td>
                <td>{new Date(s.expires_at).toLocaleString('ko-KR')}</td>
                <td>
                  <span className={`badge ${s.is_active ? 'active' : 'expired'}`}>
                    {s.is_active ? '활성' : '만료'}
                  </span>
                </td>
                <td>
                  {s.is_active && (
                    <button className="btn-danger" onClick={() => handleForceLogout(s.session_id)}>
                      강제 만료
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminUserDetailPage;
