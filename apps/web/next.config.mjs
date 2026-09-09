/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@interon/db', '@interon/ui', '@interon/types'],
};

export default nextConfig;
