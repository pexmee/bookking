/** Runtime env — bracket access so Docker can inject users after build. */
function authUsersRaw(): string | undefined {
  return process.env["BOOKKING_AUTH_USERS"];
}

/** Parse `user:pass,user2:pass2` from BOOKKING_AUTH_USERS. Password may contain `:`. */
export function parseAuthUsers(raw: string | undefined): Map<string, string> {
  const users = new Map<string, string>();
  if (!raw?.trim()) return users;
  for (const entry of raw.split(",")) {
    const trimmed = entry.trim();
    if (!trimmed) continue;
    const sep = trimmed.indexOf(":");
    if (sep <= 0) continue;
    users.set(trimmed.slice(0, sep), trimmed.slice(sep + 1));
  }
  return users;
}

export function isAuthEnabled(): boolean {
  return parseAuthUsers(authUsersRaw()).size > 0;
}

export function authUsernames(): string[] {
  return [...parseAuthUsers(authUsersRaw()).keys()].sort();
}

function safeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const aa = enc.encode(a);
  const bb = enc.encode(b);
  if (aa.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < aa.length; i++) diff |= aa[i] ^ bb[i];
  return diff === 0;
}

/** Extract username from a Basic Authorization header. */
export function parseUsernameFromBasicAuth(header: string | null): string | null {
  if (!header?.startsWith("Basic ")) return null;
  let decoded: string;
  try {
    decoded = atob(header.slice(6));
  } catch {
    return null;
  }
  const sep = decoded.indexOf(":");
  if (sep <= 0) return null;
  return decoded.slice(0, sep);
}

/** Returns true when auth is off, or the Basic credentials match a configured user. */
export function verifyBasicAuth(header: string | null): boolean {
  const users = parseAuthUsers(authUsersRaw());
  if (users.size === 0) return true;

  const username = parseUsernameFromBasicAuth(header);
  if (!username) return false;

  let decoded: string;
  try {
    decoded = atob(header!.slice(6));
  } catch {
    return false;
  }
  const sep = decoded.indexOf(":");
  const password = decoded.slice(sep + 1);
  const expected = users.get(username);
  if (expected === undefined) return false;
  return safeEqual(password, expected);
}
