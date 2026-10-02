import { useLocation, useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { describeError } from "@/services/request-helpers";
import { SignInRequiredError } from "@/state/app-stores";

/**
 * Runs an account action (cart, wishlist, garage) with a pending flag and a
 * user-facing error. Signed-out visitors are sent to the login page instead.
 */
export function useAccountAction() {
  const navigate = useNavigate();
  const pathname = useLocation({ select: (location) => location.pathname });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async <T>(action: () => Promise<T>): Promise<T | undefined> => {
      setPending(true);
      setError(null);
      try {
        return await action();
      } catch (caught) {
        if (caught instanceof SignInRequiredError) {
          void navigate({ to: "/login", search: { redirect: pathname } });
          return undefined;
        }
        setError(describeError(caught));
        return undefined;
      } finally {
        setPending(false);
      }
    },
    [navigate, pathname],
  );

  return { run, pending, error, clearError: () => setError(null) };
}
