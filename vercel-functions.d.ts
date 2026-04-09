// Minimal type declaration for @vercel/functions
// The real package is installed during Vercel deployment via package.json
declare module '@vercel/functions' {
  /**
   * Extend the lifetime of the serverless function beyond the HTTP response.
   * Vercel will keep the Lambda alive until the promise resolves (up to maxDuration).
   */
  export function waitUntil(promise: Promise<unknown>): void
}
