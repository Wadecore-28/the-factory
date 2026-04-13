import type { NextConfig } from "next";

// Transpile ESM-heavy deps so Webpack does not emit broken client chunks
// ("__webpack_modules__[moduleId] is not a function" in dev).
const nextConfig: NextConfig = {
  transpilePackages: [
    "@supabase/ssr",
    "@supabase/supabase-js",
    "react-zoom-pan-pinch",
  ],
  async redirects() {
    return [
      { source: "/dashboard", destination: "/", permanent: false },
      { source: "/factory", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;