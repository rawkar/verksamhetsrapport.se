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

        {/* Google-knapp */}
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full btn btn-secondary mb-4 py-3"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Fortsätt med Google
            </>
          )}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-[var(--border)]" />
          <span className="text-sm text-[var(--foreground-muted)]">eller</span>
          <div className="flex-1 h-px bg-[var(--border)]" />
        </div>

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
