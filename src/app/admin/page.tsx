'use client'
import { useState } from 'react'

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [sessions, setSessions] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true); setError('')
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) { setError('비밀번호가 틀렸습니다.'); return }
      const data = await res.json()
      setSessions(data.sessions)
      setIsAuthenticated(true)
    } catch { setError('오류가 발생했습니다.') }
    finally { setIsLoading(false) }
  }

  if (!isAuthenticated) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-xl">
        <h1 className="text-xl font-bold text-center mb-6">관리자 로그인</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="비밀번호 입력"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400" />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button type="submit" disabled={isLoading} className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-medium disabled:opacity-50">
            {isLoading ? '확인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">관리자 페이지</h1>
          <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm">총 {sessions.length}명</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            {sessions.map((s: any) => (
              <div key={s.id} onClick={() => setSelected(s)}
                className={`bg-white rounded-xl p-4 cursor-pointer border-2 transition-colors ${selected?.id === s.id ? 'border-blue-500' : 'border-transparent hover:border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">{s.name[0]}</div>
                  <div>
                    <p className="font-medium text-sm">{s.name} <span className="text-gray-400 font-normal">({s.age}살)</span></p>
                    <p className="text-xs text-gray-500">{s.department}</p>
                    <p className="text-xs text-gray-400">{new Date(s.created_at).toLocaleDateString('ko-KR')} · 메시지 {s.chat_messages?.length || 0}개</p>
                  </div>
                </div>
              </div>
            ))}
            {sessions.length === 0 && <p className="text-center text-gray-400 py-8">세션이 없습니다.</p>}
          </div>

          <div className="lg:col-span-2">
            {selected ? (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="mb-4 pb-4 border-b">
                  <h2 className="text-lg font-semibold mb-2">{selected.name}</h2>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600">
                    <p>나이: {selected.age}살</p>
                    <p>학번: {selected.student_id}</p>
                    <p>학과: {selected.department}</p>
                    <p>학년: {selected.year_semester}</p>
                    <p>진로: {selected.career_intention}</p>
                    {selected.military_status && <p>군복무: {selected.military_status}</p>}
                    <p className="text-gray-400 text-xs col-span-2">참여일: {new Date(selected.created_at).toLocaleString('ko-KR')}</p>
                  </div>
                </div>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {selected.chat_messages?.length > 0 ? selected.chat_messages.map((msg: any) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-xl px-4 py-2 text-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'}`}>
                        {msg.content}
                      </div>
                    </div>
                  )) : <p className="text-center text-gray-400 py-8">대화 내역이 없습니다.</p>}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-6 flex items-center justify-center h-40 shadow-sm">
                <p className="text-gray-400">왼쪽에서 세션을 선택하세요</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}