'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Lang = 'ko' | 'en'

const DEPARTMENTS = [
  '기계공학과', '지구환경도시건설공학과', '반도체공학과', '신소재공학과',
  '반도체특성화융합전공', '에너지화학공학과', '원자력공학과', '탄소중립 마이크로 전공',
  '디자인학과', '바이오메디컬공학과', '산업공학과', '생명과학과',
  '의과학 마이크로 전공', '전기전자공학과', '컴퓨터공학과',
  '물리학과', '수리과학과', '화학과', '경영과학부', '기타',
]

const YEAR_SEMESTER_KO = ['1학년 1학기','1학년 2학기','2학년 1학기','2학년 2학기','3학년 1학기','3학년 2학기','4학년 1학기','4학년 2학기','졸업생']
const YEAR_SEMESTER_EN = ['Year 1 Sem 1','Year 1 Sem 2','Year 2 Sem 1','Year 2 Sem 2','Year 3 Sem 1','Year 3 Sem 2','Year 4 Sem 1','Year 4 Sem 2','Graduate']

const semesterToNumber = (ys: string): number => {
  const map: { [key: string]: number } = {
    '1학년 1학기': 1, '1학년 2학기': 2, '2학년 1학기': 3, '2학년 2학기': 4,
    '3학년 1학기': 5, '3학년 2학기': 6, '4학년 1학기': 7, '4학년 2학기': 8, '졸업생': 9,
  }
  return map[ys] || 0
}

const calculateFutureStatus = (yearSemester: string, careerIntention: string, gradType: string): string => {
  const current = semesterToNumber(yearSemester)
  if (current === 0) return ''
  const undergradLeft = Math.max(0, 8 - current)
  const gradSemesters = 6 - undergradLeft

  if (careerIntention === '대학원 진학') {
    if (gradSemesters <= 0) {
      const f = current + 6
      return `아직 학부 ${Math.ceil(f / 2)}학년 ${f % 2 === 1 ? '1' : '2'}학기 재학 중 (졸업 전)`
    }
    if (gradType === '석사') {
      if (gradSemesters <= 4) {
        return `석사 ${Math.ceil(gradSemesters / 2)}학년 ${gradSemesters % 2 === 1 ? '1' : '2'}학기 재학 중`
      } else {
        return `석사 졸업 후 약 ${gradSemesters - 4}학기 경과`
      }
    } else if (gradType === '석박통합') {
      return `석박통합 ${Math.ceil(gradSemesters / 2)}학년 ${gradSemesters % 2 === 1 ? '1' : '2'}학기 재학 중`
    }
  } else if (careerIntention === '취업') {
    if (gradSemesters <= 0) {
      const f = current + 6
      return `아직 학부 ${Math.ceil(f / 2)}학년 ${f % 2 === 1 ? '1' : '2'}학기 재학 중 (졸업 전)`
    }
    return `학부 졸업 후 취업 약 ${gradSemesters}학기 경과`
  } else {
    // 아직 모름
    if (gradSemesters <= 0) {
      const f = current + 6
      return `아직 학부 ${Math.ceil(f / 2)}학년 ${f % 2 === 1 ? '1' : '2'}학기 재학 중 (졸업 전, 진로 미정)`
    }
    return `학부는 이미 졸업한 상태 (졸업 후 약 ${gradSemesters}학기 경과), 아직 진로 탐색 중`
  }
  return ''
}

