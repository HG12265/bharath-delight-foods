import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import authService from "../services/auth-service";
import { setSessionAuthenticated, setRefreshFailed, setAccessToken } from "../services/api-client";
import { User, Session, Envelope, Token } from "../types";

export const getStoredUser = (): User | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("current_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const useRegister = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => authService.register(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => authService.login(payload),
    onSuccess: (res) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("was_logged_in", "true");
        if (res?.data?.user) {
          localStorage.setItem("current_user", JSON.stringify(res.data.user));
        }
      }
      setSessionAuthenticated(true);
      setRefreshFailed(false);
      queryClient.invalidateQueries({ queryKey: ["session"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });
};

export const useGoogleLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (credential: string) => authService.googleLogin(credential),
    onSuccess: (res) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("was_logged_in", "true");
        if (res?.data?.user) {
          localStorage.setItem("current_user", JSON.stringify(res.data.user));
        }
      }
      setSessionAuthenticated(true);
      setRefreshFailed(false);
      queryClient.invalidateQueries({ queryKey: ["session"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });
};

export const useRequestOtp = () => {
  return useMutation({
    mutationFn: (payload: any) => authService.requestOtp(payload),
  });
};

export const useVerifyOtp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => authService.verifyOtp(payload),
    onSuccess: (res) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("was_logged_in", "true");
        if (res?.data?.user) {
          localStorage.setItem("current_user", JSON.stringify(res.data.user));
        }
      }
      setSessionAuthenticated(true);
      setRefreshFailed(false);
      queryClient.invalidateQueries({ queryKey: ["session"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });
};

export const useVerifyResetEmail = () => {
  return useMutation({
    mutationFn: (email: string) => authService.verifyResetEmail(email),
  });
};

export const useResetPassword = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { email: string; reset_token: string; new_password: string }) =>
      authService.resetPassword(payload),
    onSuccess: (res) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("was_logged_in", "true");
        if (res?.data?.user) {
          localStorage.setItem("current_user", JSON.stringify(res.data.user));
        }
      }
      setSessionAuthenticated(true);
      setRefreshFailed(false);
      queryClient.invalidateQueries({ queryKey: ["session"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("was_logged_in");
        localStorage.removeItem("access_token");
        localStorage.removeItem("current_user");
        localStorage.removeItem("guest_token");
      }
      setSessionAuthenticated(false);
      setAccessToken(null);
      queryClient.clear();
      queryClient.invalidateQueries({ queryKey: ["session"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });
};

export const useMe = (options?: { enabled?: boolean; staleTime?: number }) => {
  return useQuery<Envelope<User>>({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await authService.getMe();
      if (res?.data && typeof window !== "undefined") {
        localStorage.setItem("current_user", JSON.stringify(res.data));
      }
      return res;
    },
    initialData: () => {
      const stored = getStoredUser();
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      if (stored && token) {
        return {
          success: true,
          data: stored,
          message: "Cached profile",
        };
      }
      return undefined as any;
    },
    retry: false,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useSession = (options?: { enabled?: boolean; staleTime?: number }) => {
  return useQuery<Envelope<Session>>({
    queryKey: ["session"],
    queryFn: async () => {
      const res = await authService.getSession();
      if (res?.data?.user && typeof window !== "undefined") {
        localStorage.setItem("current_user", JSON.stringify(res.data.user));
      }
      return res;
    },
    initialData: () => {
      const stored = getStoredUser();
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      if (stored && token) {
        return {
          success: true,
          data: {
            authenticated: true,
            user: stored,
          },
          message: "Cached session",
        };
      }
      return undefined as any;
    },
    retry: false,
    refetchOnWindowFocus: false,
    ...options,
  });
};
