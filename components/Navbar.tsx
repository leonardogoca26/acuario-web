import Link from 'next/link';
import { Fish } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="bg-white text-slate-800 sticky top-0 z-50 border-b border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        
        {/* Identidad Acuario Puyehue */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shadow-sm group-hover:bg-sky-100 transition">
            <Fish className="w-6 h-6 text-amber-500 fill-amber-400 group-hover:scale-105 transition" />
          </div>
          <div>
            <div className="font-black text-base tracking-tight leading-none text-sky-950">
              ACUARIO <span className="text-sky-600 font-bold">PUYEHUE</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-0.5">
              Portal Operativo & Finanzas
            </div>
          </div>
        </Link>

        {/* Enlaces de Navegación */}
        <nav className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium">
          <Link href="/boleteria" className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-sky-900 hover:bg-slate-100 transition">
            Boletería
          </Link>
          <Link href="/convenios" className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-sky-900 hover:bg-slate-100 transition">
            Convenios
          </Link>
          <Link href="/egresos" className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-sky-900 hover:bg-slate-100 transition">
            Egresos
          </Link>
          <Link 
            href="/dashboard" 
            className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold transition shadow-sm"
          >
            Dashboard
          </Link>
        </nav>
      </div>
    </header>
  );
}