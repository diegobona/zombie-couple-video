import { homeCopy } from '@/lib/home-copy'

export function HomeContent() {
  return <div className="home-content">
    <section id="how-to-make" className="home-section section-how" aria-labelledby="how-to-make-heading">
      <h2 id="how-to-make-heading">{homeCopy.how.heading}</h2>
      <ol className="step-grid">{homeCopy.how.steps.map((step, index) => <li className="step-card" key={step.title}><div className="step-copy"><h3><span className="step-number" aria-hidden="true">{index + 1}</span>{step.title}</h3><p>{step.body}</p></div></li>)}</ol>
    </section>
    <section id="photo-and-story-tips" className="home-section" aria-labelledby="photo-and-story-heading">
      <h2 id="photo-and-story-heading">{homeCopy.guide.heading}</h2>
      <div className="faq-list">{[
        [homeCopy.guide.photoHeading, homeCopy.guide.photoBody],
        [homeCopy.guide.storyHeading, homeCopy.guide.storyBody],
        [homeCopy.guide.outputHeading, homeCopy.guide.outputBody],
      ].map(([heading, body]) => <article className="faq-item" key={heading}><h3>{heading}</h3><p>{body}</p></article>)}</div>
    </section>
    <section className="home-section" aria-labelledby="output-specs">
      <h2 id="output-specs">{homeCopy.specs.heading}</h2>
      <dl className="faq-list">{homeCopy.specs.rows.map(([label, value]) => <div className="faq-item" key={label}><dt className="font-semibold">{label}</dt><dd className="text-sm leading-relaxed text-muted-foreground">{value}</dd></div>)}</dl>
    </section>
    <section className="home-section section-faq" aria-labelledby="video-faq">
      <h2 id="video-faq">{homeCopy.faq.heading}</h2>
      <div className="faq-list">{homeCopy.faq.items.map(item => <div className="faq-item" key={item.question}><h3>{item.question}</h3><p>{item.answer}</p></div>)}</div>
    </section>
  </div>
}
