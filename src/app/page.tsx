import { FileText, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg">Verksamhetsrapport.se</span>
          </div>
          <Link href="/login" className="btn btn-primary">
            Logga in
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-[var(--background-secondary)] px-4 py-2 rounded-full text-sm mb-6">
              <Sparkles className="w-4 h-4 text-[var(--color-accent)]" />
              <span>Nu med AI-driven stilanpassning</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-balance">
              Skapa professionella verksamhetsberättelser
              <span className="text-[var(--color-accent)]"> med AI</span>
            </h1>

            <p className="text-xl text-[var(--foreground-secondary)] mb-8 max-w-2xl mx-auto">
              Spara veckor av arbete. Få enhetliga, välskrivna rapporter anpassade
              efter din organisations unika stil och tonalitet.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login" className="btn btn-primary py-3 px-6 text-lg">
                Kom igång gratis
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="#how-it-works" className="btn btn-secondary py-3 px-6 text-lg">
                Se hur det fungerar
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="how-it-works" className="py-20 px-4 bg-[var(--background-secondary)]">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Så fungerar det
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="card p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  Beskriv din verksamhet
                </h3>
                <p className="text-[var(--foreground-secondary)]">
                  Fyll i enkla formulär med era aktiviteter, händelser och
                  resultat från verksamhetsåret.
                </p>
              </div>

              <div className="card p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  AI skriver rapporten
                </h3>
                <p className="text-[var(--foreground-secondary)]">
                  Vår AI omvandlar era punkter till sammanhängande,
                  professionell text i er organisations stil.
                </p>
              </div>

              <div className="card p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  Exportera som PDF
                </h3>
                <p className="text-[var(--foreground-secondary)]">
                  Ladda ner er färdiga verksamhetsberättelse som PDF, redo
                  att skickas till styrelsen.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Fördelarna med Verksamhetsrapport.se
            </h2>

            <div className="grid sm:grid-cols-2 gap-6">
              {[
                'Spara veckor av skrivarbete',
                'Konsekvent och professionellt språk',
                'Anpassad efter er organisations stil',
                'Enkel att använda – ingen teknisk kunskap krävs',
                'Säker lagring av era rapporter',
                'Export till PDF och Word',
              ].map((benefit, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-[var(--color-success)] flex-shrink-0 mt-0.5" />
                  <span className="text-lg">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-20 px-4 bg-[var(--background-secondary)]">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">Priser</h2>
            <p className="text-center text-[var(--foreground-secondary)] mb-12">
              Börja gratis. Uppgradera när du behöver mer.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Free */}
              <div className="card p-6">
                <h3 className="text-xl font-bold mb-1">Gratis</h3>
                <p className="text-3xl font-bold mb-4">0 <span className="text-base font-normal text-[var(--foreground-muted)]">kr/mån</span></p>
                <ul className="space-y-2 text-sm text-[var(--foreground-secondary)] mb-6">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[var(--color-success)]" />1 rapport per år</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[var(--color-success)]" />Grundmallar</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[var(--color-success)]" />AI-generering</li>
                </ul>
                <Link href="/login" className="btn btn-secondary w-full">Kom igång</Link>
              </div>

              {/* Bas */}
              <div className="card p-6 border-2 border-[var(--color-primary)] relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--color-primary)] text-white text-xs font-semibold px-3 py-1 rounded-full">Populärast</div>
                <h3 className="text-xl font-bold mb-1">Bas</h3>
                <p className="text-3xl font-bold mb-4">299 <span className="text-base font-normal text-[var(--foreground-muted)]">kr/mån</span></p>
                <ul className="space-y-2 text-sm text-[var(--foreground-secondary)] mb-6">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[var(--color-success)]" />5 rapporter per år</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[var(--color-success)]" />PDF-export</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[var(--color-success)]" />Referensuppladdning</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[var(--color-success)]" />Anpassade mallar</li>
                </ul>
                <Link href="/login" className="btn btn-primary w-full">Välj Bas</Link>
              </div>

              {/* Pro */}
              <div className="card p-6">
                <h3 className="text-xl font-bold mb-1">Pro</h3>
                <p className="text-3xl font-bold mb-4">799 <span className="text-base font-normal text-[var(--foreground-muted)]">kr/mån</span></p>
                <ul className="space-y-2 text-sm text-[var(--foreground-secondary)] mb-6">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[var(--color-success)]" />Obegränsade rapporter</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[var(--color-success)]" />Allt i Bas</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[var(--color-success)]" />Team (3 användare)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[var(--color-success)]" />Versionshistorik</li>
                </ul>
                <Link href="/login" className="btn btn-secondary w-full">Välj Pro</Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 gradient-primary text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Redo att skapa din första verksamhetsberättelse?
            </h2>
            <p className="text-xl opacity-90 mb-8">
              Skapa ett gratis konto och kom igång på några minuter.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-white text-[var(--color-primary)] font-semibold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-colors"
            >
              Skapa gratis konto
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold">Verksamhetsrapport.se</span>
          </div>
          <p className="text-sm text-[var(--foreground-muted)]">
            &copy; {new Date().getFullYear()} Verksamhetsrapport.se. Alla
            rättigheter förbehållna.
          </p>
        </div>
      </footer>
    </div>
  )
}
