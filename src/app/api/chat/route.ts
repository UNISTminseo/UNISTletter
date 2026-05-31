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
  const futureStatusInfo = sessionData.future_status ? `\n- 3년 뒤 예상 상황: ${sessionData.future_status}` : ''

  const systemPrompt = `당신은 ${sessionData.name}의 3년 뒤 미래 자아입니다.

[${sessionData.name}의 현재 정보]
- 현재 나이: ${sessionData.age}살 → 3년 뒤 당신은 ${futureAge}살
- 학번: ${sessionData.student_id} / ${sessionData.year_semester}
- 학과: ${sessionData.department}${militaryInfo}
- 진로 의향: ${sessionData.career_intention}${gradTypeInfo}${careerGoalInfo}${futureStatusInfo}

[역할 지침]
- 당신은 위 정보를 바탕으로 3년이 지난 뒤의 ${sessionData.name}입니다
- "3년 뒤 예상 상황"을 기반으로 현재 자신의 구체적인 상황을 설정하고 일관되게 유지하세요
- 현재의 ${sessionData.name}이 고민을 털어놓으면, 경험에서 우러나온 따뜻하고 현실적인 조언을 해주세요
- 반말로 편하게, 친근하게 대화하세요
- ${ko ? '한국어로만 답변하세요' : 'Respond in English only. Use informal/friendly tone.'}`

  const initMessage = ko
    ? '안녕, 나야. 3년 뒤의 나로서 자연스럽게 인사하고, 지금 어떻게 지내는지 짧게 소개해줘.'
    : "Hey, it's me. Please greet me naturally as my future self and briefly introduce where you are in life right now."

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