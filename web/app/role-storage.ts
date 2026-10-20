const ROLE_UPDATED_EVENT = "focus-role-updated";

export function getStoredRole(): string {
  return localStorage.getItem("role") || "";
}

export function subscribeToStoredRole(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(ROLE_UPDATED_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(ROLE_UPDATED_EVENT, onChange);
  };
}

export function updateStoredRole(role: string): void {
  localStorage.setItem("role", role);
  window.dispatchEvent(new Event(ROLE_UPDATED_EVENT));
}

export function clearStoredRole(): void {
  localStorage.removeItem("role");
  window.dispatchEvent(new Event(ROLE_UPDATED_EVENT));
}
