import type { Metadata } from 'next'
import { getPrecedentData } from '@/lib/precedent/queries'
import PrecedentEngineClient from '@/components/precedent/PrecedentEngineClient'

export const metadata: Metadata = {
  title: 'Precedent Engine | F-1 Careers',
  description:
    'How USCIS actually decides EB-1A and EB-2 NIW self-petitions, decoded from thousands of real Administrative Appeals Office decisions.',
}

export const dynamic = 'force-dynamic'

export default async function PrecedentEnginePage() {
  const data = await getPrecedentData()
  return <PrecedentEngineClient data={data} />
}
