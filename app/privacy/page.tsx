export const metadata = { title: 'Privacy Policy — F-1 Careers' }

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-8 text-navy">
      <div>
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p className="text-mid mt-2 text-sm">Last updated: May 2025</p>
      </div>

      <p className="text-mid leading-relaxed">
        F-1 Careers ("we", "us", "our") is committed to protecting your personal information. This policy explains what we collect, how we use it, and your rights.
      </p>

      {[
        {
          title: '1. What we collect',
          body: `When you create an account: your email address and password (managed by Supabase Auth).

When you complete a profile: your name, university, degree, field of study, graduation date, visa status, LinkedIn URL, and resume (optional).

When you complete a questionnaire: your answers about your professional background, research contributions, awards, publications, and immigration goals. These responses are used solely to generate your AI reports.

When you subscribe: your payment is processed by Stripe. We do not store card numbers or full payment details — only a Stripe customer ID and subscription status.

When you use the app: we store the reports we generate for you, your Green Card Score history, and AI-generated career moves.`,
        },
        {
          title: '2. How we use your data',
          body: `Your questionnaire responses and profile information are sent to Anthropic's Claude API to generate personalized immigration strategy reports and career recommendations. Anthropic processes this data according to their privacy policy (anthropic.com/privacy).

We use your email to send report-ready notifications. We do not send marketing emails without your consent.

We use Stripe to process subscription payments and one-time report purchases.

We use Supabase (hosted on AWS) to store your data securely with row-level security — your data is only accessible by your account.`,
        },
        {
          title: '3. Third-party processors',
          body: `Anthropic — AI report generation (your questionnaire data is sent to their API)
Stripe — payment processing
Supabase — database and authentication (hosted on AWS)
Vercel — application hosting

We do not sell your data to any third party. We do not use your data for advertising.`,
        },
        {
          title: '4. Data retention',
          body: `Your data is retained for as long as your account is active. If you delete your account, all your personal data, reports, and payment records are permanently deleted within 30 days.

You can delete your account at any time from your Profile page.`,
        },
        {
          title: '5. Your rights',
          body: `You have the right to: access the data we hold about you, correct inaccurate data, request deletion of your data ("right to erasure"), and export your data in a portable format.

To exercise any of these rights, email us at support@f1careers.app or use the delete account feature in your profile.

If you are located in the European Economic Area, you have additional rights under GDPR including the right to lodge a complaint with a supervisory authority.`,
        },
        {
          title: '6. Security',
          body: `All data is transmitted over HTTPS. Your database records are protected by Supabase Row Level Security — meaning your data is inaccessible to other users at the database level. Passwords are hashed and never stored in plain text.

We perform regular security reviews and follow industry best practices for API key management.`,
        },
        {
          title: '7. Cookies',
          body: `We use a single session cookie to keep you logged in. We do not use advertising or tracking cookies. We do not use third-party analytics that profile your behavior across sites.`,
        },
        {
          title: '8. Children',
          body: `F-1 Careers is intended for users 18 years and older. We do not knowingly collect data from children under 13.`,
        },
        {
          title: '9. Changes to this policy',
          body: `We will notify you by email if we make material changes to this policy. Continued use of the service after notification constitutes acceptance of the updated policy.`,
        },
        {
          title: '10. Contact',
          body: `Questions about this policy? Email us at support@f1careers.app.`,
        },
      ].map(({ title, body }) => (
        <div key={title} className="space-y-2">
          <h2 className="font-bold text-lg">{title}</h2>
          {body.split('\n\n').map((para, i) => (
            <p key={i} className="text-mid leading-relaxed text-sm">{para}</p>
          ))}
        </div>
      ))}
    </div>
  )
}
