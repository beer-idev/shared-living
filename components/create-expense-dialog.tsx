"use client";

import { Check, ImageUp, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createExpenseAction } from "@/app/actions/expenses";
import { Avatar } from "@/components/avatar";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Member } from "@/lib/types";

const fieldClass = "h-11 w-full rounded-xl border border-[#dbe4e7] bg-white px-3 text-sm text-[#17291f] shadow-sm outline-none transition focus-visible:border-[#4cbd5b] focus-visible:ring-2 focus-visible:ring-[#4cbd5b]/20";

export function CreateExpenseDialog({ members, currentUserId, currency, defaultDate, defaultOpen = false, showTrigger = true, error }: { members: Member[]; currentUserId: string; currency: string; defaultDate: string; defaultOpen?: boolean; showTrigger?: boolean; error?: string }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [selected, setSelected] = useState(() => members.map((member) => member.user_id));
  const perPerson = useMemo(() => selected.length && Number(amount) > 0 ? Number(amount) / selected.length : 0, [amount, selected.length]);

  return <Dialog defaultOpen={defaultOpen} onOpenChange={(open) => { if (!open && defaultOpen) router.push("/expenses"); }}>
    {showTrigger && <DialogTrigger asChild><Button className="min-h-11 w-11 px-0 shadow-[0_8px_20px_rgba(76,189,91,.18)] sm:w-auto sm:px-4"><Plus aria-hidden="true" /><span className="hidden sm:inline">New expense</span></Button></DialogTrigger>}
    <DialogContent className="max-h-[calc(100dvh-1.5rem)] max-w-[500px] min-w-0 overflow-x-hidden overflow-y-auto bg-[#f8fbfc] p-5 sm:p-6 [&>form]:min-w-0">
      <DialogHeader className="min-w-0 pr-9"><DialogTitle>Create expense</DialogTitle><DialogDescription>Split equally between the members you select.</DialogDescription></DialogHeader>
      {error && <p role="alert" className="rounded-xl bg-[#fff0f2] px-3 py-2 text-sm text-[#b42334]">{error}</p>}
      <form action={createExpenseAction} className="grid min-w-0 gap-4">
        <div className="grid gap-2"><Label htmlFor="expense-title">Title</Label><Input id="expense-title" name="title" placeholder="Water bill — August" autoFocus required /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2"><Label htmlFor="expense-category">Category</Label><select id="expense-category" name="category" className={fieldClass} defaultValue="water"><option value="electricity">Utilities</option><option value="water">Water</option><option value="internet">Internet</option><option value="grocery">Groceries</option><option value="rent">Rent</option><option value="other">Other</option></select></div>
          <div className="grid gap-2"><Label htmlFor="expense-amount">Amount ({currency})</Label><Input id="expense-amount" name="amount" type="number" inputMode="decimal" min="0.01" step="0.01" placeholder="1,200" value={amount} onChange={(event) => setAmount(event.target.value)} required /></div>
          <div className="grid gap-2"><Label htmlFor="expense-paid-by">Paid by</Label><select id="expense-paid-by" name="paidBy" className={fieldClass} defaultValue={currentUserId}>{members.map((member) => <option key={member.user_id} value={member.user_id}>{member.profile.display_name}</option>)}</select></div>
          <div className="grid gap-2"><Label htmlFor="expense-date">Date</Label><Input id="expense-date" name="expenseDate" type="date" defaultValue={defaultDate} required /></div>
        </div>
        <fieldset className="min-w-0">
          <legend className="mb-2 text-sm font-medium text-[#17291f]">Split between <span className="font-normal text-[#718187]">· equal split</span></legend>
          <div className="grid gap-2 sm:grid-cols-2">{members.map((member, index) => {
            const checked = selected.includes(member.user_id);
            return <label key={member.user_id} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${checked ? "border-[#9edba7] bg-[#edfaef]" : "border-[#dbe4e7] bg-white"}`}>
              <input className="sr-only" type="checkbox" name="members" value={member.user_id} checked={checked} onChange={() => setSelected((items) => checked ? items.filter((id) => id !== member.user_id) : [...items, member.user_id])} />
              <span className={`grid size-5 place-items-center rounded-full ${checked ? "bg-[#4cbd5b] text-white" : "border border-[#cbd8db]"}`}>{checked && <Check className="size-3.5" aria-hidden="true" />}</span>
              <Avatar profile={member.profile} index={index} size="sm" /><span className="truncate">{member.profile.display_name}</span>
            </label>;
          })}</div>
        </fieldset>
        <div className="rounded-xl bg-[#eaf7ec] px-4 py-3 text-sm text-[#246f34]"><strong className="block tabular-nums">{selected.length || 0} members · {new Intl.NumberFormat("en-TH", { style: "currency", currency }).format(perPerson)} each</strong><span className="mt-0.5 block text-xs text-[#5f7b65]">The payer&apos;s share is marked paid automatically.</span></div>
        <label className="grid min-h-24 cursor-pointer place-items-center content-center gap-1 rounded-2xl border border-dashed border-[#cbdadd] bg-[#f3f8f9] px-4 text-center transition hover:border-[#4cbd5b] focus-within:ring-2 focus-within:ring-[#4cbd5b]/25">
          <ImageUp className="size-5 text-[#4cbd5b]" aria-hidden="true" /><strong className="text-sm text-[#17291f]">Upload receipt photo</strong><span className="text-xs text-[#718187]">PNG, JPG or WebP up to 5 MB</span><input className="sr-only" name="receipt" type="file" accept="image/jpeg,image/png,image/webp" />
        </label>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
          <SubmitButton className="w-full sm:w-auto" pendingLabel="Saving expense…">Save expense</SubmitButton>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
