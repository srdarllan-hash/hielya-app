/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: [
    '@hielya/application',
    '@hielya/design-tokens',
    '@hielya/persistence',
    '@hielya/ui',
  ],
};
export default nextConfig;
