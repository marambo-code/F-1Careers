import Link from 'next/link'

export const metadata = { title: 'Terms of Service, F-1 Careers' }

const SECTIONS = [
  {
    title: '1. Acceptance',
    body: `By creating an account, purchasing a report, or using any part of F-1 Careers, including the free public Risk Score and ROI Calculator tools, you agree to these Terms. If you do not agree, do not use the service.`,
  },
  {
    title: '2. Description of service',
    body: `F-1 Careers provides:

Free public tools, the Immigration Risk Score (assesses your risk profile under current immigration policy including USCIS PM-602-0199) and the NIW ROI Calculator (estimates financial exposure of delaying green card filing).

AI-generated reports (account required), personalized Green Card Strategy reports and RFE (Request for Evidence) analyses based on questionnaire responses.

Employer workforce audit services, immigration risk assessments and NIW eligibility scoring for companies with international employees.

All outputs are educational tools. They reflect AI analysis based on information you provide and are not legal advice, not legal opinions, and not a guarantee of any immigration outcome.`,
  },
  {
    title: '3. Not legal advice, please read carefully',
    body: `F-1 Careers is not a law firm. We do not provide legal representation, legal advice, or attorney-client relationships of any kind. No use of this platform creates an attorney-client relationship.

Our reports, scores, and recommendations are informational only. They are designed to help you understand your situation and prepare for conversations with licensed legal counsel.

Immigration law is highly fact-specific and subject to rapid change. USCIS policy, including the discretionary adjustment of status standard under PM-602-0199 (May 21, 2026), the ending of Duration of Status for F-1 holders, and consular processing restrictions, can change without notice. No AI system can predict immigration outcomes with certainty.

Always consult a licensed immigration attorney accredited by AILA (American Immigration Lawyers Association) before filing any petition, changing your status, or making any decisions about your immigration situation.`,
  },
  {
    title: '4. Payments and refunds',
    body: `One-time report purchases: Green Card Strategy reports ($297) and RFE analyses ($297) are generated immediately upon payment. Due to the instant delivery of AI-generated content, all sales are final. If a report fails to generate due to a technical error on our end, we will regenerate it or issue a full refund at our discretion.

Pro subscriptions: Monthly plans ($49/month) and annual plans ($399/year) are billed on the selected cycle. You may cancel at any time from your Profile page. Cancellation takes effect at the end of the current billing period. We do not issue prorated refunds for partial months or years.

Employer audit services are billed per the pricing agreed at the time of engagement. Enterprise contracts are governed by a separate agreement.`,
  },
  {
    title: '5. Accuracy of information',
    body: `Our reports and scores are only as accurate as the information you provide. You are responsible for providing truthful and complete answers in questionnaires and profile fields.

Providing false information to generate immigration reports, and then using those outputs in actual filings, is your legal responsibility and may constitute fraud in an immigration proceeding.

Immigration law and USCIS policy change frequently. Our tools and reports reflect information available at the time of generation. The free Risk Score tool includes a model version stamp indicating the policy date of its scoring engine. Always verify current requirements with USCIS.gov or a licensed attorney.`,
  },
  {
    title: '6. Acceptable use',
    body: `You agree not to: use the service to generate fraudulent immigration documentation, share account credentials, attempt to reverse-engineer or scrape AI outputs at scale, use automated tools to bulk-query the Risk Score or ROI Calculator, or use the service in any way that violates applicable federal, state, or local law.

One account per person. We reserve the right to suspend accounts that abuse the service without refund.`,
  },
  {
    title: '7. Intellectual property',
    body: `Reports generated for your account are yours to use for your personal immigration process. You may share them with your immigration attorney.

You may not resell, redistribute, publish, or use F-1 Careers outputs to build competing products or services.

The F-1 Careers platform, branding, code, design, scoring algorithms, and underlying systems are our exclusive property.`,
  },
  {
    title: '8. Disclaimer of warranties',
    body: `The service is provided "as is" and "as available" without warranties of any kind, express or implied. We do not warrant that the service will be uninterrupted, error-free, or that any particular immigration outcome will result from using our reports.

Immigration policy, including USCIS adjudication standards, travel ban designations, and immigrant visa processing availability, can change at any time. We make reasonable efforts to keep our tools current but cannot guarantee real-time accuracy.`,
  },
  {
    title: '9. Limitation of liability',
    body: `To the maximum extent permitted by applicable law, F-1 Careers, its owners, employees, and contractors are not liable for any immigration outcome, denial, delay, deportation, or financial loss arising from the use of our reports, scores, or recommendations.

Our total liability to you for any claim shall not exceed the total amount you paid us in the 3 months preceding the claim.

We are not responsible for decisions made by USCIS, immigration judges, consular officers, immigration attorneys, or employers based on our outputs.`,
  },
  {
    title: '10. Termination',
    body: `We may suspend or terminate your account and access to the service if you violate these terms, with or without prior notice. You may delete your account at any time from your Profile page. Upon account deletion, your data is deleted per our Privacy Policy.`,
  },
  {
    title: '11. Governing law and dispute resolution',
    body: `These terms are governed by the laws of the State of Delaware, United States, without regard to conflict of law principles.

Any dispute arising out of or related to these terms or the service shall first be attempted to be resolved through good-faith negotiation. If unresolved, disputes shall be resolved by binding arbitration under the American Arbitration Association Consumer Arbitration Rules, except where prohibited by law.

You waive any right to a jury trial or to participate in a class action lawsuit relating to the service.`,
  },
  {
    title: '12. Changes to terms',
    body: `We will notify registered users by email of material changes to these terms. Continued use of the service after notification constitutes acceptance of the updated terms. The date at the top of this page always reflects the most recent revision.`,
  },
  {
    title: '13. Contact',
    body: `Questions about these terms? Email support@f1careers.app.`,
  },
]

export default function TermsPage() {
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
          <h1 className="text-3xl font-bold">Terms of Service</h1>
          <p className="text-mid mt-2 text-sm">Last updated: May 26, 2026</p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="font-bold text-yellow-900 text-sm">⚠️ Not legal advice</p>
          <p className="text-yellow-800 text-sm mt-1 leading-relaxed">
            F-1 Careers provides AI-generated immigration strategy information for educational purposes only. Nothing on this platform constitutes legal advice or creates an attorney-client relationship. Immigration decisions are complex, fact-specific, and subject to rapid policy change, including USCIS PM-602-0199 (May 2026) which makes adjustment of status officially discretionary. Always consult a licensed immigration attorney before filing any petition or making decisions about your immigration status.
          </p>
        </div>

        {SECTIONS.map(({ title, body }) => (
          <div key={title} className="space-y-2">
            <h2 className="font-bold text-lg">{title}</h2>
            {body.split('\n\n').map((para, i) => (
              <p key={i} className="text-mid leading-relaxed text-sm">{para}</p>
            ))}
          </div>
        ))}
      </div>

      <footer className="border-t border-gray-200 bg-white py-6 text-center text-xs text-mid">
        <p>© 2026 F-1 Careers · Not legal advice · <Link href="/" className="text-teal hover:underline">Home</Link> · <Link href="/privacy" className="text-teal hover:underline">Privacy Policy</Link></p>
      </footer>
    </div>
  )
}
