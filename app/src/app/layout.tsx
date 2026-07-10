import type { Metadata } from "next";
import "@fontsource/newsreader/500.css";
import "@fontsource/newsreader/500-italic.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./globals.css";
import { AccountBadge } from "@/components/AccountBadge";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: {
    default: "BookKing",
    template: "%s · BookKing",
  },
  description: "A self-hosted book of accounts for income and expenses.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <Sidebar />
          <main className="main">
            <AccountBadge />
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
