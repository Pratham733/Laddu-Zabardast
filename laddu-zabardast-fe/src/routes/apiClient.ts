import { Capacitor, CapacitorHttp } from "@capacitor/core";
import { getNativeToken } from "@/mobile/session";

export class NativeConnectionError extends Error {
  constructor() {
    super("Cannot reach the store. Check your connection and try again.");
  }
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  responseType?: 'json' | 'text' | 'blob' | 'response' | 'download';
}

export const backendURL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080').replace(/\/$/, '');

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, headers, responseType, ...restOptions } = options;
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

  const mergedHeaders = new Headers(defaultHeaders);
  new Headers(headers).forEach((value, name) => mergedHeaders.set(name, value));
  const token = await getNativeToken();
  if (token && !mergedHeaders.has("Authorization")) {
    mergedHeaders.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    if (Capacitor.isNativePlatform() && responseType === "download") {
      // The native fetch bridge can decode ZIPs and PDFs as text. Ask the
      // transport for base64 so every byte is preserved.
      const nativeResponse = await CapacitorHttp.request({
        url,
        method: options.method ?? "GET",
        headers: Object.fromEntries(mergedHeaders),
        data: options.body,
        responseType: "arraybuffer",
        connectTimeout: 15_000,
        readTimeout: 150_000,
      });
      const success = nativeResponse.status >= 200 && nativeResponse.status < 300;
      const body = success
        ? Uint8Array.from(atob(String(nativeResponse.data)), char => char.charCodeAt(0))
        : typeof nativeResponse.data === "string" ? nativeResponse.data : JSON.stringify(nativeResponse.data);
      response = new Response(body, { status: nativeResponse.status, headers: nativeResponse.headers });
    } else {
      response = await fetch(url, {
        ...restOptions,
        headers: mergedHeaders,
        credentials: 'include',
      });
    }
  } catch (error) {
    if (Capacitor.isNativePlatform() && !options.signal?.aborted) throw new NativeConnectionError();
    throw error;
  }

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

  if (responseType === 'response' || responseType === 'download') {
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
