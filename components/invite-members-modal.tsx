"use client";

import { Check, Copy, Link as LinkIcon, UserPlus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function InviteMembersModal({ code, houseName, compact = false }: { code: string; houseName: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const invitePath = `/join/${encodeURIComponent(code)}`;

  async function copyInvite() {
    await navigator.clipboard.writeText(`${window.location.origin}${invitePath}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return <Dialog>
    <DialogTrigger asChild>
      <Button variant={compact ? "default" : "outline"} className={compact ? "min-h-11 w-11 px-0 sm:w-auto sm:px-4" : "w-full sm:w-auto"}>
        {compact ? <UserPlus aria-hidden="true" /> : <LinkIcon aria-hidden="true" />}
        <span className={compact ? "hidden sm:inline" : undefined}>{compact ? "Invite" : "Invite housemates"}</span>
      </Button>
    </DialogTrigger>
    <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-md overflow-y-auto bg-white p-5 sm:p-6">
      <DialogHeader className="pr-9">
        <DialogTitle>Invite housemates</DialogTitle>
        <DialogDescription>Share a secure invite link for {houseName}.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-2">
        <Label htmlFor="invite-link">Invite link</Label>
        <div className="flex min-w-0 gap-2">
          <Input id="invite-link" readOnly value={invitePath} className="min-w-0 font-mono text-xs" onFocus={(event) => event.currentTarget.select()} />
          <Button type="button" size="icon" variant={copied ? "secondary" : "outline"} className="size-10 shrink-0" onClick={copyInvite} aria-label={copied ? "Invite link copied" : "Copy invite link"}>
            {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          </Button>
        </div>
        <p className="text-xs leading-5 text-[#718187]" aria-live="polite">{copied ? "Invite link copied to clipboard." : "Anyone with this link can request to join your house."}</p>
      </div>
      <DialogFooter>
        <Button type="button" className="w-full sm:w-auto" onClick={copyInvite}>{copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}{copied ? "Copied" : "Copy link"}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
