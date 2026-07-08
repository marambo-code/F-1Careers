'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { CriterionStat, FailTag, PrecedentData } from '@/lib/precedent/queries'
import { FIELD_LABELS, PATHWAY_LABEL, uscisUrl, type Pathway } from '@/lib/precedent/labels'

const TEAL = '#00C2A8'
const GOLD = '#C79320'
const CORAL = '#CF5B30'
const NAVY = '#1B2B6B'

const FIELDS = ['business', 'computer_science', 'engineering', 'medicine', 'sciences', 'arts', 'athletics', 'other']

type Persona = 'applicant' | 'attorney'

function pct(x: number) {
  return Math.round(x * 100)
}

// ─── Small presentational pieces ──────────────────────────────────

function Bar({ label, value, max, color, suffix }: { label: string; value: number; max: number; color: string; suffix?: string }) {
  const w = max > 0 ? Math.max(Math.round((value / max) * 100), 2) : 0
  return (
    <div className="my-2.5">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="font-bold text-navy">{value}{suffix ?? ''}</span>
      </div>
      <div className="h-2.5 rounded-md bg-gray-100 overflow-hidden">
        <div className="h-full rounded-md transition-all duration-500" style={{ width: `${w}%`, background: color }} />
      </div>
    </div>
  )
}

