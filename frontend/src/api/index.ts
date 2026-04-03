import type {
  LoginResponse,
  User,
  Post,
  PostCount,
  Code,
  CodeGroup,
  Session,
  Attachment,
} from '../types';

const BASE_URL = '/api';

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options.headers as Record<string, string>),
    },
    ...options,
  });

  const data: T = res.status !== 204 ? await res.json() : (null as T);

  if (!res.ok) {
    const err = data as { detail?: string };
    throw new Error(err?.detail || '요청에 실패했습니다.');
  }

  return data;
}

export const authAPI = {
  login: (email: string, password: string) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    request<null>('/auth/logout', { method: 'POST' }),

  forgotPassword: (email: string) =>
    request<null>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, password: string) =>
    request<null>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),
};

export const userAPI = {
  signup: (email: string, username: string, password: string) =>
    request<User>('/users', {
      method: 'POST',
      body: JSON.stringify({ email, username, password }),
    }),

  getMe: () => request<User>('/users/me'),

  getUsers: () => request<User[]>('/users'),

  getUser: (id: number) => request<User>(`/users/${id}`),

  updateUser: (id: number, data: Partial<User & { password: string }>) =>
    request<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteUser: (id: number) =>
    request<null>(`/users/${id}`, { method: 'DELETE' }),
};

export const postAPI = {
  getPosts: (skip = 0, limit = 10, category: string | null = null, search: string | null = null) => {
    const params = new URLSearchParams({ skip: String(skip), limit: String(limit) });
    if (category) params.set('category', category);
    if (search) params.set('search', search);
    return request<Post[]>(`/posts?${params}`);
  },

  countPosts: (category: string | null = null, search: string | null = null) => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (search) params.set('search', search);
    return request<PostCount>(`/posts/count?${params}`);
  },

  getPost: (id: string | number) => request<Post>(`/posts/${id}`),

  createPost: (title: string, content: string, category = '일반') =>
    request<Post>('/posts', {
      method: 'POST',
      body: JSON.stringify({ title, content, category }),
    }),

  updatePost: (id: string | number, data: Partial<Pick<Post, 'title' | 'content' | 'category'>>) =>
    request<Post>(`/posts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deletePost: (id: string | number) =>
    request<null>(`/posts/${id}`, { method: 'DELETE' }),
};

export const attachmentAPI = {
  upload: (postId: number, file: File): Promise<Attachment> => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${BASE_URL}/posts/${postId}/attachments`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || '업로드에 실패했습니다.');
      return data;
    });
  },

  download: (attachmentId: number) => {
    window.location.href = `${BASE_URL}/posts/attachments/${attachmentId}/download`;
  },

  delete: (attachmentId: number) =>
    request<null>(`/posts/attachments/${attachmentId}`, { method: 'DELETE' }),
};

export const codeAPI = {
  getCodes: (groupCode: string) => request<Code[]>(`/codes/${groupCode}`),
};

export const adminAPI = {
  getUsers: () => request<User[]>('/admin/users'),

  getUser: (id: string | number) => request<User>(`/admin/users/${id}`),

  updateUser: (id: string | number, data: Partial<User>) =>
    request<User>(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  getUserSessions: (id: string | number) => request<Session[]>(`/admin/users/${id}/sessions`),

  getSessions: () => request<Session[]>('/admin/sessions'),

  forceLogout: (sessionId: string) =>
    request<null>(`/admin/sessions/${sessionId}`, { method: 'DELETE' }),

  getCodeGroups: () => request<CodeGroup[]>('/admin/code-groups'),

  createCodeGroup: (data: Pick<CodeGroup, 'code' | 'name'>) =>
    request<CodeGroup>('/admin/code-groups', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCodeGroup: (id: number, data: Partial<Pick<CodeGroup, 'name'>>) =>
    request<CodeGroup>(`/admin/code-groups/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteCodeGroup: (id: number) =>
    request<null>(`/admin/code-groups/${id}`, { method: 'DELETE' }),

  getGroupCodes: (groupId: number) => request<Code[]>(`/admin/code-groups/${groupId}/codes`),

  createCode: (data: Omit<Code, 'id' | 'is_active'> & { group_id: number }) =>
    request<Code>('/admin/codes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCode: (id: number, data: Partial<Omit<Code, 'id'>>) =>
    request<Code>(`/admin/codes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteCode: (id: number) =>
    request<null>(`/admin/codes/${id}`, { method: 'DELETE' }),
};
