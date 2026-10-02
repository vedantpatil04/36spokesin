import { useMemo } from "react";
import type { ApiUser } from "@/lib/api";
import {
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  updateCurrentUser,
  type RegisterInput,
  type UpdateAccountInput,
} from "@/services/auth";
import type { AuthStatus } from "./app-stores";
import { useAppStores } from "./app-stores";
import { useStoreSelector } from "./create-store";

export function useAuthStatus(): AuthStatus {
  const { auth } = useAppStores();
  return useStoreSelector(auth, (state) => state.status);
}

export function useAuthUser(): ApiUser | null {
  const { auth } = useAppStores();
  return useStoreSelector(auth, (state) => state.user);
}

export function useAuthActions() {
  const { auth } = useAppStores();
  return useMemo(
    () => ({
      login: async (email: string, password: string) => {
        const session = await loginRequest(email, password);
        auth.setState(() => ({ status: "authenticated", user: session.user }));
        return session;
      },
      register: async (input: RegisterInput) => {
        const session = await registerRequest(input);
        auth.setState(() => ({ status: "authenticated", user: session.user }));
        return session;
      },
      /** Saves the rider's name and phone, then shows the API's copy everywhere. */
      updateAccount: async (input: UpdateAccountInput) => {
        const user = await updateCurrentUser(input);
        auth.setState((state) => ({ ...state, user }));
        return user;
      },
      /** Always leaves the client signed out locally, even if the API call fails. */
      logout: async () => {
        try {
          await logoutRequest();
        } finally {
          auth.setState(() => ({ status: "unauthenticated", user: null }));
        }
      },
    }),
    [auth],
  );
}
