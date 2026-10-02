import { Home } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return <main className="not-found"><span><Home size={27} /></span><p className="eyebrow">404</p><h1>That room doesn’t exist.</h1><p>The page may have moved, or the link is no longer available.</p><Link className="button button--primary" href="/dashboard">Back home</Link></main>;
}
