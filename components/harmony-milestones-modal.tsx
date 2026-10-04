"use client";

import { CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Level = { level: number; name: string; range: string };

export function HarmonyMilestonesModal({ levels, currentLevel, triggerLabel = "View milestones" }: { levels: readonly Level[]; currentLevel: number; triggerLabel?: string }) {
  return <Dialog>
    <DialogTrigger asChild><Button variant="outline" className="harmony-milestones-trigger"><Sparkles aria-hidden="true" />{triggerLabel}</Button></DialogTrigger>
    <DialogContent className="harmony-milestones-dialog">
      <DialogHeader><DialogTitle>House Harmony milestones</DialogTitle><DialogDescription>See how your shared home grows together.</DialogDescription></DialogHeader>
      <div className="milestone-modal-list">{levels.map((item) => <div className={item.level <= currentLevel ? "is-reached" : ""} key={item.level}><span>{item.level <= currentLevel ? <CheckCircle2 size={16} /> : item.level}</span><strong>{item.name}</strong><small>{item.range}</small></div>)}</div>
      <DialogFooter><DialogClose asChild><Button type="button" className="button button--primary button--wide">Back to harmony</Button></DialogClose></DialogFooter>
    </DialogContent>
  </Dialog>;
}
