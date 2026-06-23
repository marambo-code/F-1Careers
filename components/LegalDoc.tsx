import React from 'react'

// Minimal, dependency-free Markdown renderer for our legal documents.
// Supports: ## headings, paragraphs, - bullet lists, > callouts, **bold**,
// and --- dividers (rendered as spacing). The source of truth is the
// Markdown files in /legal; this just presents them.

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  // Split on **bold** segments (odd indexes are bold).
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 === 1 ? (
      <strong key={`${keyPrefix}-${i}`} className="font-semibold text-navy">{part}</strong>
    ) : (
      <React.Fragment key={`${keyPrefix}-${i}`}>{part}</React.Fragment>
    )
  )
}

export default function LegalDoc({ markdown }: { markdown: string }) {
  const lines = markdown.replace(/\r/g, '').split('\n')
  const blocks: React.ReactNode[] = []
  let i = 0
  let k = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.trim() === '') { i++; continue }

    // H1 is skipped (the page renders its own title)
    if (line.startsWith('# ')) { i++; continue }

    // Dividers: skip (spacing comes from heading margins)
    if (line.trim() === '---') { i++; continue }

    // Section heading
    if (line.startsWith('## ')) {
      blocks.push(
        <h2 key={k++} className="font-bold text-lg text-navy mt-8 mb-1">
          {renderInline(line.slice(3), `h${k}`)}
        </h2>
      )
      i++
      continue
    }

    // Callout (one or more consecutive "> " lines)
    if (line.startsWith('>')) {
      const buf: string[] = []
      while (i < lines.length && lines[i].startsWith('>')) {
        buf.push(lines[i].replace(/^>\s?/, ''))
        i++
      }
      blocks.push(
        <div key={k++} className="rounded-xl border border-teal/30 bg-teal/5 px-4 py-3 my-4">
          {buf.map((b, j) => (
            <p key={j} className="text-sm text-navy leading-relaxed">{renderInline(b, `q${k}-${j}`)}</p>
          ))}
        </div>
      )
      continue
    }

    // Bullet list
    if (line.startsWith('- ')) {
      const items: string[] = []
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(lines[i].slice(2))
        i++
      }
      blocks.push(
        <ul key={k++} className="list-disc pl-5 space-y-1.5">
          {items.map((it, j) => (
            <li key={j} className="text-mid leading-relaxed text-sm">{renderInline(it, `l${k}-${j}`)}</li>
          ))}
        </ul>
      )
      continue
    }

    // Paragraph (our source keeps each paragraph on a single line)
    blocks.push(
      <p key={k++} className="text-mid leading-relaxed text-sm">{renderInline(line, `p${k}`)}</p>
    )
    i++
  }

  return <div>{blocks}</div>
}