export default function SurveyPage() {
  const router = useRouter()
  const [lang, setLang] = useState<Lang>('ko')
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', age: '', studentId: '', yearSemester: '',
    gender: '', militaryStatus: '', department: '',
    careerIntention: '', gradType: '', postMasterPlan: '', careerGoal: '',
  })

  useEffect(() => {
    if (!sessionStorage.getItem('consent')) router.push('/')
  }, [router])

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }))
  const ko = lang === 'ko'

  const futurePreview = form.yearSemester && form.careerIntention &&
    (form.careerIntention !== '대학원 진학' || form.gradType)
    ? calculateFutureStatus(form.yearSemester, form.careerIntention, form.gradType)
    : null

  const showPostMasterPlan = futurePreview?.includes('석사 졸업 후')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.gender === '남' && !form.militaryStatus) {
      alert(ko ? '군 복무 여부를 선택해주세요.' : 'Please select your military service status.')
      return
    }
    if (form.careerIntention === '대학원 진학' && !form.gradType) {
      alert(ko ? '대학원 과정을 선택해주세요.' : 'Please select your graduate program type.')
      return
    }
    if (showPostMasterPlan && !form.postMasterPlan) {
      alert(ko ? '석사 졸업 후 계획을 선택해주세요.' : 'Please select your post-master\'s plan.')
      return
    }
    setIsLoading(true)
    const futureStatus = calculateFutureStatus(form.yearSemester, form.careerIntention, form.gradType)
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
          grad_type: form.careerIntention === '대학원 진학' ? form.gradType : null,
          post_master_plan: showPostMasterPlan ? form.postMasterPlan : null,
          career_goal: form.careerGoal || null,
          future_status: futureStatus,
          language: lang,
        }])
        .select()
        .single()
      if (error) throw error
      sessionStorage.setItem('sessionId', data.id)
      sessionStorage.setItem('sessionData', JSON.stringify(data))
      router.push('/chat')
    } catch (err) {
      console.error(err)
      alert(ko ? '오류가 발생했습니다. 다시 시도해주세요.' : 'An error occurred. Please try again.')
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

        {/* 언어 토글 */}
        <div className="flex justify-end mb-4">
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            <button onClick={() => setLang('ko')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${lang === 'ko' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>한국어</button>
            <button onClick={() => setLang('en')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${lang === 'en' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>English</button>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">{ko ? '기본 정보 입력' : 'Enter Your Information'}</h1>
          <p className="text-gray-500 mt-1 text-sm">{ko ? '3년 뒤의 나를 만들기 위한 정보를 입력해주세요' : 'Help us build your future self 3 years from now'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{ko ? '이름' : 'Name'}</label>
              <input required className={inputClass} placeholder={ko ? '홍길동' : 'John Doe'} value={form.name} onChange={e => update('name', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>{ko ? '나이' : 'Age'}</label>
              <input required type="number" min="18" max="40" className={inputClass} placeholder="23" value={form.age} onChange={e => update('age', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{ko ? '학번' : 'Student ID'}</label>
              <input required className={inputClass} placeholder="20210001" value={form.studentId} onChange={e => update('studentId', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>{ko ? '학년/학기' : 'Year/Semester'}</label>
              <select required className={inputClass} value={form.yearSemester} onChange={e => update('yearSemester', e.target.value)}>
                <option value="">{ko ? '선택' : 'Select'}</option>
                {YEAR_SEMESTER_KO.map((v, i) => (
                  <option key={v} value={v}>{ko ? v : YEAR_SEMESTER_EN[i]}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>{ko ? '학과' : 'Department'}</label>
            <select required className={inputClass} value={form.department} onChange={e => update('department', e.target.value)}>
              <option value="">{ko ? '선택' : 'Select'}</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <label className={labelClass}>{ko ? '성별' : 'Gender'}</label>
            <div className="flex gap-3">
              {[['남', 'Male'], ['여', 'Female']].map(([kv, ev]) => (
                <button key={kv} type="button" onClick={() => update('gender', kv)} className={`flex-1 ${toggleClass(form.gender === kv)}`}>{ko ? kv : ev}</button>
              ))}
            </div>
          </div>

          {form.gender === '남' && (
            <div>
              <label className={labelClass}>{ko ? '군 복무 여부' : 'Military Service Status'}</label>
              <div className="grid grid-cols-2 gap-2">
                {[['입대 예정','Planned'],['현역 복무 중','Serving'],['전역','Discharged'],['공익/사회복무','Social Service'],['면제','Exempt']].map(([kv, ev]) => (
                  <button key={kv} type="button" onClick={() => update('militaryStatus', kv)} className={toggleClass(form.militaryStatus === kv)}>{ko ? kv : ev}</button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className={labelClass}>{ko ? '졸업 후 진로 의향' : 'Post-graduation Career Plan'}</label>
            <div className="grid grid-cols-3 gap-2">
              {[['대학원 진학','Grad School'],['취업','Employment'],['아직 모름','Undecided']].map(([kv, ev]) => (
                <button key={kv} type="button"
                  onClick={() => { update('careerIntention', kv); update('gradType', ''); update('postMasterPlan', '') }}
                  className={toggleClass(form.careerIntention === kv)}>{ko ? kv : ev}</button>
              ))}
            </div>
          </div>

          {form.careerIntention === '대학원 진학' && (
            <div>
              <label className={labelClass}>{ko ? '대학원 과정' : 'Graduate Program Type'}</label>
              <div className="flex gap-3">
                {[['석사', "Master's (2년)"], ['석박통합', 'Integrated MS-PhD (5-6년)']].map(([kv, ev]) => (
                  <button key={kv} type="button"
                    onClick={() => { update('gradType', kv); update('postMasterPlan', '') }}
                    className={`flex-1 ${toggleClass(form.gradType === kv)}`}>{ko ? kv : ev}</button>
                ))}
              </div>
            </div>
          )}

          {/* 석사 졸업 후 계획 (조건부 표시) */}
          {showPostMasterPlan && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
              <label className="block text-sm font-medium text-blue-800 mb-2">
                {ko ? '🎓 석사 졸업 후 계획은 무엇인가요?' : '🎓 What are your plans after completing your Master\'s?'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[['취업 목표', 'Employment'], ['박사 진학', 'PhD'], ['모르겠음', 'Undecided']].map(([kv, ev]) => (
                  <button key={kv} type="button" onClick={() => update('postMasterPlan', kv)}
                    className={`py-2.5 rounded-xl border text-sm transition-colors ${form.postMasterPlan === kv ? 'bg-blue-500 text-white border-blue-500' : 'border-blue-200 text-blue-700 hover:bg-blue-100'}`}>
                    {ko ? kv : ev}
                  </button>
                ))}
              </div>
            </div>
          )}

          {futurePreview && (
            <div className="text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2">
              📍 {ko ? '3년 뒤 예상 상태: ' : '3-year forecast: '}
              <strong>{futurePreview}</strong>
              {showPostMasterPlan && form.postMasterPlan && (
                <span className="ml-1">→ {ko ? form.postMasterPlan : ['취업 목표','박사 진학','모르겠음'].includes(form.postMasterPlan) ? {'취업 목표':'Employment','박사 진학':'PhD','모르겠음':'Undecided'}[form.postMasterPlan] : form.postMasterPlan}</span>
              )}
            </div>
          )}

          <div>
            <label className={labelClass}>
              {ko ? '희망 세부 분야 또는 진로 목표' : 'Desired Field or Career Goal'}
              <span className="text-gray-400 font-normal ml-1">{ko ? '(선택)' : '(optional)'}</span>
            </label>
            <textarea
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 bg-gray-50 resize-none"
              rows={3}
              placeholder={ko ? '예) AI 연구자, 반도체 설계 엔지니어, 스타트업 창업 등 자유롭게 적어주세요' : 'e.g., AI researcher, semiconductor engineer, startup founder...'}
              value={form.careerGoal}
              onChange={e => update('careerGoal', e.target.value)}
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <p className="font-semibold mb-1">⚠️ {ko ? '이용 전 주의사항' : 'Notice Before Use'}</p>
            <p>{ko ? 'AI는 점쟁이가 아닙니다. 본 서비스는 진로 계획에 대한 가벼운 조언 정도로만 참고해주시고, 실제 진로 결정은 본인의 판단과 전문가의 조언을 따라주세요.' : 'AI is not a fortune teller. Please use this only as a light reference for career planning. Rely on your own judgment and professional advice for actual decisions.'}</p>
          </div>

          <button type="submit" disabled={isLoading} className="w-full py-4 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 disabled:opacity-50">
            {isLoading ? (ko ? '처리 중...' : 'Processing...') : (ko ? '3년 뒤의 나와 대화하기 →' : 'Talk to My Future Self →')}
          </button>
        </form>
      </div>
    </div>
  )
}