"use client";

import { Sprout } from "lucide-react";
import { TreeIllustration } from "@/components/tree-illustration";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function HarmonyGrowthModal({ score, levelName }: { score: number; levelName: string }) {
  return <Dialog>
    <DialogTrigger asChild><button type="button" className="harmony-hero-link"><Sprout size={16} /> Continue growing</button></DialogTrigger>
    <DialogContent className="harmony-growth-dialog">
      <DialogHeader>
        <DialogTitle>Keep growing</DialogTitle>
        <DialogDescription>Your harmony stays at its current level.</DialogDescription>
      </DialogHeader>
      <TreeIllustration compact />
      <h3 className="harmony-growth-score">{score}% · {levelName}</h3>
      <p className="harmony-growth-copy">Keep sharing the chores and looking after each other. You can choose to celebrate later.</p>
      <DialogClose asChild><Button className="button--primary button--wide" type="button">Back to harmony</Button></DialogClose>
    </DialogContent>
  </Dialog>;
}
