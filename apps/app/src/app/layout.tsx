import Providers from '@/components/layout/providers';
import { Toaster } from '@/components/ui/toaster';
import '@uploadthing/react/styles.css';
import type { Metadata } from 'next';
import NextTopLoader from 'nextjs-toploader';
import { Inter } from 'next/font/google';
import './globals.css';
// import { auth } from '@/auth';
import localFont from '@next/font/local'
import { getUser } from "@v1/supabase/queries";
import { redirect } from 'next/navigation'

const inter = Inter({ subsets: ['latin'] });

const courierPrime = localFont({
  src: [
    {
      path: '../../public/fonts/Courier_Prime/CourierPrime-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Courier_Prime/CourierPrime-Bold.ttf',
      weight: '700',
      style: 'normal',
    },

  ],
  variable: '--font-type-courier-regular'
})

export const metadata: Metadata = {
  title: 'Aloud',
  description: 'Aloud script app'
};

export default async function RootLayout({
  children
}: {
  children: any;
  // children: React.ReactNode;
}) {
  // const session = await getUser();

  // console.log("session-------", session)
 
  return (
    <html lang="en" className={`${courierPrime.variable} font-courierprime`}>
      <body
        className={`${inter.className} overflow-hidden `}
        suppressHydrationWarning={true}
      >
        <NextTopLoader showSpinner={false} />
        {/* <Providers session={session}> */}
          <Toaster />
          {children}
        {/* </Providers> */}
      </body>
    </html>
  );
}
