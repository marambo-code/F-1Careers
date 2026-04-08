// Clean print layout — no nav, no sidebar, just content + auto-print trigger
export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>F-1 Careers Report</title>
        <script dangerouslySetInnerHTML={{
          __html: `window.onload = function() {
            // Small delay so styles load, then auto-print
            setTimeout(() => window.print(), 800);
          }`
        }} />
      </head>
      <body style={{ fontFamily: 'Georgia, serif', maxWidth: '800px', margin: '0 auto', padding: '40px 20px', color: '#1a1a2e' }}>
        {children}
      </body>
    </html>
  )
}
