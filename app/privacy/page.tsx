import Link from 'next/link'

export const metadata = { title: 'Privacy Policy, F-1 Careers' }

const SECTIONS = [
  {
    title: '1. Who we are',
    body: `F-1 Careers ("we", "us", "our") is an immigration strategy platform for international students and professionals navigating F-1, OPT, H-1B, L-1, and EB-2 NIW / EB-1A pathways in the United States. Our services include a free public Risk Score tool, AI-generated immigration strategy reports, and employer workforce audit services.`,
  },
  {
    title: '2. What we collect',
    subsections: [
      {
        label: 'Public tools (no account required)',
        text: `When you use our free Risk Score or ROI Calculator tools, we do not collect personally identifiable information. We collect anonymous, aggregated usage data (e.g., country distributions, visa type distributions) to improve the tools. No questionnaire answers are stored or linked to any individual.`,
      },
      {
        label: 'Account creation',
        text: `When you create an account: your email address and password (managed by Supabase Auth). Passwords are hashed and never stored in plain text.`,
      },
      {
        label: 'Profile and questionnaire',
        text: `When you complete a profile: your name, university, degree, field of study, graduation date, visa status, current employer, job title, LinkedIn URL, and resume (optional). When you complete a questionnaire, your professional background, research contributions, awards, publications, and immigration goals are used to generate your AI strategy reports. These responses are stored in your account.`,
      },
      {
        label: 'Payments',
        text: `When you subscribe or purchase a report, your payment is processed by Stripe. We do not store card numbers or full payment details, only a Stripe customer ID and subscription status.`,
      },
      {
        label: 'Employer leads',
        text: `When your company submits a workforce audit request, we collect your company name, contact name, work email, company size, and optional message. This information is used solely to respond to your inquiry.`,
      },
    ],
  },
  {
    title: '3. How we use your data',
    body: `Your questionnaire responses and profile information are sent to Anthropic's Claude API to generate personalized immigration strategy reports and career recommendations. Anthropic processes this data according to their privacy policy at anthropic.com/privacy.

We use your email to send report-ready notifications and service updates. We do not send marketing emails without your explicit consent.

We use Stripe to process subscription payments and one-time report purchases.

We use Supabase (hosted on AWS) to store your data securely with row-level security, your data is accessible only by your account.`,
  },
  {
    title: '4. Third-party processors',
    body: `Anthropic, AI report generation (your questionnaire data is sent to their API)
Stripe, payment processing
Supabase, database and authentication (hosted on AWS)
Vercel, application hosting

We do not sell your data to any third party. We do not use your data for advertising.`,
  },
  {
    title: '5. Data retention',
    body: `Your data is retained for as long as your account is active. If you delete your account, all your personal data, reports, and payment records are permanently deleted within 30 days.

You can delete your account at any time from your Profile page.

Anonymous usage data from public tools (Risk Score, ROI Calculator) is retained indefinitely in aggregate form only.`,
  },
  {
    title: '6. Your rights',
    body: `You have the right to: access the data we hold about you, correct inaccurate data, request deletion of your data ("right to erasure"), and export your data in a portable format.

To exercise any of these rights, email us at support@f1careers.app or use the delete account feature in your profile.

If you are located in the European Economic Area, you have additional rights under GDPR including the right to lodge a complaint with a supervisory authority.`,
  },
  {
    title: '7. Security',
    body: `All data is transmitted over HTTPS. Your database records are protected by Supabase Row Level Security, meaning your data is inaccessible to other users at the database level. Passwords are hashed and never stored in plain text.

We follow industry best practices for API key management and perform regular security reviews.`,
  },
  {
    title: '8. Cookies',
    body: `We use a single session cookie to keep you logged in. We do not use advertising or tracking cookies. We do not use third-party analytics that profile your behavior across sites.`,
  },
  {
    title: '9. Children',
    body: `F-1 Careers is intended for users 18 years and older. We do not knowingly collect data from children under 13. If you believe we have inadvertently collected information from a minor, contact us at support@f1careers.app and we will delete it promptly.`,
  },
  {
    title: '10. Changes to this policy',
    body: `We will notify you by email if we make material changes to this policy. Continued use of the service after notification constitutes acceptance of the updated policy. The date at the top of this page always reflects the most recent revision.`,
  },
  {
    title: '11. Contact',
    body: `Questions about this policy? Email us at support@f1careers.app.`,
  },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-navy font-bold text-lg">F-1 Careers</Link>
          <div className="flex items-center gap-4">
            <Link href="/stay-score" className="text-sm text-mid hover:text-navy">Risk Score</Link>
            <Link href="/login" className="text-sm text-teal font-semibold hover:underline">Sign in →</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-8 text-navy">
        <div>
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="text-mid mt-2 text-sm">Last updated: May 26, 2026</p>
        </div>

        <p className="text-mid leading-relaxed text-sm">
          F-1 Careers is committed to protecting your personal information. This policy explains what we collect, how we use it, and your rights. We designed this service for a community that often has significant concerns about data privacy, we take that seriously.
        </p>

        {SECTIONS.map(({ title, body, subsections }) => (
          <div key={title} className="space-y-3">
            <h2 className="font-bold text-lg">{title}</h2>
            {subsections ? (
              <div className="space-y-4">
                {subsections.map(({ label, text }) => (
                  <div key={label}>
                    <p className="text-sm font-semibold text-navy mb-1">{label}</p>
                    <p className="text-mid leading-relaxed text-sm">{text}</p>
                  </div>
                ))}
              </div>
            ) : (
              body!.split('\n\n').map((para, i) => (
                <p key={i} className="text-mid leading-relaxed text-sm">{para}</p>
              ))
            )}
          </div>
        ))}
      </div>

      <footer className="border-t border-gray-200 bg-white py-6 text-center text-xs text-mid">
        <p>© 2026 F-1 Careers · Not legal advice · <Link href="/" className="text-teal hover:underline">Home</Link> · <Link href="/terms" className="text-teal hover:underline">Terms</Link></p>
      </footer>
    </div>
  )
}
