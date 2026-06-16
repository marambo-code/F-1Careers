import { redirect } from 'next/navigation'

// The standalone ROI calculator was retired. Financial exposure now lives inside
// the Risk Score. Redirect any old bookmarks or indexed links there.
export default function RoiCalculatorRedirect() {
  redirect('/stay-score')
}
