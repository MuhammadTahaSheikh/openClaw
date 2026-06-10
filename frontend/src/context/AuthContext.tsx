import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiError, clearToken, getCachedUser, getToken, setCachedUser } from "../api/client";
import { getMe, login as apiLogin, type AuthResponse, type User } from "../api/auth";

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  completeAuth: (response: AuthResponse) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function persistUser(user: User): void {
  setCachedUser(user);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchSessionWithRetry(): Promise<User> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const { user } = await getMe();
      return user;
    } catch (error) {
      lastError = error;
      if (error instanceof ApiError && error.status === 401) {
        throw error;
      }
      if (attempt < 3) {
        await sleep(400 * (attempt + 1));
      }
    }
  }

  throw lastError;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const token = getToken();
    const cached = token ? getCachedUser() : null;
    if (!cached) return null;
    return { ...cached, role: cached.role ?? "member" };
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    fetchSessionWithRetry()
      .then((me) => {
        setUser(me);
        persistUser(me);
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 401) {
          clearToken();
          setUser(null);
          return;
        }

        // Backend may still be starting — keep cached session if we have one.
        const cached = getCachedUser();
        if (cached) {
          setUser({ ...cached, role: cached.role ?? "member" });
        } else {
          setUser(null);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user: loggedInUser } = await apiLogin(email, password);
    setUser(loggedInUser);
    persistUser(loggedInUser);
  }, []);

  const completeAuth = useCallback((response: AuthResponse) => {
    setUser(response.user);
    persistUser(response.user);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user && getToken()),
      login,
      completeAuth,
      logout,
    }),
    [user, isLoading, login, completeAuth, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
