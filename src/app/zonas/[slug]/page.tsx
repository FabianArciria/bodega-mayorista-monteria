'use client';

import React, { useState, useEffect, Suspense, use } from 'react';
import Link from 'next/link';
import { Zone, Category, Product } from '@/types/database';
import { INITIAL_ZONES, INITIAL_CATEGORIES, INITIAL_PRODUCTS } from '@/lib/mock-data';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import ProductCard from '@/components/catalog/ProductCard';
import ProductUploadModal from '@/components/worker/ProductUploadModal';
import { useAuth } from '@/context/AuthContext';
import { 
  ArrowLeft, 
  Sparkles, 
  Search, 
  Package, 
  Plus
} from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ZoneDetailPage({ params }: PageProps) {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-zinc-400">
        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs">Cargando catálogo mayorista...</p>
      </div>
    }>
      <ZoneDetailContent paramsPromise={params} />
    </Suspense>
  );
}

function ZoneDetailContent({ paramsPromise }: { paramsPromise: Promise<{ slug: string }> }) {
  const resolvedParams = use(paramsPromise);
  const slug = resolvedParams?.slug as string;
  const { role, isConfigured } = useAuth();

  const [zones, setZones] = useState<Zone[]>(INITIAL_ZONES);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!isConfigured) return;
    const supabase = createClient();
    async function fetchZoneData() {
      const { data: z } = await supabase.from('zones').select('*');
      if (z) setZones(z as Zone[]);

      const { data: c } = await supabase.from('categories').select('*');
      if (c) setCategories(c as Category[]);

      const { data: p } = await supabase.from('products').select('*');
      if (p) setProducts(p as Product[]);
    }
    fetchZoneData();
  }, [isConfigured]);

  const currentZone = zones.find((z) => z.slug === slug) || zones[0];
  const zoneCategories = categories.filter((c) => c.zone_id === currentZone?.id);

  const zoneProducts = products.filter((p) => {
    const inZone = p.zone_id === currentZone?.id;
    const inCat = selectedCat === 'all' || categories.find((c) => c.id === p.category_id)?.slug === selectedCat;
    const inSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return inZone && inCat && inSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Botón Volver y Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <Link href="/" className="hover:text-white flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al Catálogo General</span>
        </Link>
        <span>/</span>
        <span className="text-zinc-200 font-semibold">{currentZone?.name}</span>
      </div>

      {/* Banner de la Zona */}
      <div className="relative rounded-3xl overflow-hidden border border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 p-6 sm:p-10 shadow-2xl">
        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
              Catálogo Especializado Mayorista
            </span>
            {currentZone?.is_active ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Zona Activa
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                Proyectada
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            {currentZone?.name}
          </h1>

          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            {currentZone?.description}
          </p>

          {(role === 'worker' || role === 'admin') && (
            <div className="pt-2">
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-rose-950/40"
              >
                <Plus className="w-4 h-4" />
                <span>+ Cargar Producto a {currentZone?.name}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filtros de la Zona */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Buscar en ${currentZone?.name}...`}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500"
          />
        </div>

        {zoneCategories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedCat('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                selectedCat === 'all'
                  ? 'bg-rose-600 text-white'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              Todos
            </button>
            {zoneCategories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCat(c.slug)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                  selectedCat === c.slug
                    ? 'bg-rose-600 text-white'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid de Productos */}
      {zoneProducts.length === 0 ? (
        <div className="py-16 text-center bg-zinc-900/30 rounded-3xl border border-zinc-800 p-8 space-y-3">
          <Package className="w-8 h-8 text-zinc-500 mx-auto" />
          <h3 className="text-sm font-bold text-zinc-300">No hay productos en esta zona</h3>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto">
            Pronto añadiremos nuevo surtido mayorista.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {zoneProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {/* Modal */}
      <ProductUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        zones={zones}
        categories={zoneCategories}
        onProductSaved={(newP) => setProducts([newP, ...products])}
      />

    </div>
  );
}
