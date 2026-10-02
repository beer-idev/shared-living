import { AlertCircle, CheckCircle2 } from "lucide-react";

export function StatusMessage({ error, success }: { error?: string; success?: string }) {
  if (!error && !success) return null;
  return <div className={`status-message ${error ? "status-message--error" : "status-message--success"}`}>{error ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}<span>{error ?? success}</span></div>;
}
