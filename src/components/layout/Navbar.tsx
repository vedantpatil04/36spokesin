import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useEffect } from "react";
import { Button, BrandCrest, BrandWordmark, ButtonLink } from "@/components/ui-kit";
import { useDisclosure } from "@/hooks/use-disclosure";
import { useAuthActions, useAuthStatus, useAuthUser } from "@/state/auth";
import { useCartCount } from "@/state/cart";
import { mobileMenuExtras, primaryNav } from "./nav-config";

const MOBILE_MENU_ID = "mobile-menu";

export function Navbar() {
  const menu = useDisclosure();
  const cartCount = useCartCount();
  const pathname = useLocation({ select: (location) => location.pathname });
  const status = useAuthStatus();
  const user = useAuthUser();
  const { logout } = useAuthActions();
  const navigate = useNavigate();
  const isAuthenticated = status === "authenticated" && user !== null;

  // Close the mobile menu whenever the route changes (including back/forward).
  const closeMenu = menu.close;
  useEffect(() => {
    closeMenu();
  }, [pathname, closeMenu]);

  const handleLogout = () => {
    logout().then(() => navigate({ to: "/", replace: true }));
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-6 lg:h-20">
        <Link
          to="/"
          className="group flex items-center gap-2.5 font-display text-lg tracking-[0.22em] lg:text-xl"
          aria-label="36 Spokes home"
        >
          <BrandCrest className="size-8.5 ring-1 ring-border/80 transition-all duration-300 group-hover:scale-105 group-hover:ring-primary/80 lg:size-10" />
          <BrandWordmark className="flex items-center" />
        </Link>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-8">
            {primaryNav.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="font-display text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground data-[status=active]:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1.5">
          {/* Search arrives with the catalogue backend; the control is reserved here. */}
          <button
            type="button"
            aria-label="Search"
            className="flex size-10 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Search className="size-[1.15rem]" aria-hidden />
          </button>
          <Link
            to="/my-36-spokes/shop"
            aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : "Cart"}
            className="relative flex size-10 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ShoppingBag className="size-[1.15rem]" aria-hidden />
            {cartCount > 0 ? (
              <span
                aria-hidden
                className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[0.6rem] font-semibold leading-none text-primary-foreground"
              >
                {cartCount}
              </span>
            ) : null}
          </Link>
          <Link
            to="/my-36-spokes"
            aria-label="My 36 Spokes"
            className="hidden size-10 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground lg:flex"
          >
            <User className="size-[1.15rem]" aria-hidden />
          </Link>
          {isAuthenticated ? (
            <div className="hidden items-center gap-3 lg:flex">
              <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Hi, {user.firstName}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Log out
              </Button>
            </div>
          ) : (
            <>
              <ButtonLink to="/login" variant="outline" size="sm" className="hidden lg:inline-flex">
                Login
              </ButtonLink>
              <ButtonLink to="/join" size="sm" className="hidden lg:inline-flex">
                Join
              </ButtonLink>
            </>
          )}

          <button
            type="button"
            onClick={menu.toggle}
            aria-expanded={menu.isOpen}
            aria-controls={MOBILE_MENU_ID}
            aria-label={menu.isOpen ? "Close menu" : "Open menu"}
            className="flex size-10 items-center justify-center rounded-sm text-foreground lg:hidden"
          >
            {menu.isOpen ? (
              <X className="size-5" aria-hidden />
            ) : (
              <Menu className="size-5" aria-hidden />
            )}
          </button>
        </div>
      </div>

      {menu.isOpen ? (
        <nav
          id={MOBILE_MENU_ID}
          aria-label="Mobile menu"
          className="border-t border-border bg-surface lg:hidden"
        >
          <ul className="container-page flex flex-col py-2">
            {[...primaryNav, ...mobileMenuExtras].map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={menu.close}
                  className="flex h-12 items-center font-display text-sm uppercase tracking-[0.2em] text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="flex gap-3 py-3">
              {isAuthenticated ? (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    menu.close();
                    handleLogout();
                  }}
                >
                  Log out
                </Button>
              ) : (
                <>
                  <ButtonLink to="/login" variant="outline" className="flex-1" onClick={menu.close}>
                    Login
                  </ButtonLink>
                  <ButtonLink to="/join" className="flex-1" onClick={menu.close}>
                    Join
                  </ButtonLink>
                </>
              )}
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
