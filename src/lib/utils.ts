import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatea un valor numérico a Pesos Colombianos (COP)
 * Ejemplo: 45000 -> $ 45.000
 */
export function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Genera un slug seguro a partir de un texto
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

/**
 * Calcula el porcentaje de ganancia sugerido para el revendedor
 */
export function calculateProfitMargin(wholesalePrice: number, retailPrice?: number | null): number {
  if (!retailPrice || retailPrice <= wholesalePrice) return 0;
  const profit = retailPrice - wholesalePrice;
  return Math.round((profit / wholesalePrice) * 100);
}

/**
 * Genera un enlace directo a WhatsApp para finalizar o confirmar pedido
 */
export function generateWhatsAppOrderUrl(phone: string, orderDetails: {
  orderNumber?: string | number;
  customerName: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  deliveryCity: string;
}): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  
  let text = `👋 *¡Hola Bodega Mayorista Montería!*\n`;
  text += `Deseo confirmar el siguiente pedido mayorista:\n\n`;
  text += `👤 *Cliente:* ${orderDetails.customerName}\n`;
  text += `📍 *Ciudad de entrega:* ${orderDetails.deliveryCity}\n`;
  if (orderDetails.orderNumber) {
    text += `🔖 *N° Pedido:* #${orderDetails.orderNumber}\n`;
  }
  text += `\n📦 *Productos:*\n`;

  orderDetails.items.forEach((item, idx) => {
    text += `${idx + 1}. ${item.name} x${item.quantity} = ${formatCOP(item.price * item.quantity)}\n`;
  });

  text += `\n💰 *Total Mayorista: ${formatCOP(orderDetails.total)}*\n`;
  text += `\n_Quedo atento a las cuentas bancarias (Bancolombia, Nequi, Daviplata) para realizar el pago._`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}
