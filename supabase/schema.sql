-- ==============================================================================
-- BODEGA MAYORISTA MONTERÍA - ESQUEMA DE BASE DE DATOS SUPABASE (POSTGRESQL)
-- Arquitectura Multizona, Roles (Admin, Trabajador, Cliente) y RLS Estricto
-- ==============================================================================

-- 1. HABILITAR EXTENSIONES NECESARIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TIPOS Y ENUMS
-- ==============================================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'worker', 'client');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled');
    END IF;
END $$;

-- ==============================================================================
-- 3. TABLA: PROFILES (Perfiles vinculados a auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    company_name TEXT,              -- Nombre del negocio/almacén del cliente mayorista
    nit_rut TEXT,                   -- Documento tributario para facturación comercial
    city TEXT DEFAULT 'Montería',
    department TEXT DEFAULT 'Córdoba',
    role user_role NOT NULL DEFAULT 'client',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 4. TABLA: ZONES (Zonas del Catálogo Dinámico y Modular)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,                      -- Ej: 'Zona Belleza'
    slug TEXT NOT NULL UNIQUE,                      -- Ej: 'zona-belleza'
    description TEXT,
    icon TEXT DEFAULT 'Sparkles',                   -- Nombre del ícono Lucide (Sparkles, Smartphone, Package, etc.)
    color_gradient TEXT DEFAULT 'from-pink-500 to-rose-600', -- Estilo visual dinámico
    banner_url TEXT,
    logo_url TEXT,                                  -- Logo representativo propio de la zona
    contact_phone TEXT DEFAULT '573217147358',       -- Celular WhatsApp del encargado responsable
    manager_name TEXT,                              -- Nombre del encargado de la zona
    is_active BOOLEAN NOT NULL DEFAULT FALSE,       -- Con un clic desde el admin se activa/desactiva
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Vincular perfil de trabajador/encargado a su zona asignada
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS assigned_zone_id UUID REFERENCES public.zones(id) ON DELETE SET NULL;


-- ==============================================================================
-- 5. TABLA: CATEGORIES (Categorías asociadas a cada zona)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id UUID NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_zone_category_slug UNIQUE (zone_id, slug)
);

-- ==============================================================================
-- 6. TABLA: PRODUCTS (Catálogo de Productos Mayoristas)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id UUID NOT NULL REFERENCES public.zones(id) ON DELETE RESTRICT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    sku TEXT UNIQUE,                                -- Código de barras o SKU interno
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    wholesale_price NUMERIC(12, 2) NOT NULL CHECK (wholesale_price >= 0),
    suggested_retail_price NUMERIC(12, 2) CHECK (suggested_retail_price >= wholesale_price),
    min_order_quantity INT NOT NULL DEFAULT 1 CHECK (min_order_quantity >= 1),
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    images TEXT[] NOT NULL DEFAULT '{}',            -- Array de URLs en Supabase Storage
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices para búsqueda rápida en catálogo masivo
CREATE INDEX IF NOT EXISTS idx_products_zone ON public.products(zone_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_available ON public.products(is_available);
CREATE INDEX IF NOT EXISTS idx_products_search ON public.products USING gin(to_tsvector('spanish', name || ' ' || coalesce(description, '')));

-- ==============================================================================
-- 7. TABLA: ORDERS (Pedidos Mayoristas)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number SERIAL,
    client_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status order_status NOT NULL DEFAULT 'pending',
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
    discount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    items_count INT NOT NULL DEFAULT 0,
    shipping_name TEXT NOT NULL,
    shipping_phone TEXT NOT NULL,
    shipping_address TEXT NOT NULL,
    shipping_city TEXT NOT NULL DEFAULT 'Montería',
    shipping_department TEXT NOT NULL DEFAULT 'Córdoba',
    notes TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 8. TABLA: ORDER_ITEMS (Detalle de Productos por Pedido)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    product_sku TEXT,
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    quantity INT NOT NULL CHECK (quantity > 0),
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- ==============================================================================
-- 9. FUNCIONES DE AYUDA DE AUTORIZACIÓN (SECURITY DEFINER)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin' AND is_active = TRUE
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_worker_or_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'worker') AND is_active = TRUE
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Funciones criptográficas para protección de datos personales sensibles (Ley 1581 Habeas Data)
CREATE OR REPLACE FUNCTION public.encrypt_pii(data TEXT, secret_key TEXT)
RETURNS BYTEA AS $$
    SELECT pgp_sym_encrypt(data, secret_key, 'compress-algo=1, cipher-algo=aes256');
$$ LANGUAGE sql IMMUTABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decrypt_pii(encrypted_data BYTEA, secret_key TEXT)
RETURNS TEXT AS $$
    SELECT pgp_sym_decrypt(encrypted_data, secret_key);
