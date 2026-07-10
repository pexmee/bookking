"use client";

/**
 * HTTP Basic auth has no server session — sign out overwrites cached credentials
 * in the browser, then reloads so the login prompt appears again.
 */
export function LogoutButton() {
  function signOut() {
    const origin = window.location.origin;
    const url = `${origin}/api/logout?t=${Date.now()}`;

    // Synchronous XHR with invalid credentials clears cached Basic auth in most browsers.
    try {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", url, false, "\u0000", "");
      xhr.send();
    } catch {
      // 401 is expected.
    }

    window.location.replace(`${origin}/?signed_out=1`);
  }

  return (
    <button type="button" className="btn btn--ghost btn--small logout-btn" onClick={signOut}>
      Sign out
    </button>
  );
}
