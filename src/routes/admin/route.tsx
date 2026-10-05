import { Outlet, createFileRoute, useLocation, useNavigate } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { useEffect } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { EmptyState, PageSkeleton } from "@/components/states";
import { ButtonLink } from "@/components/ui-kit";
import { seo } from "@/lib/seo";
import { useAuthStatus, useAuthUser } from "@/state/auth";

/**
 * Admin CMS shell. The access token only exists in the browser, so the guard
 * runs after the session is restored (like /my-36-spokes) and every screen
 * loads its data client-side. This guard is a convenience: the API checks the
 * ADMIN role on every request.
 */
export const Route = createFileRoute("/admin")({
  head: () =>
    seo({
      title: "Admin | 36 Spokes",
      description: "Catalogue and content management.",
      path: "/admin",
      noIndex: true,
    }),
  component: AdminLayout,
});

function AdminLayout() {
  const status = useAuthStatus();
  const user = useAuthUser();
  const navigate = useNavigate();
  const pathname = useLocation({ select: (location) => location.pathname });

  useEffect(() => {
    if (status === "unauthenticated") {
      void navigate({ to: "/login", search: { redirect: pathname }, replace: true });
    }
  }, [status, navigate, pathname]);

  if (status !== "authenticated" || !user) return <PageSkeleton />;

  if (user.role !== "ADMIN") {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={ShieldAlert}
          title="Admins only"
          description="Your account doesn't have access to the catalogue CMS."
          action={
            <ButtonLink to="/" variant="outline">
              Back to 36 Spokes
            </ButtonLink>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-page px-4 py-5 sm:px-6 sm:py-6 md:py-8 lg:px-8 lg:py-10">
      <div className="grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10">
        <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
          <p className="mb-3 text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
            Content CMS
          </p>
          <AdminNav />
        </aside>
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
