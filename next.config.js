/** @type {import('next').NextConfig} */
const WorkerPlugin = require("worker-plugin")
const withLess = require("next-with-less")

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  redirects: async () => [
    {
      source: "/",
      destination: "/home",
      permanent: true,
    },
  ],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.plugins.push(
        new WorkerPlugin({
          globalObject: "self",
        })
      )
    }
    config.resolve.alias["roughjs"] = "roughjs/bundled/rough.cjs"
    return config
  },
}

module.exports = withLess(nextConfig)
