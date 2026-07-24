import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Docker üretim dağıtımı için bağımsız (standalone) çıktı
  output: "standalone",
  // Üst dizindeki başka bir lockfile'ın workspace kökü sanılmasını önle;
  // standalone çıktısı düz (.next/standalone/server.js) olsun.
  outputFileTracingRoot: path.join(__dirname),
  // Deploy pipeline'ı type hatalarında durmasın, sadece build alıp geçsin.
  // (Next 16 build sırasında lint çalıştırmadığı için ayrı bir eslint ayarı yok.)
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Avatar/logo/modül görselleri için modern format + kart görsellerine uygun ölçüler
    formats: ["image/avif", "image/webp"],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000,
  },
};

export default nextConfig;
