'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Product, Zone, Category } from '@/types/database';
import { INITIAL_PRODUCTS, INITIAL_ZONES, INITIAL_CATEGORIES } from '@/lib/mock-data';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { formatCOP } from '@/lib/utils';
import ProductUploadModal from '@/components/worker/ProductUploadModal';
import { 
  getStoredZones, 
  saveStoredZones, 
  updateZoneAndSyncWorker, 
  DATA_CHANGED_EVENT 
} from '@/lib/data-store';
import { 
  Boxes, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Check, 
  Camera, 
  TrendingUp, 
  AlertTriangle, 
  ShieldCheck, 
  ArrowLeft,
  Sparkles,
  Phone,
  Image as ImageIcon,
  Save,
  Layers,
  Settings
} from 'lucide-react';

export default function WorkerPanelPage() {
  const { role, isConfigured, profile } = useAuth();

  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [zones, setZones] = useState<Zone[]>(INITIAL_ZONES);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Pestaña activa del panel del trabajador
  const [workerTab, setWorkerTab] = useState<'inventory' | 'zone-config'>('inventory');

  // Estado para gestión de datos y logo de la zona por parte del encargado
  const [managedZoneId, setManagedZoneId] = useState<string>(zones[0]?.id || '11111111-1111-1111-1111-111111111111');
  const selectedZone = zones.find((z) => z.id === managedZoneId) || zones[0];

  const [zonePhone, setZonePhone] = useState(selectedZone?.contact_phone || '573217147358');
  const [zoneManager, setZoneManager] = useState(selectedZone?.manager_name || 'Andrés López (Encargado Zona Belleza)');
  const [zoneLogo, setZoneLogo] = useState(selectedZone?.logo_url || '');
  const [zoneDesc, setZoneDesc] = useState(selectedZone?.description || '');
  const [isSavingZone, setIsSavingZone] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Sincronizar campos al cambiar de zona gestionada
  useEffect(() => {
    if (selectedZone) {
      setZonePhone(selectedZone.contact_phone || '573217147358');
      setZoneManager(selectedZone.manager_name || '');
      setZoneLogo(selectedZone.logo_url || '');
      setZoneDesc(selectedZone.description || '');
    }
  }, [managedZoneId, zones]);

  // Sincronizar datos con almacenamiento local y escuchar cambios globales
  useEffect(() => {
    setZones(getStoredZones());

    const handleSync = () => {
      setZones(getStoredZones());
    };

    window.addEventListener(DATA_CHANGED_EVENT, handleSync);
    return () => window.removeEventListener(DATA_CHANGED_EVENT, handleSync);
  }, []);

  // Cargar datos reales de Supabase
  useEffect(() => {
    if (!isConfigured) return;

    const supabase = createClient();
    async function load() {
      try {
        const { data: p } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (p) setProducts(p as Product[]);

        const { data: z } = await supabase.from('zones').select('*').order('display_order');
        if (z && z.length > 0) {
          setZones(z as Zone[]);
          saveStoredZones(z as Zone[]);
        }

        const { data: c } = await supabase.from('categories').select('*');
        if (c) setCategories(c as Category[]);
      } catch (e) {
        console.warn('Error cargando Supabase en WorkerPanel:', e);
      }
    }
    load();
  }, [isConfigured]);

  // Subir nuevo logo de la zona (cámara o archivo)
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsUploadingLogo(true);

    try {
      if (isConfigured) {
        const supabase = createClient();
        const fileExt = file.name.split('.').pop();
        const fileName = `logos/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(fileName, file, { cacheControl: '3600', upsert: false });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(fileName);

        setZoneLogo(publicUrl);
      } else {
        const localPreview = URL.createObjectURL(file);
        setZoneLogo(localPreview);
      }
      setSavedNotice('Logo cargado correctamente. Presiona guardar para confirmar.');
      setTimeout(() => setSavedNotice(null), 3000);
    } catch (err: any) {
      alert('Error subiendo logo: ' + err.message);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Guardar cambios de la zona (Celular, Logo, Encargado) con persistencia total
  const handleSaveZoneDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingZone(true);

    try {
      const updatedZone: Zone = {
        ...selectedZone,
        contact_phone: zonePhone,
        manager_name: zoneManager,
        logo_url: zoneLogo,
        description: zoneDesc,
        updated_at: new Date().toISOString(),
      };

      const res = await updateZoneAndSyncWorker(updatedZone);
      setZones(res.zones);

      setSavedNotice(`¡Datos de ${selectedZone?.name} y su WhatsApp actualizados exitosamente!`);
      setTimeout(() => setSavedNotice(null), 3000);
    } catch (err: any) {
      alert('Error guardando datos de la zona: ' + err.message);
    } finally {
      setIsSavingZone(false);
    }
  };

  // Actualización rápida de stock en tiempo real
  const handleQuickStockUpdate = async (productId: string, newStock: number) => {
    const validStock = Math.max(0, newStock);

    try {
      if (isConfigured) {
        const supabase = createClient();
        await supabase
          .from('products')
          .update({ 
            stock_quantity: validStock,
            is_available: validStock > 0 
          })
          .eq('id', productId);
      }

      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, stock_quantity: validStock, is_available: validStock > 0 } : p
        )
      );

      setSavedNotice('Stock actualizado en tiempo real');
      setTimeout(() => setSavedNotice(null), 2000);
    } catch (e: any) {
      alert('Error actualizando stock: ' + e.message);
    }
  };

  // Eliminación rápida de producto
  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`¿Eliminar el producto "${product.name}" de la bodega?`)) return;

    try {
      if (isConfigured) {
        const supabase = createClient();
        const { error } = await supabase.from('products').delete().eq('id', product.id);
        if (error) throw error;
      }

      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      setSavedNotice(`"${product.name}" eliminado del catálogo`);
      setTimeout(() => setSavedNotice(null), 2500);
    } catch (e: any) {
      alert('Error eliminando producto: ' + e.message);
    }
  };

  const handleProductSaved = (saved: Product) => {
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
    setSavedNotice(editingProduct ? 'Producto actualizado' : 'Producto subido al catálogo con éxito');
    setTimeout(() => setSavedNotice(null), 3000);
    setEditingProduct(null);
  };

  const filteredProducts = products.filter((p) => {
    const matchesZone = selectedZoneId === 'all' || p.zone_id === selectedZoneId;
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase());
    return matchesZone && matchesSearch;
  });

  const totalStockCount = products.reduce((acc, p) => acc + p.stock_quantity, 0);
  const lowStockCount = products.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= 15).length;
  const outOfStockCount = products.filter((p) => p.stock_quantity <= 0).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Barra Superior con Acceso Rápido y Saludo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl bg-zinc-900 border border-zinc-800">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
            title="Volver a la tienda"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-white">
                Panel Encargados de Bodega
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Móvil & PC
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              {profile?.full_name || 'Encargado'} • Sube fotos, actualiza stock y gestiona los datos de tu zona
            </p>
          </div>
        </div>

        {/* Botón Principal: Cargar Producto */}
        <button
          onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
          className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-950/40 active:scale-98 transition-all"
        >
          <Camera className="w-4 h-4" />
          <span>+ Cargar Producto con Foto</span>
        </button>
      </div>

      {/* Pestañas de Trabajo del Encargado */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 text-xs font-bold">
        <button
          onClick={() => setWorkerTab('inventory')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
            workerTab === 'inventory'
              ? 'bg-amber-500 text-zinc-950 shadow-md font-extrabold'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Inventario & Stock Físico</span>
        </button>

        <button
          onClick={() => setWorkerTab('zone-config')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
            workerTab === 'zone-config'
              ? 'bg-amber-500 text-zinc-950 shadow-md font-extrabold'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Mi Zona Asignada (Celular & Logo Propio)</span>
        </button>
      </div>

      {/* Alerta de Éxito / Feedback */}
      {savedNotice && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 2: GESTIÓN DE LA ZONA (CELULAR PROPIO Y LOGO DE LA ZONA) */}
      {/* ========================================================================= */}
      {workerTab === 'zone-config' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Configurar Datos, Celular WhatsApp y Logo de tu Zona
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Cada zona tiene su propio número WhatsApp para recibir pedidos directos y su logo representativo.
              </p>
            </div>

            {/* Selector de la zona a configurar */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 font-semibold">Seleccionar Zona:</span>
              <select
                value={managedZoneId}
                onChange={(e) => setManagedZoneId(e.target.value)}
                className="px-3 py-1.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-400"
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <form onSubmit={handleSaveZoneDetails} className="space-y-5">
            {/* Logo Propio de la Zona */}
            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-2">
                Logo de la {selectedZone?.name} (Se muestra en pestañas y catálogo)
              </label>

              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-amber-500/40 bg-zinc-950 flex items-center justify-center shrink-0">
                  {zoneLogo ? (
                    <img src={zoneLogo} alt="Logo de la zona" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-zinc-600" />
                  )}
                </div>

                <div className="space-y-2">
                  <label className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-amber-300 border border-zinc-700 cursor-pointer inline-flex items-center gap-2 transition-colors">
                    <Camera className="w-4 h-4" />
                    <span>{isUploadingLogo ? 'Subiendo...' : 'Tomar Foto / Subir Logo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={isUploadingLogo}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-zinc-500">
                    Sube una imagen cuadrada (PNG, JPG o WebP) que identifique la categoría.
                  </p>
                </div>
              </div>
            </div>

            {/* Teléfono Celular WhatsApp y Nombre del Encargado */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-amber-400 block mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  Número Celular WhatsApp de esta Zona *
                </label>
                <input
                  type="text"
                  required
                  value={zonePhone}
                  onChange={(e) => setZonePhone(e.target.value)}
                  placeholder="Ej: 573217147358"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-white font-mono font-bold focus:outline-none focus:border-amber-400"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  Los pedidos mayoristas de esta zona se enviarán directamente a este WhatsApp.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                  Nombre del Encargado Responsable *
                </label>
                <input
                  type="text"
                  required
                  value={zoneManager}
                  onChange={(e) => setZoneManager(e.target.value)}
                  placeholder="Ej: Andrés López"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Descripción comercial de la zona */}
            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                Descripción Comercial de la Zona
              </label>
              <textarea
                rows={2}
                value={zoneDesc}
                onChange={(e) => setZoneDesc(e.target.value)}
                placeholder="Breve resumen de las marcas y referencias disponibles en esta zona..."
                className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-400 resize-none"
              />
            </div>

            {/* Botón Guardar Cambios */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSavingZone}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-950/40 transition-all active:scale-98 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingZone ? 'Guardando...' : `Guardar Datos de ${selectedZone?.name}`}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 1: INVENTARIO, STOCK Y SUBIDA DE ARTÍCULOS */}
      {/* ========================================================================= */}
      {workerTab === 'inventory' && (
        <>
          {/* Tarjetas de Métricas Rápidas de Inventario */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Total Referencias</span>
              <span className="text-2xl font-black text-white">{products.length}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Unidades Físicas</span>
              <span className="text-2xl font-black text-amber-400">{totalStockCount}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Bajo Stock (&lt;15)</span>
              <span className="text-2xl font-black text-orange-400">{lowStockCount}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Agotados</span>
              <span className="text-2xl font-black text-rose-400">{outOfStockCount}</span>
            </div>
          </div>

          {/* Filtros y Búsqueda */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o SKU para editar..."
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <select
              value={selectedZoneId}
              onChange={(e) => setSelectedZoneId(e.target.value)}
              className="px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-amber-400"
            >
              <option value="all">Todas las Zonas</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>

          {/* Lista de Productos para Gestión Rápida */}
          <div className="space-y-3">
            {filteredProducts.map((p) => {
              const zoneObj = zones.find((z) => z.id === p.zone_id);

              return (
                <div
                  key={p.id}
                  className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                >
                  {/* Info e Imagen */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={p.images?.[0] || 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=200&q=80'}
                      alt={p.name}
                      className="w-16 h-16 rounded-xl object-cover bg-zinc-950 shrink-0 border border-zinc-800"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-zinc-400 uppercase">
                          {p.sku || 'SIN SKU'}
                        </span>
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-zinc-800 text-zinc-300">
                          {zoneObj?.name || 'Zona General'}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white truncate mt-0.5">
                        {p.name}
                      </h3>
                      <div className="flex items-center gap-3 text-xs mt-1">
                        <span className="font-extrabold text-rose-400">
                          {formatCOP(p.wholesale_price)} Mayorista
                        </span>
                        {p.suggested_retail_price && (
                          <span className="text-zinc-500 text-[11px]">
                            P.V.P: {formatCOP(p.suggested_retail_price)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Controles de Stock y Acciones Rápidas */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800">
                    
                    {/* Stepper de Stock en Tiempo Real */}
                    <div className="flex items-center gap-2 bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800">
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold">Stock:</span>
                      <button
                        onClick={() => handleQuickStockUpdate(p.id, p.stock_quantity - 1)}
                        className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center justify-center text-xs"
                        title="Reducir stock"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-xs font-black text-white">
                        {p.stock_quantity}
                      </span>
                      <button
                        onClick={() => handleQuickStockUpdate(p.id, p.stock_quantity + 1)}
                        className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center justify-center text-xs"
                        title="Aumentar stock"
                      >
                        +
                      </button>
                    </div>

                    {/* Botón Editar Completo */}
                    <button
                      onClick={() => { setEditingProduct(p); setIsModalOpen(true); }}
                      className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 transition-colors"
                      title="Editar detalles y fotos"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Botón Eliminar */}
                    <button
                      onClick={() => handleDeleteProduct(p)}
                      className="p-2.5 rounded-xl bg-zinc-800 hover:bg-rose-500/20 text-rose-400 transition-colors"
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modal para crear/editar productos */}
      <ProductUploadModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingProduct(null); }}
        zones={zones}
        categories={categories}
        productToEdit={editingProduct}
        onProductSaved={handleProductSaved}
      />

    </div>
  );
}
