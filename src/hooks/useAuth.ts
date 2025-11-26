import type { FullUser } from "@phoenixlan/phoenix.js/build/user";
import { createContext, useContext } from "react";

type AuthContextType = {
  authUser: FullUser | null;
  login: VoidFunction;
  logout: VoidFunction;
  loadingFinished: boolean;
  shouldDisplayError: boolean;
  errorMessage: string;
}

export const AuthContext = createContext<AuthContextType|undefined>(undefined);

export const useAuth = () => {
  return useContext(AuthContext);
};