$$ LANGUAGE sql IMMUTABLE SECURITY DEFINER;

-- Trigger para auto-crear perfil cuando se registra un usuario en Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id, 
        email, 
        full_name, 
        phone, 
        company_name, 
        role, 
        assigned_zone_id,
        is_active
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario Mayorista'),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client'),
        CASE 
            WHEN NEW.raw_user_meta_data->>'assigned_zone_id' IS NOT NULL 
            THEN (NEW.raw_user_meta_data->>'assigned_zone_id')::UUID 
            ELSE NULL 
        END,
        TRUE
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
CREATE TRIGGER update_zones_modtime BEFORE UPDATE ON public.zones FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
CREATE TRIGGER update_products_modtime BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
CREATE TRIGGER update_orders_modtime BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- ==============================================================================
-- 10. SEGURIDAD: ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- A. Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- B. POLÍTICAS: PROFILES
-- Los usuarios pueden leer su propio perfil; administradores leen todos los perfiles
CREATE POLICY "Profiles: Users can read own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin());

-- Los usuarios pueden actualizar su propio perfil (excepto cambiar su propio rol a admin)
CREATE POLICY "Profiles: Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- Solo administradores pueden insertar perfiles o cambiar roles de trabajadores
CREATE POLICY "Profiles: Admins manage all profiles"
    ON public.profiles FOR ALL
    USING (public.is_admin());

-- C. POLÍTICAS: ZONES
-- Clientes y público pueden leer únicamente zonas activas
CREATE POLICY "Zones: Public read active zones"
    ON public.zones FOR SELECT
    USING (is_active = TRUE OR public.is_worker_or_admin());

-- Administradores pueden insertar o borrar zonas
CREATE POLICY "Zones: Admins manage zones"
    ON public.zones FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Trabajadores encargados pueden actualizar los datos (celular, logo, descripción) de su zona asignada
CREATE POLICY "Zones: Workers can update assigned zone"
    ON public.zones FOR UPDATE
    USING (
        public.is_admin() OR 
        EXISTS (
            SELECT 1 FROM public.profiles p 
            WHERE p.id = auth.uid() AND (p.assigned_zone_id = zones.id OR p.role = 'worker')
        )
    )
    WITH CHECK (
        public.is_admin() OR 
        EXISTS (
            SELECT 1 FROM public.profiles p 
            WHERE p.id = auth.uid() AND (p.assigned_zone_id = zones.id OR p.role = 'worker')
        )
    );

-- D. POLÍTICAS: CATEGORIES
-- Lectura pública para categorías de zonas activas
CREATE POLICY "Categories: Public read active categories"
    ON public.categories FOR SELECT
    USING (is_active = TRUE OR public.is_worker_or_admin());

-- Administradores y trabajadores pueden gestionar categorías
CREATE POLICY "Categories: Staff manage categories"
    ON public.categories FOR ALL
    USING (public.is_worker_or_admin())
    WITH CHECK (public.is_worker_or_admin());

-- E. POLÍTICAS: PRODUCTS
-- Lectura de catálogo: Clientes y visitantes solo ven productos disponibles de zonas activas
CREATE POLICY "Products: Public read available products"
    ON public.products FOR SELECT
    USING (
        (is_available = TRUE AND EXISTS (
            SELECT 1 FROM public.zones z 
            WHERE z.id = products.zone_id AND z.is_active = TRUE
        ))
        OR public.is_worker_or_admin()
    );

-- Modificación: Trabajadores y Administradores pueden insertar, editar y eliminar productos
CREATE POLICY "Products: Staff can insert products"
    ON public.products FOR INSERT
    WITH CHECK (public.is_worker_or_admin());

CREATE POLICY "Products: Staff can update products"
    ON public.products FOR UPDATE
    USING (public.is_worker_or_admin())
    WITH CHECK (public.is_worker_or_admin());

CREATE POLICY "Products: Staff can delete products"
    ON public.products FOR DELETE
    USING (public.is_worker_or_admin());

-- F. POLÍTICAS: ORDERS
-- Clientes pueden leer sus propios pedidos; Staff puede ver todos los pedidos
CREATE POLICY "Orders: Client read own orders"
    ON public.orders FOR SELECT
    USING (auth.uid() = client_id OR public.is_worker_or_admin());

-- Clientes autenticados pueden crear pedidos
CREATE POLICY "Orders: Authenticated clients create orders"
    ON public.orders FOR INSERT
    WITH CHECK (auth.uid() = client_id OR client_id IS NULL);

