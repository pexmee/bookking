import { headers } from "next/headers";
import { isAuthEnabled, parseUsernameFromBasicAuth } from "./auth";
import { sql } from "./db";
import { DEFAULT_CATEGORIES } from "./seed-data";

const LOCAL_USERNAME = "local";

/** Username from the current request's Authorization header, if any. */
export async function getAuthUsername(): Promise<string | null> {
  const h = await headers();
  return parseUsernameFromBasicAuth(h.get("authorization"));
}

/** Book user id for the current request; creates and seeds on first visit. */
export async function currentUserId(): Promise<string> {
  const fromAuth = await getAuthUsername();
  const username = fromAuth ?? (isAuthEnabled() ? null : LOCAL_USERNAME);
  if (!username) {
    throw new Error("Not signed in.");
  }
  return ensureUser(username);
}

export async function currentUsername(): Promise<string> {
  const fromAuth = await getAuthUsername();
  return fromAuth ?? (isAuthEnabled() ? "" : LOCAL_USERNAME);
}

async function ensureUser(username: string): Promise<string> {
  let [user] = await sql<{ id: string }[]>`
    select id from book_users where username = ${username}
  `;

  if (!user) {
    [user] = await sql<{ id: string }[]>`
      insert into book_users (username) values (${username}) returning id
    `;
  }

  const userId = user.id;

  // One-time: attach pre-multi-user profiles to the first account that signs in.
  await sql`
    update profiles set user_id = ${userId} where user_id is null
  `;

  const [{ count }] = await sql<{ count: number }[]>`
    select count(*)::int as count from profiles where user_id = ${userId}
  `;
  if (count === 0) {
    await seedDefaultProfile(userId);
  }

  const initial = process.env.DEFAULT_DISPLAY_CURRENCY ?? "USD";
  await sql`
    insert into app_settings (user_id, display_currency)
    values (${userId}, ${initial})
    on conflict (user_id) do nothing
  `;

  return userId;
}

async function seedDefaultProfile(userId: string) {
  const [profile] = await sql<{ id: string }[]>`
    insert into profiles (user_id, name, color, sort_order)
    values (${userId}, 'Personal', '#6B7F6A', 0)
    returning id
  `;
  const rows = DEFAULT_CATEGORIES.map(([name, kind, classification]) => ({
    profile_id: profile.id,
    name,
    kind,
    classification,
  }));
  await sql`insert into categories ${sql(rows)}`;
}

/** Profile ids belonging to the current user. */
export async function userProfileIds(): Promise<string[]> {
  const userId = await currentUserId();
  const rows = await sql<{ id: string }[]>`
    select id from profiles where user_id = ${userId}
  `;
  return rows.map((r) => r.id);
}
