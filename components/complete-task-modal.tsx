"use client";

import { Camera, CheckCircle2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { uploadPhoto } from "@/components/upload-photo";

type Action = (formData: FormData) => void | Promise<void>;

export function CompleteTaskModal({ action, taskId, taskTitle, currentUserId }: { action: Action; taskId: string; taskTitle: string; currentUserId: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [proofName, setProofName] = useState("");

  async function complete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const proof = data.get("proof");
    data.delete("proof");
    setSubmitting(true);
    setError("");
    try {
      if (!(proof instanceof File)) throw new Error("Choose a proof photo");
      data.set("proofUrl", await uploadPhoto(proof, `task-proofs/${taskId}/${currentUserId}`));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Photo could not be uploaded");
      setSubmitting(false);
      return;
    }
    // Do not catch the server-action redirect; otherwise the UI remains stuck
    // on "Uploading photo…" until a manual refresh.
    await action(data);
    setSubmitting(false);
  }

  return <Dialog>
    <DialogTrigger asChild><Button className="button"><Camera size={17} /> Complete task</Button></DialogTrigger>
    <DialogContent className="complete-task-dialog">
      <DialogHeader><DialogTitle>Complete task</DialogTitle><DialogDescription>{taskTitle} - Add a photo of your work.</DialogDescription></DialogHeader>
      <form id="complete-task-form" onSubmit={complete}>
        <input type="hidden" name="taskId" value={taskId} />
        <div className="photo-upload-card"><h3>Upload a photo of your work</h3><small>JPG, PNG or WebP · up to 5 MB</small><label className="button button--secondary button--wide"><Camera size={16} /> {proofName || "Select photo"}<input name="proof" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setProofName(event.target.files?.[0]?.name ?? "")} required /></label></div>
        <p className="modal-help">A photo is required before completing this task.</p>
        {error && <p role="alert" className="text-sm text-[#b42334]">{error}</p>}
        <DialogFooter><DialogClose asChild><Button variant="secondary" type="button">Cancel</Button></DialogClose><Button type="submit" disabled={submitting}><CheckCircle2 size={16} /> {submitting ? "Uploading photo…" : "Complete task"}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
