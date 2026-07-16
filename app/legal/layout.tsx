import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="legal-shell">
      <div className="legal-container">
        <Link href="/" className="legal-back">
          <ArrowRight className="w-4 h-4" />
          חזרה לעמוד הבית
        </Link>
        <article className="legal-doc">{children}</article>
        <div className="legal-footer">
          כל הזכויות שמורות לעידית לאוב · אמא בסדר
        </div>
      </div>
    </div>
  )
}
