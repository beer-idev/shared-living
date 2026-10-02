"use client";

import { CircleAlert, RefreshCw } from "lucide-react";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="surface route-error"><span className="icon-tile icon-tile--orange"><CircleAlert size={22} /></span><h1>We couldn’t load this page</h1><p>Your data is safe. Check the connection and try again.</p><button className="button button--primary" onClick={reset}><RefreshCw size={16} /> Try again</button></section>;
}
