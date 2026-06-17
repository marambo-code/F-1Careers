import { redirect } from 'next/navigation'

// The /test homepage redesign is served as a self-contained, interactive static
// file at /public/test-home.html (verified via headless screenshots). This route
// redirects there so /test keeps working. Delete this folder + the html to revert.
export default function TestRedirect() {
  redirect('/test-home.html')
}
