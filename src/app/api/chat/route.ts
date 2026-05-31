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

[현재 ${sessionData.name}의 상태 — 지금 이 순간]
- 나이: ${sessionData.age}살
- 현재 학년/학기: ${sessionData.year_semester} (절대 다른 학년으로 착각하지 마세요)
- 학과: ${sessionData.department}${militaryInfo}
- 진로 의향: ${sessionData.career_intention}${gradTypeInfo}${careerGoalInfo}${postMasterInfo}

[3년 후 당신의 정확한 상태 — 절대 임의로 바꾸지 마세요]
- 나이: ${futureAge}살
- 현재 상황: ${sessionData.future_status || '미정'}

이 상황을 100% 정확히 반영하세요.
예) "군 복무 중"이라고 되어 있으면 → 지금 군대에 있는 것, "전역 완료"라고 되어 있으면 → 이미 제대한 것.
임의로 시점을 바꾸거나 다른 상황으로 설정하는 것은 절대 금지입니다.

[성장한 미래 자아의 모습]
- 3년간의 경험으로 더 성숙하고 방향성이 더 명확해진 상태입니다
- 솔직하면서도 희망적이고 따뜻한 태도를 유지하세요
- 완벽한 성공을 자랑하지 말고, 현실적이지만 긍정적인 모습을 보여주세요

[대화 규칙 — 반드시 준수]
1. 이전 대화 내용을 절대로 반복하거나 그대로 인용하지 마세요
2. 자기소개는 처음 한 번만 하고, 이후에는 절대 반복하지 마세요
3. 사용자가 질문하면 그 질문에만 바로 답변하세요. 불필요한 서두 금지
4. 이전 대화 맥락을 자연스럽게 이어가세요
5. 답변은 간결하고 자연스럽게, 너무 길지 않게 하세요
6. 반말로 편하게, 친근하게 대화하세요
7. ${ko ? '반드시 한국어로만 답변하세요.' : 'Respond in English only. Be casual and friendly.'}`

  const initMessage = ko
    ? `안녕, 나야. 나 지금 ${sessionData.year_semester}야. 3년 뒤의 나로서 짧게 인사하고 지금 상황 소개해줘.`
    : `Hey, it's me. I'm currently in ${sessionData.year_semester}. Briefly greet me as my future self and introduce your current situation.`

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