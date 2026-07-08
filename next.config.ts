import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Security + SEO headers applied to every route.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        // Keep /admin out of search engines.
        source: "/admin",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        // Never index the API surface.
        source: "/api/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },

  // Canonical host: redirect www -> apex so all equity consolidates on one host.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.matchdesks.com" }],
        destination: "https://matchdesks.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