-- Solo Trabajadores y Administradores pueden actualizar el estado de los pedidos
CREATE POLICY "Orders: Staff update orders"
    ON public.orders FOR UPDATE
    USING (public.is_worker_or_admin())
    WITH CHECK (public.is_worker_or_admin());

-- G. POLÍTICAS: ORDER_ITEMS
CREATE POLICY "OrderItems: Read related to visible order"
    ON public.order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o 
            WHERE o.id = order_items.order_id 
            AND (o.client_id = auth.uid() OR public.is_worker_or_admin())
        )
    );

CREATE POLICY "OrderItems: Insert with order"
    ON public.order_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders o 
            WHERE o.id = order_items.order_id 
            AND (o.client_id = auth.uid() OR o.client_id IS NULL)
        )
    );

-- ==============================================================================
-- 11. STORAGE BUCKET PARA FOTOGRAFÍAS DE PRODUCTOS
-- ==============================================================================
-- Crear bucket público 'products' si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'products',
    'products',
    TRUE,
    5242880, -- 5 MB máximo por imagen
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET
    public = TRUE,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

-- RLS de Storage: Acceso público de lectura a las fotos
CREATE POLICY "Storage: Public can view product images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'products');

-- RLS de Storage: Solo Trabajadores y Administradores pueden subir fotos
CREATE POLICY "Storage: Staff can upload product images"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'products' 
        AND auth.role() = 'authenticated'
        AND public.is_worker_or_admin()
    );

-- RLS de Storage: Solo Trabajadores y Administradores pueden actualizar/eliminar fotos
CREATE POLICY "Storage: Staff can update product images"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'products' 
        AND auth.role() = 'authenticated'
        AND public.is_worker_or_admin()
    );

CREATE POLICY "Storage: Staff can delete product images"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'products' 
        AND auth.role() = 'authenticated'
        AND public.is_worker_or_admin()
    );

-- ==============================================================================
-- 12. DATOS SEMILLA (SEED DATA)
-- Zonas iniciales y catálogo demo para Zona Belleza
-- ==============================================================================

-- A. Insertar Zonas Modulares con Logos Propios y Celulares de Encargados
INSERT INTO public.zones (id, name, slug, description, icon, color_gradient, logo_url, contact_phone, manager_name, is_active, display_order)
VALUES 
    (
        '11111111-1111-1111-1111-111111111111', 
        'Zona Belleza', 
        'zona-belleza', 
        'Cosméticos, cuidado de la piel, maquillaje profesional y cuidado capilar al por mayor.', 
        'Sparkles', 
        'from-pink-500 via-rose-500 to-amber-400',
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=200&q=80',
        '573217147358',
        'Andrés López (Encargado Zona Belleza)',
        TRUE, 
        1
    ),
    (
        '22222222-2222-2222-2222-222222222222', 
        'Zona iPhone', 
        'zona-iphone', 
        'iPhones nuevos y seminuevos garantizados, fundas MagSafe, cargadores 20W y accesorios.', 
        'Smartphone', 
        'from-zinc-800 to-zinc-950',
        'https://images.unsplash.com/photo-1616348436168-de43ad0db179?auto=format&fit=crop&w=200&q=80',
        '573128765432',
        'Carlos Villadiego (Encargado Zona iPhone)',
        FALSE, 
        2
    ),
    (
        '33333333-3333-3333-3333-333333333333', 
        'Zona Android', 
        'zona-android', 
        'Dispositivos Xiaomi, Samsung, protectores cerámicos y repuestos al por mayor.', 
        'SmartphoneCharging', 
        'from-emerald-500 to-teal-700',
        'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=200&q=80',
        '573105556789',
        'David Martínez (Encargado Zona Android)',
        FALSE, 
        3
    ),
    (
        '44444444-4444-4444-4444-444444444444', 
        'Zona Cacharros / Variedades', 
        'zona-cacharros', 
        'Artículos para el hogar, novedades en tendencia, juguetes, termos y papelería.', 
        'Package', 
        'from-amber-500 to-orange-600',
        'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?auto=format&fit=crop&w=200&q=80',
        '573154443210',
        'Marta Cordero (Encargada Variedades)',
        FALSE, 
        4
    ),
    (
        '55555555-5555-5555-5555-555555555555', 
        'Zona Mayorista Especial', 
        'zona-mayorista-especial', 
        'Lotes cerrados por cajas y bultos con márgenes de ganancia superiores al 50%.', 
        'Crown', 
        'from-indigo-600 to-purple-800',
        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=200&q=80',
        '573217147358',
        'Don Carlos Mendoza (Administración Principal)',
        FALSE, 
        5
    )
