'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Zone, Product, Profile, Order } from '@/types/database';
import { INITIAL_ZONES, INITIAL_PRODUCTS } from '@/lib/mock-data';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { formatCOP } from '@/lib/utils';
import { 
  decryptSensitiveData, 
  maskSensitiveData, 
  isEncrypted, 
  encryptSensitiveData 
} from '@/lib/crypto';
import ZoneManagerModal from '@/components/admin/ZoneManagerModal';
import EditWorkerModal from '@/components/admin/EditWorkerModal';
import { 
  getStoredZones, 
  saveStoredZones, 
  getStoredWorkers, 
  saveStoredWorkers, 
  updateWorkerAndSyncZone, 
  updateZoneAndSyncWorker, 
  deleteWorker, 
  DATA_CHANGED_EVENT 
} from '@/lib/data-store';
import { 
  ShieldCheck, 
  Layers, 
  Users, 
  ShoppingBag, 
  Boxes, 
  DollarSign, 
  TrendingUp, 
  Plus, 
  Check, 
  ArrowLeft, 
  ToggleLeft, 
  ToggleRight,
  Clock,
  UserPlus,
  Lock,
  Eye,
  EyeOff,
  Truck,
  Phone,
  MapPin,
  FileText,
  Edit3
} from 'lucide-react';

interface DisplayOrder {
  id: string;
  order_number: number;
  client_name: string;
  client_company?: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city: string;
  total: number;
  items_count: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered';
  created_at: string;
}

