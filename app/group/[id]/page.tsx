'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Match, Group, Prediction, LeaderboardEntry } from '@/lib/types'

type Tab = 'partidos' | 'ranking' | 'info'

export default function GroupPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('partidos')
  const [group, setGroup] = useState<Group | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({})
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [inputValues, setInputValues] = useState<Record<string, { h: string; a: string }>>({})
  const [copied, setCopied] = useState(false)

  const loadAll = useCallback(async (uid: string) => {
    const [{ data: grp }, { data: mts }, { data: preds }] = await Promise.all([
      supabase.from('groups').select().eq('id', id).single(),
      supabase.from('matches').select().order('sort_order'),
      supabase.from('predictions').select().eq('group_id', id).eq('user_id', uid),
    ])
    if (!grp) { router.push('/dashboard'); return }
    setGroup(grp)
    setMatches(mts || [])
    const predMap: Record<string, Prediction> = {}
    const ivs: Record<string, { h: string; a: string }> = {}
    for (const p of (preds || []) as Prediction[]) {
      predMap[p.match_id] = p
      ivs[p.match_id] = { h: String(p.home_score), a: String(p.away_score) }
    }
    setPredictions(predMap)
    setInputValues(ivs)
    await loadLeaderboard()
    setLoading(false)
  }, [id, router])

  async function loadLeaderboard() {
    const { data: members } = await supabase
      .from('group_members')
      .select('user_id, display_name')
      .eq('group_id', id)
    const { data: preds } = await supabase
      .from('predictions')
      .select('user_id, points')
      .eq('group_id', id)

    const board: Record<string, LeaderboardEntry> = {}
    for (const m of (members || []) as any[]) {
      board[m.user_id] = { user_id: m.user_id, display_name: m.display_name, total_points: 0, exact_results: 0, correct_results: 0 }
    }
    for (const p of (preds || []) as any[]) {
      if (board[p.user_id]) {
        board[p.user_id].total_points += p.points
        if (p.points === 3) board[p.user_id].exact_results++
        else if (p.points === 1) board[p.user_id].correct_results++
      }
    }
    setLeaderboard(Object.values(board).sort((a, b) => b.total_points - a.total_points))
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      loadAll(user.id)
    })
  }, [loadAll, router])

  function setInput(matchId: string, side: 'h' | 'a', val: string) {
    setInputValues(prev => ({ ...prev, [matchId]: { ...prev[matchId], [side]: val } }))
    setSaved(prev => ({ ...prev, [matchId]: false }))
  }

  async function savePred(matchId: string) {
    const iv = inputValues[matchId]
    if (iv?.h === '' || iv?.h === undefined || iv?.a === '' || iv?.a === undefined) return
    setSaving(matchId)
    await supabase.from('predictions').upsert({
      user_id: userId, group_id: id, match_id: matchId,
      home_score: parseInt(iv.h), away_score: parseInt(iv.a),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,group_id,match_id' })
    setSaved(prev => ({ ...prev, [matchId]: true }))
    setSaving(null)
  }

  function copyCode() {
    navigator.clipboard.writeText(group?.code || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Cargando...</div>

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-gray-600 text-lg">‹</button>
        <div>
          <h1 className="font-semibold text-gray-900 leading-tight">{group?.name}</h1>
          <p className="text-xs text-gray-400">Copa del Mundo 2026</p>
        </div>
      </header>

      <div className="flex border-b border-gray-100 bg-white px-4 gap-1">
        {(['partidos', 'ranking', 'info'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); if (t === 'ranking') loadLeaderboard() }}
            className={`px-4 py-3 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {t === 'partidos' ? 'Partidos' : t === 'ranking' ? 'Ranking' : 'Info'}
          </button>
        ))}
      </div>

      <main className="max-w-lg mx-auto px-4 py-4">
        {tab === 'partidos' && (
          <div className="space-y-3">
            <p className="text-xs text-gray-400 text-center py-1">
              3 pts por resultado exacto · 1 pt por resultado correcto
            </p>
            {matches.map(m => {
              const iv = inputValues[m.id] || { h: '', a: '' }
              const isSaving = saving === m.id
              const isSaved = saved[m.id]
              const hasPred = !!predictions[m.id]
              const isFinished = m.finished

              return (
                <div key={m.id} className={`card ${isFinished ? 'opacity-70' : ''}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-400 font-medium">{m.group_label || m.stage}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(m.match_date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 text-center">
                      <div className="text-2xl">{m.home_flag}</div>
                      <div className="text-sm font-medium mt-1">{m.home_team}</div>
                    </div>
                    <div className="text-gray-300 font-light text-sm">vs</div>
                    <div className="flex-1 text-center">
                      <div className="text-2xl">{m.away_flag}</div>
                      <div className="text-sm font-medium mt-1">{m.away_team}</div>
                    </div>
                  </div>

                  {isFinished ? (
                    <div className="mt-3 pt-3 border-t border-gray-100 text-center">
                      <div className="text-lg font-semibold text-gray-700">
                        {m.home_score} — {m.away_score}
                      </div>
                      {hasPred && (
                        <div className={`text-xs mt-1 font-medium ${predictions[m.id].points === 3 ? 'text-green-600' : predictions[m.id].points === 1 ? 'text-yellow-600' : 'text-gray-400'}`}>
                          {predictions[m.id].points === 3 ? '✓ Exacto! +3pts' : predictions[m.id].points === 1 ? '≈ Correcto +1pt' : '✗ Sin puntos'}
                          {' '} (predijiste {predictions[m.id].home_score}–{predictions[m.id].away_score})
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                      <input
                        type="number" min="0" max="20"
                        className="w-12 h-10 text-center text-lg font-semibold border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        value={iv.h}
                        onChange={e => setInput(m.id, 'h', e.target.value)}
                        placeholder="–"
                      />
                      <span className="text-gray-300 font-light">–</span>
                      <input
                        type="number" min="0" max="20"
                        className="w-12 h-10 text-center text-lg font-semibold border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        value={iv.a}
                        onChange={e => setInput(m.id, 'a', e.target.value)}
                        placeholder="–"
                      />
                      <button
                        onClick={() => savePred(m.id)}
                        disabled={isSaving}
                        className={`ml-auto px-4 py-2 rounded-xl text-sm font-medium transition-all ${isSaved || hasPred ? 'bg-green-50 text-green-700 border border-green-200' : 'btn-primary'}`}
                      >
                        {isSaving ? '...' : isSaved ? '✓ Guardado' : hasPred ? '✓ Actualizar' : 'Guardar'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {tab === 'ranking' && (
          <div className="space-y-2">
            {leaderboard.map((entry, i) => (
              <div key={entry.user_id} className={`card flex items-center gap-3 ${entry.user_id === userId ? 'border-indigo-200 bg-indigo-50/30' : ''}`}>
                <div className="text-xl w-8 text-center">{medals[i] || <span className="text-gray-400 text-sm font-medium">{i + 1}</span>}</div>
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900">
                    {entry.display_name}
                    {entry.user_id === userId && <span className="ml-1 text-xs text-indigo-500">(vos)</span>}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {entry.exact_results} exactos · {entry.correct_results} correctos
                  </div>
                </div>
                <div className="text-lg font-semibold text-gray-900">{entry.total_points} <span className="text-xs text-gray-400 font-normal">pts</span></div>
              </div>
            ))}
            {leaderboard.length === 0 && (
              <div className="text-center text-gray-400 text-sm py-10">
                Todavía no hay puntos. Arranca cuando terminen los primeros partidos!
              </div>
            )}
          </div>
        )}

        {tab === 'info' && (
          <div className="space-y-3">
            <div className="card">
              <h3 className="font-medium text-gray-900 mb-1">Código del grupo</h3>
              <p className="text-xs text-gray-500 mb-3">Compartí este código con tus amigos para que se sumen</p>
              <div className="flex gap-2">
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-mono text-gray-700 text-sm tracking-widest">
                  {group?.code}
                </div>
                <button onClick={copyCode} className={`btn-secondary ${copied ? 'text-green-600 border-green-200' : ''}`}>
                  {copied ? '✓ Copiado' : 'Copiar'}
                </button>
              </div>
            </div>

            <div className="card">
              <h3 className="font-medium text-gray-900 mb-3">Sistema de puntos</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">🎯 Resultado exacto</span>
                  <span className="font-semibold text-green-600">3 puntos</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">✅ Ganador/empate correcto</span>
                  <span className="font-semibold text-yellow-600">1 punto</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">❌ Resultado incorrecto</span>
                  <span className="font-semibold text-gray-400">0 puntos</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="font-medium text-gray-900 mb-1">Participantes ({leaderboard.length})</h3>
              <div className="space-y-2 mt-2">
                {leaderboard.map(m => (
                  <div key={m.user_id} className="flex items-center gap-2 text-sm">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-700">
                      {m.display_name[0].toUpperCase()}
                    </div>
                    <span className="text-gray-700">{m.display_name}</span>
                    {m.user_id === userId && <span className="text-xs text-gray-400">(vos)</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
