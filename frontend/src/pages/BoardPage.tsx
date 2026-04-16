import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { postAPI, codeAPI } from '../api';
import type { Code, Post } from '../types';
import TopNav from '../components/TopNav';
import { getCategoryStyle } from '../utils/categoryColor';
import './BoardPage.css';

const DEFAULT_PAGE_SIZE = 10;
const MIN_PAGE_SIZE = 1;
const MAX_PAGE_SIZE = 100;

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

function Pagination({ page, totalPages, onChange }: PaginationProps) {
  const [input, setInput] = useState('');

  if (totalPages <= 1) return null;

  const WINDOW = 5;
  const half = Math.floor(WINDOW / 2);
  let start = Math.max(1, page - half);
  let end = Math.min(totalPages, start + WINDOW - 1);
  if (end - start < WINDOW - 1) start = Math.max(1, end - WINDOW + 1);

  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);

  const goToPage = () => {
    const p = parseInt(input, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) onChange(p);
    setInput('');
  };

  return (
    <div className="pagination-wrap">
      <div className="pagination">
        <button className="page-btn" onClick={() => onChange(page - 1)} disabled={page === 1}>‹</button>
        {start > 1 && <>
          <button className="page-btn" onClick={() => onChange(1)}>1</button>
          {start > 2 && <span className="page-ellipsis">…</span>}
        </>}
        {pages.map((p) => (
          <button
            key={p}
            className={`page-btn ${p === page ? 'active' : ''}`}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        ))}
        {end < totalPages && <>
          {end < totalPages - 1 && <span className="page-ellipsis">…</span>}
          <button className="page-btn" onClick={() => onChange(totalPages)}>{totalPages}</button>
        </>}
        <button className="page-btn" onClick={() => onChange(page + 1)} disabled={page === totalPages}>›</button>
      </div>

      <div className="page-jump">
        <input
          type="number"
          min={1}
          max={totalPages}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && goToPage()}
          placeholder="페이지"
          className="page-jump-input"
        />
        <button className="page-jump-btn" onClick={goToPage}>이동</button>
      </div>
    </div>
  );
}

interface Props {
  isLoggedIn: boolean;
}

