import { useEffect, useState, useRef } from 'react';
import { memoAPI } from '../api';
import type { Memo } from '../types';
import TopNav from '../components/TopNav';
import './MemoPage.css';

function MemoPage() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [selected, setSelected] = useState<Memo | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    memoAPI.getMemos()
      .then((data) => {
        setMemos(data);
        if (data.length > 0) selectMemo(data[0]);
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const selectMemo = (memo: Memo) => {
    setSelected(memo);
    setEditTitle(memo.title);
    setEditContent(memo.content);
  };

  const autoSave = (id: number, title: string, content: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      try {
        const updated = await memoAPI.updateMemo(id, { title, content });
        setMemos((prev) => prev.map((m) => m.id === id ? updated : m));
        setSelected(updated);
      } finally {
        setSaving(false);
      }
    }, 800);
  };

  const handleTitleChange = (val: string) => {
    setEditTitle(val);
    if (selected) autoSave(selected.id, val, editContent);
  };

  const handleContentChange = (val: string) => {
    setEditContent(val);
    if (selected) autoSave(selected.id, editTitle, val);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const memo = await memoAPI.createMemo(newTitle.trim());
    setMemos((prev) => [memo, ...prev]);
    setNewTitle('');
    setShowNewForm(false);
    selectMemo(memo);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('이 메모를 삭제하시겠습니까?')) return;
    await memoAPI.deleteMemo(id);
    const next = memos.filter((m) => m.id !== id);
    setMemos(next);
    if (selected?.id === id) {
      if (next.length > 0) selectMemo(next[0]);
      else setSelected(null);
    }
  };

  return (
    <div className="memo-container">
      <TopNav title="메모" />
      <div className="memo-layout">
        <aside className="memo-sidebar">
          <div className="memo-sidebar-header">
            <h2>내 메모</h2>
            <button className="btn-memo-new" onClick={() => setShowNewForm(true)}>+ 새 메모</button>
          </div>

          {showNewForm && (
            <form className="memo-new-form" onSubmit={handleCreate}>
              <input
                autoFocus
                placeholder="메모 제목"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <div className="memo-new-actions">
                <button type="submit" className="btn-memo-save">추가</button>
                <button type="button" className="btn-memo-cancel" onClick={() => { setShowNewForm(false); setNewTitle(''); }}>취소</button>
              </div>
            </form>
          )}

          {loading ? (
            <p className="memo-empty">불러오는 중...</p>
          ) : memos.length === 0 ? (
            <p className="memo-empty">메모가 없습니다.</p>
          ) : (
            <ul className="memo-list">
              {memos.map((m) => (
                <li
                  key={m.id}
                  className={`memo-item ${selected?.id === m.id ? 'active' : ''}`}
                  onClick={() => selectMemo(m)}
                >
                  <div className="memo-item-title">{m.title}</div>
                  <div className="memo-item-meta">
                    {new Date(m.updated_at ?? m.created_at).toLocaleDateString('ko-KR')}
                  </div>
                  <button
                    className="memo-item-delete"
                    onClick={(e) => { e.stopPropagation(); handleDelete(m.id); }}
                  >✕</button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <main className="memo-editor">
          {selected ? (
            <>
              <div className="memo-editor-header">
                <input
                  className="memo-title-input"
                  value={editTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="제목"
                />
                <span className="memo-save-status">{saving ? '저장 중...' : '자동 저장'}</span>
              </div>
              <textarea
                className="memo-content-input"
                value={editContent}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="내용을 입력하세요..."
              />
            </>
          ) : (
            <div className="memo-placeholder">
              <p>새 메모를 추가하거나 목록에서 메모를 선택하세요.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default MemoPage;
