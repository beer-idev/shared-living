"use client";

import { UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Action = (formData: FormData) => void | Promise<void>;

export function RemoveMemberButton({ name, memberId, action }: { name: string; memberId: string; action: Action }) {
  const initials = name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return <Dialog>
    <DialogTrigger asChild>
      <Button variant="default" className="h-11 min-h-11 w-full rounded-xl bg-[#e5484d] text-white shadow-sm hover:bg-[#cf3f44] [&_svg]:text-white">
        <UserMinus aria-hidden="true" /> Remove
      </Button>
    </DialogTrigger>
    <DialogContent className="max-w-md bg-white">
      <DialogHeader className="pr-8">
        <DialogTitle>Remove {name}?</DialogTitle>
        <DialogDescription>This person will leave the current house. Their past expense and task records will stay available.</DialogDescription>
      </DialogHeader>
      <div className="flex items-center gap-3 rounded-2xl bg-[#f7f9f9] p-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#dcf5df] font-bold text-[#2c7d3c]">{initials}</span>
        <div><strong className="block text-sm text-[#17291f]">{name}</strong><span className="text-xs text-[#718187]">House member</span></div>
      </div>
      <form action={action}>
        <input type="hidden" name="memberId" value={memberId} />
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
          <Button type="submit" variant="default" className="bg-[#e5484d] text-white hover:bg-[#cf3f44]">Remove member</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
