import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Supabase client for Route Handlers: RLS applies to the signed-in user.
 * Prefer `Authorization: Bearer <access_token>` from the browser client.
 */
export async function createSupabaseRouteClient(request: Request): Promise<SupabaseClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const header = request.headers.get("authorization") ?? request.headers.get("Authorization");
  const bearer =
    header && /^Bearer\s+(.+)$/i.test(header.trim())
      ? header.trim().replace(/^Bearer\s+/i, "")
      : null;

  if (bearer) {
    return createClient(url, anon, {
      global: { headers: { Authorization: `Bearer ${bearer}` } },
    });
  }

  const cookieStore = await cookies();
  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          /* ignore */
        }
      },
    },
  });
}

export async function getRouteUser(request: Request) {
  const supabase = await createSupabaseRouteClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { user: null as null, supabase };
  return { user: data.user, supabase };
}
