/** @type {import('next').NextConfig} */
const isGithubPages = process.env.DEPLOY_TARGET === 'gh-pages';

const nextConfig = {
  reactStrictMode: true,
  ...(isGithubPages && {
    output: 'export',
    basePath: '/babibon',
    images: {
      unoptimized: true,
    },
  }),
  ...(!isGithubPages && {
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: '**',
        },
        {
          protocol: 'http',
          hostname: '**',
        },
      ],
    },
  }),
};

module.exports = nextConfig;
