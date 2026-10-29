export type UserRole = "admin" | "customer";

const adminPaths = ["/admin", "/cadastrar-produto"];
const customerPaths = ["/store"];

function matchesPath(pathname: string, paths: string[]): boolean {
  return paths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function getRoleRedirect(
  pathname: string,
  role: UserRole,
): string | null {
  if (role === "admin" && matchesPath(pathname, customerPaths)) {
    return "/admin/dashboard";
  }

  if (role === "customer" && matchesPath(pathname, adminPaths)) {
    return "/store";
  }

  return null;
}
