'use client';

import React, { useState } from 'react';
import { Zone } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { slugify } from '@/lib/utils';
import { updateZoneAndSyncWorker, saveStoredZones } from '@/lib/data-store';
import { 
  X, 
  Layers, 
  Check, 
  Plus, 
  ToggleLeft, 
  ToggleRight, 
  Sparkles, 
  Smartphone, 
  Package, 
  Crown,
  Phone,
  User,
  Image as ImageIcon,
  Edit2,
  Save,
  AlertCircle
} from 'lucide-react';

interface ZoneManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  zones: Zone[];
  onZonesUpdated: (updatedZones: Zone[]) => void;
}

export default function ZoneManagerModal({
  isOpen,
  onClose,
  zones,
  onZonesUpdated,
}: ZoneManagerModalProps) {
  const { isConfigured } = useAuth();
  const [localZones, setLocalZones] = useState<Zone[]>(zones);
  
  // Creación de nueva zona
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneDescription, setNewZoneDescription] = useState('');
  const [newZonePhone, setNewZonePhone] = useState('573217147358');
  const [newZoneManager, setNewZoneManager] = useState('');
  const [newZoneLogo, setNewZoneLogo] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  // Edición rápida de zona existente
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [editPhone, setEditPhone] = useState('');
  const [editManager, setEditManager] = useState('');
  const [editLogo, setEditLogo] = useState('');
  
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Alternar estado activo con 1 solo clic y persistir
  const handleToggleZone = async (zone: Zone) => {
    const updatedStatus = !zone.is_active;
    const updatedZone: Zone = { ...zone, is_active: updatedStatus };

    try {
      const res = await updateZoneAndSyncWorker(updatedZone);
      setLocalZones(res.zones);
      onZonesUpdated(res.zones);
      setMessage(`Zona "${zone.name}" ${updatedStatus ? 'activada' : 'desactivada'} en el catálogo`);
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      console.error('Error actualizando zona:', err);
      alert('Error: ' + err.message);
    }
  };

  // Iniciar edición de una zona
  const startEditing = (zone: Zone) => {
    setEditingZoneId(zone.id);
    setEditPhone(zone.contact_phone || '573217147358');
    setEditManager(zone.manager_name || '');
    setEditLogo(zone.logo_url || '');
  };

  // Guardar edición de una zona (WhatsApp, Logo, Encargado) con persistencia total
  const handleSaveZoneEdit = async (zoneId: string) => {
    const target = localZones.find((z) => z.id === zoneId);
    if (!target) return;

    try {
      const updatedZone: Zone = {
        ...target,
        contact_phone: editPhone,
        manager_name: editManager,
        logo_url: editLogo,
        updated_at: new Date().toISOString(),
      };

      const res = await updateZoneAndSyncWorker(updatedZone);
      setLocalZones(res.zones);
      onZonesUpdated(res.zones);
      setEditingZoneId(null);
      setMessage('¡Datos, WhatsApp y logo de la zona actualizados con éxito!');
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      alert('Error guardando cambios: ' + err.message);
    }
  };

  // Crear nueva zona modular dinámicamente
  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneName) return;

    setIsCreating(true);
    const newZone: Zone = {
      id: `zone-${Date.now()}`,
      name: newZoneName,
      slug: slugify(newZoneName),
      description: newZoneDescription,
      icon: 'Package',
      color_gradient: 'from-blue-600 to-indigo-800',
      logo_url: newZoneLogo || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=200&q=80',
      contact_phone: newZonePhone || '573217147358',
      manager_name: newZoneManager || `Encargado ${newZoneName}`,
      is_active: true,
      display_order: localZones.length + 1,
      created_at: '2026-10-31T00:00:00.000Z',
      updated_at: '2026-10-31T00:00:00.000Z',
    };

    try {
      if (isConfigured) {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('zones')
          .insert({
            name: newZone.name,
            slug: newZone.slug,
            description: newZone.description,
            icon: newZone.icon,
            color_gradient: newZone.color_gradient,
            logo_url: newZone.logo_url,
            contact_phone: newZone.contact_phone,
            manager_name: newZone.manager_name,
            is_active: true,
            display_order: newZone.display_order,
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          const updated = [...localZones, data as Zone];
          setLocalZones(updated);
          onZonesUpdated(updated);
          saveStoredZones(updated);
        }
      } else {
        const updated = [...localZones, newZone];
        setLocalZones(updated);
        onZonesUpdated(updated);
        saveStoredZones(updated);
      }

      setNewZoneName('');
      setNewZoneDescription('');
      setNewZoneManager('');
      setNewZoneLogo('');
      setMessage(`Nueva zona "${newZone.name}" creada y activada con éxito`);
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      console.error('Error creando zona:', err);
      alert('Error creando zona: ' + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm p-4 sm:p-6 flex items-center justify-center">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl text-zinc-100 flex flex-col max-h-[90vh]">
        
        {/* Cabecera */}
        <div className="p-5 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white">
                Gestor de Zonas Modulares & Encargados
              </h2>
              <p className="text-xs text-zinc-400">
                Activa zonas, asigna logos representativos y configura el celular WhatsApp de cada encargado
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

        {/* Notificación rápida */}
        {message && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Lista de Zonas Existentes con Switch de 1 Clic */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
              Zonas Actuales (Activar / Desactivar y Editar Encargado)
            </h3>
            <div className="space-y-3">
              {localZones.map((z) => {
                const isEditing = editingZoneId === z.id;

                return (
                  <div
                    key={z.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      z.is_active
                        ? 'bg-zinc-900 border-purple-500/40 shadow-sm'
                        : 'bg-zinc-950/60 border-zinc-800/80 opacity-80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Logo o Icono */}
                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-zinc-700 bg-zinc-950 flex items-center justify-center shrink-0">
                          {z.logo_url ? (
                            <img src={z.logo_url} alt={z.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-purple-400">
                              {z.icon === 'Sparkles' ? <Sparkles className="w-5 h-5" /> :
                               z.icon === 'Smartphone' ? <Smartphone className="w-5 h-5" /> :
                               z.icon === 'Crown' ? <Crown className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                            {z.name}
                            {z.slug === 'zona-belleza' && (
                              <span className="text-[10px] bg-rose-500/20 text-rose-300 font-bold px-1.5 py-0.2 rounded border border-rose-500/30">
                                Inicial
                              </span>
                            )}
                          </h4>
                          <p className="text-[11px] text-zinc-400 line-clamp-1">{z.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Botón Editar datos */}
                        <button
                          type="button"
                          onClick={() => isEditing ? setEditingZoneId(null) : startEditing(z)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                          title="Editar celular y logo"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Switch de activación 1-clic */}
                        <button
                          type="button"
                          onClick={() => handleToggleZone(z)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                            z.is_active
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                              : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-white hover:bg-zinc-700'
                          }`}
                        >
                          {z.is_active ? (
                            <>
                              <ToggleRight className="w-4 h-4 text-emerald-400" />
                              <span>Visible</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-4 h-4 text-zinc-500" />
                              <span>Oculta</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Fila con detalles del encargado y WhatsApp */}
                    {!isEditing && (
                      <div className="mt-3 pt-2.5 border-t border-zinc-800/60 flex flex-wrap items-center gap-3 text-xs">
                        <div className="flex items-center gap-1 text-emerald-400 font-mono">
                          <Phone className="w-3 h-3" />
                          <span>WhatsApp: +{z.contact_phone || '573217147358'}</span>
                        </div>
                        {z.manager_name && (
                          <div className="flex items-center gap-1 text-zinc-400">
                            <User className="w-3 h-3 text-zinc-500" />
                            <span>{z.manager_name}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Modo edición inline */}
                    {isEditing && (
                      <div className="mt-3 pt-3 border-t border-zinc-800 space-y-2.5 bg-zinc-950/80 p-3 rounded-xl">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="text-[10px] text-zinc-400 block mb-0.5">Celular WhatsApp Encargado</label>
                            <input
                              type="text"
                              value={editPhone}
                              onChange={(e) => setEditPhone(e.target.value)}
                              placeholder="573217147358"
                              className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-white"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-zinc-400 block mb-0.5">Nombre Encargado</label>
                            <input
                              type="text"
                              value={editManager}
                              onChange={(e) => setEditManager(e.target.value)}
                              placeholder="Nombre del responsable"
                              className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-zinc-400 block mb-0.5">URL del Logo Propio</label>
                          <input
                            type="text"
                            value={editLogo}
                            onChange={(e) => setEditLogo(e.target.value)}
                            placeholder="https://..."
                            className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-white"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingZoneId(null)}
                            className="px-3 py-1 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-semibold"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveZoneEdit(z.id)}
                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1"
                          >
                            <Save className="w-3 h-3" />
                            <span>Guardar Cambios</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Formulario para Crear Nueva Zona */}
          <form onSubmit={handleCreateZone} className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              Crear Nueva Zona Dinámica
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Nombre de la Zona *</label>
                <input
                  type="text"
                  required
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  placeholder="Ej: Zona Mascotas"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Celular WhatsApp del Encargado</label>
                <input
                  type="text"
                  value={newZonePhone}
                  onChange={(e) => setNewZonePhone(e.target.value)}
                  placeholder="Ej: 573217147358"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Nombre del Encargado</label>
                <input
                  type="text"
                  value={newZoneManager}
                  onChange={(e) => setNewZoneManager(e.target.value)}
                  placeholder="Ej: Sandra Pérez (Encargada)"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">URL Logo de la Zona (Opcional)</label>
                <input
                  type="text"
                  value={newZoneLogo}
                  onChange={(e) => setNewZoneLogo(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Descripción corta</label>
              <input
                type="text"
                value={newZoneDescription}
                onChange={(e) => setNewZoneDescription(e.target.value)}
                placeholder="Productos y artículos al por mayor para..."
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <button
              type="submit"
              disabled={isCreating || !newZoneName}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isCreating ? 'Creando...' : 'Crear y Habilitar Zona con Encargado'}</span>
            </button>
          </form>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition-colors"
          >
            Cerrar Gestor
          </button>
        </div>

      </div>
    </div>
  );
}
