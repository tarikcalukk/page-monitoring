import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiService } from "../services/apiService";
import {
  clearStoredToken,
  getStoredToken,
  storeToken,
} from "../utils/authStorage";
import { normalizeEmail } from "../utils/validation";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(() =>
    getStoredToken() ? "checking" : "unauthenticated",
  );

  const logout = useCallback(() => {
    clearStoredToken();
    setToken(null);
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const verifySession = useCallback(async () => {
    if (!getStoredToken()) {
      logout();
      return false;
    }

    setStatus("checking");
    try {
      const result = await apiService.verifyToken();
      if (!result?.isValid) {
        logout();
        return false;
      }
      setUser(result.user);
      setStatus("authenticated");
      return true;
    } catch {
      logout();
      return false;
    }
  }, [logout]);

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  useEffect(() => {
    window.addEventListener("auth:unauthorized", logout);
    return () => window.removeEventListener("auth:unauthorized", logout);
  }, [logout]);

  const login = useCallback(async ({ email, password }) => {
    const response = await apiService.login({
      email: normalizeEmail(email),
      password,
    });
    storeToken(response.token);
    setToken(response.token);
    setUser(response.user);
    setStatus("authenticated");
    return response;
  }, []);

  const register = useCallback(async ({ email, password }) => {
    return apiService.register({
      email: normalizeEmail(email),
      password,
    });
  }, []);

  const verifyEmail = useCallback(async ({ email, code }) => {
    const response = await apiService.verifyEmail({
      email: normalizeEmail(email),
      code,
    });
    if (response.token) {
      storeToken(response.token);
      setToken(response.token);
      setUser(response.user);
      setStatus("authenticated");
    }
    return response;
  }, []);

  const resendVerificationCode = useCallback(async ({ email }) => {
    return apiService.resendVerificationCode({
      email: normalizeEmail(email),
    });
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      status,
      isAuthenticated: status === "authenticated",
      isChecking: status === "checking",
      login,
      logout,
      register,
      verifyEmail,
      resendVerificationCode,
      verifySession,
    }),
    [
      token,
      user,
      status,
      login,
      logout,
      register,
      verifyEmail,
      resendVerificationCode,
      verifySession,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
