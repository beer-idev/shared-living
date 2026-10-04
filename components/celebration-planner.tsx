"use client";

import { useRef, useState } from "react";
import { CalendarDays, X } from "lucide-react";
import { SubmitButton } from "./submit-button";

const presets: { title: string; label?: string; icon: string }[] = [
  { title: "Pizza Night", icon: "🍕" },
  { title: "Movie Night", icon: "🎬" },
  { title: "Dinner Together", icon: "🍜" },
  { title: "", label: "Custom", icon: "🎁" },
];

export function CelebrationPlanner({ action }: { action: (formData: FormData) => void | Promise<void> }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [title, setTitle] = useState("Pizza Night");

  function openPlanner(nextTitle: string) {
    setTitle(nextTitle);
    dialogRef.current?.showModal();
  }

  return <>
    <div className="celebration-presets">
      {presets.map((preset) => <button type="button" key={preset.label ?? preset.title} onClick={() => openPlanner(preset.title)}><span aria-hidden="true">{preset.icon}</span><strong>{preset.label ?? preset.title}</strong></button>)}
    </div>
    <dialog className="celebration-dialog" ref={dialogRef} onClick={(event) => { if (event.target === dialogRef.current) dialogRef.current.close(); }}>
      <form action={action}>
        <header><span><CalendarDays size={20} /></span><div><p className="eyebrow">House celebration</p><h2>Plan something together</h2></div><button type="button" aria-label="Close" onClick={() => dialogRef.current?.close()}><X size={19} /></button></header>
        <label>Activity<input name="title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Custom celebration" required /></label>
        <label>When<input name="startsAt" type="datetime-local" required /></label>
        <label>Where<input name="location" defaultValue="Living room" /></label>
        <label>Details<textarea name="details" placeholder="Anything your housemates should bring or know?" /></label>
        <div className="dialog-actions"><button className="button button--ghost" type="button" onClick={() => dialogRef.current?.close()}>Cancel</button><SubmitButton pendingLabel="Creating celebration...">Create celebration</SubmitButton></div>
      </form>
    </dialog>
  </>;
}
