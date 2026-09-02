import { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('expense_user')); } catch { return null; }
  });

  const saveSession = ({ user: nextUser, token }) => {
    localStorage.setItem('expense_token', token);
    localStorage.setItem('expense_user', JSON.stringify(nextUser));
    setUser(nextUser);
  };
  const logout = () => {
    localStorage.removeItem('expense_token');
    localStorage.removeItem('expense_user');
    setUser(null);
  };
  return <AuthContext.Provider value={useMemo(() => ({ user, saveSession, logout, isAuthenticated: Boolean(user) }), [user])}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
