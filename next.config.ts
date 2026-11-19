import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    qualities: [75, 90],
    formats: ["image/avif", "image/webp"],
    localPatterns: [{ pathname: "/brand/**" }, { pathname: "/catalogue/**" }],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "wptcofcimxqkznqdpjbr.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "wptcofcimxqkznqdpjbr.supabase.co",
        pathname: "/storage/v1/object/sign/**",
      },
    ],
  },
};

export default nextConfig;
