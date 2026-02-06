'use client'

import { Suspense, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import { FileText, Mail, Loader2 } from 'lucide-react'

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'

  const supabase = createClient()

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
        },
      })

      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else {
        setMessage({
          type: 'success',
          text: 'Kolla din e-post! Vi har skickat en inloggningslänk till dig.',
        })
        setEmail('')
      }
    } catch {
      setMessage({
        type: 'error',
        text: 'Något gick fel. Försök igen senare.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
        },
      })

      if (error) {
        setMessage({ type: 'error', text: error.message })
        setIsLoading(false)
      }
    } catch {
      setMessage({
        type: 'error',
        text: 'Något gick fel. Försök igen senare.',
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background-secondary)] px-4">
      {/* Logo och titel */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
            <FileText className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Verksamhetsrapport.se
          </h1>
        </div>
        <p className="text-[var(--foreground-muted)]">
          Skapa professionella verksamhetsberättelser med AI
        </p>
      </div>

      {/* Login-kort */}
      <div className="w-full max-w-md card p-8">
        <h2 className="text-xl font-semibold text-center mb-6">
          Logga in eller skapa konto
        </h2>

        {/* Magic link-formulär */}
        <form onSubmit={handleMagicLink}>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium mb-2 text-[var(--foreground-secondary)]"
            >
              E-postadress
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--foreground-muted)]" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="din@email.se"
                required
                className="input pl-10"
                disabled={isLoading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !email}
            className="w-full btn btn-primary py-3"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Skicka inloggningslänk'
            )}
          </button>
        </form>

        {/* Meddelanden */}
        {message && (
          <div
            className={`mt-4 p-4 rounded-lg text-sm ${
              message.type === 'success'
                ? 'bg-[rgba(48,145,154,0.1)] text-[var(--color-success)]'
                : 'bg-[rgba(255,43,15,0.1)] text-[var(--color-error)]'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Info-text */}
        <p className="mt-6 text-xs text-center text-[var(--foreground-muted)]">
          Genom att logga in godkänner du våra{' '}
          <a href="/terms" className="underline hover:text-[var(--foreground)]">
            användarvillkor
          </a>{' '}
          och{' '}
          <a
            href="/privacy"
            className="underline hover:text-[var(--foreground)]"
          >
            integritetspolicy
          </a>
          .
        </p>
      </div>

      {/* Footer */}
      <p className="mt-8 text-sm text-[var(--foreground-muted)]">
        &copy; {new Date().getFullYear()} Verksamhetsrapport.se
      </p>
    </div>
  )
}