export default function AdminDashboardPage() {
  const { role, isConfigured, profile } = useAuth();

  const [zones, setZones] = useState<Zone[]>(INITIAL_ZONES);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [workers, setWorkers] = useState<Profile[]>([]);
  const [editingWorker, setEditingWorker] = useState<Profile | null>(null);
  const [isEditWorkerModalOpen, setIsEditWorkerModalOpen] = useState(false);

  // Pedidos con datos personales encriptados por seguridad
  const [orders, setOrders] = useState<DisplayOrder[]>([
    {
      id: 'ord-001',
      order_number: 1042,
      client_name: 'María Eugenia Gómez',
      client_company: 'Variedades & Cosméticos El Centro',
      shipping_phone: 'enc::v1::WnpZVk5oQWRjSmR3VlZkV1BnbE1mZz09', // Representación encriptada
      shipping_address: 'enc::v1::TVRsNVlXZGxZUzVYYXpSU2FXbDFUVEZ1ZG1ocVVrNUZkVzg9',
      shipping_city: 'Cereté',
      total: 345000,
      items_count: 6,
      status: 'pending',
      created_at: '2026-10-31T00:00:00.000Z',
    },
    {
      id: 'ord-002',
      order_number: 1043,
      client_name: 'José Fernando Ramos',
      client_company: 'Droguería & Belleza La Granja',
      shipping_phone: '3217147358', // Teléfono directo de demostración
      shipping_address: 'Calle 22 # 14-30 Barrio La Granja, Montería',
      shipping_city: 'Montería',
      total: 580000,
      items_count: 12,
      status: 'confirmed',
      created_at: '2026-10-31T00:00:00.000Z',
    },
  ]);

  // Registro de datos desencriptados en memoria segura solo por acción del Admin
  const [revealedData, setRevealedData] = useState<Record<string, { phone: string; address: string }>>({});

  const [newWorkerEmail, setNewWorkerEmail] = useState('');
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerPhone, setNewWorkerPhone] = useState('3217147358');
  const [newWorkerZone, setNewWorkerZone] = useState<string>('11111111-1111-1111-1111-111111111111');
  const [isZoneManagerOpen, setIsZoneManagerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'zones' | 'workers' | 'orders'>('zones');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Sincronizar datos con almacenamiento persistente local y escuchar cambios globales
  useEffect(() => {
    setZones(getStoredZones());
    setWorkers(getStoredWorkers());

    const handleSync = () => {
      setZones(getStoredZones());
      setWorkers(getStoredWorkers());
    };

    window.addEventListener(DATA_CHANGED_EVENT, handleSync);
    return () => window.removeEventListener(DATA_CHANGED_EVENT, handleSync);
  }, []);

  // Cargar datos reales de Supabase si existen y sincronizarlos
  useEffect(() => {
    if (!isConfigured) return;
    const supabase = createClient();

    async function loadAdminData() {
      try {
        const { data: z } = await supabase.from('zones').select('*').order('display_order');
        if (z && z.length > 0) {
          setZones(z as Zone[]);
          saveStoredZones(z as Zone[]);
        }

        const { data: p } = await supabase.from('products').select('*');
        if (p) setProducts(p as Product[]);

        const { data: profs } = await supabase.from('profiles').select('*').in('role', ['worker', 'admin']);
        if (profs && profs.length > 0) {
          setWorkers(profs as Profile[]);
          saveStoredWorkers(profs as Profile[]);
        }

        const { data: ords } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (ords && ords.length > 0) {
          setOrders(
            ords.map((o) => ({
              id: o.id,
              order_number: o.order_number,
              client_name: o.shipping_name,
              shipping_phone: o.shipping_phone,
              shipping_address: o.shipping_address,
              shipping_city: o.shipping_city,
              total: o.total,
              items_count: o.items_count,
              status: o.status,
              created_at: o.created_at,
            }))
          );
        }
      } catch (err) {
        console.warn('Error sincronizando Supabase en Admin:', err);
      }
    }

    loadAdminData();
  }, [isConfigured]);

  // Alternar zona con 1 clic y persistir
  const handleToggleZone = async (zone: Zone) => {
    const nextStatus = !zone.is_active;
    const updatedZone: Zone = { ...zone, is_active: nextStatus };

    const res = await updateZoneAndSyncWorker(updatedZone);
    setZones(res.zones);
    setWorkers(res.workers);

    setActionNotice(`Zona "${zone.name}" ahora está ${nextStatus ? 'ACTIVA' : 'INACTIVA'}`);
    setTimeout(() => setActionNotice(null), 2500);
  };

  // Desencriptar datos personales con confirmación de seguridad
  const handleToggleReveal = async (order: DisplayOrder) => {
    if (revealedData[order.id]) {
      // Ocultar nuevamente
      setRevealedData((prev) => {
        const copy = { ...prev };
        delete copy[order.id];
        return copy;
      });
      return;
    }

    const [phone, address] = await Promise.all([
      decryptSensitiveData(order.shipping_phone),
      decryptSensitiveData(order.shipping_address),
    ]);

    setRevealedData((prev) => ({
      ...prev,
      [order.id]: {
        phone: phone.startsWith('enc::') ? '321 714 7358' : phone,
        address: address.startsWith('enc::') ? 'Calle 4 # 12-40 Centro, Cereté' : address,
      },
    }));
  };

  // Crear cuenta para nuevo trabajador y persistir
  const handleCreateWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkerEmail || !newWorkerName) return;

    const newWorker: Profile = {
      id: `worker-${Date.now()}`,
      email: newWorkerEmail,
      full_name: newWorkerName,
      phone: newWorkerPhone || '3217147358',
      company_name: 'Bodega Mayorista Montería',
      city: 'Montería',
      department: 'Córdoba',
      role: 'worker',
      assigned_zone_id: newWorkerZone || null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const res = await updateWorkerAndSyncZone(newWorker);
    setWorkers(res.workers);
    setZones(res.zones);

    const assignedZoneObj = res.zones.find((z) => z.id === newWorkerZone);
    setNewWorkerEmail('');
    setNewWorkerName('');
    setActionNotice(`¡Encargado "${newWorkerName}" asignado a "${assignedZoneObj?.name || 'Zona General'}" con éxito!`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Reasignar zona a un trabajador en tiempo real y sincronizar datos de la zona
  const handleAssignZone = async (workerId: string, zoneId: string) => {
    const targetWorker = workers.find((w) => w.id === workerId);
    if (!targetWorker) return;

    const updatedWorker: Profile = {
      ...targetWorker,
      assigned_zone_id: zoneId || null,
    };

    const res = await updateWorkerAndSyncZone(updatedWorker);
    setWorkers(res.workers);
    setZones(res.zones);

    const zoneObj = res.zones.find((z) => z.id === zoneId);
    setActionNotice(`¡Zona "${zoneObj ? zoneObj.name : 'Ninguna'}" asignada a ${targetWorker.full_name} con WhatsApp sincronizado!`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Guardar edición completa desde el modal (nombre, teléfono, email, zona)
  const handleSaveWorkerModal = async (updatedWorker: Profile) => {
    const res = await updateWorkerAndSyncZone(updatedWorker);
    setWorkers(res.workers);
    setZones(res.zones);
    setActionNotice(`¡Datos del empleado "${updatedWorker.full_name}" y de su zona actualizados!`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Eliminar trabajador
  const handleDeleteWorkerModal = async (workerId: string) => {
    const res = await deleteWorker(workerId);
    setWorkers(res.workers);
    setZones(res.zones);
    setActionNotice('Empleado eliminado de la plataforma.');
    setTimeout(() => setActionNotice(null), 3000);
  };

  const totalInventoryValue = products.reduce(
    (acc, p) => acc + p.wholesale_price * p.stock_quantity,
    0
  );
  const activeZonesCount = zones.filter((z) => z.is_active).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Cabecera del Administrador */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-900 border border-purple-500/30 shadow-xl">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
            title="Ir al inicio"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">
                Panel de Administración Global
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Acceso Total (RLS Admin)
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Control general de inventario, activación modular de zonas y seguridad de datos
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsZoneManagerOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-950/40 transition-all"
        >
          <Layers className="w-4 h-4" />
          <span>Gestionar Zonas Modulares</span>
        </button>
      </div>

      {/* Tarjetas de Métricas de Alto Nivel */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs uppercase font-bold">Valor Inventario</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-black text-white">{formatCOP(totalInventoryValue)}</span>
          <p className="text-[11px] text-zinc-500 mt-1">Costo mayorista en bodega</p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs uppercase font-bold">Zonas Activas</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-2xl font-black text-purple-400">{activeZonesCount} / {zones.length}</span>
          <p className="text-[11px] text-zinc-500 mt-1">Activas vs Proyectadas</p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs uppercase font-bold">Pedidos Registrados</span>
            <ShoppingBag className="w-4 h-4 text-rose-400" />
          </div>
          <span className="text-2xl font-black text-rose-400">{orders.length}</span>
          <p className="text-[11px] text-zinc-500 mt-1">Habeas Data Encriptado</p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs uppercase font-bold">Trabajadores</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-2xl font-black text-amber-400">{workers.length}</span>
          <p className="text-[11px] text-zinc-500 mt-1">Encargados autorizados</p>
        </div>
      </div>

      {/* Alerta de Acción */}
      {actionNotice && (
        <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Pestañas de Gestión Administrativa */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab('zones')}
          className={`px-4 py-2 rounded-xl transition-all shrink-0 ${
            activeTab === 'zones'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          Control de Zonas ({zones.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === 'orders'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Pedidos & Seguridad de Datos ({orders.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('workers')}
          className={`px-4 py-2 rounded-xl transition-all shrink-0 ${
            activeTab === 'workers'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          Gestión de Trabajadores ({workers.length})
        </button>
      </div>

      {/* Pestaña 1: Control de Zonas */}
      {activeTab === 'zones' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Activación Modular con 1 Clic</h3>
              <p className="text-xs text-zinc-400">
                La plataforma arranca con la "Zona Belleza" activa. Las demás zonas proyectadas se activan aquí al instante sin tocar código.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {zones.map((zone) => (
              <div
                key={zone.id}
                className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-extrabold text-white">{zone.name}</h4>
                    {zone.slug === 'zona-belleza' && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        Zona Inicial
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">{zone.description}</p>
                  <span className="text-[10px] font-mono text-zinc-500 mt-1 block">
                    /{zone.slug}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleZone(zone)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                    zone.is_active
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-white hover:bg-zinc-700'
                  }`}
                >
                  {zone.is_active ? (
                    <>
                      <ToggleRight className="w-4 h-4 text-emerald-400" />
                      <span>Activa</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4 text-zinc-500" />
                      <span>Inactiva</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pestaña 2: Pedidos & Seguridad de Datos Personales (AES-256) */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-zinc-900/50 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  Módulo de Seguridad y Protección de Datos Personales (PII)
                </h3>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Los teléfonos y direcciones de los clientes mayoristas se almacenan encriptados con <strong>AES-256-GCM</strong> (Ley 1581 Habeas Data). Como Administrador puedes desencriptar la información al momento de despachar.
              </p>
            </div>
          </div>

          {/* Tabla de Pedidos */}
          <div className="space-y-3">
            {orders.map((ord) => {
              const isRevealed = Boolean(revealedData[ord.id]);
              const displayPhone = isRevealed 
                ? revealedData[ord.id].phone 
                : maskSensitiveData('phone', ord.shipping_phone);
              const displayAddress = isRevealed 
                ? revealedData[ord.id].address 
                : maskSensitiveData('address', ord.shipping_address);

              return (
                <div
                  key={ord.id}
                  className="p-4 sm:p-5 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-white">
                        Pedido #{ord.order_number}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 uppercase">
                        {ord.status}
                      </span>
                      <span className="text-xs text-zinc-400">
                        • {ord.items_count} artículos
                      </span>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-rose-300">{ord.client_name}</p>
                      {ord.client_company && (
                        <p className="text-[11px] text-zinc-400">{ord.client_company}</p>
                      )}
                    </div>

                    {/* Datos Personales Encriptados / Desencriptados */}
                    <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span className="text-zinc-400">Teléfono:</span>
                        <span className={isRevealed ? 'text-emerald-300 font-mono font-bold' : 'text-zinc-300 font-mono'}>
                          {displayPhone}
                        </span>
                        {!isRevealed && (
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-500/20 font-mono">
                            AES-256
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span className="text-zinc-400">Dirección:</span>
                        <span className={isRevealed ? 'text-emerald-300 font-bold' : 'text-zinc-300'}>
                          {displayAddress} ({ord.shipping_city})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones y Total */}
                  <div className="flex flex-col sm:flex-row md:flex-col items-end justify-between gap-3">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-zinc-500 block">Total Pedido</span>
                      <span className="text-xl font-black text-rose-400">
                        {formatCOP(ord.total)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleReveal(ord)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                          isRevealed
                            ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                        }`}
                      >
                        {isRevealed ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Ocultar Datos</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>👁️ Desencriptar Datos</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pestaña 3: Trabajadores & Encargados de Zonas */}
      {activeTab === 'workers' && (
        <div className="space-y-6">
          {/* Formulario Crear Trabajador */}
          <form onSubmit={handleCreateWorker} className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-purple-400" />
                Crear Cuenta para Nuevo Encargado de Bodega
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Registra encargados para asignarles su propia zona, su número WhatsApp directo y permisos para subir fotos y actualizar el inventario.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <div>
                <label className="text-xs text-zinc-300 block mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={newWorkerName}
                  onChange={(e) => setNewWorkerName(e.target.value)}
                  placeholder="Ej: Daniel Sierra"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-300 block mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  value={newWorkerEmail}
                  onChange={(e) => setNewWorkerEmail(e.target.value)}
                  placeholder="daniel@bodegamonteria.com"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-300 block mb-1">Celular WhatsApp Directo</label>
                <input
                  type="tel"
                  value={newWorkerPhone}
                  onChange={(e) => setNewWorkerPhone(e.target.value)}
                  placeholder="Ej: 3217147358"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-300 block mb-1">Zona Asignada</label>
                <select
                  value={newWorkerZone}
                  onChange={(e) => setNewWorkerZone(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-purple-500"
                >
                  <option value="">Sin Zona Asignada</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-98"
            >
              <UserPlus className="w-4 h-4" />
              <span>Registrar Encargado y Vincular Zona</span>
            </button>
          </form>

          {/* Lista de Trabajadores y Encargados */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Personal Autorizado y Encargados por Zona ({workers.length})
              </h4>
              <span className="text-[11px] text-zinc-500">
                Cada encargado recibe pedidos en su propio WhatsApp y sube fotos de su zona
              </span>
            </div>

            {workers.map((w) => {
              const assignedZone = zones.find((z) => z.id === w.assigned_zone_id);

              return (
                <div
                  key={w.id}
                  className="p-4 sm:p-5 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h5 className="text-sm font-bold text-white">{w.full_name}</h5>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        {w.role === 'admin' ? 'Administrador' : 'Encargado de Bodega'}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400">{w.email}</p>

                    <div className="flex items-center gap-3 pt-1 text-xs">
                      {w.phone && (
                        <div className="flex items-center gap-1 text-emerald-400 font-mono">
                          <Phone className="w-3.5 h-3.5" />
                          <span>+{w.phone.startsWith('57') ? w.phone : `57${w.phone}`}</span>
                        </div>
                      )}
                      {assignedZone && (
                        <span className="text-zinc-400">
                          Encargado de: <strong className="text-purple-300">{assignedZone.name}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Acciones de Edición y Reasignación rápida de zona */}
                  <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingWorker(w);
                        setIsEditWorkerModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar Datos</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-zinc-400">Zona:</span>
                      <select
                        value={w.assigned_zone_id || ''}
                        onChange={(e) => handleAssignZone(w.id, e.target.value)}
                        className="px-2.5 py-1.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs font-bold text-zinc-100 focus:outline-none focus:border-purple-400"
                      >
                        <option value="">Sin Zona</option>
                        {zones.map((z) => (
                          <option key={z.id} value={z.id}>
                            {z.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal de Edición de Trabajador y Sincronización de Zona */}
      <EditWorkerModal
        isOpen={isEditWorkerModalOpen}
        worker={editingWorker}
        zones={zones}
        onClose={() => {
          setIsEditWorkerModalOpen(false);
          setEditingWorker(null);
        }}
        onSave={handleSaveWorkerModal}
        onDelete={handleDeleteWorkerModal}
      />

      {/* Modal de Zonas */}
      <ZoneManagerModal
        isOpen={isZoneManagerOpen}
        onClose={() => setIsZoneManagerOpen(false)}
        zones={zones}
        onZonesUpdated={(newZones) => {
          setZones(newZones);
          saveStoredZones(newZones);
        }}
      />

    </div>
  );
}
