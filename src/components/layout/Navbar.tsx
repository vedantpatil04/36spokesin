import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { ChevronDown, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BrandCrest, BrandWordmark, ButtonLink } from "@/components/ui-kit";
import { useDisclosure } from "@/hooks/use-disclosure";
import { useAuthActions, useAuthStatus, useAuthUser } from "@/state/auth";
import { useCartCount } from "@/state/cart";
import { accountNav, mobileMenuExtras, primaryNav } from "./nav-config";

const MOBILE_MENU_ID = "mobile-menu";

const accountItemClasses =
  "cursor-pointer px-3 py-2.5 font-display text-xs uppercase tracking-[0.18em] text-muted-foreground focus:bg-surface-2 focus:text-foreground data-[status=active]:text-foreground";

const mobileRowClasses =
  "flex h-12 w-full items-center font-display text-sm uppercase tracking-[0.2em]";

export function Navbar() {
  const menu = useDisclosure();
  const cartCount = useCartCount();
  const pathname = useLocation({ select: (location) => location.pathname });
  const status = useAuthStatus();
  const user = useAuthUser();
  const { logout } = useAuthActions();
  const navigate = useNavigate();
  const isAuthenticated = status === "authenticated" && user !== null;
  const isAdmin = isAuthenticated && user.role === "ADMIN";

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
          {isAuthenticated ? (
            <div className="hidden items-center gap-1.5 lg:flex">
              {isAdmin ? (
                <ButtonLink to="/admin/products" variant="ghost" size="sm">
                  Admin
                </ButtonLink>
              ) : null}
              {/* Non-modal so opening it never locks page scroll under the sticky header. */}
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger className="group flex h-10 items-center gap-2 rounded-sm pl-2.5 text-xs uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground data-[state=open]:text-foreground">
                  <User className="size-[1.15rem]" aria-hidden />
                  <span className="max-w-40 truncate">Hi, {user.firstName}</span>
                  <ChevronDown
                    className="size-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180"
                    aria-hidden
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={10}
                  className="min-w-52 rounded-sm p-1.5"
                >
                  {accountNav.map((item) => (
                    <DropdownMenuItem key={item.to} asChild className={accountItemClasses}>
                      <Link to={item.to} activeOptions={{ exact: true }}>
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem className={accountItemClasses} onSelect={handleLogout}>
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <>
              <Link
                to="/my-36-spokes"
                aria-label="My 36 Spokes"
                className="hidden size-10 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground lg:flex"
              >
                <User className="size-[1.15rem]" aria-hidden />
              </Link>
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
          // Scrolls within the space between the header and the bottom tab bar.
          className="max-h-[calc(100dvh-8rem)] overflow-y-auto border-t border-border bg-surface lg:hidden"
        >
          <ul className="container-page flex flex-col py-2">
            {[...primaryNav, ...mobileMenuExtras].map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={menu.close}
                  className={`${mobileRowClasses} text-foreground`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            {isAuthenticated ? null : (
              <li className="flex gap-3 py-3">
                <ButtonLink to="/login" variant="outline" className="flex-1" onClick={menu.close}>
                  Login
                </ButtonLink>
                <ButtonLink to="/join" className="flex-1" onClick={menu.close}>
                  Join
                </ButtonLink>
              </li>
            )}
          </ul>
          {isAuthenticated ? (
            <div className="border-t border-border">
              <div className="container-page pb-2 pt-4">
                <p className="eyebrow">Hi, {user.firstName}</p>
                <ul className="mt-1 flex flex-col">
                  {accountNav.map((item) => (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        onClick={menu.close}
                        className={`${mobileRowClasses} text-foreground`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                  {isAdmin ? (
                    <li>
                      <Link
                        to="/admin/products"
                        onClick={menu.close}
                        className={`${mobileRowClasses} text-primary`}
                      >
                        Admin CMS
                      </Link>
                    </li>
                  ) : null}
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        menu.close();
                        handleLogout();
                      }}
                      className={`${mobileRowClasses} text-muted-foreground`}
                    >
                      Log out
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          ) : null}
        </nav>
      ) : null}
    </header>
  );
}
