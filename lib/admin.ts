// Operator/founder allowlist. Override with the ADMIN_EMAILS env var (comma-separated).
const ADMINS = (process.env.ADMIN_EMAILS ?? 'raypat919@gmail.com,raypat919v@gmail.com,calvinmarambo@gmail.com')
  .split(',').map(s => s.trim().toLowerCase()).filter(Boolean)

export function isAdminEmail(email?: string | null): boolean {
  return !!email && ADMINS.includes(email.toLowerCase())
}
