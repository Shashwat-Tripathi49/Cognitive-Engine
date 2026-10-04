import { NextResponse } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Public routes — sign-in and sign-up are always accessible
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

export default clerkMiddleware(
  async (auth, request) => {
    const { userId } = await auth();
    const { pathname } = request.nextUrl;

    // If already authenticated and visiting sign-in or sign-up, redirect to root dashboard
    if (userId && (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up'))) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // If not authenticated and visiting protected route, explicitly redirect to /sign-in
    if (!isPublicRoute(request)) {
      if (!userId) {
        const signInUrl = new URL('/sign-in', request.url);
        if (pathname !== '/') {
          signInUrl.searchParams.set('redirect_url', request.url);
        }
        return NextResponse.redirect(signInUrl);
      }
      await auth.protect();
    }
  },
  {
    signInUrl: '/sign-in',
    signUpUrl: '/sign-up',
  }
);

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
