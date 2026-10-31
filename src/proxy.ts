import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // Si no está configurado Supabase aún (modo preview local), permitir la navegación
  if (!supabaseUrl || supabaseUrl.includes('placeholder-project')) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options as CookieOptions)
        );
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // Proteger rutas /admin y /worker
  if (path.startsWith('/admin') || path.startsWith('/worker')) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', path);
      return NextResponse.redirect(loginUrl);
    }

    // Consultar el rol del usuario en profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.is_active) {
      return NextResponse.redirect(new URL('/login?error=account_inactive', request.url));
    }

    // Validación de acceso a /admin (solo admin)
    if (path.startsWith('/admin') && profile.role !== 'admin') {
      return NextResponse.redirect(new URL('/worker', request.url));
    }

    // Validación de acceso a /worker (admin o worker)
    if (path.startsWith('/worker') && profile.role !== 'admin' && profile.role !== 'worker') {
      return NextResponse.redirect(new URL('/?error=unauthorized', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/worker/:path*', '/auth/:path*'],
};
