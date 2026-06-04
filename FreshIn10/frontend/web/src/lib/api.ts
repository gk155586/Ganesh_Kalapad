import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://freshin10-api.onrender.com";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor - attach token
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("No refresh token");

        const { data } = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });

        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);

        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        // Always logout to clear stale state from Zustand
        if (typeof window !== "undefined") {
          import("@/store/authStore").then(({ useAuthStore }) => {
            useAuthStore.getState().logout();
            // Only redirect if not already on the login page
            if (!window.location.pathname.startsWith("/auth/login")) {
              window.location.href = "/auth/login";
            }
          });
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
