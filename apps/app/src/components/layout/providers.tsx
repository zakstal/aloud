'use client';
import React from 'react';
import ThemeProvider from './ThemeToggle/theme-provider';
// import { SessionProvider, SessionProviderProps } from 'next-auth/react';
import { SessionProvider } from "@v1/supabase/supbaseSessionContext";
import { Session } from "@supabase/supabase-js";
export default function Providers({
  session,
  children
}: {
  session: Session;
  children: React.ReactNode;
}) {
  return (
    <>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <SessionProvider>{children}</SessionProvider>
        {/* {children} */}
      </ThemeProvider>
    </>
  );
}
