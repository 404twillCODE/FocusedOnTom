import { redirect } from "next/navigation";
import { getSiteUser, requireSiteApiUser, type SiteUser } from "@/lib/auth/site-user";

export type VaultUser = SiteUser;

export const getVaultUser = getSiteUser;

export async function requireVaultUser(): Promise<VaultUser> {
  const user = await getVaultUser();
  if (!user) redirect("/focusedonyou/auth?next=/vault");
  return user;
}

export const requireVaultApiUser = requireSiteApiUser;
