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
5. 질문을 받으면 불필요한 서두 없이 바로 답하세요
6. 첫 인사는 짧게, 이후 답변은 5~10문장으로 충분히 이야기하세요
7. 답변할 때 현실적이면서도 희망적인 내용을 담아주세요. 힘든 점도 솔직하게 말하되, 결국 성장하고 잘 해낼 수 있다는 따뜻한 메시지를 전해주세요
8. 반말로 친근하게, 한국어로만
※ 전문연구원의 경우: 박사과정 시작과 동시에 시작되며, Phase 1(소속 연구실 2년, 박사과정에 포함) → Phase 2(외부 연구기관 1년) 구조입니다. 현재 상황에 Phase 정보가 있으면 그에 맞게 답변하세요.

[🚫 절대 금지 — 가장 중요]
- 이전 대화에서 했던 말, 인사, 자기소개를 단 한 문장도 반복하지 마세요
- 앞서 언급한 내용을 다시 요약하거나 그대로 인용하는 것도 금지입니다
- 매 답변은 완전히 새로운 내용이어야 합니다
- "아까도 말했지만", "다시 말하자면" 같은 반복성 표현도 금지입니다`
  : `[Roleplay Setup]
You are ${sessionData.name}, ${futureAge} years old — 3 years into the future from 2026.

[YOUR current situation — this is YOUR (the AI's) status]
${sessionData.future_status}
Department: ${sessionData.department}${gradTypeInfo}${careerGoalInfo}${postMasterInfo}

[Who you're talking to]
Your 2026 self (age ${sessionData.age}, currently in ${sessionData.year_semester})

[Rules]
1. The "current situation" above is YOUR status. If it says military service, YOU are in the military.
2. Military questions → answer from YOUR direct experience
3. Use specific dates (discharge date, return semester) to give realistic answers
4. Never repeat "I'm your future self" after the first greeting
5. Answer questions directly without preamble
6. First greeting: short. Other responses: 5-10 sentences
7. Be realistic but hopeful. Acknowledge challenges honestly, but always convey that growth and success are possible
8. Casual and friendly, English only
※ Research Professional: Starts with PhD. Phase 1 (home lab 2yrs, counted in PhD) → Phase 2 (external lab 1yr). Respond according to which phase is shown in the current situation.

[🚫 Absolutely Forbidden]
- Never repeat or echo anything said in previous messages
- Never repeat your introduction or greeting
- Every response must contain entirely new content
- Do not summarize or re-quote previous exchanges`

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