const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface RequestOptions extends RequestInit {
  auth?: boolean;
}

class ApiClient {
  private getAuthHeaders(): HeadersInit {
    if (typeof window === "undefined") return {};
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { auth = true, headers, ...fetchOptions } = options;

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...fetchOptions,
      headers: {
        "Content-Type": "application/json",
        ...(auth ? this.getAuthHeaders() : {}),
        ...headers,
      },
    });

    if (response.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.location.href = "/login";
      throw new Error("Unauthorized");
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(error.detail || `HTTP error ${response.status}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  async post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }

  async postForm<T>(endpoint: string, formData: FormData, options?: RequestOptions): Promise<T> {
    const { auth = true, headers, ...fetchOptions } = options || {};
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...fetchOptions,
      method: "POST",
      body: formData,
      headers: {
        ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });

    if (response.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.location.href = "/login";
      throw new Error("Unauthorized");
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(error.detail || `HTTP error ${response.status}`);
    }

    return response.json();
  }
}

export const api = new ApiClient();

export interface User {
  id: number;
  email: string;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Token {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface Client {
  id: number;
  name: string;
  user_id: number;
  tone_profile_id: number | null;
  delivery_preference: string;
  created_at: string;
  updated_at: string;
}

export interface ClientCreate {
  name: string;
  delivery_preference?: string;
}

export interface ClientUpdate {
  name?: string;
  tone_profile_id?: number | null;
  delivery_preference?: string;
}

export interface Integration {
  id: number;
  provider: string;
  user_id: number;
  is_active: boolean;
  last_sync: string | null;
  created_at: string;
}

export interface ToneProfile {
  id: number;
  client_id: number;
  examples: string[] | null;
  style_descriptors: Record<string, unknown> | null;
  updated_at: string;
}

export interface ToneProfileCreate {
  examples?: string[];
  style_descriptors?: Record<string, unknown>;
}

export interface ActivityEvent {
  id: number;
  client_id: number;
  source: string;
  type: string;
  summary: string;
  actor: string | null;
  timestamp: string;
  relevance_score: number;
  raw_ref: string | null;
  processed: boolean;
  created_at: string;
}

export interface Draft {
  id: number;
  client_id: number;
  week_of: string;
  content: string;
  status: "draft" | "edited" | "sent";
  created_at: string;
  updated_at: string;
}

export interface DraftCreate {
  client_id: number;
  week_of: string;
  content: string;
  status?: string;
}

export interface DraftUpdate {
  content?: string;
  status?: "draft" | "edited" | "sent";
}

export interface DraftGenerateRequest {
  week_of?: string;
  auto_ingest?: boolean;
}

export interface IngestionSummary {
  events_fetched: number;
  events_stored: number;
  events_filtered_out: number;
  errors: number;
}

export const authApi = {
  register: (data: { email: string; password: string; full_name?: string }) =>
    api.post<Token>("/auth/register", data, { auth: false }),

  login: (email: string, password: string) =>
    api.postForm<Token>("/auth/login", new URLSearchParams({ username: email, password }) as unknown as FormData, { auth: false }),

  refresh: (refreshToken: string) =>
    api.post<Token>("/auth/refresh", { refresh_token: refreshToken }, { auth: false }),

  me: () => api.get<User>("/auth/me"),

  githubOAuth: () => `${API_BASE}/auth/github`,

  githubDisconnect: () => api.post<{ message: string }>("/auth/github/disconnect"),
};

export const clientsApi = {
  list: () => api.get<Client[]>("/clients"),

  create: (data: ClientCreate) => api.post<Client>("/clients", data),

  get: (id: number) => api.get<Client>(`/clients/${id}`),

  update: (id: number, data: ClientUpdate) => api.patch<Client>(`/clients/${id}`, data),

  delete: (id: number) => api.delete<void>(`/clients/${id}`),

  generateDraft: (clientId: number, data?: DraftGenerateRequest) =>
    api.post<Draft>(`/clients/${clientId}/drafts/generate`, data),

  listDrafts: (clientId: number, limit = 20, offset = 0) =>
    api.get<Draft[]>(`/clients/${clientId}/drafts?limit=${limit}&offset=${offset}`),
};

export const draftsApi = {
  list: (limit = 20, offset = 0) => api.get<Draft[]>(`/drafts?limit=${limit}&offset=${offset}`),

  get: (id: number) => api.get<Draft>(`/drafts/${id}`),

  update: (id: number, data: DraftUpdate) => api.patch<Draft>(`/drafts/${id}`, data),

  finalize: (id: number) => api.post<Draft>(`/drafts/${id}/finalize`),

  delete: (id: number) => api.delete<void>(`/drafts/${id}`),
};

export const integrationsApi = {
  list: () => api.get<Integration[]>("/integrations"),

  create: (data: { provider: string; access_token: string; refresh_token?: string; scope_config?: Record<string, unknown> }) =>
    api.post<Integration>("/integrations", data),

  delete: (id: number) => api.delete<void>(`/integrations/${id}`),
};

export const toneApi = {
  get: (clientId: number) => api.get<ToneProfile>(`/clients/${clientId}/tone`),

  create: (clientId: number, data: ToneProfileCreate) => api.post<ToneProfile>(`/clients/${clientId}/tone`, data),

  update: (clientId: number, data: ToneProfileCreate) => api.patch<ToneProfile>(`/clients/${clientId}/tone`, data),
};