import type { Profile } from "@/lib/types";

const tones = ["mint", "blue", "orange", "pink"];

export function initials(name: string) {
  return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

export function Avatar({ profile, index = 0, size = "md" }: { profile: Pick<Profile, "display_name"> & Partial<Pick<Profile, "avatar_path">>; index?: number; size?: "sm" | "md" | "lg" }) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const avatarUrl = profile.avatar_path && baseUrl ? `${baseUrl}/storage/v1/object/public/profile-avatars/${profile.avatar_path}` : null;
  return <span
    className={`avatar avatar--${size} avatar--${tones[index % tones.length]} overflow-hidden bg-cover bg-center`}
    style={avatarUrl ? { backgroundImage: `url(${JSON.stringify(avatarUrl).slice(1, -1)})` } : undefined}
    role="img"
    aria-label={`${profile.display_name}'s profile photo`}
  >{avatarUrl ? <span className="sr-only">{profile.display_name}</span> : initials(profile.display_name)}</span>;
}
