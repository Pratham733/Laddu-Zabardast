// src/routes/apiClient.ts

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  responseType?: 'json' | 'text' | 'blob' | 'response';
}

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, headers, responseType, ...restOptions } = options;
  const backendURL = ((import.meta as any).env?.VITE_BACKEND_URL as string) || 'http://localhost:8080';
  let url = `${backendURL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        searchParams.append(key, String(val));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  // Set up default headers
  const defaultHeaders: Record<string, string> = {};

  // Check if body is FormData (then browser sets content-type automatically, including boundaries)
  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const mergedHeaders = {
    ...defaultHeaders,
    ...headers,
  };

  const response = await fetch(url, {
    ...restOptions,
    headers: mergedHeaders,
    credentials:'include',
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `HTTP error! Status: ${response.status}`;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorJson.error || errorMessage;
    } catch {
      if (errorText) {
        errorMessage = errorText;
      }
    }
    throw new Error(errorMessage);
  }

  if (responseType === 'response') {
    return response as unknown as T;
  }

  if (responseType === 'blob') {
    return response.blob() as unknown as T;
  }

  // For empty response or delete requests that might return 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  if (responseType === 'text') {
    return response.text() as unknown as T;
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json() as Promise<T>;
  }

  return response.text() as unknown as Promise<T>;
}
