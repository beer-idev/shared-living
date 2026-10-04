import type { Profile } from "@/lib/types";

const tones = ["mint", "blue", "orange", "pink"];

export function initials(name: string) {
  return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

export function Avatar({ profile, index = 0, size = "md" }: { profile: Pick<Profile, "display_name"> & Partial<Pick<Profile, "avatar_path">>; index?: number; size?: "sm" | "md" | "lg" }) {
  return <span
    className={`avatar avatar--${size} avatar--${tones[index % tones.length]} overflow-hidden bg-cover bg-center`}
    role="img"
    aria-label={profile.display_name}
  >{initials(profile.display_name)}</span>;
}
