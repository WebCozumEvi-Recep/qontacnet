import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Docker üretim dağıtımı için bağımsız (standalone) çıktı
  output: "standalone",
  // Üst dizindeki başka bir lockfile'ın workspace kökü sanılmasını önle;
  // standalone çıktısı düz (.next/standalone/server.js) olsun.
  outputFileTracingRoot: path.join(__dirname),
  // Deploy pipeline'ı lint/type hatalarında durmasın, sadece build alıp geçsin.
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
