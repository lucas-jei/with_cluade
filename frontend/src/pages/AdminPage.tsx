import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminAPI } from '../api';
import type { CodeGroup, Code, Session, User } from '../types';
import './AdminPage.css';

interface GroupForm {
  code: string;
  name: string;
}

interface CodeForm {
  code: string;
  name: string;
  sort_order: number | string;
}

function CodesTab() {
  const [groups, setGroups] = useState<CodeGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<CodeGroup | null>(null);
  const [codes, setCodes] = useState<Code[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingCodes, setLoadingCodes] = useState(false);

  const [groupForm, setGroupForm] = useState<GroupForm>({ code: '', name: '' });
  const [groupFormError, setGroupFormError] = useState('');
  const [editGroupId, setEditGroupId] = useState<number | null>(null);
  const [editGroupForm, setEditGroupForm] = useState<{ name: string }>({ name: '' });

  const [codeForm, setCodeForm] = useState<CodeForm>({ code: '', name: '', sort_order: 0 });
  const [editCodeId, setEditCodeId] = useState<number | null>(null);
  const [editCodeForm, setEditCodeForm] = useState<{ name: string; sort_order: number | string }>({ name: '', sort_order: 0 });

  const loadGroups = () => {
    setLoadingGroups(true);
    adminAPI.getCodeGroups()
      .then((data) => {
        setGroups(data);
        if (selectedGroup) {
          const updated = data.find((g) => g.id === selectedGroup.id);
          setSelectedGroup(updated || null);
        }
      })
      .finally(() => setLoadingGroups(false));
  };

  const loadCodes = (groupId: number) => {
    setLoadingCodes(true);
    adminAPI.getGroupCodes(groupId)
      .then(setCodes)
      .finally(() => setLoadingCodes(false));
  };

  useEffect(() => { loadGroups(); }, []); // eslint-disable-line

  const selectGroup = (g: CodeGroup) => {
    setSelectedGroup(g);
    setEditCodeId(null);
    setCodeForm({ code: '', name: '', sort_order: 0 });
    loadCodes(g.id);
  };

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupForm.code.trim() || !groupForm.name.trim()) return;
    setGroupFormError('');
    try {
      await adminAPI.createCodeGroup(groupForm);
      setGroupForm({ code: '', name: '' });
      loadGroups();
    } catch (err) { setGroupFormError((err as Error).message); }
  };

  const handleSaveGroup = async (id: number) => {
    try {
      await adminAPI.updateCodeGroup(id, editGroupForm);
      setEditGroupId(null);
      loadGroups();
    } catch (err) { alert((err as Error).message); }
  };

  const handleDeleteGroup = async (id: number) => {
    if (!window.confirm('그룹과 하위 코드가 모두 삭제됩니다. 계속하시겠습니까?')) return;
    try {
      await adminAPI.deleteCodeGroup(id);
      if (selectedGroup?.id === id) { setSelectedGroup(null); setCodes([]); }
      loadGroups();
    } catch (err) { alert((err as Error).message); }
  };

  const handleAddCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeForm.code.trim() || !codeForm.name.trim() || !selectedGroup) return;
    try {
      await adminAPI.createCode({ ...codeForm, group_id: selectedGroup.id, sort_order: Number(codeForm.sort_order) });
      setCodeForm({ code: '', name: '', sort_order: 0 });
      loadCodes(selectedGroup.id);
    } catch (err) { alert((err as Error).message); }
  };

  const handleSaveCode = async (id: number) => {
    if (!selectedGroup) return;
    try {
      await adminAPI.updateCode(id, { ...editCodeForm, sort_order: Number(editCodeForm.sort_order) });
      setEditCodeId(null);
      loadCodes(selectedGroup.id);
    } catch (err) { alert((err as Error).message); }
  };

  const handleDeleteCode = async (id: number) => {
    if (!selectedGroup) return;
    if (!window.confirm('이 코드를 삭제하시겠습니까?')) return;
    try {
      await adminAPI.deleteCode(id);
      loadCodes(selectedGroup.id);
    } catch (err) { alert((err as Error).message); }
  };

  const handleToggleCode = async (c: Code) => {
    if (!selectedGroup) return;
    try {
      await adminAPI.updateCode(c.id, { is_active: !c.is_active });
      loadCodes(selectedGroup.id);
    } catch (err) { alert((err as Error).message); }
  };

  return (
    <div className="codes-tab">
      <div className="codes-section">
        <div className="codes-section-header">
          <h3>부모코드 그룹</h3>
        </div>
        <form className="code-add-form" onSubmit={handleAddGroup}>
          <input
            placeholder="코드 (예: BOARD_CATEGORY)"
            value={groupForm.code}
            onChange={(e) => setGroupForm({ ...groupForm, code: e.target.value })}
          />
          <input
            placeholder="그룹명 (예: 게시판구분)"
            value={groupForm.name}
            onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
          />
          <button type="submit" className="btn-detail">추가</button>
        </form>
        {groupFormError && <p className="form-error">{groupFormError}</p>}

        {loadingGroups ? <p className="loading">불러오는 중...</p> : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>코드</th>
                <th>그룹명</th>
                <th>생성일</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {groups.length === 0 && (
                <tr><td colSpan={4} className="empty">등록된 그룹이 없습니다.</td></tr>
              )}
              {groups.map((g) => (
                <tr
                  key={g.id}
                  className={selectedGroup?.id === g.id ? 'selected-row' : ''}
                  style={{ cursor: 'pointer' }}
                  onClick={() => selectGroup(g)}
                >
                  <td>{g.code}</td>
                  <td>
                    {editGroupId === g.id
                      ? <input value={editGroupForm.name} onChange={(e) => setEditGroupForm({ name: e.target.value })} onClick={(e) => e.stopPropagation()} />
                      : g.name}
                  </td>
                  <td>{new Date(g.created_at).toLocaleDateString('ko-KR')}</td>
                  <td className="code-actions" onClick={(e) => e.stopPropagation()}>
                    {editGroupId === g.id ? (
                      <>
                        <button className="btn-detail" onClick={() => handleSaveGroup(g.id)}>저장</button>
                        <button className="btn-back" onClick={() => setEditGroupId(null)}>취소</button>
                      </>
                    ) : (
                      <>
                        <button className="btn-detail" onClick={() => { setEditGroupId(g.id); setEditGroupForm({ name: g.name }); }}>수정</button>
                        <button className="btn-danger" onClick={() => handleDeleteGroup(g.id)}>삭제</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedGroup && (
        <div className="codes-section codes-section-child">
          <div className="codes-section-header">
            <h3>자식코드 — <span className="group-label">{selectedGroup.code} · {selectedGroup.name}</span></h3>
          </div>
          <form className="code-add-form" onSubmit={handleAddCode}>
            <input
              placeholder="코드값"
              value={codeForm.code}
              onChange={(e) => setCodeForm({ ...codeForm, code: e.target.value })}
            />
            <input
              placeholder="코드명"
              value={codeForm.name}
              onChange={(e) => setCodeForm({ ...codeForm, name: e.target.value })}
            />
            <input
              type="number"
              placeholder="정렬"
              value={codeForm.sort_order}
              onChange={(e) => setCodeForm({ ...codeForm, sort_order: e.target.value })}
              style={{ width: 70 }}
            />
            <button type="submit" className="btn-detail">추가</button>
          </form>

          {loadingCodes ? <p className="loading">불러오는 중...</p> : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>코드값</th>
                  <th>코드명</th>
                  <th>정렬</th>
                  <th>활성</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {codes.length === 0 && (
                  <tr><td colSpan={5} className="empty">등록된 코드가 없습니다.</td></tr>
                )}
                {codes.map((c) => (
                  <tr key={c.id}>
                    <td>{c.code}</td>
                    <td>
                      {editCodeId === c.id
                        ? <input value={editCodeForm.name} onChange={(e) => setEditCodeForm({ ...editCodeForm, name: e.target.value })} />
                        : c.name}
                    </td>
                    <td>
                      {editCodeId === c.id
                        ? <input type="number" value={editCodeForm.sort_order} onChange={(e) => setEditCodeForm({ ...editCodeForm, sort_order: e.target.value })} style={{ width: 60 }} />
                        : c.sort_order}
                    </td>
                    <td>
                      <button
                        className={`badge ${c.is_active ? 'active' : 'expired'}`}
                        onClick={() => handleToggleCode(c)}
                        style={{ cursor: 'pointer', border: 'none' }}
                      >
                        {c.is_active ? '활성' : '비활성'}
                      </button>
                    </td>
                    <td className="code-actions">
                      {editCodeId === c.id ? (
                        <>
                          <button className="btn-detail" onClick={() => handleSaveCode(c.id)}>저장</button>
                          <button className="btn-back" onClick={() => setEditCodeId(null)}>취소</button>
                        </>
                      ) : (
                        <>
                          <button className="btn-detail" onClick={() => { setEditCodeId(c.id); setEditCodeForm({ name: c.name, sort_order: c.sort_order }); }}>수정</button>
                          <button className="btn-danger" onClick={() => handleDeleteCode(c.id)}>삭제</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

function SessionsTab() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminAPI.getSessions()
      .then((data) => setSessions(data.filter((s) => s.is_active)))
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const handleForceLogout = async (sessionId: string) => {
    if (!window.confirm('이 세션을 강제 만료하시겠습니까?')) return;
    try {
      await adminAPI.forceLogout(sessionId);
      setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
    } catch (err) {
      alert((err as Error).message);
    }
  };

  if (loading) return <p className="loading">불러오는 중...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th>사용자</th>
          <th>이메일</th>
          <th>IP</th>
          <th>접속 환경</th>
          <th>로그인 시각</th>
          <th>만료 시각</th>
          <th>관리</th>
        </tr>
      </thead>
      <tbody>
        {sessions.length === 0 && (
          <tr><td colSpan={7} className="empty">현재 접속 중인 세션이 없습니다.</td></tr>
        )}
        {sessions.map((s) => (
          <tr key={s.id}>
            <td>{s.username}</td>
            <td>{s.email}</td>
            <td>{s.ip_address || '-'}</td>
            <td className="cell-ellipsis">{s.user_agent || '-'}</td>
            <td>{new Date(s.created_at).toLocaleString('ko-KR')}</td>
            <td>{new Date(s.expires_at).toLocaleString('ko-KR')}</td>
            <td>
              <button className="btn-danger" onClick={() => handleForceLogout(s.session_id)}>
                강제 만료
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminAPI.getUsers()
      .then(setUsers)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="loading">불러오는 중...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>사용자 이름</th>
          <th>이메일</th>
          <th>가입일</th>
          <th>활성</th>
          <th>관리자</th>
          <th>상세</th>
        </tr>
      </thead>
      <tbody>
        {users.length === 0 && (
          <tr><td colSpan={7} className="empty">회원이 없습니다.</td></tr>
        )}
        {users.map((u) => (
          <tr key={u.id}>
            <td>{u.id}</td>
            <td>{u.username}</td>
            <td>{u.email}</td>
            <td>{new Date(u.created_at).toLocaleString('ko-KR')}</td>
            <td><span className={`badge ${u.is_active ? 'active' : 'expired'}`}>{u.is_active ? '활성' : '비활성'}</span></td>
            <td><span className={`badge ${u.is_admin ? 'admin' : 'normal'}`}>{u.is_admin ? '관리자' : '일반'}</span></td>
            <td><Link to={`/admin/users/${u.id}`} className="btn-detail">상세보기</Link></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AdminPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'users' | 'sessions' | 'codes'>('users');

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>관리자</h1>
        <button className="btn-back" onClick={() => navigate('/')}>← 메인으로</button>
      </div>

      <div className="admin-tabs">
        <button
          className={`tab-btn ${tab === 'users' ? 'active' : ''}`}
          onClick={() => setTab('users')}
        >
          회원 목록
        </button>
        <button
          className={`tab-btn ${tab === 'sessions' ? 'active' : ''}`}
          onClick={() => setTab('sessions')}
        >
          세션 관리
        </button>
        <button
          className={`tab-btn ${tab === 'codes' ? 'active' : ''}`}
          onClick={() => setTab('codes')}
        >
          공통코드
        </button>
      </div>

      <div className="admin-content">
        {tab === 'users' && <UsersTab />}
        {tab === 'sessions' && <SessionsTab />}
        {tab === 'codes' && <CodesTab />}
      </div>
    </div>
  );
}

export default AdminPage;
