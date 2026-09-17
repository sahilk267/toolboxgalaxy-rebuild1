// Orbital Workbench: clear route recovery instead of navigation dead ends.
import AppShell from "@/components/AppShell";
import { Link } from "wouter";

export default function NotFound() { return <AppShell><section className="page-section"><p className="mono-label text-[#ff9b54]">404 / OFF ORBIT</p><h1 className="font-display mt-4 text-5xl font-semibold tracking-[-0.06em]">That module is not in this bay.</h1><Link href="/" className="signal-button mt-8 inline-flex">Return to overview</Link></section></AppShell>; }
