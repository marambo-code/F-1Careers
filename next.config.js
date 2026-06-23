/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pdf-parse'],
  // Ensure the legal Markdown source files are bundled for the routes that read them.
  outputFileTracingIncludes: {
    '/privacy': ['./legal/privacy-policy.md'],
    '/terms': ['./legal/terms-of-service.md'],
  },
}

module.exports = nextConfig
