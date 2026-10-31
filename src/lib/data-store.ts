'use client';

import { Zone, Profile } from '@/types/database';
import { INITIAL_ZONES, INITIAL_WORKERS } from '@/lib/mock-data';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

const ZONES_KEY = 'bodega_monteria_zones_v3';
const WORKERS_KEY = 'bodega_monteria_workers_v3';
export const DATA_CHANGED_EVENT = 'bodega_data_updated';

// ---------------------------------------------------------------------------
// 1. GESTIÓN DE ZONAS (Léctura y Persistencia)
// ---------------------------------------------------------------------------
export function getStoredZones(): Zone[] {
  if (typeof window === 'undefined') return INITIAL_ZONES;

  try {
    const raw = localStorage.getItem(ZONES_KEY);
    if (!raw) {
      localStorage.setItem(ZONES_KEY, JSON.stringify(INITIAL_ZONES));
      return INITIAL_ZONES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.error('Error leyendo zonas de localStorage:', e);
  }
  return INITIAL_ZONES;
}

export function saveStoredZones(zones: Zone[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ZONES_KEY, JSON.stringify(zones));
    window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT, { detail: { type: 'zones', zones } }));
  } catch (e) {
    console.error('Error guardando zonas en localStorage:', e);
  }
}

// ---------------------------------------------------------------------------
// 2. GESTIÓN DE TRABAJADORES (Léctura y Persistencia)
// ---------------------------------------------------------------------------
export function getStoredWorkers(): Profile[] {
  if (typeof window === 'undefined') return INITIAL_WORKERS;

  try {
    const raw = localStorage.getItem(WORKERS_KEY);
    if (!raw) {
      localStorage.setItem(WORKERS_KEY, JSON.stringify(INITIAL_WORKERS));
      return INITIAL_WORKERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.error('Error leyendo trabajadores de localStorage:', e);
  }
  return INITIAL_WORKERS;
}

export function saveStoredWorkers(workers: Profile[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WORKERS_KEY, JSON.stringify(workers));
    window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT, { detail: { type: 'workers', workers } }));
  } catch (e) {
    console.error('Error guardando trabajadores en localStorage:', e);
  }
}

// ---------------------------------------------------------------------------
// 3. ACTUALIZACIÓN INTEGRADA DE TRABAJADOR Y ZONA ASOCIADA
// Cuando se modifica un encargado (nombre, teléfono o zona), se actualiza 
// automáticamente la zona asignada para que WhatsApp y catálogo queden 100% sincronizados.
// ---------------------------------------------------------------------------
export async function updateWorkerAndSyncZone(
  updatedWorker: Profile,
  options?: { oldZoneId?: string | null }
): Promise<{ workers: Profile[]; zones: Zone[] }> {
  const currentWorkers = getStoredWorkers();
  const currentZones = getStoredZones();

  // 1. Actualizar o insertar trabajador en la lista
  const workerIndex = currentWorkers.findIndex((w) => w.id === updatedWorker.id);
  let nextWorkers: Profile[];
  if (workerIndex >= 0) {
    nextWorkers = [...currentWorkers];
    nextWorkers[workerIndex] = { ...updatedWorker, updated_at: new Date().toISOString() };
  } else {
    nextWorkers = [updatedWorker, ...currentWorkers];
  }

  // 2. Sincronizar zona asignada
  let nextZones = [...currentZones];
  const newZoneId = updatedWorker.assigned_zone_id;

  if (newZoneId) {
    // Normalizar teléfono WhatsApp (con prefijo 57 de Colombia si no lo tiene)
    const rawPhone = (updatedWorker.phone || '3217147358').replace(/[^0-9]/g, '');
    const formattedPhone = rawPhone.startsWith('57') ? rawPhone : `57${rawPhone}`;

    nextZones = nextZones.map((z) => {
      if (z.id === newZoneId) {
        return {
          ...z,
          contact_phone: formattedPhone,
          manager_name: `${updatedWorker.full_name} (Encargado ${z.name})`,
          updated_at: new Date().toISOString(),
        };
      }
      return z;
    });
  }

  // Guardar en almacenamiento persistente local
  saveStoredWorkers(nextWorkers);
  saveStoredZones(nextZones);

  // Intentar sincronización con Supabase si está disponible
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();

      // Guardar en tabla profiles
      await supabase.from('profiles').upsert({
        id: updatedWorker.id,
        email: updatedWorker.email,
        full_name: updatedWorker.full_name,
        phone: updatedWorker.phone,
        company_name: updatedWorker.company_name || 'Bodega Central Montería',
        city: updatedWorker.city || 'Montería',
        department: updatedWorker.department || 'Córdoba',
        role: updatedWorker.role,
        assigned_zone_id: updatedWorker.assigned_zone_id || null,
        is_active: updatedWorker.is_active,
        updated_at: new Date().toISOString(),
      });

      // Si tiene zona asignada, actualizar la zona en Supabase
      if (newZoneId) {
        const targetZone = nextZones.find((z) => z.id === newZoneId);
        if (targetZone) {
          await supabase.from('zones').update({
            contact_phone: targetZone.contact_phone,
            manager_name: targetZone.manager_name,
            updated_at: new Date().toISOString(),
          }).eq('id', newZoneId);
        }
      }
    } catch (err) {
      console.warn('Sincronización remota con Supabase omitida o fallida:', err);
    }
  }

  // Disparar evento global de sincronización en caliente
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT, { 
      detail: { type: 'all', workers: nextWorkers, zones: nextZones } 
    }));
  }

  return { workers: nextWorkers, zones: nextZones };
}

