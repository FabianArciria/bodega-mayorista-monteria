'use client';

import React, { useState, useEffect } from 'react';
import { Profile, Zone } from '@/types/database';
import { X, User, Phone, Mail, Layers, Save, Trash2, CheckCircle2 } from 'lucide-react';

interface EditWorkerModalProps {
  isOpen: boolean;
  worker: Profile | null;
  zones: Zone[];
  onClose: () => void;
  onSave: (updatedWorker: Profile) => Promise<void>;
  onDelete?: (workerId: string) => Promise<void>;
}

export default function EditWorkerModal({
  isOpen,
  worker,
  zones,
  onClose,
  onSave,
  onDelete,
}: EditWorkerModalProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [assignedZoneId, setAssignedZoneId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (worker) {
      setFullName(worker.full_name || '');
      setPhone(worker.phone || '');
      setEmail(worker.email || '');
      setAssignedZoneId(worker.assigned_zone_id || '');
      setSuccessMsg(null);
    }
  }, [worker]);

  if (!isOpen || !worker) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated: Profile = {
        ...worker,
        full_name: fullName,
        phone: phone,
        email: email,
        assigned_zone_id: assignedZoneId || null,
        updated_at: new Date().toISOString(),
      };
      await onSave(updated);
      setSuccessMsg('¡Datos del empleado y zona actualizados correctamente!');
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      alert('Error guardando cambios: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (!confirm(`¿Estás seguro de eliminar al empleado "${worker.full_name}"?`)) return;

    setIsDeleting(true);
    try {
      await onDelete(worker.id);
      onClose();
    } catch (err: any) {
      alert('Error al eliminar: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm p-4 flex items-center justify-center animate-fadeIn">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl text-zinc-100 flex flex-col">
        {/* Cabecera */}
        <div className="p-5 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                Editar Datos del Empleado
              </h3>
              <p className="text-xs text-zinc-400">
                Actualiza datos personales, WhatsApp directo y zona asignada
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notificación de éxito */}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-zinc-300 block mb-1">
              Nombre Completo del Encargado *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej: Andrés López"
                className="w-full pl-9 pr-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-300 block mb-1">
              Celular WhatsApp de Pedidos *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej: 3217147358"
                className="w-full pl-9 pr-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-emerald-300 font-mono placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Este número se sincronizará automáticamente como el contacto de WhatsApp de la zona asignada.
            </p>
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-300 block mb-1">
              Correo Electrónico *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="empleado@bodegamonteria.com"
                className="w-full pl-9 pr-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-300 block mb-1">
              Zona Asignada
            </label>
            <div className="relative">
              <Layers className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <select
                value={assignedZoneId}
                onChange={(e) => setAssignedZoneId(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 font-bold"
              >
                <option value="">Sin Zona Asignada</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} {z.is_active ? '(Activa)' : '(Inactiva)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between gap-3">
            {onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || isSaving}
                className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-md active:scale-98 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Guardando...' : 'Aplicar Cambios'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
