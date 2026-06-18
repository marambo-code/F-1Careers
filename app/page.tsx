import { redirect } from 'next/navigation'

// The live homepage is the design served from /public/home.html via middleware
// (see middleware.ts: "/" is rewritten there, or redirected to /dashboard when
// signed in). This route is a fallback only and is normally never reached.
// The previous React homepage now lives at /test.
export default function HomeFallback() {
  redirect('/home.html')
}
