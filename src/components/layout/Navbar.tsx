'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { 
  ShoppingBag, 
  Store, 
  ShieldCheck, 
  Boxes, 
  User, 
  LogOut, 
  Sparkles,
  Phone,
  Layers,
  ChevronDown,
  Lock,
  Eye,
  CheckCircle2
} from 'lucide-react';

export default function Navbar() {
  const { role, profile, isAuthenticated, logout, switchDemoRole, isConfigured } = useAuth();
  const { totalItems, setIsCartOpen } = useCart();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const isAdmin = role === 'admin';
  const isWorker = role === 'worker';
  const isClient = role === 'client';

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800 text-white">
      {/* Top Banner Mayorista Montería */}
      <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-pink-600 text-xs font-semibold py-1.5 px-4 text-center tracking-wide text-white flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Precios especiales al por mayor para Montería y Córdoba • Despachos inmediatos</span>
        <span className="hidden md:inline font-bold bg-black/20 px-2 py-0.5 rounded-full text-[11px]">
          Línea WhatsApp: 321 714 7358
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo y Nombre Comercial */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-950/40 group-hover:scale-105 transition-transform">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-zinc-100 group-hover:text-amber-400 transition-colors">
                  Bodega Mayorista
                </span>
                <span className="text-[10px] bg-rose-500/20 text-rose-300 font-bold px-1.5 py-0.5 rounded border border-rose-500/30 uppercase">
                  Montería
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                Catálogo oficial B2B para comerciantes
              </p>
            </div>
          </Link>

          {/* Navegación estrictamente diferenciada por Rol */}
          <nav className="hidden md:flex items-center gap-1.5">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-zinc-200 hover:text-white hover:bg-zinc-800/80 transition-colors flex items-center gap-1.5"
            >
              <Layers className="w-4 h-4 text-rose-400" />
              Catálogo Zonas
            </Link>

            {/* Solo visible para Personal Autorizado (Admin y Trabajadores) */}
            {isAuthenticated && (isWorker || isAdmin) && (
              <Link
                href="/worker"
                className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-colors flex items-center gap-1.5"
              >
                <Boxes className="w-4 h-4 text-amber-400" />
                Panel Encargado (Stock & Fotos)
              </Link>
            )}

            {/* Solo visible para el Administrador */}
            {isAuthenticated && isAdmin && (
              <Link
                href="/admin"
                className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold text-purple-300 bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 transition-colors flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                Administración General
              </Link>
            )}
          </nav>

          {/* Área de Usuario & Carrito */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Estado del Usuario y Menú */}
            {!isAuthenticated ? (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950/40 transition-all hover:scale-105 active:scale-95"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Ingresar</span>
              </Link>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    isAdmin 
                      ? 'bg-purple-950/40 text-purple-200 border-purple-500/40 hover:bg-purple-900/40' 
                      : isWorker
                      ? 'bg-amber-950/40 text-amber-200 border-amber-500/40 hover:bg-amber-900/40'
                      : 'bg-zinc-900 text-zinc-200 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${
                    isAdmin ? 'bg-purple-400 shadow-sm shadow-purple-500' :
                    isWorker ? 'bg-amber-400 shadow-sm shadow-amber-500' :
                    'bg-emerald-400 shadow-sm shadow-emerald-500'
                  }`} />

                  <div className="text-left hidden sm:block">
                    <span className="block text-[11px] font-extrabold leading-tight">
                      {profile?.company_name || profile?.full_name || 'Mi Cuenta'}
                    </span>
                    <span className="block text-[9px] uppercase tracking-wider text-zinc-400 font-semibold">
                      {isAdmin ? '🛡️ Administrador' : isWorker ? '📦 Encargado' : '🛒 Comprador Mayorista'}
                    </span>
                  </div>

                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                </button>

              {/* Dropdown de Usuario con Permisos y Acciones */}
              {profileDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-64 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-3 z-50 text-xs text-zinc-200"
                  onMouseLeave={() => setProfileDropdownOpen(false)}
                >
                  <div className="p-2 bg-zinc-950 rounded-xl border border-zinc-800 mb-2">
                    <p className="text-[10px] uppercase font-bold text-zinc-500">Sesión Activa:</p>
                    <p className="font-bold text-white truncate">{profile?.full_name}</p>
                    <p className="text-[11px] text-zinc-400 truncate">{profile?.email}</p>
                    {profile?.company_name && (
                      <p className="text-[10px] text-rose-400 font-semibold mt-0.5 truncate">
                        {profile.company_name}
                      </p>
                    )}
                  </div>

                  {/* Acciones según el rol */}
                  <div className="space-y-1">
                    {isAdmin && (
                      <>
                        <Link
                          href="/admin"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="w-full text-left px-3 py-2 rounded-xl flex items-center gap-2 hover:bg-zinc-800 text-purple-300 font-bold transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>Panel de Administrador</span>
                        </Link>
                        <Link
                          href="/worker"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="w-full text-left px-3 py-2 rounded-xl flex items-center gap-2 hover:bg-zinc-800 text-amber-300 font-bold transition-colors"
                        >
                          <Boxes className="w-4 h-4" />
                          <span>Subir Fotos & Stock</span>
                        </Link>
                        
                        {/* Herramienta de Administrador: Previsualizar como Cliente */}
                        <div className="border-t border-zinc-800 my-1 pt-1">
                          <button
                            onClick={() => { switchDemoRole('client'); setProfileDropdownOpen(false); }}
                            className="w-full text-left px-3 py-1.5 rounded-lg text-[11px] text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center gap-2"
                          >
                            <Eye className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Ver tienda como Cliente Mayorista</span>
                          </button>
                        </div>
                      </>
                    )}

                    {isWorker && (
                      <Link
                        href="/worker"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="w-full text-left px-3 py-2 rounded-xl flex items-center gap-2 hover:bg-zinc-800 text-amber-300 font-bold transition-colors"
                      >
                        <Boxes className="w-4 h-4" />
                        <span>Panel Encargado de Bodega</span>
                      </Link>
                    )}

                    {isClient && (
                      <button
                        onClick={() => { setIsCartOpen(true); setProfileDropdownOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-xl flex items-center gap-2 hover:bg-zinc-800 text-rose-300 font-bold transition-colors"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>Ver mi Pedido Mayorista</span>
                      </button>
                    )}
                  </div>

                  <div className="border-t border-zinc-800 my-2 pt-2 flex items-center justify-between">
                    <button
                      onClick={() => { logout(); setProfileDropdownOpen(false); }}
                      className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-rose-500/10"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Cerrar Sesión</span>
                    </button>

                    <Link
                      href="/login"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="text-[10px] text-zinc-500 hover:text-zinc-300"
                    >
                      Cambiar cuenta
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

            {/* Botón Carrito de Compras */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-medium shadow-md shadow-rose-950/50 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
              aria-label="Ver Carrito Mayorista"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-bold">Pedido</span>
              {totalItems > 0 && (
                <span className="bg-white text-rose-700 text-xs font-black px-1.5 py-0.2 rounded-full min-w-5 h-5 flex items-center justify-center animate-pulse">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
