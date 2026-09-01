import Link from 'next/link';
import { Layers } from 'lucide-react';
import Twin from '@/components/twin';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-950 dark:to-slate-900 text-gray-900 dark:text-slate-100 transition-colors duration-200">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Top Right Navigation */}
          <div className="flex justify-end mb-3">
            <Link
              href="/architecture"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-cyan-500/50 dark:hover:border-cyan-500/50 shadow-sm hover:shadow transition-all active:scale-95"
              id="see-architecture-btn"
            >
              <Layers className="w-4 h-4 text-cyan-500" />
              <span>See Architecture</span>
            </Link>
          </div>

          <h1 className="text-4xl font-bold text-center text-gray-800 dark:text-white mb-2 tracking-tight transition-colors">
            AI in Production
          </h1>
          <p className="text-center text-gray-600 dark:text-slate-400 mb-8 tracking-tight transition-colors">
            The Interactive AI Chatbot
          </p>

          <div className="h-[600px]">
            <Twin />
          </div>

          <footer className="mt-8 text-center text-sm text-gray-500 dark:text-slate-500 transition-colors">
            <p>Powered by AWS</p>
          </footer>
        </div>
      </div>
    </main>
  );
}