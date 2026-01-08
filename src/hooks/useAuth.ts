import { createContext, useContext } from "react";
import type { AuthContextProps } from "../components/AuthContextProvider";

export const AuthContext = createContext<AuthContextProps|undefined>(undefined);

export const useAuth = () => {
  return useContext(AuthContext);
};
