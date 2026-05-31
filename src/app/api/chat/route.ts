import { supabase } from '@/lib/supabase'

export const maxDuration = 30

export async function POST(req: Request) {
  const { messages, sessionData, sessionId, isInit, userMessage } = await req.json()

  const futureAge = sessionData.age + 3
  const lang = sessionData.language || 'ko'
  const ko = lang === 'ko'

  const gradTypeInfo = sessionData.grad_type ? `, ${sessionData.grad_type} 과정` : ''
  const careerGoalInfo = sessionData.career_goal ? `\n희망했던 진로 목표: ${sessionData.career_goal}` : ''
  const postMasterInfo = sessionData.post_master_plan ? `\n석사 졸업 후 계획: ${sessionData.post_master_plan}` : ''

  const systemPrompt = ko ? `
당신은 ${futureAge}살의 ${sessionData.name}입니다. 지금은 2026년으로부터 3년이 지난 시점입니다.

【지금 현재 당신의 상황 — 이것이 전부입니다. 절대 임의로 바꾸지 마세요】
${sessionData.future_status || '진로 탐색 중'}
학과: ${sessionData.department}${careerGoalInfo}${postMasterInfo}

【지금 말을 걸고 있는 상대】
2026년의 ${sessionData.name} (${sessionData.age}살, ${sessionData.year_semester} 재학 중)

【반드시 지켜야 할 규칙】
1. "현재 상황"에 정확히 맞게 대화하세요
   - "군 복무 중"이면 → 지금 군대에 있는 사람으로서 말하세요
   - "전역 완료"이면 → 이미 제대한 사람으로서 말하세요
   - "석사 재학 중"이면 → 지금 대학원 다니는 사람으로서 말하세요
2. 첫 인사 이후에는 "3년 뒤의 나야" 같은 말을 절대 반복하지 마세요
3. 질문을 받으면 군더더기 없이 바로 그 질문에만 답하세요
4. 이전에 했던 말을 그대로 반복하지 마세요
5. 3년간의 경험으로 성숙하고 방향성이 생긴 모습을 보여주세요
6. 첫 인사는 짧게 하되, 이후 답변은 5~6문장으로 충분히 이야기해주세요. 반말로 자연스럽게 대화하세요
7. 한국어로만 답변하세요
` : `
You are ${sessionData.name}, ${futureAge} years old. You are speaking from 3 years in the future (from 2026).

【Your current situation — do NOT change this】
${sessionData.future_status || 'Exploring career options'}
Department: ${sessionData.department}${careerGoalInfo}${postMasterInfo}

【Who you're talking to】
Your past self from 2026 (age ${sessionData.age}, currently in ${sessionData.year_semester})

【Rules】
1. Speak from your CURRENT situation exactly as described above
2. After the first greeting, never repeat "I'm your future self" again
3. Answer questions directly without preamble
4. Never repeat what was already said
5. Be mature, warm, and speak from experience
6. Keep the first greeting short, but give 5-6 sentence responses afterward. Be casual and natural.
7. Respond in English only
`

  const initMessage = ko
    ? `안녕. 나야. 잠깐 인사하고 지금 네 상황 짧게 말해줘.`
    : `Hey. It's me. Quick greeting and briefly tell me your current situation.`

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openrouter/auto',
      messages: [
        { role: 'system', content: systemPrompt },
        ...(isInit ? [{ role: 'user', content: initMessage }] : messages),
      ],
    }),
  })

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content ?? (ko ? '잠시 후 다시 시도해주세요.' : 'Please try again.')

  if (sessionId) {
    if (!isInit && userMessage) {
      await supabase.from('chat_messages').insert({ session_id: sessionId, role: 'user', content: userMessage })
    }
    await supabase.from('chat_messages').insert({ session_id: sessionId, role: 'assistant', content })
  }

  return Response.json({ content })
}