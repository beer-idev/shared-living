"use client";

import { Hand, Plus, RotateCw, Shuffle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createTaskAction } from "@/app/actions/tasks";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Member } from "@/lib/types";

const fieldClass = "h-11 w-full rounded-xl border border-[#dbe4e7] bg-white px-3 text-sm text-[#17291f] shadow-sm outline-none transition focus-visible:border-[#4cbd5b] focus-visible:ring-2 focus-visible:ring-[#4cbd5b]/20";
const options = [{ value: "manual", label: "Manual", icon: Hand }, { value: "random", label: "Random", icon: Shuffle }, { value: "rotation", label: "Rotation", icon: RotateCw }] as const;

export function CreateTaskDialog({ members, currentUserId, defaultDue, defaultOpen = false, showTrigger = true, error }: { members: Member[]; currentUserId: string; defaultDue?: string; defaultOpen?: boolean; showTrigger?: boolean; error?: string }) {
  const router = useRouter();
  const [assignment, setAssignment] = useState<(typeof options)[number]["value"]>("manual");
  const [initialDue] = useState(() => {
    if (defaultDue) return defaultDue;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(tomorrow).map((part) => [part.type, part.value]));
    return `${parts.year}-${parts.month}-${parts.day}T18:00`;
  });
  return <Dialog defaultOpen={defaultOpen} onOpenChange={(open) => { if (!open && defaultOpen) router.push("/chores"); }}>
    {showTrigger && <DialogTrigger asChild><Button className="min-h-11 w-11 px-0 shadow-[0_8px_20px_rgba(76,189,91,.18)] sm:w-auto sm:px-4"><Plus aria-hidden="true" /><span className="hidden sm:inline">New task</span></Button></DialogTrigger>}
    <DialogContent className="max-h-[calc(100dvh-1.5rem)] max-w-[480px] min-w-0 overflow-x-hidden overflow-y-auto bg-[#f8fbfc] p-5 sm:p-6 [&>form]:min-w-0">
      <DialogHeader className="min-w-0 pr-9"><DialogTitle>Create task</DialogTitle><DialogDescription>Assign it manually, randomly, or by rotation.</DialogDescription></DialogHeader>
      {error && <p role="alert" className="rounded-xl bg-[#fff0f2] px-3 py-2 text-sm text-[#b42334]">{error}</p>}
      <form action={createTaskAction} className="grid min-w-0 gap-4">
        <div className="grid gap-2"><Label htmlFor="task-name">Task name</Label><Input id="task-name" name="title" placeholder="Balcony sweep" autoFocus required /></div>
        <div className="grid gap-2"><Label htmlFor="task-description">Description</Label><textarea id="task-description" name="description" className={`${fieldClass} min-h-20 resize-y py-3`} placeholder="What needs to be done?" /></div>
        <div className="grid gap-2"><Label htmlFor="task-due">Due date</Label><Input id="task-due" name="dueAt" type="datetime-local" defaultValue={initialDue} required /></div>
        <fieldset className="min-w-0">
          <legend className="mb-2 text-sm font-medium text-[#17291f]">Assignment type</legend>
          <div className="grid grid-cols-3 gap-2">{options.map(({ value, label, icon: Icon }) => <label key={value} className={`grid min-h-16 cursor-pointer place-items-center content-center gap-1 rounded-2xl border px-2 text-xs font-medium transition ${assignment === value ? "border-[#4cbd5b] bg-[#dcf6e0] text-[#195c29]" : "border-[#dbe4e7] bg-white text-[#5f7479]"}`}><input className="sr-only" type="radio" name="assignmentType" value={value} checked={assignment === value} onChange={() => setAssignment(value)} /><Icon className="size-4" aria-hidden="true" />{label}</label>)}</div>
        </fieldset>
        {assignment === "manual" && <div className="grid gap-2"><Label htmlFor="task-assignee">Assign to</Label><select id="task-assignee" name="assignedTo" className={fieldClass} defaultValue={currentUserId}>{members.map((member) => <option key={member.user_id} value={member.user_id}>{member.profile.display_name}</option>)}</select></div>}
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
          <SubmitButton className="w-full sm:w-auto" pendingLabel="Creating task…">Create task</SubmitButton>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
