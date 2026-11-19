import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicEnv, hasPublicEnv } from "@/lib/env";
import { toAppError } from "@/lib/errors";
import type { Database } from "@/types/database";

function isAuthUnavailable(error: unknown) {
  const { message } = toAppError(error);
  return /fetch|network|ECONN|ENOTFOUND|ETIMEDOUT|timeout|aborted|socket/i.test(message);
}

/**
 * Refreshes the Supabase session cookie.
 * A public page still renders when the auth service cannot be reached.
 * Missing configuration returns before any request. Other thrown errors propagate.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!hasPublicEnv()) {
    return response;
  }

  const env = getPublicEnv();
  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  try {
    const { error } = await supabase.auth.getUser();
    if (error && !/auth session missing/i.test(error.message)) {
      console.error("Supabase auth refresh was declined:", error.message);
    }
  } catch (error) {
    if (!isAuthUnavailable(error)) {
      throw error;
    }
    console.error("Supabase auth refresh is unavailable:", toAppError(error).message);
  }

  return response;
}
