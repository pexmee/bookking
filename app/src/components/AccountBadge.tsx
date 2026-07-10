import { isAuthEnabled } from "@/lib/auth";
import { currentUsername } from "@/lib/session";
import { LogoutButton } from "./LogoutButton";

export async function AccountBadge() {
  const username = await currentUsername();
  if (!username) return null;
  const authOn = isAuthEnabled();

  return (
    <div className="account-bar">
      <p className="account-badge">
        {authOn ? `Signed in as ${username}` : "Local session"}
        <span className="account-badge__note"> · your own ledger</span>
      </p>
      {authOn && <LogoutButton />}
    </div>
  );
}
