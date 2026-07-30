/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ['@hielya/ui', '@hielya/design-tokens'],
};
export default nextConfig;
