import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../api';
import './AuthForm.css';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setMessage('재설정 링크를 이메일로 발송했습니다. 메일함을 확인해주세요.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>비밀번호 찾기</h1>
        <p className="auth-desc">가입한 이메일을 입력하면 재설정 링크를 보내드립니다.</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일을 입력하세요"
              required
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          {message && <p className="success-message">{message}</p>}
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? '발송 중...' : '재설정 링크 발송'}
          </button>
        </form>
        <p className="auth-link">
          <Link to="/login">로그인으로 돌아가기</Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
