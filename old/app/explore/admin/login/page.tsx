import { Suspense } from "react";
import { AdminLoginForm } from "./login-form";

export default function AdminLoginPage() {
  return (
    <section className="mx-auto max-w-sm px-6 py-16">
      <h1 className="text-2xl font-semibold">Explore owner</h1>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        Sign in with the owner account. Public Explore pages stay open; this
        dashboard is not linked in the main nav.
      </p>
      <Suspense>
        <AdminLoginForm />
      </Suspense>
    </section>
  );
}
