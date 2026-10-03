"use client";

import { ReceiptText } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type ExpenseStatus = "Pending" | "Partially paid" | "Settled" | "Your share paid";

export function ExpenseDetailModal({ title, category, date, total, perPerson, paidBy, members, status }: { title: string; category: string; date: string; total: string; perPerson: string; paidBy: string; members: number; status: ExpenseStatus }) {
  const settled = status === "Settled" || status === "Your share paid";
  return <Dialog>
    <DialogTrigger asChild><button type="button" className="flex min-h-11 max-w-full cursor-pointer items-center overflow-hidden text-left text-sm font-bold text-[#17291f] transition hover:text-[#27843a] hover:underline hover:underline-offset-4 focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4cbd5b]/35"><span className="truncate">{title}</span></button></DialogTrigger>
    <DialogContent className="max-w-md bg-white">
      <DialogHeader className="pr-8"><DialogTitle>{title}</DialogTitle><DialogDescription className="capitalize">{category} · {date}</DialogDescription></DialogHeader>
      <div className="flex min-h-24 flex-col items-center justify-center rounded-[20px] bg-[#dff6e3] text-center"><strong className="text-3xl font-bold tabular-nums text-[#216d32]">{total}</strong><span className="mt-1 text-xs text-[#5e8265]">{perPerson} per person · equal split</span></div>
      <dl className="grid gap-3 text-sm"><div className="flex justify-between gap-4"><dt className="text-[#718187]">Paid by</dt><dd className="font-semibold text-[#17291f]">{paidBy}</dd></div><div className="flex justify-between gap-4"><dt className="text-[#718187]">Members</dt><dd className="font-semibold text-[#17291f]">{members}</dd></div><div className="flex justify-between gap-4"><dt className="text-[#718187]">Status</dt><dd className={`font-semibold ${settled ? "text-[#27843a]" : "text-[#99612b]"}`}>{status}</dd></div></dl>
      <div className="grid min-h-20 place-items-center content-center gap-1 rounded-2xl border border-dashed border-[#d4e0e1] text-[#718187]"><ReceiptText className="size-5 text-[#2b8a3e]" aria-hidden="true" /><span className="text-sm font-medium">Receipt preview</span><small className="text-xs">Receipt image will appear here when uploaded.</small></div>
    </DialogContent>
  </Dialog>;
}
