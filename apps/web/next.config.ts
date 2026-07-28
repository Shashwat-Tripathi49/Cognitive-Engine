import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@cognitive-engine/shared', '@cognitive-engine/ui'],
  outputFileTracingRoot: path.join(__dirname, '../../'),
};

export default nextConfig;
