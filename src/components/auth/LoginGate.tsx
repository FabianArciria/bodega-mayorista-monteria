'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  Store, 
  ShieldCheck, 
  Boxes, 
  User, 
  Lock, 
  Mail, 
  Building2, 
  Phone, 
  ArrowRight,
  AlertCircle,
  Sparkles,
  Truck,
  CheckCircle2
} from 'lucide-react';

interface LoginGateProps {
  onSuccess?: () => void;
}

export default function LoginGate({ onSuccess }: LoginGateProps) {
  const router = useRouter();
  const { login, signup, switchDemoRole } = useAuth();

  const [activeTab, setActiveTab] = useState<'client' | 'staff'>('client');
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Campos de formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      if (isRegisterMode) {
        const res = await signup({
          email,
          password,
          fullName,
          phone,
          companyName,
        });

        if (!res.success) {
          setErrorMsg(res.error || 'Error creando la cuenta');
          return;
        }

        if (onSuccess) onSuccess();
        else router.push('/');
      } else {
        const res = await login(email, password);
        if (!res.success) {
          setErrorMsg(res.error || 'Credenciales incorrectas');
          return;
        }

        if (res.role === 'admin') router.push('/admin');
        else if (res.role === 'worker') router.push('/worker');
        else {
          if (onSuccess) onSuccess();
          else router.push('/');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error en el proceso de autenticación');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoAccess = (demoRole: 'admin' | 'worker' | 'client') => {
    switchDemoRole(demoRole);
    if (demoRole === 'admin') router.push('/admin');
    else if (demoRole === 'worker') router.push('/worker');
    else {
      if (onSuccess) onSuccess();
      else router.push('/');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 sm:py-12 relative">
      {/* Fondo con brillo difuminado */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-r from-rose-600/20 via-pink-600/10 to-amber-600/20 blur-3xl rounded-full pointer-events-none" />

      <div className="w-full max-w-lg bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 sm:p-9 shadow-2xl shadow-black/80 space-y-6 relative z-10">
        
        {/* Encabezado Principal */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 via-rose-500 to-pink-600 flex items-center justify-center mx-auto shadow-xl shadow-rose-950/50">
            <Store className="w-7 h-7 text-white" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold tracking-wide">
            <Lock className="w-3.5 h-3.5" />
            <span>Ingreso Obligatorio Mayorista</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Bodega Mayorista Montería
          </h1>

          <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto leading-relaxed">
            Para ver el catálogo de precios por mayor, márgenes de ganancia y hacer pedidos, por favor inicia sesión o ingresa a tu cuenta.
          </p>
        </div>

        {/* Acceso Rápido Instantáneo (1 Clic) */}
        <div className="p-3.5 bg-zinc-950/90 rounded-2xl border border-zinc-800/80 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Ingreso Rápido en 1 Clic:
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold">Listo para usar</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemoAccess('client')}
              className="px-2 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all hover:scale-102 active:scale-98"
            >
              <Store className="w-4 h-4" />
              <span>Comprador</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoAccess('worker')}
              className="px-2 py-2.5 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all hover:scale-102 active:scale-98"
            >
              <Boxes className="w-4 h-4" />
              <span>Encargado</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoAccess('admin')}
              className="px-2 py-2.5 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/30 hover:bg-purple-500/20 font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all hover:scale-102 active:scale-98"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin RLS</span>
            </button>
          </div>
        </div>

        {/* Separador */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-zinc-800"></div>
          <span className="flex-shrink mx-3 text-[11px] uppercase tracking-wider text-zinc-500 font-bold">
            O ingresa con tus credenciales
          </span>
          <div className="flex-grow border-t border-zinc-800"></div>
        </div>

        {/* Tabs de Selección de Tipo de Cuenta */}
        <div className="grid grid-cols-2 p-1 bg-zinc-950 rounded-2xl border border-zinc-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setActiveTab('client'); setIsRegisterMode(false); }}
            className={`py-2 rounded-xl transition-all ${
              activeTab === 'client'
                ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Cliente Mayorista
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('staff'); setIsRegisterMode(false); }}
            className={`py-2 rounded-xl transition-all ${
              activeTab === 'staff'
                ? 'bg-zinc-800 text-amber-300 shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Personal de Bodega
          </button>
        </div>

        {/* Mensaje de Error */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {isRegisterMode && (
            <>
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Nombre Completo *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ej: Laura Sofía Mendoza"
                    className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Nombre del Negocio / Almacén</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ej: Variedades Montería Centro"
                    className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Teléfono Móvil / WhatsApp *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="300 123 4567"
                    className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-bold text-zinc-300 block mb-1">Correo Electrónico *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={activeTab === 'staff' ? 'encargado@bodegamonteria.com' : 'tu-correo@negocio.com'}
                className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-300 block mb-1">Contraseña *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg text-white hover:scale-102 active:scale-98 ${
              activeTab === 'staff'
                ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-950/50'
                : 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 shadow-rose-950/50'
            }`}
          >
            {isSubmitting ? (
              <span>Verificando ingreso...</span>
            ) : isRegisterMode ? (
              <>
                <span>Registrarme como Cliente Mayorista</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Ingresar al Catálogo Mayorista</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Toggle Login / Registro */}
        {activeTab === 'client' && (
          <div className="text-center pt-1 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={() => { setIsRegisterMode(!isRegisterMode); setErrorMsg(null); }}
              className="text-xs text-rose-400 hover:text-rose-300 font-bold"
            >
              {isRegisterMode
                ? '¿Ya tienes cuenta mayorista? Inicia sesión aquí'
                : '¿Eres comerciante nuevo? Regístrate para ver precios'}
            </button>
          </div>
        )}

        {/* Garantías B2B al pie */}
        <div className="pt-2 flex items-center justify-between text-[11px] text-zinc-400 border-t border-zinc-800/60">
          <span className="flex items-center gap-1">
            <Truck className="w-3.5 h-3.5 text-emerald-400" />
            Montería & Córdoba
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />
            Precios Mayoristas
          </span>
          <span className="flex items-center gap-1">
            <Phone className="w-3.5 h-3.5 text-amber-400" />
            Línea: 321 714 7358
          </span>
        </div>

      </div>
    </div>
  );
}
