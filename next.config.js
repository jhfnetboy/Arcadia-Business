/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb'
    }
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ntsjepamqixrxjzdnidv.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    domains: [
      'lh3.googleusercontent.com', // Google用户头像
      'avatars.githubusercontent.com', // GitHub头像
      'platform-lookaside.fbsbx.com', // Facebook头像
      'pbs.twimg.com', // Twitter头像
      'cdn.discordapp.com', // Discord头像
      'api.dicebear.com' // DiceBear API
    ]
  }
}

module.exports = nextConfig
