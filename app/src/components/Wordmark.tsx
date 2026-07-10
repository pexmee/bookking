import { CrownIcon } from "./CrownIcon";

/** BookKing — big second K, crown as the dot on the i. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={`wordmark${className ? ` ${className}` : ""}`} aria-label="BookKing">
      <span className="wordmark__book">Book</span>
      <span className="wordmark__k">K</span>
      <span className="wordmark__i">
        <CrownIcon className="wordmark__crown" />
        <span className="wordmark__i-stem">{"\u0131"}</span>
      </span>
      <span className="wordmark__tail">ng</span>
    </span>
  );
}