function BoardPage({ isLoggedIn }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [categories, setCategories] = useState<Code[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const selectedCategory = searchParams.get('category') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('size') || String(DEFAULT_PAGE_SIZE), 10);
  const searchKeyword = searchParams.get('search') || '';
  const totalPages = Math.ceil(total / pageSize);

  const [sizeInput, setSizeInput] = useState(String(pageSize));
  const [searchInput, setSearchInput] = useState(searchKeyword);

  useEffect(() => {
    codeAPI.getCodes('BOARD_CATEGORY').then(setCategories);
  }, []);

  useEffect(() => {
    setLoading(true);
    const cat = selectedCategory || null;
    const kw = searchKeyword || null;
    const skip = (page - 1) * pageSize;
    Promise.all([
      postAPI.getPosts(skip, pageSize, cat, kw),
      postAPI.countPosts(cat, kw),
    ]).then(([items, { total: t }]) => {
      setPosts(items);
      setTotal(t);
    }).finally(() => setLoading(false));
  }, [selectedCategory, page, pageSize, searchKeyword]);

  interface BuildParams {
    cat?: string;
    p?: number;
    size?: number;
    kw?: string;
  }

  const buildParams = ({ cat = selectedCategory, p = 1, size = pageSize, kw = searchKeyword }: BuildParams = {}) => {
    const params: Record<string, string> = {};
    if (cat) params.category = cat;
    if (p > 1) params.page = String(p);
    if (size !== DEFAULT_PAGE_SIZE) params.size = String(size);
    if (kw) params.search = kw;
    return params;
  };

  const handleCategoryClick = (code: string) => {
    setSearchInput(searchKeyword);
    setSearchParams(buildParams({ cat: code }));
  };

  const handlePageChange = (p: number) => {
    setSearchParams(buildParams({ p }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => setSizeInput(e.target.value);
  const applySize = () => {
    const parsed = parseInt(sizeInput, 10);
    if (isNaN(parsed)) { setSizeInput(String(pageSize)); return; }
    const clamped = Math.min(MAX_PAGE_SIZE, Math.max(MIN_PAGE_SIZE, parsed));
    setSizeInput(String(clamped));
    setSearchParams(buildParams({ size: clamped }));
  };

  const handleSearch = () => {
    setSearchParams(buildParams({ kw: searchInput.trim() }));
  };
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };
  const handleSearchClear = () => {
    setSearchInput('');
    setSearchParams(buildParams({ kw: '' }));
  };

  const boardUrl = location.pathname + location.search;

  return (
    <>
    <TopNav />
    <div className="board-container">
      <div className="board-header">
        <h1>게시판</h1>
        <div className="board-actions">
          <button className="btn-back" onClick={() => navigate('/')}>← 메인으로</button>
          {isLoggedIn && (
            <Link to="/board/write" state={{ category: selectedCategory || undefined, from: boardUrl }} className="btn-write">글쓰기</Link>
          )}
        </div>
      </div>

      <div className="category-tabs">
        <button
          className={`category-tab ${selectedCategory === '' ? 'active' : ''}`}
          onClick={() => handleCategoryClick('')}
        >
          전체
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`category-tab ${selectedCategory === cat.code ? 'active' : ''}`}
            onClick={() => handleCategoryClick(cat.code)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="board-info">
        <span className="board-total">총 <strong>{total}</strong>개 게시글</span>
        <div className="page-size-control">
          <label>페이지당</label>
          <input
            type="number"
            value={sizeInput}
            min={MIN_PAGE_SIZE}
            max={MAX_PAGE_SIZE}
            onChange={handleSizeChange}
            onBlur={applySize}
            onKeyDown={(e) => e.key === 'Enter' && applySize()}
            className="page-size-input"
          />
          <span>개</span>
          {totalPages > 0 && <span className="board-page-info">{page} / {totalPages} 페이지</span>}
        </div>
      </div>

      {loading ? (
        <p className="loading">불러오는 중...</p>
      ) : (
        <>
          <div className="table-wrap">
          <table className="board-table">
            <thead>
              <tr>
                <th className="col-id">번호</th>
                <th className="col-category">분류</th>
                <th className="col-title">제목</th>
                <th className="col-author">작성자</th>
                <th className="col-date">작성일</th>
              </tr>
            </thead>
            <tbody>
              {posts.length === 0 && (
                <tr><td colSpan={5} className="empty">
                  {searchKeyword ? '검색 결과가 없습니다.' : '등록된 게시글이 없습니다.'}
                </td></tr>
              )}
              {posts.map((post) => (
                <tr key={post.id}>
                  <td className="col-id">{post.id}</td>
                  <td className="col-category">
                    <span className="category-badge" style={getCategoryStyle(post.category)}>{post.category}</span>
                  </td>
                  <td className="col-title">
                    <Link to={`/board/${post.id}`} state={{ from: boardUrl }}>{post.title}</Link>
                    {post.attachments.length > 0 && (
                      <span className="attachment-indicator" title={`첨부파일 ${post.attachments.length}개`}>
                        📎{post.attachments.length}
                      </span>
                    )}
                  </td>
                  <td className="col-author">{post.username}</td>
                  <td className="col-date">{new Date(post.created_at).toLocaleDateString('ko-KR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          <Pagination page={page} totalPages={totalPages} onChange={handlePageChange} />

          <div className="search-bar">
            <div className="search-input-wrap">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="제목 또는 내용 검색"
                className="search-input"
              />
              {searchInput && (
                <button className="search-clear" onClick={handleSearchClear}>✕</button>
              )}
            </div>
            <button className="search-btn" onClick={handleSearch}>검색</button>
          </div>

          {searchKeyword && (
            <div className="search-result-info">
              <span><strong>"{searchKeyword}"</strong> 검색 결과 {total}건</span>
              <button className="search-clear-btn" onClick={handleSearchClear}>검색 초기화</button>
            </div>
          )}
        </>
      )}
    </div>
    </>
  );
}

export default BoardPage;
