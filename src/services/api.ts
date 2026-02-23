const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  isBlob = false
): Promise<T> {
  // Ensure endpoint always starts with /api
  const url = endpoint.startsWith('/api') ? `${API_BASE}${endpoint}` : `${API_BASE}/api${endpoint}`;
  const isFormData = options.body instanceof FormData;
  
  const authToken = localStorage.getItem('auth_token');
  console.log('🚀 Making API request:', {
    url,
    method: options.method || 'GET',
    isFormData,
    contentType: isFormData ? 'multipart/form-data' : (isBlob ? 'application/pdf' : 'application/json'),
    hasAuthToken: !!authToken
  });
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(!isFormData && {
        'Content-Type': isBlob ? 'application/pdf' : 'application/json'
      }),
      ...(authToken && {
        'Authorization': `Bearer ${authToken}`
      }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('API Error:', {
      status: response.status,
      statusText: response.statusText,
      body: errorText
    });
    throw new Error(errorText);
  }

  if (isBlob) {
    return response.blob() as Promise<T>;
  }

  const responseText = await response.text();
  console.log('API Response:', responseText);
  
  try {
    return JSON.parse(responseText) as T;
  } catch (error) {
    console.error('Failed to parse JSON response:', error);
    throw new Error('Invalid JSON response from server');
  }
}

export const api = {
  get: <T>(endpoint: string) => fetchApi<T>(endpoint),
  
  post: <T>(endpoint: string, data: any) => 
    fetchApi<T>(endpoint, {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),
  
  put: <T>(endpoint: string, data: any) =>
    fetchApi<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: <T>(endpoint: string) =>
    fetchApi<T>(endpoint, {
      method: 'DELETE',
    }),
    
  getPDF: async (endpoint: string, filename?: string) => {
    const blob = await fetchApi<Blob>(endpoint, {
      headers: {
        'Accept': 'application/pdf'
      }
    }, true);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename || 'document.pdf');
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
  ,
  getExcel: async (endpoint: string, filename?: string) => {
    const blob = await fetchApi<Blob>(endpoint, {
      headers: {
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    }, true);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename || 'report.xlsx');
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
};
