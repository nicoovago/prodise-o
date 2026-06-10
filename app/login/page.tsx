'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })
    if (error) setError(error.message)
    else setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">⚽</div>
          <h1 className="text-2xl font-semibold text-gray-900">Prode 2026</h1>
          <p className="text-gray-500 text-sm mt-1">Jugá con tus amigos</p>
        </div>

        {sent ? (
          <div className="card text-center py-8">
            <div className="text-3xl mb-3">📬</div>
            <h2 className="font-medium text-gray-900 mb-2">Revisá tu email</h2>
            <p className="text-gray-500 text-sm">
              Te mandamos un link mágico a <strong>{email}</strong>.<br />
              Hacé click ahí para entrar, sin contraseña.
            </p>
          </div>
        ) : (
          <div className="card">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tu email
                </label>
                <input
                  type="email"
                  className="input"
                  placeholder="vos@ejemplo.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              {error && (
                <p className="text-red-500 text-xs">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Enviando...' : 'Entrar con email →'}
              </button>
            </form>
            <p className="text-center text-xs text-gray-400 mt-4">
              Sin contraseña. Te mandamos un link al email.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
