'use client';

import React, { useState } from 'react';
import { Product, Zone, Category } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { formatCOP, slugify, calculateProfitMargin } from '@/lib/utils';
import { 
  X, 
  Upload, 
  Camera, 
  Image as ImageIcon, 
  Check, 
  Sparkles, 
  DollarSign, 
  Boxes, 
  Layers, 
  Shuffle,
  AlertCircle
} from 'lucide-react';

interface ProductUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  zones: Zone[];
  categories: Category[];
  productToEdit?: Product | null;
  onProductSaved: (product: Product) => void;
}

export default function ProductUploadModal({
  isOpen,
  onClose,
  zones,
  categories,
  productToEdit,
  onProductSaved,
}: ProductUploadModalProps) {
  const { isConfigured, user } = useAuth();

  const isEditing = Boolean(productToEdit);

  const [name, setName] = useState(productToEdit?.name || '');
  const [sku, setSku] = useState(productToEdit?.sku || '');
  const [description, setDescription] = useState(productToEdit?.description || '');
  const [wholesalePrice, setWholesalePrice] = useState<number | string>(productToEdit?.wholesale_price || '');
  const [retailPrice, setRetailPrice] = useState<number | string>(productToEdit?.suggested_retail_price || '');
  const [stock, setStock] = useState<number | string>(productToEdit?.stock_quantity ?? 50);
  const [minOrder, setMinOrder] = useState<number | string>(productToEdit?.min_order_quantity ?? 1);
  const [zoneId, setZoneId] = useState(productToEdit?.zone_id || zones[0]?.id || '');
  const [categoryId, setCategoryId] = useState(productToEdit?.category_id || categories[0]?.id || '');
  const [featured, setFeatured] = useState(productToEdit?.featured || false);
  const [images, setImages] = useState<string[]>(productToEdit?.images || []);

  const [uploadingImage, setUploadingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentProfitMargin = calculateProfitMargin(Number(wholesalePrice) || 0, Number(retailPrice) || 0);

  // Generador de SKU rápido para el encargado
  const handleGenerateSku = () => {
    const selectedZone = zones.find((z) => z.id === zoneId);
    const prefix = selectedZone?.slug.includes('belleza') ? 'BEL' : 
                   selectedZone?.slug.includes('iphone') ? 'IPH' : 
                   selectedZone?.slug.includes('android') ? 'AND' : 'VAR';
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setSku(`${prefix}-${randomNum}`);
  };

  // Manejo de carga de imagen intuitiva (cámara o galería)
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setUploadingImage(true);
    setErrorMessage(null);

    try {
      if (isConfigured) {
        const supabase = createClient();
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `products/${fileName}`;

        // Subir directamente a Supabase Storage bucket 'products'
        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Obtener URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(filePath);

        setImages((prev) => [...prev, publicUrl]);
      } else {
        // En modo demostración local, creamos un ObjectURL temporal
        const previewUrl = URL.createObjectURL(file);
        setImages((prev) => [...prev, previewUrl]);
      }
    } catch (err: any) {
      console.error('Error al subir imagen:', err);
      setErrorMessage(err.message || 'Error al subir la imagen al Storage');
    } finally {
      setUploadingImage(false);
    }
  };

  // Guardar producto
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !wholesalePrice) {
      setErrorMessage('El nombre y el precio mayorista son obligatorios.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const productData = {
      zone_id: zoneId || zones[0]?.id,
      category_id: categoryId || null,
      name,
      slug: slugify(name),
      sku: sku || `SKU-${Date.now().toString().slice(-6)}`,
      description,
      wholesale_price: Number(wholesalePrice),
      suggested_retail_price: retailPrice ? Number(retailPrice) : null,
      min_order_quantity: Math.max(1, Number(minOrder) || 1),
      stock_quantity: Math.max(0, Number(stock) || 0),
      is_available: Number(stock) > 0,
      featured,
      images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80'],
      updated_at: new Date().toISOString(),
    };

    try {
      if (isConfigured) {
        const supabase = createClient();
        if (isEditing && productToEdit?.id) {
          const { data, error } = await supabase
            .from('products')
            .update(productData)
            .eq('id', productToEdit.id)
            .select()
            .single();

          if (error) throw error;
          onProductSaved(data as Product);
        } else {
          const { data, error } = await supabase
            .from('products')
            .insert({
              ...productData,
              created_by: user?.id || null,
            })
            .select()
            .single();

          if (error) throw error;
          onProductSaved(data as Product);
        }
      } else {
        // Modo Demo Local
        const saved: Product = {
          id: productToEdit?.id || `demo-${Date.now()}`,
          ...productData,
          created_at: productToEdit?.created_at || new Date().toISOString(),
        };
        onProductSaved(saved);
      }

      onClose();
    } catch (err: any) {
      console.error('Error guardando producto:', err);
      setErrorMessage(err.message || 'Error al guardar el producto');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm p-3 sm:p-6 flex items-center justify-center">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl text-zinc-100 flex flex-col max-h-[92vh]">
        
        {/* Cabecera del Modal */}
        <div className="p-4 sm:p-5 border-b border-zinc-800/90 bg-zinc-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white">
                {isEditing ? 'Editar Producto Mayorista' : 'Cargar Nuevo Producto a Bodega'}
              </h2>
              <p className="text-xs text-zinc-400">
                Optimizado para celular y PC • Actualización en tiempo real
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

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Subida de Fotos intuitiva con Cámara o Archivo */}
          <div>
            <label className="text-xs font-bold text-zinc-300 block mb-1.5">
              Fotografías del Artículo (Supabase Storage)
            </label>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Fotos cargadas */}
              {images.map((imgUrl, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-zinc-700 bg-zinc-900 group">
                  <img src={imgUrl} alt="Foto producto" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages(images.filter((_, i) => i !== idx))}
                    className="absolute inset-0 bg-black/60 text-rose-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
                  >
                    Quitar
                  </button>
                </div>
              ))}

              {/* Botón Tomar Foto con Cámara Celular o Galería */}
              <label className="w-24 h-20 rounded-xl border-2 border-dashed border-zinc-700 hover:border-amber-400 hover:bg-amber-400/5 transition-all flex flex-col items-center justify-center cursor-pointer text-zinc-400 hover:text-amber-300 p-2 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  disabled={uploadingImage}
                  className="hidden"
                />
                <Camera className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-semibold">
                  {uploadingImage ? 'Subiendo...' : 'Tomar / Subir'}
                </span>
              </label>
            </div>
          </div>

          {/* Nombre y SKU */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-zinc-300 block mb-1">
                Nombre del Producto *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Labial Mate Ruby Rose (Caja x24)"
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-zinc-300">SKU / Código</label>
                <button
                  type="button"
                  onClick={handleGenerateSku}
                  className="text-[10px] text-amber-400 hover:underline flex items-center gap-0.5"
                >
                  <Shuffle className="w-2.5 h-2.5" /> Auto
                </button>
              </div>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="BEL-1024"
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 font-mono focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Selector de Zona y Categoría */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">
                Zona del Catálogo *
              </label>
              <select
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-amber-400"
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} {z.is_active ? '✓' : '(Inactiva)'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">
                Categoría
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-amber-400"
              >
                <option value="">(Sin categoría específica)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Precios: Mayorista y Sugerido Reventa con Calculadora de Margen */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800/90 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-rose-400 block mb-1">
                  Precio Mayorista (COP) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="500"
                  value={wholesalePrice}
                  onChange={(e) => setWholesalePrice(e.target.value)}
                  placeholder="Ej: 42000"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm font-black text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">
                  Precio Sugerido Reventa P.V.P (COP)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={retailPrice}
                  onChange={(e) => setRetailPrice(e.target.value)}
                  placeholder="Ej: 75000"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm font-bold text-zinc-300 focus:outline-none focus:border-zinc-500"
                />
              </div>
            </div>

            {currentProfitMargin > 0 && (
              <div className="flex items-center justify-between text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span>Margen estimado para el cliente revendedor:</span>
                <span className="font-bold text-sm">+{currentProfitMargin}%</span>
              </div>
            )}
          </div>

          {/* Stock y Pedido Mínimo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">
                Stock Físico en Bodega
              </label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="50"
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">
                Pedido Mínimo Mayorista
              </label>
              <input
                type="number"
                min="1"
                value={minOrder}
                onChange={(e) => setMinOrder(e.target.value)}
                placeholder="1"
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="text-xs font-bold text-zinc-300 block mb-1">
              Descripción o Características
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Presentación, tonos, registro Invima o instrucciones de venta..."
              className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 resize-none"
            />
          </div>

          {/* Destacado */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="featured-check"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 bg-zinc-900 border-zinc-700"
            />
            <label htmlFor="featured-check" className="text-xs font-medium text-zinc-300 cursor-pointer">
              Marcar como producto destacado / de alta rotación
            </label>
          </div>
        </form>

        {/* Footer del Modal */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-900/60 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            Cancelar
          </button>
          
          <button
            type="button"
            disabled={isSaving || uploadingImage}
            onClick={handleSubmit}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-rose-950/40 transition-all flex items-center gap-2 active:scale-98 disabled:opacity-50"
          >
            {isSaving ? (
              <span>Guardando...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{isEditing ? 'Actualizar Producto' : 'Publicar a Catálogo'}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
