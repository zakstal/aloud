import Providers from '@/components/layout/providers';
import { Toaster } from '@/components/ui/toaster';
import '@uploadthing/react/styles.css';
import type { Metadata } from 'next';
import NextTopLoader from 'nextjs-toploader';
import { Inter } from 'next/font/google';
import './globals.css';
// import { auth } from '@/auth';
import localFont from '@next/font/local'
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
  title: 'Next Shadcn',
  description: 'Basic dashboard with Next.js and Shadcn'
};

export default async function RootLayout({
  children
}: {
  children: any;
  // children: React.ReactNode;
}) {
  const session = {
    user: {
      name: 'zak',
      image: '',
      email: 'ssdf@me.com'
    },
    expires: 'never'
  };
  // const session = await auth();
  // const session = await getUser();
  return (
    <html lang="en" className={`${courierPrime.variable} font-courierprime`}>
      <body
        className={`${inter.className} overflow-hidden `}
        suppressHydrationWarning={true}
      >
        <NextTopLoader showSpinner={false} />
        <Providers session={session}>
          <Toaster />
          {children}
        </Providers>
      </body>
    </html>
  );
}
