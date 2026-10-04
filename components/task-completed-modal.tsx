"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TreeIllustration } from "@/components/tree-illustration";

export function TaskCompletedModal({ open, taskTitle, isOwner }: { open: boolean; taskTitle: string; isOwner: boolean }) {
  const [levelUp] = useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("levelUp") === "1");
  return <Dialog defaultOpen={open || levelUp}>
    <DialogContent className="task-completed-dialog">
      {levelUp ? <>
        <DialogHeader><DialogTitle>Your house leveled up!</DialogTitle><DialogDescription>Congratulations, everyone.</DialogDescription></DialogHeader>
        <TreeIllustration compact /><h3>New harmony milestone</h3><p>{isOwner ? "Your house reached a new level. Make some time to celebrate together." : "Your house reached a new level. The house owner can plan a celebration for everyone."}</p>
        <DialogFooter>{isOwner && <Button asChild><Link href="/harmony#celebration">Celebrate together</Link></Button>}<DialogClose asChild><Button variant="secondary" type="button">Continue growing</Button></DialogClose></DialogFooter>
      </> : <>
        <DialogHeader><DialogTitle>Nice work!</DialogTitle><DialogDescription>{taskTitle} has been completed.</DialogDescription></DialogHeader>
        <div className="task-score-card"><strong>+10 System Score</strong><span>Your house harmony has been updated.</span></div>
        <p>Your housemates have been notified. The first reaction from another member adds +5 bonus points.</p>
        <DialogFooter><Button asChild><Link href="/chores">Back to tasks</Link></Button><DialogClose asChild><Button variant="secondary" type="button">Done</Button></DialogClose></DialogFooter>
      </>}
    </DialogContent>
  </Dialog>;
}