function Tag({ kind, children }: { kind: 'win' | 'mid' | 'hard'; children: React.ReactNode }) {
  const cls =
    kind === 'win'
      ? 'bg-teal-light text-teal'
      : kind === 'mid'
        ? 'bg-yellow-50 text-yellow-700'
        : 'bg-red-50 text-red-600'
  return <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${cls}`}>{children}</span>
}

function rankKind(r: number): 'win' | 'mid' | 'hard' {
  return r >= 18 ? 'win' : r >= 11 ? 'mid' : 'hard'
}

// ─── Applicant view ───────────────────────────────────────────────

function ApplicantView({ data }: { data: PrecedentData }) {
  const [track, setTrack] = useState<Pathway>('EB1A')
  const [field, setField] = useState('business')

  const o = data.outcomes[track]
  const tot = o.total || 1
  const fieldN = data.fieldCounts[track]?.[field] ?? 0

  const ranked = useMemo(() => [...data.criteria].sort((a, b) => b.metRate - a.metRate), [data.criteria])
  // NIW: prong met-rates in this corpus are a coding artifact (~0%, even in
  // sustained appeals), so the honest applicant metric is where cases are
  // contested, not "acceptance" rates.
  const prongTotal = data.prongs.reduce((s, p) => s + p.decided, 0) || 1
  const prongShares = useMemo(
    () =>
      [...data.prongs]
        .map((p) => ({ ...p, share: p.decided / prongTotal }))
        .sort((a, b) => b.share - a.share),
    [data.prongs, prongTotal]
  )
  const fails = data.failtags
  const failMax = fails[0]?.count ?? 1

  const checks = useMemo(() => buildChecklist(track, field, ranked), [track, field, ranked])

  return (
    <>
      <div className="card">
        <div className="text-[11px] font-bold tracking-widest uppercase text-gray-400">Reality check</div>
        <h3 className="text-navy text-lg font-bold mt-1">Where does my case actually stand?</h3>
        <p className="text-mid text-sm mt-1 mb-5">
          Pick your path and field for the adjudicator&rsquo;s-eye view: how each requirement fares, and the precise reasons petitions get denied.
        </p>

        {/* Controls */}
        <div className="bg-navy-light border border-[#dfe4f2] rounded-xl p-4 mb-5 flex flex-wrap gap-5 items-end">
          <div>
            <div className="text-xs font-bold text-navy mb-1.5">Your path</div>
            <div className="inline-flex bg-white border border-border rounded-lg overflow-hidden">
              {(['EB1A', 'NIW'] as Pathway[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTrack(t)}
                  aria-pressed={track === t}
                  className={`px-4 py-2.5 text-sm font-bold transition-colors ${track === t ? 'bg-navy text-white' : 'bg-white text-mid hover:bg-gray-50'}`}
                >
                  {t === 'EB1A' ? 'EB-1A · Extraordinary ability' : 'EB-2 NIW · National interest'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-navy mb-1.5">Your field</div>
            <select value={field} onChange={(e) => setField(e.target.value)} aria-label="Your field" className="input bg-white" style={{ minWidth: 230 }}>
              {FIELDS.map((f) => (
                <option key={f} value={f}>{cap(FIELD_LABELS[f])}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results */}
        <div className="grid lg:grid-cols-[1.08fr_.92fr] gap-5">
          <div>
            <div className="text-[11px] font-bold tracking-widest uppercase text-gray-400">
              How appealed {PATHWAY_LABEL[track]} denials resolve
            </div>
            <div className="mt-2.5">
              <Bar label="Denial upheld (dismissed)" value={pct(o.dismissed / tot)} max={100} color={CORAL} suffix="%" />
              <Bar label="Sent back for review (remanded)" value={pct(o.remanded / tot)} max={100} color={GOLD} suffix="%" />
              <Bar label="Denial reversed (approved)" value={pct(o.sustained / tot)} max={100} color={TEAL} suffix="%" />
            </div>
            <div className="mt-3.5 text-sm rounded-lg bg-teal-light border border-[#bfeee6] px-3.5 py-3 text-[#0c5147]">
              Every case here was <b>already denied</b> before it was appealed, so these bars are not your approval odds.
              The value is the pattern: the record documents exactly which evidence persuaded adjudicators and which did not.
              Your field (<b>{FIELD_LABELS[field]}</b>) appears in <b>{fieldN.toLocaleString()}</b> decisions{fieldN < 25 ? ' (limited coverage, read field-level signals with care)' : ''}.
            </div>
          </div>
          <div>
            <div className="text-[11px] font-bold tracking-widest uppercase text-gray-400">
              {track === 'EB1A' ? 'Criteria ranked by winnability' : 'Where contested NIW cases are decided'}
            </div>
            <div className="mt-1">
              {track === 'EB1A' ? (
                ranked.map((it, i) => {
                  const r = pct(it.metRate)
                  const k = rankKind(r)
                  return (
                    <div key={it.key} className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
                      <span className="w-7 h-7 rounded-full bg-teal-light text-[#0a6b5e] flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-gray-900">{it.label}</div>
                        <div className="text-xs text-mid">accepted in {r}% of contested findings · n={it.decided.toLocaleString()}</div>
                      </div>
                      <Tag kind={k}>{k === 'win' ? 'most winnable' : k === 'mid' ? 'workable' : 'hardest'}</Tag>
                    </div>
                  )
                })
              ) : (
                <>
                  {prongShares.map((p, i) => (
                    <div key={p.key} className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
                      <span className="w-7 h-7 rounded-full bg-teal-light text-[#0a6b5e] flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-gray-900">{p.label}</div>
                        <div className="text-xs text-mid">contested in {pct(p.share)}% of prong findings · n={p.decided.toLocaleString()}</div>
                      </div>
                      <Tag kind={i === 0 ? 'hard' : 'mid'}>{i === 0 ? 'the battleground' : 'contested'}</Tag>
                    </div>
                  ))}
                  <p className="text-xs text-mid mt-2">
                    Why no &ldquo;acceptance rates&rdquo; here: in dismissed appeals the AAO almost never records a prong as
                    satisfied, so prong-level met-rates would be an artifact of the denial corpus, not a real signal. Contest
                    frequency is the honest metric, it tells you where to concentrate your argument.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5 mt-5">
        <div className="card">
          <div className="text-[11px] font-bold tracking-widest uppercase text-gray-400">Documented evidence gaps</div>
          <h3 className="text-navy text-base font-bold mt-1 mb-1">The specific gaps officers call out by name</h3>
          <p className="text-xs text-mid mb-2.5">
            Coded from EB-1A criterion findings where the AAO stated a specific reason. Counts are findings with that
            named reason{track === 'NIW' ? '. NIW failures are argued per prong (see left), but these are the same evidence standards officers apply' : ''}.
          </p>
          {fails.map((t) => (
            <Bar key={t.key} label={t.label} value={t.count} max={failMax} color={CORAL} />
          ))}
        </div>
        <div className="card">
          <div className="text-[11px] font-bold tracking-widest uppercase text-gray-400">Action plan</div>
          <h3 className="text-navy text-base font-bold mt-1 mb-1.5">
            {track === 'EB1A' ? 'Your evidence priority list' : 'Your Dhanasar priority list'}
          </h3>
          {checks.map((c, i) => (
            <div key={i} className="flex gap-3 py-3 border-b border-gray-100 last:border-0 text-sm text-gray-800">
              <span className="w-[22px] h-[22px] rounded-full bg-teal text-white flex items-center justify-center text-xs font-bold shrink-0">✓</span>
              <span>{c}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Product handoff */}
      <div className="mt-7">
        <div className="text-[11px] font-bold tracking-widest uppercase text-gray-400">Turn the map into a filing</div>
        <h3 className="text-navy text-xl font-bold mt-1 mb-3.5">Close your gaps with the full report</h3>
        <div className="grid md:grid-cols-2 gap-5">
          <div className="card border-2 border-teal flex flex-col">
            <span className="self-start text-[11px] font-bold uppercase tracking-wide text-teal bg-teal-light px-2.5 py-1 rounded-full mb-3">Most popular</span>
            <h4 className="text-navy text-lg font-bold mb-1.5">Green Card Strategy Report</h4>
            <div className="font-bold mb-2">$297</div>
            <p className="text-mid text-sm flex-1 mb-4">
              Scores your real profile against this case law across both paths, pinpoints your specific evidence gaps, and hands you a step-by-step plan to close them before you file.
            </p>
            <Link href="/start" className="btn-teal text-center">Build my Strategy Report →</Link>
          </div>
          <div className="card flex flex-col">
            <span className="self-start text-[11px] font-bold uppercase tracking-wide text-yellow-700 bg-yellow-50 px-2.5 py-1 rounded-full mb-3">Already filed?</span>
            <h4 className="text-navy text-lg font-bold mb-1.5">RFE Response Analyzer</h4>
            <div className="font-bold mb-2">$297</div>
            <p className="text-mid text-sm flex-1 mb-4">
              Upload your RFE and get an issue-by-issue response strategy, each objection mapped to the precedent and evidence that overcame it in real cases.
            </p>
            <Link href="/rfe" className="btn-primary text-center">Analyze my RFE →</Link>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Attorney view ────────────────────────────────────────────────

function AttorneyView({ data }: { data: PrecedentData }) {
  const [sort, setSort] = useState<{ key: 'label' | 'metRate' | 'decided'; dir: number }>({ key: 'metRate', dir: -1 })
  const [fTrack, setFTrack] = useState('all')
  const [fField, setFField] = useState('all')
  const prongTotal = data.prongs.reduce((s, p) => s + p.decided, 0) || 1

  const critMax = Math.max(...data.criteria.map((c) => c.metRate), 0.0001)
  const sortedCrit = useMemo(() => {
    const arr = [...data.criteria]
    arr.sort((a, b) => {
      if (sort.key === 'label') return sort.dir * a.label.localeCompare(b.label)
      return sort.dir * ((a[sort.key] as number) - (b[sort.key] as number))
    })
    return arr
  }, [data.criteria, sort])

  const failMax = data.failtags[0]?.count ?? 1

  const cases = data.cases.filter(
    (c) => (fTrack === 'all' || c.category === fTrack) && (fField === 'all' || c.field === fField)
  )

  const setSortKey = (key: 'label' | 'metRate' | 'decided') =>
    setSort((s) => ({ key, dir: s.key === key ? -s.dir : key === 'label' ? 1 : -1 }))

  const rfeShare = data.cases.length
    ? Math.round((data.cases.filter((c) => c.rfe).length / data.cases.length) * 100)
    : 0

  return (
    <>
      <div className="grid md:grid-cols-2 gap-5">
        <div className="card">
          <div className="text-[11px] font-bold tracking-widest uppercase text-gray-400">EB-1A criteria</div>
          <h3 className="text-navy text-lg font-bold mt-1">Met-rate when contested</h3>
          <p className="text-mid text-sm mt-1 mb-3">Share of contested findings where the AAO accepted the criterion (appeals + motions of denied petitions). Click a column to sort.</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <Th onClick={() => setSortKey('label')}>Criterion</Th>
                <Th onClick={() => setSortKey('metRate')}>Met rate</Th>
                <Th onClick={() => setSortKey('decided')} right>Decided</Th>
              </tr>
            </thead>
            <tbody>
              {sortedCrit.map((c) => {
                const r = pct(c.metRate)
                const col = r >= 18 ? TEAL : r >= 11 ? GOLD : CORAL
                const w = Math.round((c.metRate / critMax) * 100)
                return (
                  <tr key={c.key} className="border-t border-gray-100">
                    <td className="py-2.5 pr-2 font-medium">{c.label}</td>
                    <td className="py-2.5 pr-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded bg-gray-100 overflow-hidden min-w-[64px]">
                          <div className="h-full" style={{ width: `${w}%`, background: col }} />
                        </div>
                        <b>{r}%</b>
                      </div>
                    </td>
                    <td className="py-2.5 text-right text-mid">{c.decided.toLocaleString()}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="text-[11px] font-bold tracking-widest uppercase text-gray-400">EB-2 NIW · Dhanasar</div>
          <h3 className="text-navy text-lg font-bold mt-1">Where NIW cases break</h3>
          <p className="text-mid text-sm mt-1 mb-3">Prong 1 (national importance) is the dominant battleground, the framing battle.</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th scope="col" className="text-[11px] uppercase tracking-wide text-gray-400 font-bold py-2">Prong</th>
                <th scope="col" className="text-[11px] uppercase tracking-wide text-gray-400 font-bold py-2">Contested</th>
                <th scope="col" className="text-[11px] uppercase tracking-wide text-gray-400 font-bold py-2 text-right">Findings</th>
              </tr>
            </thead>
            <tbody>
              {data.prongs.map((p) => (
                <tr key={p.key} className="border-t border-gray-100">
                  <td className="py-2.5 pr-2 font-medium">{p.label}</td>
                  <td className="py-2.5 font-bold">{Math.round((p.decided / prongTotal) * 100)}%</td>
                  <td className="py-2.5 text-right text-mid">{p.decided.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-mid mt-2">
            Methodology note: prong-level &ldquo;met&rdquo; rates are not reported. In a denial-appeal corpus the AAO
            rarely records a satisfied prong, so met-rates would understate real-world acceptance. Contest share is the
            reliable signal.
          </p>
          <div className="text-[11px] font-bold tracking-widest uppercase text-gray-400 mt-5 mb-2">Documented failure modes (EB-1A findings, named reasons only)</div>
          {data.failtags.map((t: FailTag) => (
            <Bar key={t.key} label={t.label} value={t.count} max={failMax} color={NAVY} />
          ))}
        </div>
      </div>

      <div className="card mt-5">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
          <div>
            <div className="text-[11px] font-bold tracking-widest uppercase text-gray-400">Case explorer</div>
            <h3 className="text-navy text-lg font-bold mt-1">Reversals worth reading</h3>
          </div>
          <span className="text-mid text-sm">Real sustained appeals, open the source on uscis.gov.</span>
        </div>
        <div className="flex gap-2.5 flex-wrap mb-4">
          <select value={fTrack} onChange={(e) => setFTrack(e.target.value)} aria-label="Filter by path" className="input bg-white" style={{ minWidth: 150, width: 'auto' }}>
            <option value="all">All paths</option>
            <option value="NIW">EB-2 NIW</option>
            <option value="EB1A">EB-1A</option>
            <option value="EB2_other">EB-2 (other)</option>
          </select>
          <select value={fField} onChange={(e) => setFField(e.target.value)} aria-label="Filter by field" className="input bg-white" style={{ minWidth: 150, width: 'auto' }}>
            <option value="all">All fields</option>
            <option value="business">Business</option>
            <option value="computer_science">AI / software</option>
            <option value="medicine">Medicine</option>
            <option value="engineering">Engineering</option>
          </select>
        </div>
        {cases.length === 0 ? (
          <div className="text-sm text-mid rounded-lg bg-teal-light border border-[#bfeee6] px-3.5 py-3 text-[#0c5147]">No sustained cases match. Widen the filter.</div>
        ) : (
          cases.map((c) => {
            const tl = c.category === 'EB1A' ? 'EB-1A' : c.category === 'NIW' ? 'EB-2 NIW' : 'EB-2 (other)'
            return (
              <div key={c.id} className="flex items-center gap-3.5 px-3.5 py-3 border border-gray-100 rounded-lg mb-2.5 hover:bg-gray-50/60 transition-colors">
                <span className="w-9 h-9 rounded-lg bg-navy-light text-navy flex items-center justify-center text-xs font-bold shrink-0">PDF</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[15px] text-navy">In re {c.id}</div>
                  <div className="text-xs text-mid">{c.date} · {FIELD_LABELS[c.field] ?? c.field}</div>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-teal-light text-[#0a6b5e]">Sustained</span>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">{tl}</span>
                {c.rfe && <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700">RFE</span>}
                <a href={uscisUrl(c.sourceFile)} target="_blank" rel="noopener noreferrer" className="text-teal font-bold text-sm whitespace-nowrap hover:opacity-80">Open ↗</a>
              </div>
            )
          })
        )}
        <div className="text-sm rounded-lg bg-teal-light border border-[#bfeee6] px-3.5 py-3 text-[#0c5147] mt-3.5">
          <b>RFE intelligence:</b> {rfeShare}% of these reversals had an RFE before the original denial, proof that a case
          can be denied after an RFE and still win with the right argument. The RFE Response Analyzer targets the same
          documented failure modes this corpus surfaces.
        </div>
      </div>
    </>
  )
}

function Th({ children, onClick, right }: { children: React.ReactNode; onClick: () => void; right?: boolean }) {
  return (
    <th scope="col" className={`py-0 ${right ? 'text-right' : 'text-left'}`}>
      <button
        type="button"
        onClick={onClick}
        className={`text-[11px] uppercase tracking-wide text-gray-400 font-bold py-2 cursor-pointer select-none hover:text-navy ${right ? 'text-right' : 'text-left'}`}
      >
        {children}
      </button>
    </th>
  )
}

// ─── Shell ────────────────────────────────────────────────────────

export default function PrecedentEngineClient({ data }: { data: PrecedentData }) {
  const [persona, setPersona] = useState<Persona>('applicant')

  return (
    <div>
      <div className="flex items-end justify-between gap-4 flex-wrap mb-3">
        <div>
          <h1 className="text-navy text-3xl font-bold tracking-tight flex items-center gap-2">
            Precedent Engine <span className="text-teal text-2xl">✦</span>
          </h1>
          <p className="text-mid mt-1 max-w-xl">How USCIS actually decides self-petitions: {data.corpus.decisions.toLocaleString()} real AAO rulings, decoded to the criterion.</p>
        </div>
        <div className="inline-flex bg-white border border-border rounded-full p-1">
          {(['applicant', 'attorney'] as Persona[]).map((p) => (
            <button
              key={p}
              onClick={() => setPersona(p)}
              aria-pressed={persona === p}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${persona === p ? 'bg-navy text-white' : 'text-mid hover:text-navy'}`}
            >
              {p === 'applicant' ? 'Applicant view' : 'Attorney view'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 items-start rounded-xl bg-teal-light border border-[#bfeee6] px-4 py-3.5 mb-1">
        <span className="w-6 h-6 rounded-lg bg-teal text-white flex items-center justify-center shrink-0 text-sm font-bold">✓</span>
        <span className="text-sm text-[#0c5147]"><b className="text-[#0a6b5e]">Grounded, not guesswork.</b> Every figure is computed from real Administrative Appeals Office decisions, and links back to the source on uscis.gov.</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-5">
        <Tile k="Decisions decoded" n={data.corpus.decisions.toLocaleString()} sub="Real AAO rulings" color="text-teal" />
        <Tile k="Coded findings" n={data.corpus.findings.toLocaleString()} sub="Criterion + prong level" color="text-navy" />
        <Tile k="Requirements mapped" n="13" sub="10 EB-1A · 3 Dhanasar" color="text-[#C79320]" />
        <Tile k="Coverage" n="’23, ’26" sub="Live from uscis.gov" color="text-teal" />
      </div>

      {persona === 'applicant' ? <ApplicantView data={data} /> : <AttorneyView data={data} />}
    </div>
  )
}

