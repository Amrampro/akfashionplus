import { useContext } from "react";
import { AuthContext, type AuthUser } from "../contexts/AuthContext";

export type { AuthUser };

export function useAuth() {
  return useContext(AuthContext);
}
