const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function resolveImageUrl(value) {
  if (!value) return '';

  if (typeof value !== 'string') return '';

  const trimmed = value.trim();
  if (!trimmed) return '';

  if (/^https?:\/\//i.test(trimmed) || /^data:/i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('/uploads/')) {
    return `${API_BASE_URL}${trimmed}`;
  }

  return trimmed;
}

async function request(path, options = {}) {
  const { method = 'GET', body, headers = {}, authToken } = options;

  const config = {
    method,
    headers: { ...headers },
  };

  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }

  if (body instanceof FormData) {
    config.body = body;
  } else if (body !== undefined && body !== null) {
    config.body = JSON.stringify(body);
    config.headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${path}`, config);

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof data === 'object' && data ? data.erro || data.message : data;
    throw new Error(message || 'Erro inesperado ao comunicar com a API.');
  }

  return data;
}

export async function fetchMemoriais() {
  return request('/memoriais');
}

export async function fetchMemorialById(id) {
  return request(`/memoriais/${id}`);
}

export async function loginAdmin(email, password) {
  return request('/login', {
    method: 'POST',
    body: { email, password },
  });
}

export async function createMemorial(payload, token) {
  return request('/memoriais', {
    method: 'POST',
    body: payload,
    authToken: token,
  });
}

export async function updateMemorial(id, payload, token) {
  return request(`/memoriais/${id}`, {
    method: 'PUT',
    body: payload,
    authToken: token,
  });
}

export async function deleteMemorial(id, token) {
  return request(`/memoriais/${id}`, {
    method: 'DELETE',
    authToken: token,
  });
}
