import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../api';
import type { User } from '../types';
import './ProfilePage.css';

interface Msg {
  type: 'success' | 'error' | '';
  text: string;
}

function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  const [username, setUsername] = useState('');
  const [infoMsg, setInfoMsg] = useState<Msg>({ type: '', text: '' });
  const [infoLoading, setInfoLoading] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwMsg, setPwMsg] = useState<Msg>({ type: '', text: '' });
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    userAPI.getMe().then((u) => {
      setUser(u);
      setUsername(u.username);
    }).catch(() => navigate('/login'));
  }, [navigate]);

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setInfoLoading(true);
    setInfoMsg({ type: '', text: '' });
    try {
      const updated = await userAPI.updateUser(user.id, { username });
      setUser(updated);
      setInfoMsg({ type: 'success', text: '정보가 업데이트되었습니다.' });
    } catch (err) {
      setInfoMsg({ type: 'error', text: (err as Error).message });
    } finally {
      setInfoLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (newPassword.length < 8) {
      setPwMsg({ type: 'error', text: '비밀번호는 최소 8자 이상이어야 합니다.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: 'error', text: '비밀번호가 일치하지 않습니다.' });
      return;
    }
    setPwLoading(true);
    setPwMsg({ type: '', text: '' });
    try {
      await userAPI.updateUser(user.id, { password: newPassword });
      setNewPassword('');
      setConfirmPassword('');
      setPwMsg({ type: 'success', text: '비밀번호가 변경되었습니다.' });
    } catch (err) {
      setPwMsg({ type: 'error', text: (err as Error).message });
    } finally {
      setPwLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>내 정보</h1>
        <button className="btn-back" onClick={() => navigate('/')}>← 메인으로</button>
      </div>

      <div className="profile-summary">
        <div className="profile-avatar">{user.username.charAt(0).toUpperCase()}</div>
        <div className="profile-summary-info">
          <p className="profile-name">{user.username}</p>
          <p className="profile-email">{user.email}</p>
          <p className="profile-meta">
            가입일 {new Date(user.created_at).toLocaleDateString('ko-KR')}
            {user.is_admin && <span className="badge-admin">관리자</span>}
          </p>
        </div>
      </div>

      <div className="profile-card">
        <h2>기본 정보 수정</h2>
        <form onSubmit={handleInfoSubmit}>
          <div className="form-group">
            <label>이메일 (변경 불가)</label>
            <input type="email" value={user.email} disabled className="input-readonly" />
          </div>
          <div className="form-group">
            <label>사용자 이름</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          {infoMsg.text && (
            <p className={infoMsg.type === 'success' ? 'msg-success' : 'msg-error'}>
              {infoMsg.text}
            </p>
          )}
          <div className="form-submit">
            <button type="submit" className="btn-save" disabled={infoLoading}>
              {infoLoading ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>

      <div className="profile-card">
        <h2>비밀번호 변경</h2>
        <form onSubmit={handlePasswordSubmit}>
          <div className="form-group">
            <label>새 비밀번호</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="8자 이상"
              required
            />
          </div>
          <div className="form-group">
            <label>새 비밀번호 확인</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="비밀번호를 다시 입력하세요"
              required
            />
          </div>
          {pwMsg.text && (
            <p className={pwMsg.type === 'success' ? 'msg-success' : 'msg-error'}>
              {pwMsg.text}
            </p>
          )}
          <div className="form-submit">
            <button type="submit" className="btn-save" disabled={pwLoading}>
              {pwLoading ? '변경 중...' : '비밀번호 변경'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfilePage;