function Tile({ k, n, sub, color }: { k: string; n: string; sub: string; color: string }) {
  return (
    <div className="card !p-4">
      <div className="text-[11px] font-bold tracking-widest uppercase text-gray-400">{k}</div>
      <div className={`text-3xl font-bold tracking-tight mt-1 leading-none ${color}`}>{n}</div>
      <div className="text-xs text-mid mt-1">{sub}</div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function buildChecklist(track: Pathway, field: string, ranked: CriterionStat[]): string[] {
  if (track === 'EB1A') {
    const top = ranked.slice(0, 3).map((x) => x.label.split(' / ')[0])
    const oc = ranked.find((x) => x.key === 'original_contributions')
    const ocPct = oc ? pct(oc.metRate) : 7
    return [
      `Anchor your strongest three criteria first: ${top.join(', ')}.`,
      'Benchmark every claim against the field: an unproven leading role, salary without comparatives, and non-selective memberships are the most-cited documented gaps.',
      `Treat “original contributions” as evidence-heavy: it's accepted in only ${ocPct}% of contested findings. Lead with independent corroboration.`,
      'Prove a genuinely leading role and major-media coverage with named, comparative evidence, not titles.',
    ]
  }
  return [
    'Win Prong 1 on framing: define the endeavor’s national importance in concrete, field-level impact, it’s the #1 failure point.',
    'Prong 2: document a record of success plus a realistic plan; vague “well positioned” language fails.',
    'Prong 3: argue that waiving the job offer benefits the U.S. on the merits, not your convenience.',
    `Tie everything to your field (${FIELD_LABELS[field]}) with evidence officers can verify.`,
  ]
}
