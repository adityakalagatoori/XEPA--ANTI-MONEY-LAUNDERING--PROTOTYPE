import { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("xepa-token"));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("xepa-user");
    return raw ? JSON.parse(raw) : null;
  });

  const value = useMemo(
    () => ({
      token,
      user,
      login(nextToken, nextUser) {
        localStorage.setItem("xepa-token", nextToken);
        localStorage.setItem("xepa-user", JSON.stringify(nextUser));
        setToken(nextToken);
        setUser(nextUser);
      },
      logout() {
        localStorage.removeItem("xepa-token");
        localStorage.removeItem("xepa-user");
        setToken(null);
        setUser(null);
      }
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
