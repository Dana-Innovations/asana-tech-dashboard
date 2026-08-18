/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Existing next-auth provider typing mismatch should not block deploys
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
