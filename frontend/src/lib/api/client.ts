import { supabase } from "../supabase";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function apiRequest<TResponse>(path: string, init: RequestInit = {}): Promise<TResponse> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const response = await fetch(`${apiBaseUrl}/api${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ code: "REQUEST_FAILED", message: response.statusText }));
    throw new ApiClientError(response.status, error.code ?? "REQUEST_FAILED", error.message ?? "Request failed");
  }

  return response.json() as Promise<TResponse>;
}
