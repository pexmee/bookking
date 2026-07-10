import { isAuthEnabled } from "@/lib/auth";
import { currentUsername } from "@/lib/session";

export async function AccountBadge() {
  const username = await currentUsername();
  if (!username) return null;
  return (
    <p className="account-badge">
      {isAuthEnabled() ? `Signed in as ${username}` : "Local session"}
      <span className="account-badge__note"> · your own ledger</span>
    </p>
  );
}
