import { apiClient, setAccessToken } from "./api-client";
import { Envelope, Token, User, Session } from "../types";

export const authService = {
  async register(payload: any): Promise<Envelope<User>> {
    const response = await apiClient.post<Envelope<User>>("/api/v1/auth/register", payload);
    return response.data;
  },

  async login(payload: any): Promise<Envelope<Token>> {
    const response = await apiClient.post<Envelope<Token>>("/api/v1/auth/login", payload);
    setAccessToken(response.data.data.access_token);
    if (response.data.data.user && typeof window !== "undefined") {
      localStorage.setItem("current_user", JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  async googleLogin(credential: string): Promise<Envelope<Token>> {
    const response = await apiClient.post<Envelope<Token>>("/api/v1/auth/google", { credential });
    setAccessToken(response.data.data.access_token);
    if (response.data.data.user && typeof window !== "undefined") {
      localStorage.setItem("current_user", JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  async requestOtp(payload: any): Promise<Envelope<null>> {
    const response = await apiClient.post<Envelope<null>>("/api/v1/auth/otp/request", payload);
    return response.data;
  },

  async verifyOtp(payload: any): Promise<Envelope<Token>> {
    const response = await apiClient.post<Envelope<Token>>("/api/v1/auth/otp/verify", payload);
    setAccessToken(response.data.data.access_token);
    if (response.data.data.user && typeof window !== "undefined") {
      localStorage.setItem("current_user", JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  async logout(): Promise<Envelope<null>> {
    try {
      const response = await apiClient.post<Envelope<null>>("/api/v1/auth/logout");
      setAccessToken(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("current_user");
      }
      return response.data;
    } catch {
      setAccessToken(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("current_user");
      }
      return { success: true, data: null, message: "Logged out" };
    }
  },

  async getMe(): Promise<Envelope<User>> {
    const response = await apiClient.get<Envelope<User>>("/api/v1/auth/me");
    if (response.data?.data && typeof window !== "undefined") {
      localStorage.setItem("current_user", JSON.stringify(response.data.data));
    }
    return response.data;
  },

  async getSession(): Promise<Envelope<Session>> {
    const response = await apiClient.get<Envelope<Session>>("/api/v1/auth/session");
    if (response.data?.data?.user && typeof window !== "undefined") {
      localStorage.setItem("current_user", JSON.stringify(response.data.data.user));
    }
    return response.data;
  },
};
export default authService;
