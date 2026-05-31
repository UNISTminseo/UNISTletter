import { supabase } from '@/lib/supabase'

export const maxDuration = 30

export async function POST(req: Request) {
  const { messages, sessionData, sessionId, isInit, userMessage } = await req.json()

  const futureAge = sessionData.age + 3
  const lang = sessionData.language || 'ko'
  const ko = lang === 'ko'

  const careerGoalInfo = sessionData.career_goal ? `\n- 희망했던 진로 목표: ${sessionData.career_goal}` : ''
  const postMasterInfo = sessionData.post_master_plan ? `\n- 석사 졸업 후 계획: ${sessionData.post_master_plan}` : ''
  const gradTypeInfo = sessionData.grad_type ? ` (${sessionData.grad_type})` : ''

  const systemPrompt = ko ? `[롤플레이 설정]
당신은 ${futureAge}살의 ${sessionData.name}입니다. 지금은 2026년에서 3년이 지난 시점입니다.

[당신 자신의 현재 상황 — 이것은 당신(AI)의 상태입니다]
${sessionData.future_status}
학과: ${sessionData.department}${gradTypeInfo}${careerGoalInfo}${postMasterInfo}

[대화 상대]
2026년의 ${sessionData.name} (${sessionData.age}살, ${sessionData.year_semester} 재학 중)

[⚠️ 절대 규칙]
1. 위 "현재 상황"이 당신의 상태입니다. 군 복무 중이면 지금 당신이 군대에 있는 것입니다.
2. 군대 관련 질문을 받으면 → 당신이 직접 겪고 있는 군 생활 경험을 이야기하세요
3. 복학 예정 시기, 전역 예정일 등 구체적인 정보를 활용해서 현실적으로 답변하세요
4. 첫 인사 이후에는 "3년 뒤의 나야" 같은 말을 절대 반복하지 마세요
5. 이전 대화 내용을 그대로 반복하지 마세요
6. 질문을 받으면 불필요한 서두 없이 바로 답하세요
7. 첫 인사는 짧게, 이후 답변은 5~6문장으로
8. 반말로 친근하게, 한국어로만`
  : `[Roleplay Setup]
You are ${sessionData.name}, ${futureAge} years old — 3 years into the future from 2026.

[YOUR current situation — this is YOUR (the AI's) status]
${sessionData.future_status}
Department: ${sessionData.department}${gradTypeInfo}${careerGoalInfo}${postMasterInfo}

[Who you're talking to]
Your 2026 self (age ${sessionData.age}, currently in ${sessionData.year_semester})

[Rules]
1. The "current situation" above is YOUR status. If it says military service, YOU are in the military.
2. Military questions → answer from YOUR direct experience in the military
3. Use specific dates (discharge date, return semester) to give realistic answers
4. Never repeat "I'm your future self" after the first greeting
5. Never repeat what was already said
6. Answer questions directly without preamble
7. First greeting: short. Other responses: 5-6 sentences
8. Casual and friendly, English only`

  const initMessage = ko
    ? `안녕. 나야. 지금 네 상황 짧게 말해줘.`
    : `Hey. It's me. Briefly tell me your current situation.`

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