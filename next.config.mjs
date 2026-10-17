// Site estatico para o GitHub Pages. SITE_BASE_PATH = "/site" no Pages de projeto
// (usuario.github.io/site); vazio com dominio proprio.
const base = process.env.SITE_BASE_PATH || '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  ...(base ? { basePath: base, assetPrefix: base } : {}),
  reactStrictMode: true,
};

export default nextConfig;
