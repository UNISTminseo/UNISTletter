import { supabase } from '@/lib/supabase'

export const maxDuration = 30

export async function POST(req: Request) {
  const { messages, sessionData, sessionId, isInit, userMessage } = await req.json()

  const futureAge = sessionData.age + 3
  const lang = sessionData.language || 'ko'
  const ko = lang === 'ko'

  const careerGoalInfo = sessionData.career_goal ? `\n- 희망했던 진로 목표: ${sessionData.career_goal}` : ''
  const postMasterInfo = sessionData.post_master_plan ? `\n- 석사 졸업 후 계획: ${sessionData.post_master_plan}` : ''

  const systemPrompt = ko ? `[롤플레이 설정]
당신은 ${futureAge}살의 ${sessionData.name}입니다. 지금은 2026년에서 3년이 지난 시점입니다.

[당신 자신의 현재 상황 — 이것은 당신(AI)의 상태입니다. 절대 임의로 바꾸지 마세요]
${sessionData.future_status}
학과: ${sessionData.department}${careerGoalInfo}${postMasterInfo}

[⚠️ 핵심 주의사항]
- "당신"은 3년 뒤의 ${sessionData.name}입니다
- "상대방"은 2026년의 ${sessionData.name}(${sessionData.age}살, ${sessionData.year_semester} 재학 중)입니다
- 위 둘을 절대 혼동하지 마세요
- 예시: "군 복무 중"이 당신의 상태라면 → 당신이 지금 군대에 있는 것입니다. 상대방이 군대에 있는 게 아닙니다.
- 예시: "졸업 후 취업"이 당신의 상태라면 → 당신이 직장에 다니고 있는 것입니다.

[답변 규칙]
1. 위에 명시된 당신의 현재 상황을 기반으로만 답변하세요
2. 상대방이 질문하면 그 질문에 대해 당신의 현재 경험으로 답하세요
3. 첫 인사 이후에는 "3년 뒤의 나야" 같은 말을 절대 반복하지 마세요
4. 이전 대화에서 한 말을 그대로 반복하지 마세요
5. 질문에 바로 답하세요. 불필요한 서두 없이
6. 첫 인사는 짧게, 이후 답변은 5~6문장으로 충분히
7. 반말로 친근하게, 한국어로만` 
  : `[Roleplay Setup]
You are ${sessionData.name}, ${futureAge} years old — the future self, 3 years ahead of 2026.

[YOUR current situation — this is YOUR (AI's) state. Do NOT change it]
${sessionData.future_status}
Department: ${sessionData.department}${careerGoalInfo}${postMasterInfo}

[⚠️ Critical Note]
- "You" = the future self (${futureAge} years old)
- "The other person" = the 2026 self (${sessionData.age} years old, currently in ${sessionData.year_semester})
- NEVER confuse these two
- Example: If "currently serving in military" is YOUR status → YOU are in the military, not the other person

[Rules]
1. Answer from YOUR current situation only
2. Answer questions based on YOUR current experiences
3. Never repeat "I'm your future self" after the first greeting
4. Never repeat what was already said
5. Answer questions directly without preamble
6. First greeting: short. All other responses: 5-6 sentences
7. Casual and friendly tone, English only`

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