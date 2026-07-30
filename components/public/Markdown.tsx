import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Renders owner-authored markdown (blog bodies) with brand-styled elements.
// Runs in a server component - no 'use client' needed.
export default function Markdown({ children }: { children: string }) {
  return (
    <div style={{ color: '#3a1e2d', fontSize: '1.02rem', lineHeight: 1.85 }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: (props) => <h2 style={{ fontFamily: 'var(--font-display, serif)', fontSize: '1.5rem', fontWeight: 700, color: '#7F5268', margin: '1.6em 0 0.5em' }} {...props} />,
          h3: (props) => <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#7F5268', margin: '1.3em 0 0.4em' }} {...props} />,
          p:  (props) => <p style={{ margin: '0 0 1em' }} {...props} />,
          ul: (props) => <ul style={{ margin: '0 0 1em', paddingInlineStart: '1.4em', listStyleType: 'disc' }} {...props} />,
          ol: (props) => <ol style={{ margin: '0 0 1em', paddingInlineStart: '1.4em' }} {...props} />,
          li: (props) => <li style={{ margin: '0.3em 0' }} {...props} />,
          strong: (props) => <strong style={{ fontWeight: 700, color: '#3a1e2d' }} {...props} />,
          blockquote: (props) => <blockquote style={{ margin: '0 0 1em', padding: '0.5em 1em', borderInlineStart: '3px solid #C4A0B4', background: 'rgba(127,82,104,0.05)', borderRadius: 8, color: '#6b5560' }} {...props} />,
          a: (props) => <a style={{ color: '#7F5268', textDecoration: 'underline' }} target="_blank" rel="noopener noreferrer" {...props} />,
          // eslint-disable-next-line @next/next/no-img-element
          img: (props) => <img style={{ maxWidth: '100%', borderRadius: 12, margin: '0.5em 0' }} alt={props.alt ?? ''} {...props} />,
          hr: () => <hr style={{ border: 'none', borderTop: '1px solid rgba(127,82,104,0.2)', margin: '1.6em 0' }} />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
