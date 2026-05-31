'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

type Message = { id: string; role: 'user' | 'assistant'; content: string }

export default function ChatPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionData, setSessionData] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const initialized = useRef(false)

  useEffect(() => {
    const data = sessionStorage.getItem('sessionData')
    const sessionId = sessionStorage.getItem('sessionId')
    if (!data || !sessionId) { router.push('/'); return }
    const parsed = JSON.parse(data)
    setSessionData(parsed)
    if (!initialized.current) {
      initialized.current = true
      initChat(parsed, sessionId)
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const initChat = async (sessData: any, sessionId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [], sessionData: sessData, sessionId, isInit: true }),
      })
      const data = await response.json()
      setMessages([{ id: Date.now().toString(), role: 'assistant', content: data.content }])
    } catch (err) { console.error(err) }
    finally { setIsLoading(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || !sessionData) return
    const sessionId = sessionStorage.getItem('sessionId')
    const text = input
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          sessionData,
          sessionId,
          isInit: false,
          userMessage: text,
        }),
      })
      const data = await response.json()
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: data.content }])
    } catch (err) { console.error(err) }
    finally { setIsLoading(false) }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-white shadow-sm px-4 py-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
          {sessionData?.name?.[0] || '?'}
        </div>
        <div>
          <p className="font-semibold text-gray-800">3년 뒤의 {sessionData?.name || '나'}</p>
          <p className="text-xs text-gray-500">{sessionData?.department} · {sessionData?.age ? sessionData.age + 3 : ''}살</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user' ? 'bg-blue-500 text-white rounded-br-sm' : 'bg-white text-gray-800 shadow-sm rounded-bl-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex gap-1">
              {[0, 150, 300].map(delay => (
                <div key={delay} className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white px-4 py-4 border-t">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="미래의 나에게 물어보세요..."
            className="flex-1 border border-gray-200 rounded-full px-4 py-3 text-sm focus:outline-none focus:border-blue-400 bg-gray-50"
          />
          <button type="submit" disabled={isLoading || !input.trim()} className="bg-blue-500 text-white rounded-full px-5 py-3 text-sm font-medium disabled:opacity-50 hover:bg-blue-600">
            전송
          </button>
        </form>
      </div>
    </div>
  )
}