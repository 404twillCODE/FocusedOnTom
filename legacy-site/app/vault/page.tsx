import type { Metadata } from "next";
import { requireVaultUser } from "@/lib/vault/auth";
import { VaultDashboard } from "@/app/vault/_components/VaultDashboard";

export const metadata: Metadata = {
  title: "Vault",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function VaultPage() {
  const user = await requireVaultUser();
  return <VaultDashboard initialUser={user} />;
}
