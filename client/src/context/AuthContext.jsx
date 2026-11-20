import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      setLoading(false);
      return;
    }
    api("/auth/me")
      .then(setUser)
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const d = await api("/auth/login", "POST", { email, password });
    localStorage.setItem("token", d.token);
    setUser(d.user);
  }

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
  }

  return <Ctx.Provider value={{ user, setUser, loading, login, logout }}>{children}</Ctx.Provider>;
}
