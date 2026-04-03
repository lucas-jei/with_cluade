import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { postAPI, codeAPI, attachmentAPI } from '../api';
import type { Code, Attachment } from '../types';
import TopNav from '../components/TopNav';
import './BoardPage.css';
import './PostFormPage.css';

interface PendingFile {
  id: string;
  file: File;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function PostFormPage() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const isEdit = !!postId;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<Code[]>([]);
  const [loading, setLoading] = useState(false);

  // 기존 첨부파일 (수정 시)
  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>([]);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  // 새로 추가할 파일
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    codeAPI.getCodes('BOARD_CATEGORY').then((codes) => {
      setCategories(codes);
      if (!isEdit && codes.length > 0) setCategory(codes[0].code);
    });
  }, [isEdit]);

  useEffect(() => {
    if (isEdit) {
      postAPI.getPost(postId).then((post) => {
        setTitle(post.title);
        setContent(post.content);
        setCategory(post.category);
        setExistingAttachments(post.attachments);
      });
    }
  }, [postId, isEdit]);

  const addFiles = (files: FileList | File[]) => {
    const arr = Array.from(files);
    const newPending: PendingFile[] = arr.map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      file,
    }));
    setPendingFiles((prev) => [...prev, ...newPending]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
      e.target.value = '';
    }
  };

  const removePending = (id: string) => {
    setPendingFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const removeExisting = async (attachmentId: number) => {
    setDeletingIds((prev) => new Set(prev).add(attachmentId));
    try {
      await attachmentAPI.delete(attachmentId);
      setExistingAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(attachmentId);
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setLoading(true);
    try {
      let savedPostId: number;
      if (isEdit) {
        await postAPI.updatePost(postId, { title, content, category });
        savedPostId = parseInt(postId, 10);
      } else {
        const post = await postAPI.createPost(title, content, category);
        savedPostId = post.id;
      }

      // 파일 업로드
      for (const pf of pendingFiles) {
        try {
          await attachmentAPI.upload(savedPostId, pf.file);
        } catch (err) {
          alert(`"${pf.file.name}" 업로드 실패: ${(err as Error).message}`);
        }
      }

      navigate(`/board/${savedPostId}`);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <TopNav />
    <div className="board-container">
      <div className="board-header">
        <h1>{isEdit ? '게시글 수정' : '게시글 작성'}</h1>
        <button className="btn-back" onClick={() => navigate(isEdit ? `/board/${postId}` : '/board')}>
          ← 취소
        </button>
      </div>

      <form className="post-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <select
            className="category-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.code}>{c.name}</option>
            ))}
          </select>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            maxLength={100}
            required
          />
        </div>
        <div className="form-group">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="내용을 입력하세요"
            rows={15}
            required
          />
        </div>

        {/* 첨부파일 */}
        <div className="attachment-section">
          <p className="attachment-label">첨부파일</p>

          {/* 드래그앤드롭 영역 */}
          <div
            className={`drop-zone ${dragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <span>파일을 드래그하거나 클릭하여 추가</span>
            <span className="drop-zone-hint">최대 20MB</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileInput}
          />

          {/* 기존 첨부파일 (수정 시) */}
          {existingAttachments.length > 0 && (
            <ul className="attachment-list">
              {existingAttachments.map((att) => (
                <li key={att.id} className="attachment-item">
                  <span className="attachment-name">{att.filename}</span>
                  <span className="attachment-size">{formatBytes(att.file_size)}</span>
                  <button
                    type="button"
                    className="attachment-remove"
                    onClick={() => removeExisting(att.id)}
                    disabled={deletingIds.has(att.id)}
                  >
                    {deletingIds.has(att.id) ? '삭제 중...' : '✕'}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* 새로 추가할 파일 */}
          {pendingFiles.length > 0 && (
            <ul className="attachment-list">
              {pendingFiles.map((pf) => (
                <li key={pf.id} className="attachment-item pending">
                  <span className="attachment-name">{pf.file.name}</span>
                  <span className="attachment-size">{formatBytes(pf.file.size)}</span>
                  <button
                    type="button"
                    className="attachment-remove"
                    onClick={() => removePending(pf.id)}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="form-submit">
          <button type="submit" className="btn-write" disabled={loading}>
            {loading ? '처리 중...' : isEdit ? '수정 완료' : '등록'}
          </button>
        </div>
      </form>
    </div>
    </>
  );
}

export default PostFormPage;
