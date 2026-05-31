'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const DEPARTMENTS = [
  '기계공학과', '지구환경도시건설공학과', '반도체공학과', '신소재공학과',
  '반도체특성화융합전공', '에너지화학공학과', '원자력공학과', '탄소중립 마이크로 전공',
  '디자인학과', '바이오메디컬공학과', '산업공학과', '생명과학과',
  '의과학 마이크로 전공', '전기전자공학과', '컴퓨터공학과',
  '물리학과', '수리과학과', '화학과', '경영과학부', '기타',
]

export default function SurveyPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', age: '', studentId: '', yearSemester: '',
    gender: '', militaryStatus: '', department: '',
    careerIntention: '', careerGoal: '',
  })

  useEffect(() => {
    if (!sessionStorage.getItem('consent')) router.push('/')
  }, [router])

  const update = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.gender === '남' && !form.militaryStatus) {
      alert('군 복무 여부를 선택해주세요.')
      return
    }
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert([{
          name: form.name,
          age: parseInt(form.age),
          student_id: form.studentId,
          year_semester: form.yearSemester,
          gender: form.gender,
          military_status: form.gender === '남' ? form.militaryStatus : null,
          department: form.department,
          career_intention: form.careerIntention,
          career_goal: form.careerGoal || null,
        }])
        .select()
        .single()
      if (error) throw error
      sessionStorage.setItem('sessionId', data.id)
      sessionStorage.setItem('sessionData', JSON.stringify(data))
      router.push('/chat')
    } catch (err) {
      console.error(err)
      alert('오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 bg-gray-50"
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5"
  const toggleClass = (active: boolean) =>
    `py-2.5 rounded-xl border text-sm transition-colors ${active ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-lg w-full p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">기본 정보 입력</h1>
          <p className="text-gray-500 mt-1 text-sm">3년 뒤의 나를 만들기 위한 정보를 입력해주세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>이름</label>
              <input required className={inputClass} placeholder="홍길동" value={form.name} onChange={e => update('name', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>나이</label>
              <input required type="number" min="18" max="40" className={inputClass} placeholder="23" value={form.age} onChange={e => update('age', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>학번</label>
              <input required className={inputClass} placeholder="20210001" value={form.studentId} onChange={e => update('studentId', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>학년/학기</label>
              <select required className={inputClass} value={form.yearSemester} onChange={e => update('yearSemester', e.target.value)}>
                <option value="">선택</option>
                {['1학년 1학기','1학년 2학기','2학년 1학기','2학년 2학기','3학년 1학기','3학년 2학기','4학년 1학기','4학년 2학기','졸업생'].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>학과</label>
            <select required className={inputClass} value={form.department} onChange={e => update('department', e.target.value)}>
              <option value="">선택</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <label className={labelClass}>성별</label>
            <div className="flex gap-3">
              {['남', '여'].map(g => (
                <button key={g} type="button" onClick={() => update('gender', g)} className={`flex-1 ${toggleClass(form.gender === g)}`}>{g}</button>
              ))}
            </div>
          </div>

          {form.gender === '남' && (
            <div>
              <label className={labelClass}>군 복무 여부</label>
              <div className="grid grid-cols-2 gap-2">
                {['입대 예정', '현역 복무 중', '전역', '공익/사회복무', '면제'].map(s => (
                  <button key={s} type="button" onClick={() => update('militaryStatus', s)} className={toggleClass(form.militaryStatus === s)}>{s}</button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className={labelClass}>졸업 후 진로 의향</label>
            <div className="grid grid-cols-3 gap-2">
              {['대학원 진학', '취업', '아직 모름'].map(c => (
                <button key={c} type="button" onClick={() => update('careerIntention', c)} className={toggleClass(form.careerIntention === c)}>{c}</button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>희망 세부 분야 또는 진로 목표 <span className="text-gray-400 font-normal">(선택)</span></label>
            <textarea
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 bg-gray-50 resize-none"
              rows={3}
              placeholder="예) AI 연구자, 반도체 설계 엔지니어, 스타트업 창업 등 자유롭게 적어주세요"
              value={form.careerGoal}
              onChange={e => update('careerGoal', e.target.value)}
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <p className="font-semibold mb-1">⚠️ 이용 전 주의사항</p>
            <p>AI는 점쟁이가 아닙니다. 본 서비스는 진로 계획에 대한 가벼운 조언 정도로만 참고해주시고, 실제 진로 결정은 본인의 판단과 전문가의 조언을 따라주세요.</p>
          </div>

          <button type="submit" disabled={isLoading} className="w-full py-4 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 disabled:opacity-50">
            {isLoading ? '처리 중...' : '3년 뒤의 나와 대화하기 →'}
          </button>
        </form>
      </div>
    </div>
  )
}