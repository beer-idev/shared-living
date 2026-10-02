"use client";

import { UserMinus, X } from "lucide-react";
import { useRef } from "react";

type Action = (formData: FormData) => void | Promise<void>;

export function RemoveMemberButton({ name, memberId, action }: { name: string; memberId: string; action: Action }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  return <>
    <button className="quiet-danger" type="button" onClick={() => dialogRef.current?.showModal()}><UserMinus size={15} /> Remove</button>
    <dialog className="prototype-dialog remove-member-dialog" ref={dialogRef} onClick={(event) => { if (event.target === dialogRef.current) dialogRef.current?.close(); }}>
      <div className="prototype-dialog__panel"><header><div><h2>Remove {name}?</h2><p>Manage house members · Owner only</p></div><button type="button" aria-label="Close" onClick={() => dialogRef.current?.close()}><X size={17} /></button></header><div className="member-removal-avatar"><span>{name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span></div><p>{name} will no longer be a member of your house. Past expense and task records remain available.</p><small>This confirmation removes the member from the current house only.</small><form action={action} className="prototype-dialog__actions"><input type="hidden" name="memberId" value={memberId} /><button className="button button--secondary" type="button" onClick={() => dialogRef.current?.close()}>Cancel</button><button className="button button--danger" type="submit">Remove member</button></form></div>
    </dialog>
  </>;
}
