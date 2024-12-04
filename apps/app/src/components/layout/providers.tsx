'use client';
import React from 'react';
import ThemeProvider from './ThemeToggle/theme-provider';
// import { SessionProvider, SessionProviderProps } from 'next-auth/react';
import { SessionProvider } from "@v1/supabase/supbaseSessionContext";
import { ScriptMetaProvider } from "@/components/scriptEditor2/scriptMetaContext";
import { Session } from "@supabase/supabase-js";
export default function Providers({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <ScriptMetaProvider>
          <SessionProvider>
            {children}
          </SessionProvider>
        </ScriptMetaProvider>
        {/* {children} */}
      </ThemeProvider>
    </>
  );
}
