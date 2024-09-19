import baseConfig from "@v1/ui/tailwind.config";
import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  presets: [baseConfig],
  theme: {
    extend: {
      fontFamily: {
        courier: ['var(--font-type-courier-regular)'],
        courierBold: ['var(--font-type-courier-bold)']
      }
    }
  }
} satisfies Config;
