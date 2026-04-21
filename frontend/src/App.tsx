import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainPage from './pages/MainPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AdminPage from './pages/AdminPage';
import AdminUserDetailPage from './pages/AdminUserDetailPage';
import ProfilePage from './pages/ProfilePage';
import MemoPage from './pages/MemoPage';
import BoardPage from './pages/BoardPage';
import PostDetailPage from './pages/PostDetailPage';
import PostFormPage from './pages/PostFormPage';
import { userAPI, authAPI } from './api';
import { AuthContext } from './context/AuthContext';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState('');
  const [authLoading, setAuthLoading] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    if (isLoggedIn) {
      userAPI.getMe()
        .then((user) => { setIsAdmin(user.is_admin); setUsername(user.username); })
        .catch(() => handleLogout())
        .finally(() => setAuthLoading(false));
    }
  }, [isLoggedIn]);

  const handleLogout = async () => {
    try { await authAPI.logout(); } catch (_) {}
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setIsAdmin(false);
    setUsername('');
  };

  if (authLoading) return null;

  return (
    <AuthContext.Provider value={{ isLoggedIn, isAdmin, username, onLogout: handleLogout }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/login" element={<LoginPage onLogin={() => setIsLoggedIn(true)} />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/board" element={<BoardPage isLoggedIn={isLoggedIn} />} />
          <Route path="/board/write" element={isLoggedIn ? <PostFormPage /> : <Navigate to="/login" replace />} />
          <Route path="/board/:postId" element={<PostDetailPage />} />
          <Route path="/board/:postId/edit" element={isLoggedIn ? <PostFormPage /> : <Navigate to="/login" replace />} />
          <Route path="/profile" element={isLoggedIn ? <ProfilePage /> : <Navigate to="/login" replace />} />
          <Route path="/memos" element={isLoggedIn ? <MemoPage /> : <Navigate to="/login" replace />} />
          <Route path="/admin" element={isAdmin ? <AdminPage /> : <Navigate to="/" replace />} />
          <Route path="/admin/users/:userId" element={isAdmin ? <AdminUserDetailPage /> : <Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;
