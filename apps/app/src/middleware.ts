// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getUser } from "@v1/supabase/queries";
import { logger } from "@v1/logger";


export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Get the authenticated user
  const session  = await getUser()
  logger.info('Session---------')
  if (!session.data.user) {
    logger.info('Is not user')
    return NextResponse.redirect(new URL('/', req.url))
  }

  // If a user exists, proceed to the requested route
  return res;
}

// Optionally, define the routes where the middleware should apply
export const config = {
  matcher: ['/dashboard/:path*'], // Apply to specific routes
};
