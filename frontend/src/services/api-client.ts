import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

import { env } from "../lib/env";
import { Envelope, Token } from "../types";

// Persistent storage for tokens across page reloads
let accessToken: string | null = null;
let guestToken: string | null = null;
let refreshFailed = false;
let sessionAuthenticated =
  typeof window !== "undefined" &&
  (!!localStorage.getItem("access_token") || localStorage.getItem("was_logged_in") === "true");

export const getAccessToken = (): string | null => {
  if (!accessToken && typeof window !== "undefined") {
    accessToken = localStorage.getItem("access_token");
  }
  return accessToken;
};

export const setAccessToken = (token: string | null): void => {
  accessToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("access_token", token);
      localStorage.setItem("was_logged_in", "true");
    } else {
      localStorage.removeItem("access_token");
      localStorage.removeItem("was_logged_in");
      localStorage.removeItem("current_user");
    }
  }
  if (token) {
    refreshFailed = false;
    sessionAuthenticated = true;
  } else {
    refreshFailed = true;
    sessionAuthenticated = false;
  }
};

export const getSessionAuthenticated = (): boolean => sessionAuthenticated;
export const setSessionAuthenticated = (auth: boolean): void => {
  sessionAuthenticated = auth;
};

export const setRefreshFailed = (failed: boolean): void => {
  refreshFailed = failed;
};

export const getGuestToken = (): string | null => {
  if (typeof window !== "undefined") {
    let token = localStorage.getItem("guest_token");
    if (!token) {
      token = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      localStorage.setItem("guest_token", token);
    }
    return token;
  }
  return guestToken;
};

export const setGuestToken = (token: string | null): void => {
  guestToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("guest_token", token);
    } else {
      localStorage.removeItem("guest_token");
    }
  }
};

// Create Axios client instance
export const apiClient = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // Crucial for sending/receiving HttpOnly cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach JWT authorization header and X-Guest-Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }
    const gToken = getGuestToken();
    if (gToken && !config.headers.get("X-Guest-Token")) {
      config.headers.set("X-Guest-Token", gToken);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Flag to prevent multiple simultaneous refresh calls
let isRefreshing = false;
// Queue of requests waiting for token refresh
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null): void => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

// Response interceptor to handle token refresh automatically on 401
apiClient.interceptors.response.use(
  (response) => {
    // Check if guest token was returned in response headers
    const gToken = response.headers["x-guest-token"];
    if (typeof gToken === "string") {
      setGuestToken(gToken);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config;
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Only auto-refresh on 401 (Unauthorized) credentials expiry
    // Do not attempt to refresh on 403 (Forbidden) or other codes
    if (error.response?.status === 401 && !originalRequest.headers.get("X-Retry-Flag")) {
      if (refreshFailed || !sessionAuthenticated) {
        return Promise.reject(error);
      }

      // Avoid refresh loop or running refresh for login/auth setup requests
      const isAuthSetupUrl =
        originalRequest.url?.includes("/auth/login") ||
        originalRequest.url?.includes("/auth/register") ||
        originalRequest.url?.includes("/auth/refresh") ||
        originalRequest.url?.includes("/auth/otp");

      if (isAuthSetupUrl) {
        setAccessToken(null);
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.set("Authorization", `Bearer ${token}`);
            originalRequest.headers.set("X-Retry-Flag", "true");
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      isRefreshing = true;

      try {
        // Run silent refresh call to backend
        // HttpOnly cookie 'refresh_token' is sent automatically because of withCredentials: true
        const refreshResponse = await axios.post<Envelope<Token>>(
          `${env.NEXT_PUBLIC_API_URL}/api/v1/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken = refreshResponse.data.data.access_token;
        setAccessToken(newToken);

        processQueue(null, newToken);
        isRefreshing = false;

        // Retry the original request
        originalRequest.headers.set("Authorization", `Bearer ${newToken}`);
        originalRequest.headers.set("X-Retry-Flag", "true");
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        setAccessToken(null);

        // Return custom error details
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);