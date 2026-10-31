'use client';

import React, { useState, useEffect } from 'react';
import { Zone, Category, Product } from '@/types/database';
import { INITIAL_ZONES, INITIAL_CATEGORIES, INITIAL_PRODUCTS } from '@/lib/mock-data';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import ZoneTabs from '@/components/catalog/ZoneTabs';
import ProductCard from '@/components/catalog/ProductCard';
import ProductUploadModal from '@/components/worker/ProductUploadModal';
import ZoneManagerModal from '@/components/admin/ZoneManagerModal';
import { 
  getStoredZones, 
  saveStoredZones, 
  DATA_CHANGED_EVENT 
} from '@/lib/data-store';
import LoginGate from '@/components/auth/LoginGate';
import { 
  Search, 
  Sparkles, 
  TrendingUp, 
  Filter, 
  Plus, 
  ShieldCheck, 
  Truck, 
  ShoppingBag,
  Info,
  Smartphone,
  Package,
  Phone
} from 'lucide-react';

export default function HomePage() {
  const { role, isConfigured, isAuthenticated, isLoading: authLoading } = useAuth();

  const [zones, setZones] = useState<Zone[]>(INITIAL_ZONES);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [activeZoneSlug, setActiveZoneSlug] = useState<string>('zona-belleza');
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isZoneManagerOpen, setIsZoneManagerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Sincronizar datos con almacenamiento local y escuchar cambios globales en caliente
  useEffect(() => {
    setZones(getStoredZones());

    const handleSync = () => {
      setZones(getStoredZones());
    };

    window.addEventListener(DATA_CHANGED_EVENT, handleSync);
    return () => window.removeEventListener(DATA_CHANGED_EVENT, handleSync);
  }, []);

  // Cargar datos desde Supabase si está configurado
  useEffect(() => {
    if (!isConfigured) return;

    const supabase = createClient();

    async function fetchData() {
      setIsLoading(true);
      try {
        // Cargar Zonas
        const { data: zonesData } = await supabase
          .from('zones')
          .select('*')
          .order('display_order', { ascending: true });

        if (zonesData && zonesData.length > 0) {
          setZones(zonesData as Zone[]);
          saveStoredZones(zonesData as Zone[]);
        }

        // Cargar Categorías
        const { data: catData } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (catData && catData.length > 0) {
          setCategories(catData as Category[]);
        }

        // Cargar Productos
        const { data: prodData } = await supabase
          .from('products')
          .select('*, zone:zones(*), category:categories(*)')
          .order('created_at', { ascending: false });

        if (prodData && prodData.length > 0) {
          setProducts(prodData as Product[]);
        }
      } catch (err) {
        console.error('Error cargando catálogo desde Supabase:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [isConfigured]);

  const activeZone = zones.find((z) => z.slug === activeZoneSlug) || zones[0];

  // Filtrar categorías que pertenecen a la zona activa
  const filteredCategories = categories.filter((c) => c.zone_id === activeZone?.id);

  // Filtrar productos por zona, categoría seleccionada y término de búsqueda
  const filteredProducts = products.filter((p) => {
    const matchesZone = p.zone_id === activeZone?.id;
    const matchesCategory =
      selectedCategorySlug === 'all' ||
      categories.find((c) => c.id === p.category_id)?.slug === selectedCategorySlug;
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesZone && matchesCategory && matchesSearch;
  });

  const handleProductSaved = (savedProduct: Product) => {
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === savedProduct.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = savedProduct;
        return copy;
      }
      return [savedProduct, ...prev];
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Si no ha iniciado sesión, mostrar primero el Inicio de Sesión / Portal de Ingreso
  if (!isAuthenticated) {
    return <LoginGate />;
  }

  return (
    <div className="min-h-screen pb-16">
      
      {/* Hero Banner Mayorista */}
      <section className="relative overflow-hidden bg-gradient-to-b from-zinc-900 to-zinc-950 border-b border-zinc-800/80 py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        {/* Glow decorativo de fondo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-64 bg-gradient-to-r from-rose-600/20 via-pink-600/10 to-amber-600/20 blur-3xl rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Distribución Mayorista B2B en Montería, Córdoba</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto">
            Surtido Mayorista de Alta Rotación con{' '}
            <span className="bg-gradient-to-r from-rose-400 via-pink-500 to-amber-400 bg-clip-text text-transparent">
              Margen Superior al 50%
            </span>
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Abastécete con precios de importador directo. Cosméticos, cuidado capilar, tecnología y variedades listas para despachar en Montería y municipios aledaños.
          </p>

          {/* Badges de Garantía Comercial */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-zinc-300 font-medium">
            <div className="flex items-center gap-1.5 bg-zinc-900/80 px-3 py-1.5 rounded-xl border border-zinc-800">
              <Truck className="w-4 h-4 text-emerald-400" />
              <span>Despachos diarios en Montería</span>
            </div>
            <div className="flex items-center gap-1.5 bg-zinc-900/80 px-3 py-1.5 rounded-xl border border-zinc-800">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>Precios por caja y docena</span>
            </div>
            <div className="flex items-center gap-1.5 bg-zinc-900/80 px-3 py-1.5 rounded-xl border border-zinc-800">
              <ShieldCheck className="w-4 h-4 text-rose-400" />
              <span>Atención directa para comerciantes</span>
            </div>
          </div>
        </div>
      </section>

      {/* Contenedor Principal del Catálogo */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        
        {/* Selector de Zonas Modulares */}
        <div className="bg-zinc-900/60 p-4 sm:p-5 rounded-2xl border border-zinc-800/90 shadow-sm">
          <ZoneTabs
            zones={zones}
            activeZoneSlug={activeZoneSlug}
            onSelectZone={(slug) => {
              setActiveZoneSlug(slug);
              setSelectedCategorySlug('all');
            }}
            onOpenZoneManager={() => setIsZoneManagerOpen(true)}
            isAdmin={role === 'admin'}
          />
        </div>

        {/* Encabezado de la Zona Seleccionada con Logo Propio y Contacto del Encargado */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 shadow-md">
          <div className="flex items-start sm:items-center gap-4">
            {activeZone?.logo_url ? (
              <img
                src={activeZone.logo_url}
                alt={activeZone.name}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-rose-500/30 shadow-lg shadow-rose-950/20 shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center text-rose-400 border border-zinc-700 shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  {activeZone?.name}
                </h2>
                {activeZone?.is_active ? (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Zona Activa
                  </span>
                ) : (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                    Próximamente
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-1 max-w-xl">
                {activeZone?.description}
              </p>

              {/* Celular y Contacto Directo del Encargado de esta Zona */}
              {activeZone?.contact_phone && (
                <div className="flex items-center gap-2 mt-2.5">
                  <a
                    href={`https://wa.me/${activeZone.contact_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola, me comunico por productos de la ${activeZone.name} de Bodega Mayorista Montería`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>WhatsApp Encargado: +{activeZone.contact_phone}</span>
                    <span className="text-[10px] text-zinc-400">({activeZone.manager_name || 'Asesor Directo'})</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Botón rápido para que Encargados/Admin suban productos */}
          {(role === 'worker' || role === 'admin') && (
            <button
              onClick={() => setIsProductModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-rose-950/40 shrink-0 self-start md:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>+ Cargar Producto a {activeZone?.name}</span>
            </button>
          )}
        </div>

        {/* Aviso de zona proyectada / inactiva diferenciado por rol */}
        {!activeZone?.is_active && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-amber-400 shrink-0" />
              <span>
                {role === 'admin' 
                  ? 'Esta zona se encuentra inactiva para clientes. Haz clic para activarla y publicarla inmediatamente en el catálogo.'
                  : '✨ Esta zona estará disponible próximamente en Bodega Mayorista Montería. Contáctanos por WhatsApp para reservas de mercancía.'}
              </span>
            </div>
            {role === 'admin' && (
              <button
                onClick={() => setIsZoneManagerOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-amber-500 text-zinc-950 font-bold hover:bg-amber-400 shrink-0"
              >
                Activar Ahora
              </button>
            )}
          </div>
        )}

        {/* Barra de Búsqueda y Filtros */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Input de Búsqueda */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Buscar en ${activeZone?.name} (nombre, SKU o descripción)...`}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition-colors"
            />
          </div>

          {/* Chips de Categorías */}
          {filteredCategories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => setSelectedCategorySlug('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                  selectedCategorySlug === 'all'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                Todos
              </button>
              {filteredCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategorySlug(cat.slug)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                    selectedCategorySlug === cat.slug
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cuadrícula de Productos */}
        {filteredProducts.length === 0 ? (
          <div className="py-16 text-center bg-zinc-900/30 rounded-3xl border border-zinc-800/80 p-8 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-zinc-800 text-zinc-500 flex items-center justify-center mx-auto">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-zinc-200">
              No hay productos registrados en {activeZone?.name}
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {role === 'worker' || role === 'admin'
                ? 'Como encargado, puedes subir el primer artículo ahora mismo con su fotografía y precio al por mayor.'
                : 'Estamos surtiendo nuevos lotes mayoristas. Vuelve a consultar pronto.'}
            </p>
            {(role === 'worker' || role === 'admin') && (
              <button
                onClick={() => setIsProductModalOpen(true)}
                className="mt-3 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs"
              >
                + Subir Producto con Foto
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={(p) => {
                  setEditingProduct(p);
                  setIsProductModalOpen(true);
                }}
              />
            ))}
          </div>
        )}

      </div>

      {/* Modales */}
      <ProductUploadModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        zones={zones}
        categories={filteredCategories}
        productToEdit={editingProduct}
        onProductSaved={handleProductSaved}
      />

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
