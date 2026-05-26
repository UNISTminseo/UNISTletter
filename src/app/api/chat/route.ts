export const maxDuration = 30

export async function POST(req: Request) {
  const { messages } = await req.json()

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openrouter/auto',
      messages: [
        { role: 'system', content: 'You are a helpful assistant. Respond in the same language the user writes in.' },
        ...messages,
      ],
    }),
  })

  const data = await response.json()
  console.log('OpenRouter response:', JSON.stringify(data))
  const content = data.choices?.[0]?.message?.content ?? '응답을 받지 못했습니다.'

  return Response.json({ content })
}