import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/catalog/CartDrawer';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Bodega Mayorista Montería | Distribuidora B2B y Catálogo Multizona',
  description: 'Plataforma oficial mayorista en Montería, Córdoba. Cosméticos, belleza, cuidado capilar y tecnología por mayor con márgenes superiores de reventa.',
  keywords: ['Bodega Mayorista Monteria', 'Cosméticos por mayor Monteria', 'Distribuidora Cordoba', 'Zona Belleza Mayorista', 'Maquillaje por mayor Monteria'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`dark ${inter.variable}`}>
      <body className="bg-zinc-950 text-zinc-100 min-h-screen flex flex-col font-sans antialiased selection:bg-rose-500 selection:text-white">
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
            <CartDrawer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
