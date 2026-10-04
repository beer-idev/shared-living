import Link from "next/link";
import { Database } from "lucide-react";

export default function SetupPage() {
  return <main className="setup-page">
    <header><span><Database size={25} /></span><p className="eyebrow">Production setup</p><h1>Connect Firebase and Vercel Blob</h1><p>Shared Living stores accounts and house data in Firebase. Receipt and task photos are stored in Vercel Blob.</p></header>
    <ol className="setup-steps">
      <li><span>1</span><div><h2>Create a Firebase project</h2><p>Enable Email/Password in Authentication and create a Firestore database.</p></div></li>
      <li><span>2</span><div><h2>Add environment variables</h2><pre><code>NEXT_PUBLIC_FIREBASE_API_KEY=...{"\n"}FIREBASE_PROJECT_ID=...{"\n"}FIREBASE_CLIENT_EMAIL=...{"\n"}FIREBASE_PRIVATE_KEY=...{"\n"}BLOB_READ_WRITE_TOKEN=...</code></pre></div></li>
      <li><span>3</span><div><h2>Create a Vercel Blob store</h2><p>Connect the store to this Vercel project, then add the same variables to your local environment for development.</p></div></li>
    </ol>
    <Link href="/login" className="button button--primary">Open login</Link>
  </main>;
}
