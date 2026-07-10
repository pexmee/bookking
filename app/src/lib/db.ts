import postgres from "postgres";

const url =
  process.env.DATABASE_URL ??
  "postgres://supabase_admin:bookking@localhost:55432/postgres";

const globalForDb = globalThis as unknown as {
  __sql?: ReturnType<typeof postgres>;
};

export const sql =
  globalForDb.__sql ??
  postgres(url, {
    max: 5,
    onnotice: () => {},
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__sql = sql;
}
