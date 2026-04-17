export const metadata = { title: 'Terms of Service — F-1 Careers' }

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-8 text-navy">
      <div>
        <h1 className="text-3xl font-bold">Terms of Service</h1>
        <p className="text-mid mt-2 text-sm">Last updated: May 2025</p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <p className="font-bold text-yellow-900 text-sm">⚠️ Not legal advice</p>
        <p className="text-yellow-800 text-sm mt-1 leading-relaxed">
          F-1 Careers provides AI-generated immigration strategy information for educational purposes only. Nothing on this platform constitutes legal advice. Immigration decisions are complex and fact-specific — you should consult a licensed immigration attorney before filing any petition or making any decisions about your immigration status.
        </p>
      </div>

      {[
        {
          title: '1. Acceptance',
          body: `By creating an account or using F-1 Careers, you agree to these Terms. If you do not agree, do not use the service.`,
        },
        {
          title: '2. Description of service',
          body: `F-1 Careers provides AI-generated immigration strategy reports, RFE (Request for Evidence) analysis, Green Card Score assessments, and career move recommendations for individuals navigating EB-1A and EB-2 NIW green card petitions.

These reports are educational tools. They reflect AI analysis based on information you provide and are not legal advice, not legal opinions, and not a guarantee of any immigration outcome.`,
        },
        {
          title: '3. Not legal advice',
          body: `F-1 Careers is not a law firm. We do not provide legal representation, legal advice, or attorney-client relationships. Our reports and recommendations are informational only.

USCIS adjudication is highly fact-specific and subject to change. No AI system can predict immigration outcomes with certainty. Always consult a licensed immigration attorney (such as one accredited by AILA — American Immigration Lawyers Association) before filing a petition.`,
        },
        {
          title: '4. Payments and refunds',
          body: `Strategy reports and RFE analyses are one-time purchases. Due to the nature of AI-generated content (generated immediately upon payment), all sales are final. If a report fails to generate due to a technical error on our end, we will regenerate it or issue a full refund at our discretion.

Pro subscriptions ($29/month) are billed monthly. You may cancel at any time. Cancellation takes effect at the end of the current billing period. We do not issue prorated refunds for partial months.`,
        },
        {
          title: '5. Accuracy of information',
          body: `Our reports are only as accurate as the information you provide. You are responsible for providing truthful and complete answers in questionnaires. Providing false information to influence immigration reports is your responsibility and may have legal consequences if used in actual filings.

Immigration law and USCIS policy change frequently. Our reports reflect information available at the time of generation. Always verify current requirements with USCIS.gov or a licensed attorney.`,
        },
        {
          title: '6. Acceptable use',
          body: `You may not: use the service to generate fraudulent immigration documentation, share your account credentials, attempt to reverse-engineer or scrape our AI outputs at scale, or use the service in any way that violates applicable law.

One account per person. We reserve the right to suspend accounts that abuse the service.`,
        },
        {
          title: '7. Intellectual property',
          body: `The reports generated for your account are yours to use for your personal immigration process. You may not resell, redistribute, or use F-1 Careers outputs to build competing products.

The F-1 Careers platform, code, design, and underlying systems are owned by us.`,
        },
        {
          title: '8. Limitation of liability',
          body: `To the maximum extent permitted by law, F-1 Careers is not liable for any immigration outcome, denial, delay, or loss arising from the use of our reports. Our total liability to you for any claim shall not exceed the amount you paid us in the 3 months preceding the claim.

We are not responsible for decisions made by USCIS, immigration attorneys, or employers based on our outputs.`,
        },
        {
          title: '9. Termination',
          body: `We may suspend or terminate your account if you violate these terms. You may delete your account at any time from your profile. Upon termination, your data is deleted per our Privacy Policy.`,
        },
        {
          title: '10. Governing law',
          body: `These terms are governed by the laws of the State of Delaware, USA. Disputes shall be resolved by binding arbitration under the AAA Consumer Arbitration Rules, except where prohibited by law.`,
        },
        {
          title: '11. Changes to terms',
          body: `We will notify you by email of material changes to these terms. Continued use of the service constitutes acceptance.`,
        },
        {
          title: '12. Contact',
          body: `Questions? Email support@f1careers.app.`,
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
