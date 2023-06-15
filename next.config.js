/** @type {import('next').NextConfig} */

const webpack = require('webpack');
const withPWA = require('next-pwa');
const runtimeCaching = require('next-pwa/cache');
require('dotenv').config();


module.exports = withPWA({
  env: {
    URL: process.env.URL,
    TWITTER: process.env.TWITTER,
    DISCORD: process.env.DISCORD,
    RPC_URL: process.env.RPC_URL,
  },
  reactStrictMode: true,
  pwa: {
    dest: 'public',
    disable: process.env.NODE_ENV === 'development',
    runtimeCaching,
  },
  ...(process.env.NODE_ENV === 'production' && {
    typescript: {
      ignoreBuildErrors: true,
    },
    eslint: {
      ignoreDuringBuilds: true,
    },
  }),
  webpack5: true,
  webpack: (config, options) => {
    config.ignoreWarnings = [/Failed to parse source map/];
    const fallback = config.resolve.fallback || {};
    Object.assign(fallback, {
      stream: require.resolve('stream-browserify'),
      fs: require.resolve('browserify-fs'),
    });
    config.resolve.fallback = fallback;
    config.plugins = (config.plugins || []).concat([
      new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer'],
      }),
    ]);
    const experiments = config.experiments || {};
    Object.assign(experiments, {
      asyncWebAssembly: true,
      syncWebAssembly: true,
    });
    config.experiments = experiments;
    const alias = config.resolve.alias || {};
    Object.assign(alias, {
      react$: require.resolve('react'),
    });
    config.resolve.alias = alias;
    return config;
  },
});