ON CONFLICT (slug) DO UPDATE SET
    logo_url = EXCLUDED.logo_url,
    contact_phone = EXCLUDED.contact_phone,
    manager_name = EXCLUDED.manager_name;

-- B. Categorías para Zona Belleza
INSERT INTO public.categories (id, zone_id, name, slug, description, display_order)
VALUES 
    ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Cuidado Facial & Skincare', 'cuidado-facial', 'Serums, tónicos, cremas hidratantes y protectores solares', 1),
    ('a2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Maquillaje Profesional', 'maquillaje', 'Bases, correctores, paletas de sombras y labiales mate', 2),
    ('a3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Cuidado Capilar', 'cuidado-capilar', 'Tratamientos de keratina, mascarillas nutritivas y termoprotectores', 3),
    ('a4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Perfumería y Fragancias', 'perfumeria', 'Splash corporales, perfumes inspirados y aceites aromáticos', 4)
ON CONFLICT (zone_id, slug) DO NOTHING;

-- C. Productos Semilla para Zona Belleza
INSERT INTO public.products (zone_id, category_id, sku, name, slug, description, wholesale_price, suggested_retail_price, min_order_quantity, stock_quantity, is_available, featured, images)
VALUES
    (
        '11111111-1111-1111-1111-111111111111',
        'a1111111-1111-1111-1111-111111111111',
        'BEL-SKIN-001',
        'Serum Facial Ácido Hialurónico + Vitamina C (Caja x12 und)',
        'serum-facial-acido-hialuronico-vitamina-c-caja-x12',
        'Potente tratamiento anti-edad e iluminador de absorción rápida. Presentación de 30ml por unidad. Fórmula dermatológica aprobada.',
        42000.00,
        75000.00,
        1,
        85,
        TRUE,
        TRUE,
        ARRAY['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80']
    ),
    (
        '11111111-1111-1111-1111-111111111111',
        'a1111111-1111-1111-1111-111111111111',
        'BEL-SKIN-002',
        'Protector Solar Toque Seco FPS 50+ 60ml (Docena)',
        'protector-solar-toque-seco-fps-50-docena',
        'Filtro solar invisible sin sensación grasosa, resistente al agua y sudor. Ideal para reventa en climas cálidos como la Costa Caribe.',
        78000.00,
        130000.00,
        1,
        120,
        TRUE,
        TRUE,
        ARRAY['https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80']
    ),
    (
        '11111111-1111-1111-1111-111111111111',
        'a2222222-2222-2222-2222-222222222222',
        'BEL-MKP-001',
        'Set Labiales Líquidos Mate Larga Duración (Display x24 und)',
        'set-labiales-liquidos-mate-larga-duracion-x24',
        'Display exhibidor con 24 tonos surtidos en tendencia. Alta pigmentación, no transfiere y duración de 16 horas.',
        65000.00,
        120000.00,
        1,
        45,
        TRUE,
        TRUE,
        ARRAY['https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800&q=80']
    ),
    (
        '11111111-1111-1111-1111-111111111111',
        'a2222222-2222-2222-2222-222222222222',
        'BEL-MKP-002',
        'Paleta de Sombras ' || quote_literal('Sunset Paradise') || ' 35 Tonos',
        'paleta-sombras-sunset-paradise-35-tonos',
        'Tonos cálidos, metálicos y mates de altísima pigmentación. Empaque imantado de lujo con espejo.',
        22000.00,
        40000.00,
        3,
        60,
        TRUE,
        FALSE,
        ARRAY['https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80']
    ),
    (
        '11111111-1111-1111-1111-111111111111',
        'a3333333-3333-3333-3333-333333333333',
        'BEL-CAP-001',
        'Tratamiento Termoprotector Capilar con Aceite de Argán 250ml (Caja x6)',
        'termoprotector-capilar-argan-250ml-x6',
        'Blindaje térmico hasta 230°C, sella puntas abiertas y elimina el frizz por humedad. Aroma exquisito de larga fijación.',
        48000.00,
        84000.00,
        1,
        90,
        TRUE,
        TRUE,
        ARRAY['https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=800&q=80']
    ),
    (
        '11111111-1111-1111-1111-111111111111',
        'a4444444-4444-4444-4444-444444444444',
        'BEL-PERF-001',
        'Body Splash Corporal Shimmer ' || quote_literal('Vanilla Diamond') || ' 250ml (Pack x6)',
        'body-splash-shimmer-vanilla-diamond-pack-x6',
        'Loción corporal perfumada con micro-destellos dorados. El producto más vendido en tiendas de variedades y boutiques.',
        54000.00,
        96000.00,
        1,
        70,
        TRUE,
        FALSE,
        ARRAY['https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80']
    )
ON CONFLICT (sku) DO NOTHING;