// ---------------------------------------------------------------------------
// 4. ACTUALIZACIÓN DIRECTA DE ZONA (Celular, Logo, Estado)
// ---------------------------------------------------------------------------
export async function updateZoneAndSyncWorker(
  updatedZone: Zone
): Promise<{ zones: Zone[]; workers: Profile[] }> {
  const currentZones = getStoredZones();
  const currentWorkers = getStoredWorkers();

  // Actualizar zona en la lista
  const nextZones = currentZones.map((z) => (z.id === updatedZone.id ? { ...updatedZone, updated_at: new Date().toISOString() } : z));
  
  // Si la zona cambió de teléfono o encargado, actualizar el trabajador asignado a esa zona
  const nextWorkers = currentWorkers.map((w) => {
    if (w.assigned_zone_id === updatedZone.id) {
      return {
        ...w,
        phone: updatedZone.contact_phone || w.phone,
        updated_at: new Date().toISOString(),
      };
    }
    return w;
  });

  saveStoredZones(nextZones);
  saveStoredWorkers(nextWorkers);

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      await supabase.from('zones').update({
        name: updatedZone.name,
        slug: updatedZone.slug,
        description: updatedZone.description,
        logo_url: updatedZone.logo_url,
        contact_phone: updatedZone.contact_phone,
        manager_name: updatedZone.manager_name,
        is_active: updatedZone.is_active,
        updated_at: new Date().toISOString(),
      }).eq('id', updatedZone.id);
    } catch (err) {
      console.warn('Sincronización de zona con Supabase omitida:', err);
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT, { 
      detail: { type: 'all', workers: nextWorkers, zones: nextZones } 
    }));
  }

  return { zones: nextZones, workers: nextWorkers };
}

// ---------------------------------------------------------------------------
// 5. ELIMINAR TRABAJADOR
// ---------------------------------------------------------------------------
export async function deleteWorker(workerId: string): Promise<{ workers: Profile[]; zones: Zone[] }> {
  const currentWorkers = getStoredWorkers();
  const nextWorkers = currentWorkers.filter((w) => w.id !== workerId);
  saveStoredWorkers(nextWorkers);

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      await supabase.from('profiles').delete().eq('id', workerId);
    } catch (e) {
      console.warn('Error eliminando trabajador en Supabase:', e);
    }
  }

  const currentZones = getStoredZones();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT, { 
      detail: { type: 'all', workers: nextWorkers, zones: currentZones } 
    }));
  }

  return { workers: nextWorkers, zones: currentZones };
}
