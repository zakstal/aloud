import "./src/env.mjs";
import { withSentryConfig } from "@sentry/nextjs";
import CopyPlugin from'copy-webpack-plugin';

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
      // Note: we provide webpack above so you should not `require` it
      // Perform customizations to webpack config
      config.plugins.push(
          new CopyPlugin({
              patterns: [
                  {
                      from: './bin/xpdf-wasm',
                      to: './.next/server/xpdf-wasm',
                  },
              ],
          })
      )

      // Important: return the modified config
      return config
  },
  distDir: 'build',
  transpilePackages: ["@v1/supabase"],
  experimental: {
    instrumentationHook: process.env.NODE_ENV === "production",
  },
  images: {
    domains: ['utfs.io']
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
  },
  compiler: {
    removeConsole: false,
  },
};

export default withSentryConfig(nextConfig, {
  silent: !process.env.CI,
  telemetry: false,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  tunnelRoute: "/monitoring",
});
