"use client";

import { useSyncExternalStore } from "react";

const errorMessages: Record<string, string> = {
  email_not_verified:
    "A conta Google precisa ter um endereço de email verificado.",
  admin_account:
    "Esta é uma conta de administrador. Entre usando o acesso de administrador.",
  google_account_conflict:
    "Esta conta já está vinculada a outro perfil Google. Entre com email e senha.",
  invalid_oauth_state:
    "A tentativa de login expirou ou não pôde ser validada. Tente novamente.",
  google_login_failed: "Não foi possível entrar com Google. Tente novamente.",
};

function subscribeToSearch(onChange: () => void): () => void {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

export default function GoogleAuthOption() {
  const code = useSyncExternalStore(
    subscribeToSearch,
    () => new URLSearchParams(window.location.search).get("error"),
    () => null,
  );
  const error = code
    ? (errorMessages[code] ??
      "Não foi possível entrar com Google. Tente novamente.")
    : null;

  return (
    <>
      {error && (
        <div
          role="alert"
          className="mb-4 p-3 bg-red-900/50 border border-red-600 rounded text-red-200"
        >
          {error}
        </div>
      )}
      <a
        href="/api/auth/google"
        className="mt-4 block w-full rounded border border-gray-500 px-4 py-2 text-center transition hover:bg-gray-800"
      >
        Entrar com Google
      </a>
    </>
  );
}
