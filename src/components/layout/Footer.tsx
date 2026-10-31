'use client';

import React from 'react';
import Link from 'next/link';
import { Store, MapPin, Phone, Clock, ShieldCheck, Truck, Sparkles } from 'lucide-react';

export default function Footer() {
  const currentYear = 2026;

  return (
    <footer className="bg-zinc-950 border-t border-zinc-800 text-zinc-400 text-sm mt-16">
      {/* Ventajas Mayoristas */}
      <div className="border-b border-zinc-800/80 bg-zinc-900/40 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
          <div className="flex items-center gap-4 justify-center md:justify-start">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-zinc-100 font-bold text-sm">Despachos Inmediatos</h4>
              <p className="text-xs text-zinc-400">Envíos a Montería, Cereté, Lorica, Sahagún, Montelíbano y toda la Costa.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 justify-center md:justify-start">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-zinc-100 font-bold text-sm">Margen de Ganancia Alto</h4>
              <p className="text-xs text-zinc-400">Precios directos de importación para que tu negocio gane más del 50%.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 justify-center md:justify-start">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-zinc-100 font-bold text-sm">Atención Personalizada</h4>
              <p className="text-xs text-zinc-400">Cotizaciones rápidas y asesoría directa por WhatsApp con nuestros ejecutivos.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Info Principal */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white font-bold">
                BM
              </div>
              <span className="text-zinc-100 font-extrabold text-lg tracking-tight">
                Bodega Mayorista Montería
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
              Plataforma B2B líder en el departamento de Córdoba para la distribución de cosméticos de alta rotación, tecnología, accesorios y variedades por mayor.
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Sector Comercial Centro, Montería, Córdoba - Colombia</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Línea Mayorista WhatsApp: +57 321 714 7358</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Lunes a Sábado: 8:00 AM - 6:00 PM</span>
              </div>
            </div>
          </div>

          {/* Zonas Disponibles */}
          <div>
            <h5 className="text-zinc-200 font-bold text-sm uppercase tracking-wider mb-4">
              Zonas del Catálogo
            </h5>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/zonas/zona-belleza" className="hover:text-rose-400 transition-colors flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  Zona Belleza & Skincare (Activa)
                </Link>
              </li>
              <li className="text-zinc-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-700"></span>
                Zona iPhone (Próximamente)
              </li>
              <li className="text-zinc-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-700"></span>
                Zona Android (Próximamente)
              </li>
              <li className="text-zinc-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-700"></span>
                Zona Cacharros & Hogar
              </li>
              <li className="text-zinc-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-700"></span>
                Zona Mayorista Especial
              </li>
            </ul>
          </div>

          {/* Accesos de Gestión y Seguridad */}
          <div>
            <h5 className="text-zinc-200 font-bold text-sm uppercase tracking-wider mb-4">
              Acceso a la Plataforma
            </h5>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/login" className="hover:text-zinc-200 transition-colors">
                  Iniciar Sesión Mayorista
                </Link>
              </li>
              <li>
                <Link href="/worker" className="hover:text-amber-400 transition-colors">
                  Portal Encargados (Subir Productos)
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-rose-400 transition-colors">
                  Panel de Administrador (RLS)
                </Link>
              </li>
              <li className="pt-2">
                <span className="inline-block px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-500">
                  Arquitectura Supabase + Vercel
                </span>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-zinc-900 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
          <p>© {currentYear} Bodega Mayorista Montería. Todos los derechos reservados.</p>
          <div className="flex gap-4">
            <span className="text-zinc-400 font-medium">NIT 901.458.789-3</span>
            <span>•</span>
            <span>Montería, Colombia</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
