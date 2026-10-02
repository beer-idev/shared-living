"use client";

import { Check, Copy, Link as LinkIcon, X } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

export function InviteMembersModal({ code, houseName }: { code: string; houseName: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState(false);
  const invitePath = `/join/${encodeURIComponent(code)}`;
  async function copyInvite() { await navigator.clipboard.writeText(`${window.location.origin}${invitePath}`); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
  return <>
    <button className="button button--secondary invite-button" type="button" onClick={() => dialogRef.current?.showModal()}><LinkIcon size={16} /> Invite housemates</button>
    <dialog className="prototype-dialog invite-members-dialog" ref={dialogRef} onClick={(event) => { if (event.target === dialogRef.current) dialogRef.current?.close(); }}><div className="prototype-dialog__panel"><header><div><h2>Invite housemates</h2><p>Share your house with the people you live with.</p></div><button type="button" aria-label="Close" onClick={() => dialogRef.current?.close()}><X size={17} /></button></header><h3>{houseName}</h3><label>Invite link<input readOnly value={`${typeof window === "undefined" ? "https://sharedliving.app" : window.location.origin}${invitePath}`} /></label>{copied && <span className="invite-copied"><Check size={13} /> Copied state · Prototype</span>}<button className="button button--primary button--wide" type="button" onClick={copyInvite}>{copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Invite link copied" : "Copy link"}</button><Link className="button button--secondary button--wide" href={invitePath}>Preview join page</Link><small>Demo invite link · No real invitation is sent by this prototype.</small></div></dialog>
  </>;
}
