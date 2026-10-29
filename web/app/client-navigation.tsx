"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  clearStoredRole,
  getStoredRole,
  subscribeToStoredRole,
  updateStoredRole,
} from "./role-storage";
import { getRoleRedirect, type UserRole } from "./route-access";

type ClientNavigationProps = {
  children: ReactNode;
};

export default function ClientNavigation({ children }: ClientNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [verifiedPath, setVerifiedPath] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<{
    pathname: string;
    message: string;
  } | null>(null);
  const role = useSyncExternalStore(
    subscribeToStoredRole,
    getStoredRole,
    () => "",
  );

  useEffect(() => {
    if (pathname === "/login" || pathname === "/register") {
      return;
    }

    let cancelled = false;
    fetch("/api/auth/session")
      .then(async (response) => {
        if (response.status === 401 || response.status === 403) {
          clearStoredRole();
          localStorage.removeItem("token");
          router.replace("/login");
          return null;
        }
        if (!response.ok) {
          throw new Error(
            `Session check failed with status ${response.status}`,
          );
        }
        return (await response.json()) as { role: UserRole };
      })
      .then((session) => {
        if (cancelled || !session) return;
        if (session.role !== "customer" && session.role !== "admin") {
          throw new Error("Session has an invalid role");
        }
        updateStoredRole(session.role);
        const redirect = getRoleRedirect(pathname, session.role);
        if (redirect) {
          router.replace(redirect);
          return;
        }
        setVerifiedPath(pathname);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error("Could not verify the current session", error);
        clearStoredRole();
        setSessionError({
          pathname,
          message:
            "Não foi possível verificar sua sessão. Tente recarregar a página.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (pathname === "/login" || pathname === "/register") {
    return <main className="site-main">{children}</main>;
  }

  return (
    <>
      <nav className="site-nav">
        <div className="site-nav-inner">
          <Link href="/" className="site-brand">
            Focus <span>Ecommerce</span>
          </Link>
          {verifiedPath === pathname && (
            <div className="site-nav-links">
              <Link
                href="/"
                aria-current={pathname === "/" ? "page" : undefined}
                className="site-nav-link"
              >
                Início
              </Link>
              {role === "admin" && (
                <>
                  <Link
                    href="/admin/dashboard"
                    aria-current={
                      pathname === "/admin/dashboard" ? "page" : undefined
                    }
                    className="site-nav-link"
                  >
                    Admin Dashboard
                  </Link>
                  <Link
                    href="/admin/products"
                    aria-current={
                      pathname === "/admin/products" ? "page" : undefined
                    }
                    className="site-nav-link"
                  >
                    Gerenciar Produtos
                  </Link>
                  <Link
                    href="/admin/stock"
                    aria-current={
                      pathname === "/admin/stock" ? "page" : undefined
                    }
                    className="site-nav-link"
                  >
                    Controle de Estoque
                  </Link>
                </>
              )}
              {role === "customer" && (
                <>
                  <Link
                    href="/store"
                    aria-current={pathname === "/store" ? "page" : undefined}
                    className="site-nav-link"
                  >
                    Loja
                  </Link>
                  <Link
                    href="/store/cart"
                    aria-current={
                      pathname === "/store/cart" ? "page" : undefined
                    }
                    className="site-nav-link"
                  >
                    Carrinho
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </nav>
      <main className="site-main">
        {verifiedPath === pathname ? (
          children
        ) : sessionError?.pathname === pathname ? (
          <div className="page-shell" role="alert">
            {sessionError.message}
          </div>
        ) : (
          <div className="page-shell" role="status" aria-live="polite">
            Verificando permissões...
          </div>
        )}
      </main>
    </>
  );
}
