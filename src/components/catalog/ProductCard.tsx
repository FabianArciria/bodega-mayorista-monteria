'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Product } from '@/types/database';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { formatCOP, calculateProfitMargin } from '@/lib/utils';
import { 
  ShoppingBag, 
  TrendingUp, 
  Check, 
  AlertCircle, 
  Sparkles,
  Edit2
} from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
}

export default function ProductCard({ product, onEdit }: ProductCardProps) {
  const { addToCart } = useCart();
  const { role } = useAuth();
  const isAdminOrWorker = role === 'admin' || role === 'worker';

  const [quantity, setQuantity] = useState(product.min_order_quantity || 1);
  const [justAdded, setJustAdded] = useState(false);

  const profitMargin = calculateProfitMargin(product.wholesale_price, product.suggested_retail_price);
  const isOutOfStock = product.stock_quantity <= 0;
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 15;

  const handleAdd = () => {
    if (isOutOfStock) return;
    addToCart(product, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const primaryImage = product.images?.[0] || 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="group bg-zinc-900/90 border border-zinc-800 hover:border-rose-500/50 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-rose-950/20">
      
      {/* Contenedor de Imagen y Badges */}
      <div className="relative aspect-square w-full bg-zinc-950 overflow-hidden">
        <img
          src={primaryImage}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Gradiente de fondo en hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Badges superiores */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1">
          {profitMargin > 0 && (
            <span className="bg-emerald-500 text-zinc-950 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
              <TrendingUp className="w-3 h-3" />
              Gana +{profitMargin}%
            </span>
          )}

          {/* Botón de Edición Rápida (Solo visible para Admin y Trabajador) */}
          {isAdminOrWorker && onEdit && (
            <button
              onClick={() => onEdit(product)}
              className="bg-zinc-900/90 text-amber-300 p-1.5 rounded-full hover:bg-amber-400 hover:text-zinc-950 transition-colors shadow-md ml-auto"
              title="Editar producto (Admin/Trabajador)"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}

          {product.featured && !isAdminOrWorker && (
            <span className="bg-amber-400 text-zinc-950 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md ml-auto">
              <Sparkles className="w-3 h-3" />
              Más Vendido
            </span>
          )}
        </div>

        {/* Stock Status Badge */}
        <div className="absolute bottom-2.5 left-2.5">
          {isOutOfStock ? (
            <span className="bg-zinc-900/90 text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-rose-500/30 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Agotado
            </span>
          ) : isLowStock ? (
            <span className="bg-zinc-900/90 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-500/30">
              ⚡ Últimas {product.stock_quantity} unds
            </span>
          ) : (
            <span className="bg-zinc-900/90 text-zinc-300 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-zinc-700">
              Stock: {product.stock_quantity}
            </span>
          )}
        </div>
      </div>

      {/* Información del Producto */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          {isAdminOrWorker && product.sku && (
            <span className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase block mb-1">
              SKU: {product.sku}
            </span>
          )}
          <h3 className="text-zinc-100 font-bold text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-rose-400 transition-colors">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-zinc-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}
        </div>

        {/* Bloque de Precios Mayoristas */}
        <div className="pt-2 border-t border-zinc-800/80">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-[10px] text-zinc-400 uppercase font-semibold block">
                Precio Mayorista
              </span>
              <span className="text-lg sm:text-xl font-black text-rose-400 tracking-tight">
                {formatCOP(product.wholesale_price)}
              </span>
            </div>

            {product.suggested_retail_price && (
              <div className="text-right">
                <span className="text-[10px] text-zinc-500 uppercase font-semibold block">
                  P.V.P Sugerido
                </span>
                <span className="text-xs font-bold text-zinc-300 line-through decoration-zinc-500">
                  {formatCOP(product.suggested_retail_price)}
                </span>
              </div>
            )}
          </div>

          <div className="text-[11px] text-zinc-400 mt-1 flex items-center justify-between">
            <span>Pedido mínimo:</span>
            <span className="font-semibold text-zinc-200">
              {product.min_order_quantity} {product.min_order_quantity === 1 ? 'unidad' : 'unidades'}
            </span>
          </div>
        </div>

        {/* Acciones: Cantidad y Agregar al Pedido */}
        <div className="pt-1 flex items-center gap-2">
          {!isOutOfStock && (
            <div className="flex items-center bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden shrink-0">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(product.min_order_quantity || 1, q - 1))}
                className="px-2.5 py-1.5 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors text-xs font-bold"
                aria-label="Disminuir cantidad"
              >
                -
              </button>
              <span className="px-2 text-xs font-bold text-zinc-100 min-w-6 text-center">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(product.stock_quantity, q + 1))}
                className="px-2.5 py-1.5 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors text-xs font-bold"
                aria-label="Aumentar cantidad"
              >
                +
              </button>
            </div>
          )}

          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleAdd}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all shadow-md ${
              isOutOfStock
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                : justAdded
                ? 'bg-emerald-600 text-white shadow-emerald-950/40'
                : 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-rose-950/40 active:scale-98'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-4 h-4" />
                <span>¡Agregado!</span>
              </>
            ) : isOutOfStock ? (
              <span>Sin Stock</span>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>Agregar</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
