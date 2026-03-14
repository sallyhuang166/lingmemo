const API_BASE_URL = 'https://1411435087-kx79oy1a6s.ap-beijing.tencentscf.com/api';

let authToken = localStorage.getItem('auth_token');

export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('auth_token', token);
    authToken = token;
  } else {
    localStorage.removeItem('auth_token');
    authToken = null;
  }
};

export const getAuthToken = () => authToken;

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (authToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// Auth API
export const authApi = {
  register: (email: string, password: string, name?: string) =>
    request<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),

  login: (email: string, password: string) =>
    request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<{ user: any }>('/auth/me'),
};

// Folders API
export const folderApi = {
  getAll: () => request<{ folders: any[] }>('/folders'),

  create: (name: string, parentId?: string) =>
    request<{ folder: any }>('/folders', {
      method: 'POST',
      body: JSON.stringify({ name, parentId }),
    }),

  update: (id: string, name: string) =>
    request<{ folder: any }>(`/folders/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    }),

  delete: (id: string) =>
    request<{ success: boolean }>(`/folders/${id}`, {
      method: 'DELETE',
    }),
};

// Notes API
export const noteApi = {
  getAll: (folderId?: string) => {
    const query = folderId ? `?folderId=${folderId}` : '';
    return request<{ notes: any[] }>(`/notes${query}`);
  },

  getOne: (id: string) => request<{ note: any }>(`/notes/${id}`),

  create: (folderId?: string) =>
    request<{ note: any }>('/notes', {
      method: 'POST',
      body: JSON.stringify({ folderId }),
    }),

  update: (id: string, data: any) =>
    request<{ note: any }>(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<{ success: boolean }>(`/notes/${id}`, {
      method: 'DELETE',
    }),

  restore: (id: string) =>
    request<{ success: boolean }>(`/notes/${id}/restore`, {
      method: 'POST',
    }),

  permanentDelete: (id: string) =>
    request<{ success: boolean }>(`/notes/${id}/permanent`, {
      method: 'DELETE',
    }),

  search: (query: string) =>
    request<{ notes: any[] }>(`/notes/search/${encodeURIComponent(query)}`),
};

// AI API
export const aiApi = {
  generateSummary: (noteId: string) =>
    request<{ summary: string }>('/ai/summary', {
      method: 'POST',
      body: JSON.stringify({ noteId }),
    }),

  search: (query: string) =>
    request<{ notes: any[] }>('/ai/search', {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),
};
