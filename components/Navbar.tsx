import Link from 'next/link';
import { Waves } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="bg-slate-950 text-white sticky top-0 z-50 border-b border-slate-800 shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        
        {/* Identidad de Marca */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 group-hover:bg-emerald-500/20 transition">
            <Waves className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="font-extrabold text-base tracking-tight leading-none text-white group-hover:text-emerald-300 transition">
              ACUARIO <span className="text-emerald-400 font-medium">PUYEHUE</span>
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">
              Control de Operaciones
            </div>
          </div>
        </Link>

        {/* Navegación */}
        <nav className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium">
          <Link href="/boleteria" className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition">
            Boletería
          </Link>
          <Link href="/convenios" className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition">
            Convenios & Delegaciones
          </Link>
          <Link href="/egresos" className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition">
            Egresos
          </Link>
          <Link 
            href="/dashboard" 
            className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition shadow-sm"
          >
            Dashboard
          </Link>
        </nav>
      </div>
    </header>
  );
}