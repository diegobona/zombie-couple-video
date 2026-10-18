import { legalDetails, legalPages } from '@/lib/legal-copy'

export function LegalContent({ page }: { page: (typeof legalPages)[keyof typeof legalPages] }) {
  return (
    <main className="home-page article-page">
      <h1 className="home-title">{page.label}</h1>
      <p className="text-sm text-muted-foreground">{legalDetails.updatedLabel} {legalDetails.updated}</p>
      <p className="article-intro mt-6">{page.intro}</p>
      {page.sections.map((section) => (
        <section className="article-section scroll-mt-6" id={'id' in section ? section.id : undefined} key={section.heading}>
          <h2>{section.heading}</h2>
          {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </section>
      ))}
      <section className="article-section">
        <h2>{legalDetails.contactHeading}</h2>
        <p>{legalDetails.contactLead} <a href={`mailto:${legalDetails.supportEmail}`}>{legalDetails.supportEmail}</a>. {legalDetails.operator}</p>
      </section>
    </main>
  )
}
