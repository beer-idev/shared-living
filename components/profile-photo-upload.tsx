"use client";

import { Camera, LoaderCircle } from "lucide-react";
import { useRef, useState } from "react";
import { updateAvatarAction } from "@/app/actions/house";

export function ProfilePhotoUpload() {
  const formRef = useRef<HTMLFormElement>(null);
  const [uploading, setUploading] = useState(false);

  return <form ref={formRef} action={updateAvatarAction} className="absolute -bottom-1 -right-1">
    <label className="grid size-11 cursor-pointer place-items-center rounded-full border-4 border-white bg-[#4cbd5b] text-white shadow-md transition hover:bg-[#3eaa4d] focus-within:ring-2 focus-within:ring-[#4cbd5b]/40 focus-within:ring-offset-2" aria-label="Upload profile photo">
      {uploading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Camera className="size-4" aria-hidden="true" />}
      <input
        className="sr-only"
        type="file"
        name="avatar"
        accept="image/jpeg,image/png,image/webp"
        disabled={uploading}
        onChange={(event) => {
          if (!event.currentTarget.files?.length) return;
          setUploading(true);
          formRef.current?.requestSubmit();
        }}
      />
    </label>
  </form>;
}
