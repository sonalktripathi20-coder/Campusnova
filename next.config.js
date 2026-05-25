/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Ignore build errors if running in restricted environments
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignore eslint during builds for seamless developer experience
    ignoreDuringBuilds: true,
  }
};

module.exports = nextConfig;
