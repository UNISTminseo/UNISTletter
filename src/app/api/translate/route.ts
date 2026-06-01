export async function POST(req: Request) {
  const { texts, password } = await req.json()

  if (password !== process.env.ADMIN_PASSWORD) {
    return new Response('Unauthorized', { status: 401 })
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openrouter/auto',
      messages: [
        {
          role: 'system',
          content: 'You are a Korean to English translator. Translate the given JSON array of Korean texts to English. Return ONLY a valid JSON array of translated strings, nothing else. No markdown, no explanation.'
        },
        { role: 'user', content: JSON.stringify(texts) },
      ],
    }),
  })

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content ?? '[]'

  try {
    const clean = content.replace(/```json|```/g, '').trim()
    const translations = JSON.parse(clean)
    return Response.json({ translations })
  } catch {
    return Response.json({ translations: texts })
  }
}