import type { Metadata } from "next";
import { ProfileManager } from "@/components/ProfileManager";
import { getCategories, getProfiles } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Profiles" };

export default async function ProfilesPage() {
  const [profiles, categories] = await Promise.all([
    getProfiles(),
    getCategories(null),
  ]);

  return (
    <>
      <div className="page-head">
        <h1>Profiles</h1>
        <span className="fx-note">
          Separate books for separate lives — personal, business, whatever you keep.
        </span>
      </div>
      <ProfileManager profiles={profiles} categories={categories} />
    </>
  );
}
