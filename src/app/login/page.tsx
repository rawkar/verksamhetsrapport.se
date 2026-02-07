'use client'

import { Suspense, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams, useRouter } from 'next/navigation'
import { FileText, Mail, Lock, Loader2, Eye, EyeOff, CheckCircle2, RefreshCw } from 'lucide-react'

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

type Mode = 'login' | 'register' | 'forgot'

function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [mode, setMode] = useState<Mode>('login')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [resending, setResending] = useState(false)
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'

  const supabase = createClient()

  const switchMode = (newMode: Mode) => {
    setMode(newMode)
    setMessage(null)
    setPassword('')
    setConfirmPassword('')
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.message === 'Invalid login credentials') {
          setMessage({ type: 'error', text: 'Fel e-post eller lösenord.' })
        } else if (error.message === 'Email not confirmed') {
          setRegisteredEmail(email)
          setShowConfirmation(true)
        } else {
          setMessage({ type: 'error', text: error.message })
        }
      } else {
        router.push(redirectTo)
      }
    } catch {
      setMessage({ type: 'error', text: 'Något gick fel. Försök igen senare.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    if (password.length < 8) {
      setMessage({ type: 'error', text: 'Lösenordet måste vara minst 8 tecken.' })
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Lösenorden matchar inte.' })
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
        },
      })

      if (error) {
        if (error.message.includes('already registered')) {
          setMessage({ type: 'error', text: 'Det finns redan ett konto med den e-postadressen.' })
        } else {
          setMessage({ type: 'error', text: error.message })
        }
      } else {
        setRegisteredEmail(email)
        setShowConfirmation(true)
        setPassword('')
        setConfirmPassword('')
      }
    } catch {
      setMessage({ type: 'error', text: 'Något gick fel. Försök igen senare.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/reset-password`,
      })

      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else {
        setMessage({
          type: 'success',
          text: 'Vi har skickat en länk för att återställa lösenordet. Kolla din e-post.',
        })
      }
    } catch {
      setMessage({ type: 'error', text: 'Något gick fel. Försök igen senare.' })
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
      setMessage({ type: 'error', text: 'Något gick fel. Försök igen senare.' })
      setIsLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    setResending(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: registeredEmail,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
        },
      })

      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else {
        setMessage({ type: 'success', text: 'Nytt bekräftelsemail skickat! Kolla din inkorg.' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Kunde inte skicka mailet. Försök igen senare.' })
    } finally {
      setResending(false)
    }
  }

  const titles: Record<Mode, string> = {
    login: 'Logga in',
    register: 'Skapa konto',
    forgot: 'Återställ lösenord',
  }

  const submitLabels: Record<Mode, string> = {
    login: 'Logga in',
    register: 'Skapa konto',
    forgot: 'Skicka återställningslänk',
  }

  const handleSubmit = mode === 'login' ? handleLogin : mode === 'register' ? handleRegister : handleForgotPassword

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
        {showConfirmation ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-[rgba(48,145,154,0.1)] flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-[var(--color-success)]" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Bekräfta din e-post</h2>
            <p className="text-[var(--foreground-muted)] mb-6">
              Vi har skickat ett bekräftelsemail till{' '}
              <span className="font-medium text-[var(--foreground)]">{registeredEmail}</span>.
              Klicka på länken i mailet för att aktivera ditt konto.
            </p>

            {message && (
              <div
                className={`mb-4 p-3 rounded-lg text-sm ${
                  message.type === 'success'
                    ? 'bg-[rgba(48,145,154,0.1)] text-[var(--color-success)]'
                    : 'bg-[rgba(255,43,15,0.1)] text-[var(--color-error)]'
                }`}
              >
                {message.text}
              </div>
            )}

            <button
              onClick={handleResendConfirmation}
              disabled={resending}
              className="btn btn-secondary w-full mb-3"
            >
              {resending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {resending ? 'Skickar...' : 'Inget mail? Skicka igen'}
            </button>

            <button
              onClick={() => {
                setShowConfirmation(false)
                switchMode('login')
              }}
              className="text-sm text-[var(--color-primary)] hover:underline font-medium"
            >
              Tillbaka till inloggning
            </button>
          </div>
        ) : (
        <>
        <h2 className="text-xl font-semibold text-center mb-6">
          {titles[mode]}
        </h2>

        {/* Formulär */}
        <form onSubmit={handleSubmit}>
          {/* E-post */}
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium mb-2 text-[var(--foreground-secondary)]"
            >
              E-postadress
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--foreground-muted)] pointer-events-none" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="din@email.se"
                required
                className="input"
                style={{ paddingLeft: '2.5rem' }}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Lösenord (login + register) */}
          {mode !== 'forgot' && (
            <div className="mb-4">
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2 text-[var(--foreground-secondary)]"
              >
                Lösenord
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--foreground-muted)] pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'Minst 8 tecken' : 'Ditt lösenord'}
                  required
                  minLength={mode === 'register' ? 8 : undefined}
                  className="input"
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] hover:text-[var(--foreground-secondary)]"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Bekräfta lösenord (register) */}
          {mode === 'register' && (
            <div className="mb-4">
              <label
                htmlFor="confirm-password"
                className="block text-sm font-medium mb-2 text-[var(--foreground-secondary)]"
              >
                Bekräfta lösenord
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--foreground-muted)] pointer-events-none" />
                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Upprepa lösenord"
                  required
                  minLength={8}
                  className="input"
                  style={{ paddingLeft: '2.5rem' }}
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {/* Glömt lösenord-länk (login mode) */}
          {mode === 'login' && (
            <div className="mb-4 text-right">
              <button
                type="button"
                onClick={() => switchMode('forgot')}
                className="text-sm text-[var(--color-primary)] hover:underline"
              >
                Glömt lösenord?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !email}
            className="w-full btn btn-primary py-3"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              submitLabels[mode]
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

        {/* Divider */}
        {mode !== 'forgot' && (
          <>
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-[var(--border)]" />
              <span className="text-xs text-[var(--foreground-muted)]">eller</span>
              <div className="flex-1 h-px bg-[var(--border)]" />
            </div>

            {/* Google login */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full btn btn-secondary py-3 justify-center"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Fortsätt med Google
            </button>
          </>
        )}

        {/* Mode switcher */}
        <div className="mt-6 text-center text-sm text-[var(--foreground-muted)]">
          {mode === 'login' && (
            <p>
              Inget konto?{' '}
              <button
                type="button"
                onClick={() => switchMode('register')}
                className="text-[var(--color-primary)] hover:underline font-medium"
              >
                Skapa konto
              </button>
            </p>
          )}
          {mode === 'register' && (
            <p>
              Har du redan ett konto?{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-[var(--color-primary)] hover:underline font-medium"
              >
                Logga in
              </button>
            </p>
          )}
          {mode === 'forgot' && (
            <p>
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-[var(--color-primary)] hover:underline font-medium"
              >
                Tillbaka till inloggning
              </button>
            </p>
          )}
        </div>

        {/* Info-text */}
        {mode !== 'forgot' && (
          <p className="mt-4 text-xs text-center text-[var(--foreground-muted)]">
            Genom att {mode === 'login' ? 'logga in' : 'skapa konto'} godkänner du våra{' '}
            <a href="/terms" className="underline hover:text-[var(--foreground)]">
              användarvillkor
            </a>{' '}
            och{' '}
            <a href="/privacy" className="underline hover:text-[var(--foreground)]">
              integritetspolicy
            </a>
            .
          </p>
        )}
        </>
        )}
      </div>

      {/* Footer */}
      <p className="mt-8 text-sm text-[var(--foreground-muted)]">
        &copy; {new Date().getFullYear()} Verksamhetsrapport.se
      </p>
    </div>
  )
}
