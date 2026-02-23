export type FetchOptions = RequestInit & {
  token?: string;
  skipAuth?: boolean;
};

export const fetchApi = async <T = any>(url: string, options: FetchOptions = {}): Promise<T> => {
  const token = options.token || localStorage.getItem('auth_token');
  const baseUrl = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:4000/api';

  // Debug token presence
  console.log('Token status:', token ? 'present' : 'missing');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (!options.skipAuth && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  // Debug headers
  console.log('Request headers:', headers);

  // Log request details for debugging
  console.log('Request details:', {
    url: `${baseUrl}${url}`,
    headers,
    token: token ? 'Present' : 'Missing'
  });

  const response = await fetch(`${baseUrl}${url}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401) {
      // Only clear token and redirect for authenticated routes
      if (!options.skipAuth) {
        localStorage.removeItem('auth_token');
        // Don't redirect if we're already on the login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      throw new Error(data?.message || 'Authentication required');
    }
    throw new Error(data?.message || 'An error occurred');
  }

  return data;
};
