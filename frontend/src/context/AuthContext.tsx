import { createContext, useContext } from 'react';

interface AuthContextValue {
  isLoggedIn: boolean;
  isAdmin: boolean;
  username: string;
  onLogout: () => void;
}

export const AuthContext = createContext<AuthContextValue>({
  isLoggedIn: false,
  isAdmin: false,
  username: '',
  onLogout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}
