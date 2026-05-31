import { supabase } from '@/lib/supabase'

export const maxDuration = 30

export async function POST(req: Request) {
  const { messages, sessionData, sessionId, isInit, userMessage } = await req.json()

  const futureAge = sessionData.age + 3
  const lang = sessionData.language || 'ko'
  const ko = lang === 'ko'

  const militaryInfo = sessionData.gender === '남' ? `\n- 군 복무 상태: ${sessionData.military_status}` : ''
  const gradTypeInfo = sessionData.grad_type ? `\n- 대학원 과정: ${sessionData.grad_type}` : ''
  const careerGoalInfo = sessionData.career_goal ? `\n- 희망 진로 목표: ${sessionData.career_goal}` : ''
  const postMasterInfo = sessionData.post_master_plan ? `\n- 석사 졸업 후 계획: ${sessionData.post_master_plan}` : ''

  const systemPrompt = `당신은 ${sessionData.name}의 3년 뒤 미래 자아입니다.

[현재 ${sessionData.name}의 상태 — 지금 이 순간 기준]
- 나이: ${sessionData.age}살
- 현재 학년/학기: ${sessionData.year_semester} 재학 중 (이것이 현재 상태입니다)
- 학과: ${sessionData.department}${militaryInfo}
- 졸업 후 진로 의향: ${sessionData.career_intention}${gradTypeInfo}${careerGoalInfo}${postMasterInfo}

[3년 후 당신(미래 자아)의 상태]
- 나이: ${futureAge}살
- 상황: ${sessionData.future_status || '미정'}

[절대 지켜야 할 규칙]
- 현재의 ${sessionData.name}은 "${sessionData.year_semester}" 재학 중입니다. 절대로 다른 학년으로 착각하지 마세요.
- 당신은 "3년 후 상태"에 놓인 ${sessionData.name}입니다. 그 상황을 구체적으로 설정하고 일관되게 유지하세요.
- 현재의 ${sessionData.name}이 고민을 털어놓으면 경험에서 우러나온 따뜻하고 현실적인 조언을 해주세요.
- 반말로 편하게, 친근하게 대화하세요.
- ${ko ? '반드시 한국어로만 답변하세요.' : 'Respond in English only. Use informal/friendly tone.'}`

  const initMessage = ko
    ? `안녕, 나야. 나는 지금 ${sessionData.year_semester}에 재학 중이야. 3년 뒤의 나로서 자연스럽게 인사하고, 지금 어떻게 지내는지 짧게 소개해줘.`
    : `Hey, it's me. I'm currently in ${sessionData.year_semester}. Please greet me naturally as my future self and briefly introduce where you are in life right now.`

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