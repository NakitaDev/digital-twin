import Link from 'next/link';
import { ArrowLeft, ExternalLink, Network } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'System Architecture | AI Digital Twin',
  description: 'Interactive system architecture diagram for AI Digital Twin on AWS',
};

export default function ArchitecturePage() {
  return (
    <div className="h-screen w-full overflow-hidden bg-[#020617] text-slate-100 flex flex-col">
      {/* Top Bar Navigation */}
      <header className="h-14 bg-[#0b1120] border-b border-[#1e293b] px-4 sm:px-6 flex items-center justify-between shrink-0 z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-slate-300 hover:text-white bg-[#1e293b]/80 hover:bg-[#1e293b] border border-[#334155] hover:border-slate-400 transition-all shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Chat</span>
        </Link>

        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-cyan-400" />
          <h1 className="font-semibold text-sm sm:text-base text-white tracking-tight">
            System Architecture
          </h1>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
            Interactive
          </span>
        </div>

        <a
          href="/architecture-diagram.html"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-[#1e293b]/80 hover:bg-[#1e293b] border border-[#334155] hover:border-slate-400 transition-all shadow-sm active:scale-95"
          title="Open standalone diagram in new tab"
        >
          <span className="hidden sm:inline">Fullscreen</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </header>

      {/* Embedded interactive SVG architecture diagram */}
      <main className="flex-1 w-full h-[calc(100vh-3.5rem)] relative bg-[#020617]">
        <iframe
          src="/architecture-diagram.html"
          title="AI Digital Twin System Architecture Diagram"
          className="w-full h-full border-0 absolute inset-0"
        />
      </main>
    </div>
  );
}
