import Card from '@/components/Card'

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="text-center py-10 md:py-16">
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight leading-tight">
          Clean, opinionated React foundation
        </h1>
        <p className="mt-4 text-subtle max-w-2xl mx-auto">
          Built like a Meta full‑stack engineer. Styled with an Apple‑inspired aesthetic.
          Powered by Tailwind. Fully responsive out of the box.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <a href="https://tailwindcss.com/docs/installation" className="btn btn-primary">Docs</a>
          <a href="#features" className="btn btn-ghost">Explore</a>
        </div>
      </section>

      <section id="features" className="grid md:grid-cols-3 gap-6">
        <Card title="TypeScript-first" desc="Strict types, path aliases, clean utilities." />
        <Card title="Tailwind UI tokens" desc="Consistent spacing, radius, and shadows." />
        <Card title="Performance" desc="Vite + React 18, minimal JS by default." />
      </section>

      <section id="showcase" className="grid lg:grid-cols-2 gap-6">
        <Card
          title="Responsive grid"
          desc="Try resizing the window — the layout adapts elegantly."
        />
        <Card
          title="Cards & buttons"
          desc="Pre-styled components ready for iteration."
          cta={{ label: 'Get Started', href: '#' }}
        />
      </section>

      <section id="contact" className="card">
        <h2 className="text-xl font-semibold tracking-tight">Contact</h2>
        <form className="mt-6 grid gap-4 sm:grid-cols-2">
          <input className="rounded-2xl border border-black/10 px-4 py-3" placeholder="Name" />
          <input className="rounded-2xl border border-black/10 px-4 py-3" placeholder="Email" />
          <textarea className="rounded-2xl border border-black/10 px-4 py-3 sm:col-span-2" rows={4} placeholder="How can we help?" />
          <button className="btn btn-primary sm:col-span-2" type="button">Send</button>
        </form>
      </section>
    </div>
  )
}
