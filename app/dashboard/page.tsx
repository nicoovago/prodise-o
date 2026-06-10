'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Group } from '@/lib/types'
import Link from 'next/link'

export default function DashboardPage() {
  const router = useRouter()
  const [groups, setGroups] = useState<Group[]>([])
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)
  const [joinCode, setJoinCode] = useState('')
  const [newGroupName, setNewGroupName] = useState('')
  const [joinName, setJoinName] = useState('')
  const [view, setView] = useState<'list' | 'create' | 'join'>('list')
  const [userId, setUserId] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      setUserName(user.email?.split('@')[0] || 'Usuario')
      loadGroups(user.id)
    })
  }, [router])

  async function loadGroups(uid: string) {
    const { data } = await supabase
      .from('group_members')
      .select('groups(*)')
      .eq('user_id', uid)
    setGroups((data?.map((d: any) => d.groups) || []) as Group[])
    setLoading(false)
  }

  async function createGroup() {
    if (!newGroupName.trim()) return
    const { data: group } = await supabase
      .from('groups')
      .insert({ name: newGroupName, created_by: userId })
      .select()
      .single()
    if (group) {
      await supabase.from('group_members').insert({
        group_id: group.id, user_id: userId, display_name: joinName || userName
      })
      router.push(`/group/${group.id}`)
    }
  }

  async function joinGroup() {
    if (!joinCode.trim()) return
    const { data: group } = await supabase
      .from('groups')
      .select()
      .eq('code', joinCode.trim().toLowerCase())
      .single()
    if (!group) { alert('Código no encontrado'); return }
    await supabase.from('group_members').upsert({
      group_id: group.id, user_id: userId, display_name: joinName || userName
    })
    router.push(`/group/${group.id}`)
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Cargando...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚽</span>
          <span className="font-semibold text-gray-900">Prode 2026</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{userName}</span>
          <button onClick={logout} className="text-xs text-gray-400 hover:text-gray-600">Salir</button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {view === 'list' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-lg font-semibold">Tus grupos</h1>
            </div>

            {groups.length === 0 ? (
              <div className="card text-center py-10">
                <div className="text-4xl mb-3">🏆</div>
                <p className="text-gray-500 text-sm mb-4">Todavía no estás en ningún grupo</p>
              </div>
            ) : (
              <div className="space-y-3 mb-4">
                {groups.map(g => (
                  <Link key={g.id} href={`/group/${g.id}`}>
                    <div className="card hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{g.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">Código: {g.code}</div>
                      </div>
                      <span className="text-gray-300 text-lg">›</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setView('create')} className="btn-primary">
                + Crear grupo
              </button>
              <button onClick={() => setView('join')} className="btn-secondary">
                Unirse con código
              </button>
            </div>
          </>
        )}

        {view === 'create' && (
          <div className="card">
            <h2 className="font-semibold mb-4">Crear nuevo grupo</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Nombre del grupo</label>
                <input className="input" placeholder="Ej: Los del trabajo" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Tu nombre en el grupo</label>
                <input className="input" placeholder={userName} value={joinName} onChange={e => setJoinName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button onClick={() => setView('list')} className="btn-secondary">Cancelar</button>
                <button onClick={createGroup} className="btn-primary">Crear →</button>
              </div>
            </div>
          </div>
        )}

        {view === 'join' && (
          <div className="card">
            <h2 className="font-semibold mb-4">Unirse a un grupo</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Código del grupo</label>
                <input className="input" placeholder="ej: a1b2c3d4" value={joinCode} onChange={e => setJoinCode(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Tu nombre en el grupo</label>
                <input className="input" placeholder={userName} value={joinName} onChange={e => setJoinName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button onClick={() => setView('list')} className="btn-secondary">Cancelar</button>
                <button onClick={joinGroup} className="btn-primary">Unirse →</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
