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
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, signup, switchDemoRole, isConfigured } = useAuth();

  const [activeTab, setActiveTab] = useState<'client' | 'staff'>('client');
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Form fields
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

        router.push('/');
      } else {
        const res = await login(email, password);
        if (!res.success) {
          setErrorMsg(res.error || 'Credenciales incorrectas');
          return;
        }

        if (res.role === 'admin') router.push('/admin');
        else if (res.role === 'worker') router.push('/worker');
        else router.push('/');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error en el proceso de autenticación');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Acceso Rápido para Pruebas del Evaluador / Cliente
  const handleQuickDemoAccess = (demoRole: 'admin' | 'worker' | 'client') => {
    switchDemoRole(demoRole);
    if (demoRole === 'admin') router.push('/admin');
    else if (demoRole === 'worker') router.push('/worker');
    else router.push('/');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Logo y Encabezado */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-rose-500 to-pink-600 flex items-center justify-center mx-auto shadow-lg shadow-rose-950/40">
            <Store className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Bodega Mayorista Montería
          </h1>
          <p className="text-xs text-zinc-400">
            Ingreso oficial para compradores y equipo de bodega
          </p>
        </div>

        {/* Tabs de Selección de Tipo de Usuario */}
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

        {/* Banner de acceso rápido de prueba (útil para revisar la plataforma de inmediato) */}
        <div className="p-3 bg-zinc-950/80 rounded-2xl border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 font-bold uppercase tracking-wider">
            <span>Acceso Instantáneo de Demostración:</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => handleQuickDemoAccess('client')}
              className="px-2 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 font-semibold"
            >
              Comprador
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoAccess('worker')}
              className="px-2 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 font-semibold"
            >
              Encargado
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoAccess('admin')}
              className="px-2 py-1.5 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/30 hover:bg-purple-500/20 font-semibold"
            >
              Admin RLS
            </button>
          </div>
        </div>

        {/* Mensaje de Error */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Formulario Principal */}
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
            className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg text-white ${
              activeTab === 'staff'
                ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-950/50'
                : 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 shadow-rose-950/50'
            }`}
          >
            {isSubmitting ? (
              <span>Procesando...</span>
            ) : isRegisterMode ? (
              <>
                <span>Registrarme como Cliente Mayorista</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Entrar a la Plataforma</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Toggle Login / Register para Clientes */}
        {activeTab === 'client' && (
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => { setIsRegisterMode(!isRegisterMode); setErrorMsg(null); }}
              className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
            >
              {isRegisterMode
                ? '¿Ya tienes cuenta mayorista? Inicia sesión aquí'
                : '¿Eres comerciante nuevo? Regístrate para ver precios'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
