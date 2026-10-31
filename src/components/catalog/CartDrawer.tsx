'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { formatCOP, generateWhatsAppOrderUrl } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { encryptSensitiveData } from '@/lib/crypto';
import { getStoredZones } from '@/lib/data-store';
import { 
  X, 
  Trash2, 
  ShoppingBag, 
  Send, 
  MapPin, 
  User, 
  Phone, 
  CheckCircle2, 
  AlertCircle,
  Truck,
  ShieldCheck,
  Lock
} from 'lucide-react';

const CORDOBA_CITIES = [
  'Montería (Urbana)',
  'Cereté',
  'Lorica',
  'Sahagún',
  'Planeta Rica',
  'Montelíbano',
  'Ciénaga de Oro',
  'Tierralta',
  'San Antero',
  'Otro municipio de Córdoba / Costa Caribe',
];

export default function CartDrawer() {
  const { cart, removeFromCart, updateQuantity, clearCart, totalItems, subtotal, isCartOpen, setIsCartOpen } = useCart();
  const { profile, isConfigured } = useAuth();

  const [customerName, setCustomerName] = useState(profile?.full_name || '');
  const [customerPhone, setCustomerPhone] = useState(profile?.phone || '');
  const [shippingAddress, setShippingAddress] = useState('');
  const [deliveryCity, setDeliveryCity] = useState(profile?.city || 'Montería (Urbana)');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  if (!isCartOpen) return null;

  const handleWhatsAppCheckout = () => {
    if (!customerName || !customerPhone) {
      alert('Por favor ingresa tu nombre y número de teléfono celular.');
      return;
    }

    const itemsForWhatsApp = cart.map((item) => ({
      name: item.product.name,
      quantity: item.quantity,
      price: item.product.wholesale_price,
    }));

    // Obtener el celular específico del encargado de la zona del primer producto
    const storedZones = getStoredZones();
    const productZoneId = cart[0]?.product?.zone_id;
    const foundZone = storedZones.find((z) => z.id === productZoneId);
    const zonePhone = foundZone?.contact_phone?.replace(/[^0-9]/g, '');
    const whatsappNumber = zonePhone || process.env.NEXT_PUBLIC_WHATSAPP_ORDER_NUMBER || '573217147358';

    const url = generateWhatsAppOrderUrl(whatsappNumber, {
      customerName,
      deliveryCity,
      items: itemsForWhatsApp,
      total: subtotal,
    });

    window.open(url, '_blank');
  };

  const handleSystemOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (!customerName || !customerPhone || !shippingAddress) {
      alert('Por favor completa todos los datos de contacto y entrega.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Encriptar datos personales sensibles con AES-256
      const [encryptedPhone, encryptedAddress] = await Promise.all([
        encryptSensitiveData(customerPhone),
        encryptSensitiveData(shippingAddress),
      ]);

      if (isConfigured) {
        const supabase = createClient();
        // Insertar en tabla orders con datos personales encriptados
        const { data: orderData, error: orderErr } = await supabase
          .from('orders')
          .insert({
            client_id: profile?.id || null,
            status: 'pending',
            subtotal,
            discount: 0,
            total: subtotal,
            items_count: totalItems,
            shipping_name: customerName,
            shipping_phone: encryptedPhone,
            shipping_address: encryptedAddress,
            shipping_city: deliveryCity,
            shipping_department: 'Córdoba',
            notes,
          })
          .select('id, order_number')
          .single();

        if (orderErr) throw orderErr;

        // Insertar order_items
        if (orderData?.id) {
          const itemsToInsert = cart.map((item) => ({
            order_id: orderData.id,
            product_id: item.product.id,
            product_name: item.product.name,
            product_sku: item.product.sku,
            unit_price: item.product.wholesale_price,
            quantity: item.quantity,
            subtotal: item.product.wholesale_price * item.quantity,
          }));

          await supabase.from('order_items').insert(itemsToInsert);
          setOrderSuccess(`Pedido #${orderData.order_number || 'REG-001'} registrado con éxito`);
        }
      } else {
        // Modo demo
        setOrderSuccess(`Pedido Demo registrado exitosamente`);
      }

      clearCart();
    } catch (err: any) {
      console.error('Error guardando pedido:', err);
      alert('Error registrando pedido: ' + (err.message || 'Intente nuevamente'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-zinc-950 border-l border-zinc-800 flex flex-col shadow-2xl text-zinc-100">
          
          {/* Header del Carrito */}
          <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-600/20 text-rose-400 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-extrabold tracking-tight">Pedido Mayorista</h2>
                <p className="text-xs text-zinc-400">{totalItems} productos seleccionados</p>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Contenido Principal */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            {orderSuccess ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-zinc-100">¡Pedido Enviado!</h3>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                  {orderSuccess}. Nuestro equipo en Montería se pondrá en contacto para validar despacho y pago.
                </p>
                <button
                  onClick={() => { setOrderSuccess(null); setIsCartOpen(false); }}
                  className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition-colors"
                >
                  Seguir Comprando
                </button>
              </div>
            ) : cart.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-16 h-16 bg-zinc-900 text-zinc-500 rounded-full flex items-center justify-center mx-auto border border-zinc-800">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-zinc-300">Tu carrito mayorista está vacío</h3>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                  Agrega referencias del catálogo de la Zona Belleza para armar tu pedido de reventa.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white text-xs font-bold shadow-md shadow-rose-950/40"
                >
                  Explorar Catálogo
                </button>
              </div>
            ) : (
              <>
                {/* Lista de Productos del Carrito */}
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex gap-3 items-center justify-between"
                    >
                      <img
                        src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=200&q=80'}
                        alt={item.product.name}
                        className="w-14 h-14 rounded-lg object-cover bg-zinc-950 shrink-0 border border-zinc-800"
                      />

                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-zinc-200 truncate">
                          {item.product.name}
                        </h4>
                        <div className="text-[11px] text-zinc-400 mt-0.5">
                          {formatCOP(item.product.wholesale_price)} c/u
                        </div>

                        {/* Controles de cantidad */}
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="px-2 py-0.5 text-xs text-zinc-400 hover:text-white"
                            >
                              -
                            </button>
                            <span className="px-2 text-xs font-bold text-zinc-200">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="px-2 py-0.5 text-xs text-zinc-400 hover:text-white"
                            >
                              +
                            </button>
                          </div>

                          <span className="text-xs font-bold text-rose-400 ml-auto">
                            {formatCOP(item.product.wholesale_price * item.quantity)}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1.5 text-zinc-500 hover:text-rose-400 transition-colors ml-1"
                        title="Eliminar producto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Formulario de Despacho y Contacto Mayorista */}
                <div className="pt-4 border-t border-zinc-800/80 space-y-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-rose-500" />
                    Datos para Despacho en Montería / Córdoba
                  </h4>

                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Nombre del Comprador / Negocio *</label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Ej: Variedades El Centro / Laura Gómez"
                        className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-1">Teléfono / WhatsApp *</label>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
                        <input
                          type="tel"
                          required
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="300 123 4567"
                          className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-1">Municipio *</label>
                      <select
                        value={deliveryCity}
                        onChange={(e) => setDeliveryCity(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-rose-500"
                      >
                        {CORDOBA_CITIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Dirección / Barrio en Montería</label>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        placeholder="Ej: Cra 3 # 32-15 Centro o Barrio La Granja"
                        className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>

                  {/* Garantía de Seguridad y Encriptación de Datos */}
                  <div className="p-2.5 rounded-xl bg-zinc-950 border border-emerald-500/20 text-[11px] text-zinc-400 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Tus datos personales se encriptan con <strong>AES-256</strong> (Ley 1581 de Protección de Datos).</span>
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Notas especiales (opcional)</label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Empaque especial, horario de entrega preferido, etc."
                      className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500 resize-none"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer del Carrito con Totales y Botones de Acción */}
          {cart.length > 0 && !orderSuccess && (
            <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-900/90 space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-zinc-400 font-semibold uppercase block">Total Mayorista</span>
                  <span className="text-[11px] text-emerald-400">Precios especiales aplicados</span>
                </div>
                <span className="text-2xl font-black text-white tracking-tight">
                  {formatCOP(subtotal)}
                </span>
              </div>

              {/* Botón WhatsApp Inmediato */}
              <button
                type="button"
                onClick={handleWhatsAppCheckout}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all active:scale-98"
              >
                <Send className="w-4 h-4" />
                <span>Confirmar Pedido por WhatsApp</span>
              </button>

              {/* Botón Guardar en Sistema */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSystemOrder}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs flex items-center justify-center gap-2 border border-zinc-700 transition-colors"
              >
                {isSubmitting ? 'Procesando...' : 'Registrar Pedido en Sistema Interno'}
              </button>

              <p className="text-[10px] text-zinc-500 text-center">
                Bodega Mayorista Montería • Pagos por Bancolombia, Nequi y Daviplata
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
