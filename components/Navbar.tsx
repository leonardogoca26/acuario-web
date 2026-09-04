import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
  return (
    <header className="bg-slate-950/90 backdrop-blur-md text-white sticky top-0 z-50 border-b border-sky-900/40 shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-4">
        
        {/* Logo Flotante Transparente */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative h-11 w-36 flex items-center justify-center">
            <Image 
              src="/acuario.png" 
              alt="Parque Acuario Puyehue" 
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="hidden sm:block border-l border-slate-700/80 pl-3">
            <div className="text-[11px] uppercase tracking-wider font-bold text-sky-400">
              Control Operativo
            </div>
            <div className="text-[10px] text-slate-400">
              Entre Lagos • Puyehue
            </div>
          </div>
        </Link>

        {/* Enlaces de Navegación */}
        <nav className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium">
          <Link href="/boleteria" className="px-3 py-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800/80 transition">
            Boletería
          </Link>
          <Link href="/convenios" className="px-3 py-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800/80 transition">
            Convenios
          </Link>
          <Link href="/egresos" className="px-3 py-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800/80 transition">
            Egresos
          </Link>
          <Link 
            href="/dashboard" 
            className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold transition shadow-sm"
          >
            Dashboard
          </Link>
        </nav>
      </div>
    </header>
  );
}