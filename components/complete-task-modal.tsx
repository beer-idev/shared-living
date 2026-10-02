"use client";

import { Camera, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Action = (formData: FormData) => void | Promise<void>;

export function CompleteTaskModal({ action, taskId, taskTitle }: { action: Action; taskId: string; taskTitle: string }) {
  return <Dialog>
    <DialogTrigger asChild><Button className="button"><Camera size={17} /> Complete chore</Button></DialogTrigger>
    <DialogContent className="complete-task-dialog">
      <DialogHeader><DialogTitle>Complete task</DialogTitle><DialogDescription>{taskTitle} · Add a photo of your work.</DialogDescription></DialogHeader>
      <div className="photo-upload-card"><h3>Upload a photo of your work</h3><small>JPG or PNG · Up to 5 MB</small><label className="button button--secondary button--wide"><Camera size={16} /> Select photo<input name="proof" form="complete-task-form" type="file" accept="image/jpeg,image/png,image/webp" required /></label></div>
      <p className="modal-help">A photo is required before completing this task.</p>
      <form id="complete-task-form" action={action}>
        <input type="hidden" name="taskId" value={taskId} />
        <DialogFooter><DialogClose asChild><Button variant="secondary" type="button">Cancel</Button></DialogClose><Button type="submit"><CheckCircle2 size={16} /> Complete task</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
