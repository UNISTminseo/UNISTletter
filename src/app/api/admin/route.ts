import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  const { password } = await req.json()

  if (password !== process.env.ADMIN_PASSWORD) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('*, chat_messages(*)')
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ sessions })
}