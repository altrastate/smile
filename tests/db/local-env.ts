import { execSync } from "node:child_process";

export type LocalSupabase = {
  apiUrl: string;
  dbUrl: string;
  anonKey: string;
  serviceRoleKey: string;
  mailUrl: string;
};

function parseEnv(raw: string) {
  const values = new Map<string, string>();
  for (const line of raw.split(/\r?\n/)) {
    const match = /^([A-Z0-9_]+)="(.*)"$/.exec(line) ?? /^([A-Z0-9_]+)=(.*)$/.exec(line);
    if (match) {
      values.set(match[1], match[2]);
    }
  }
  return values;
}

export function readLocalSupabase(): LocalSupabase {
  const raw = execSync("supabase status -o env", {
    encoding: "utf8",
    cwd: process.cwd(),
    windowsHide: true,
  });
  const values = parseEnv(raw);
  const apiUrl = values.get("API_URL") ?? "";
  const dbUrl = values.get("DB_URL") ?? "";
  const anonKey = values.get("ANON_KEY") ?? values.get("PUBLISHABLE_KEY") ?? "";
  const serviceRoleKey = values.get("SERVICE_ROLE_KEY") ?? values.get("SECRET_KEY") ?? "";
  const mailUrl = values.get("MAILPIT_URL") ?? values.get("INBUCKET_URL") ?? "";
  const localHost = apiUrl.startsWith("http://127.0.0.1:") && dbUrl.includes("@127.0.0.1:");
  if (!localHost || !anonKey || !serviceRoleKey || !mailUrl) {
    throw new Error("Local Supabase status did not return a loopback database, API, and mail capture URL.");
  }
  return { apiUrl, dbUrl, anonKey, serviceRoleKey, mailUrl };
}
