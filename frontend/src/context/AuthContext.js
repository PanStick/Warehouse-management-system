import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [role, setRole] = useState(() => localStorage.getItem("role"));
    const [userId, setUserId] = useState(() => localStorage.getItem("userId"));
    const [email, setEmail] = useState(() => localStorage.getItem("email"));
  return (
    <AuthContext.Provider value={{ role, setRole, userId, setUserId, email, setEmail }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
