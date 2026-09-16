import { loadLocalEnv } from "./load-env";
import { createClient } from "@supabase/supabase-js";

loadLocalEnv();

function env(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npx tsx scripts/explore-promote-admin.ts you@example.com");
    process.exit(1);
  }
  const supabase = createClient(
    env("NEXT_PUBLIC_SUPABASE_URL"),
    env("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 200 });
  if (error) throw error;
  const user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) {
    throw new Error(`No auth user with email ${email}. Create the user in Supabase Auth first.`);
  }
  const { error: upErr } = await supabase.from("explore_admins").upsert({
    user_id: user.id,
    role: "owner",
  });
  if (upErr) throw upErr;
  console.log(`Promoted ${email} (${user.id}) to Explore owner.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
