export interface User {
  id: number;
  email: string;
  username: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Attachment {
  id: number;
  post_id: number;
  filename: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  category: string;
  username: string;
  user_id: number;
  created_at: string;
  updated_at: string | null;
  attachments: Attachment[];
}

export interface Code {
  id: number;
  code: string;
  name: string;
  sort_order: number;
  is_active: boolean;
}

export interface CodeGroup {
  id: number;
  code: string;
  name: string;
  created_at: string;
}

export interface Session {
  id: number;
  session_id: string;
  username: string;
  email: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  expires_at: string;
  is_active: boolean;
}

export interface LoginResponse {
  access_token: string;
}

export interface PostCount {
  total: number;
}
