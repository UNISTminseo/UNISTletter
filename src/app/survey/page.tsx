'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Lang = 'ko' | 'en'

const DEPARTMENTS_KO = [
  '기계공학과', '지구환경도시건설공학과', '반도체공학과', '신소재공학과',
  '반도체특성화융합전공', '에너지화학공학과', '원자력공학과', '탄소중립 마이크로 전공',
  '디자인학과', '바이오메디컬공학과', '산업공학과', '생명과학과',
  '의과학 마이크로 전공', '전기전자공학과', '컴퓨터공학과',
  '물리학과', '수리과학과', '화학과', '경영과학부', '기타',
]

const DEPARTMENTS_EN = [
  'Mechanical Engineering', 'Civil, Urban, Earth and Environmental Engineering',
  'Semiconductor Engineering', 'Materials Science and Engineering',
  'Semiconductor Specialization Interdisciplinary Major', 'Energy and Chemical Engineering',
  'Nuclear Engineering', 'Carbon Neutrality Micro Major', 'Design',
  'Biomedical Engineering', 'Industrial Engineering', 'Biological Sciences',
  'Health Science and Technology Micro Major', 'Electrical Engineering',
  'Computer Science and Engineering', 'Physics', 'Mathematical Sciences',
  'Chemistry', 'School of Business Administration', 'Other',
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

const semNumToLabel = (n: number, lang: string): string => {
  if (n <= 0) return lang === 'en' ? 'Pre-enrollment' : '입학 전'
  if (n >= 9) return lang === 'en' ? 'Graduated' : '졸업'
  const y = Math.ceil(n / 2)
  const s = n % 2 === 1 ? '1' : '2'
  return lang === 'en' ? `Year ${y} Sem ${s}` : `${y}학년 ${s}학기`
}

const toM = (year: number, month: number) => year * 12 + (month - 1)
const fromM = (total: number) => ({ year: Math.floor(total / 12), month: (total % 12) + 1 })

const calculateFutureStatus = (
  yearSemester: string, careerIntention: string, gradType: string,
  gender: string, militaryStatus: string,
  enlistYear: string, enlistMonth: string,
  dischargeYear: string, dischargeMonth: string,
  lang: string = 'ko'
): string => {
  const now = new Date()
  const nowM = toM(now.getFullYear(), now.getMonth() + 1)
  const futureM = nowM + 36
  const current = semesterToNumber(yearSemester)
  if (current === 0) return ''

  let militaryBlockedMonths = 0
  let militaryDetail = ''
  const L = lang

  if (gender === '남') {
    if (militaryStatus === '입대 예정' && enlistYear && enlistMonth) {
      const eM = toM(parseInt(enlistYear), parseInt(enlistMonth))
      const dM = eM + 18
      const dis = fromM(dM)
      const monthsToEnlist = Math.max(0, eM - nowM)
      const extraSems = Math.floor(monthsToEnlist / 6)
      const lastSem = current + extraSems
      const returnSem = lastSem + 1

      if (eM >= futureM) {
        militaryDetail = L === 'en'
          ? `Not yet enlisted (Planned: ${enlistYear}/${enlistMonth}, after ${semNumToLabel(lastSem, L)} / Discharge: ${dis.year}/${dis.month} / Return to ${semNumToLabel(returnSem, L)})`
          : `아직 입대 전 (${enlistYear}년 ${enlistMonth}월 입대 예정 / ${semNumToLabel(lastSem, L)} 수료 후 / 전역: ${dis.year}년 ${dis.month}월 / 복학: ${semNumToLabel(returnSem, L)})`
        militaryBlockedMonths = 0
      } else if (dM > futureM) {
        const served = futureM - eM
        militaryDetail = L === 'en'
          ? `Currently serving (Enlisted ${enlistYear}/${enlistMonth} after ${semNumToLabel(lastSem, L)} / ${served}mo in / Discharge: ${dis.year}/${dis.month} / Will return to ${semNumToLabel(returnSem, L)})`
          : `군 복무 중 (${enlistYear}년 ${enlistMonth}월 입대 / ${semNumToLabel(lastSem, L)} 수료 후 / 복무 ${served}개월차 / 전역: ${dis.year}년 ${dis.month}월 / 복학: ${semNumToLabel(returnSem, L)})`
        militaryBlockedMonths = served
      } else {
        const after = futureM - dM
        militaryDetail = L === 'en'
          ? `Military completed (Enlisted ${enlistYear}/${enlistMonth} / Discharged ${dis.year}/${dis.month} / Now in ${semNumToLabel(returnSem, L)} / ${after}mo since discharge)`
          : `전역 완료 (${enlistYear}년 ${enlistMonth}월 입대 / ${dis.year}년 ${dis.month}월 전역 / 현재 ${semNumToLabel(returnSem, L)} 복학 중 / 전역 후 ${after}개월 경과)`
        militaryBlockedMonths = 18
      }
    } else if (militaryStatus === '전문연구원' && enlistYear && enlistMonth) {
      const sM = toM(parseInt(enlistYear), parseInt(enlistMonth))
      const phase1End = sM + 24
      const endM = sM + 36
      const p1 = fromM(phase1End)
      const end = fromM(endM)

      if (sM >= futureM) {
        militaryDetail = L === 'en'
          ? `Research Professional not yet started (Planned: ${enlistYear}/${enlistMonth} / Phase 1: home lab 2yrs (PhD) → Phase 2: external lab 1yr)`
          : `전문연구원 아직 시작 전 (${enlistYear}년 ${enlistMonth}월 시작 예정 / Phase 1: 소속 연구실 2년(박사과정 포함) → Phase 2: 외부 연구기관 1년)`
        militaryBlockedMonths = 0
      } else if (futureM < phase1End) {
        const mo = futureM - sM
        militaryDetail = L === 'en'
          ? `Research Professional Phase 1 (home lab / part of PhD / ${mo}mo in / until ${p1.year}/${p1.month} / then 1yr external lab)`
          : `전문연구원 Phase 1 복무 중 (소속 연구실 / 박사과정 포함 / 시작 후 ${mo}개월 / ${p1.year}년 ${p1.month}월까지 / 이후 외부 연구기관 1년 추가)`
        militaryBlockedMonths = 0
      } else if (futureM < endM) {
        const mo2 = futureM - phase1End
        militaryDetail = L === 'en'
          ? `Research Professional Phase 2 (external lab / ${mo2}mo in / ends ${end.year}/${end.month})`
          : `전문연구원 Phase 2 복무 중 (외부 연구기관 / ${mo2}개월 경과 / ${end.year}년 ${end.month}월 완료 예정)`
        militaryBlockedMonths = mo2
      } else {
        const after = futureM - endM
        militaryDetail = L === 'en'
          ? `Research Professional completed (${end.year}/${end.month} / ${after}mo since)`
          : `전문연구원 복무 완료 (${end.year}년 ${end.month}월 완료 / 완료 후 ${after}개월 경과)`
        militaryBlockedMonths = 12
      }
    } else if (militaryStatus === '병역 완료') {
      militaryDetail = L === 'en' ? 'Military service completed' : '병역 완료'
    } else if (militaryStatus === '면제') {
      militaryDetail = L === 'en' ? 'Military exempt' : '군 면제'
    } else if (militaryStatus === '잘 모름') {
      militaryDetail = L === 'en' ? 'Military status uncertain' : '군 복무 여부 미정'
    }
  }

  const blockedSemesters = Math.round(militaryBlockedMonths / 6)
  const undergradLeft = Math.max(0, 8 - current)
  const availableSemesters = 6 - blockedSemesters
  const postGradSemesters = availableSemesters - undergradLeft

  if (militaryDetail.includes('복무 중') || militaryDetail.includes('Currently serving') ||
      militaryDetail.includes('Phase 1') || militaryDetail.includes('Phase 2')) {
    return militaryDetail
  }

  let academicStatus = ''
  if (postGradSemesters <= 0) {
    const rem = Math.max(0, undergradLeft - availableSemesters)
    academicStatus = rem > 0
      ? (L === 'en' ? `Still enrolled (${rem} semesters until graduation)` : `학부 재학 중 (졸업까지 약 ${rem}학기 남음)`)
      : (L === 'en' ? 'Near undergraduate graduation' : '학부 졸업 무렵')
  } else if (careerIntention === '대학원 진학') {
    if (gradType === '석사') {
      academicStatus = postGradSemesters <= 4
        ? (L === 'en' ? `Master's Year ${Math.ceil(postGradSemesters/2)} Sem ${postGradSemesters%2===1?'1':'2'}` : `석사 ${Math.ceil(postGradSemesters/2)}학년 ${postGradSemesters%2===1?'1':'2'}학기 재학 중`)
        : (L === 'en' ? `~${postGradSemesters-4} semesters after Master's graduation` : `석사 졸업 후 약 ${postGradSemesters-4}학기 경과`)
    } else if (gradType === '석박통합') {
      academicStatus = L === 'en'
        ? `Integrated MS-PhD Year ${Math.ceil(postGradSemesters/2)} Sem ${postGradSemesters%2===1?'1':'2'}`
        : `석박통합 ${Math.ceil(postGradSemesters/2)}학년 ${postGradSemesters%2===1?'1':'2'}학기 재학 중`
    }
  } else if (careerIntention === '취업') {
    academicStatus = L === 'en'
      ? `~${postGradSemesters} semesters after graduation (employed)`
      : `학부 졸업 후 취업 약 ${postGradSemesters}학기 경과`
  } else {
    academicStatus = L === 'en'
      ? `~${postGradSemesters} semesters after graduation (exploring)`
      : `학부 졸업 후 진로 탐색 중 (졸업 약 ${postGradSemesters}학기 경과)`
  }

  return militaryDetail ? `${academicStatus} / ${militaryDetail}` : academicStatus
}

export default function SurveyPage() {
  const router = useRouter()
  const [lang, setLang] = useState<Lang>('ko')
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', age: '', studentId: '', yearSemester: '',
    gender: '', militaryStatus: '', enlistYear: '', enlistMonth: '',
    dischargeYear: '', dischargeMonth: '',
    department: '', careerIntention: '', gradType: '', postMasterPlan: '', careerGoal: '',
  })

  useEffect(() => {
    if (!sessionStorage.getItem('consent')) { router.push('/'); return }
    const savedLang = sessionStorage.getItem('preferredLang')
    if (savedLang === 'en') setLang('en')
  }, [router])

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }))
  const ko = lang === 'ko'
  const currentYear = new Date().getFullYear()

  const futurePreview = (() => {
    if (!form.yearSemester || !form.careerIntention) return null
    if (form.careerIntention === '대학원 진학' && !form.gradType) return null
    if (form.gender === '남') {
      if (form.militaryStatus === '입대 예정' && (!form.enlistYear || !form.enlistMonth)) return null
      if (form.militaryStatus === '전문연구원' && (!form.enlistYear || !form.enlistMonth)) return null
    }
    return calculateFutureStatus(
      form.yearSemester, form.careerIntention, form.gradType,
      form.gender, form.militaryStatus, form.enlistYear, form.enlistMonth,
      form.dischargeYear, form.dischargeMonth, lang
    )
  })()

  const showPostMasterPlan = futurePreview?.includes('석사 졸업 후') || futurePreview?.includes("after Master's graduation")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.gender === '남' && !form.militaryStatus) {
      alert(ko ? '군 복무 여부를 선택해주세요.' : 'Please select your military service status.'); return
    }
    if (form.gender === '남' && form.militaryStatus === '입대 예정' && (!form.enlistYear || !form.enlistMonth)) {
      alert(ko ? '입대 예정 시기를 입력해주세요.' : 'Please enter your planned enlistment date.'); return
    }
    if (form.gender === '남' && form.militaryStatus === '전문연구원' && (!form.enlistYear || !form.enlistMonth)) {
      alert(ko ? '전문연구원 시작 예정 시기를 입력해주세요.' : 'Please enter your planned Research Professional start date.'); return
    }
    if (form.careerIntention === '대학원 진학' && !form.gradType) {
      alert(ko ? '대학원 과정을 선택해주세요.' : 'Please select your graduate program type.'); return
    }
    if (showPostMasterPlan && !form.postMasterPlan) {
      alert(ko ? '석사 졸업 후 계획을 선택해주세요.' : "Please select your post-master's plan."); return
    }

    setIsLoading(true)
    const futureStatus = calculateFutureStatus(
      form.yearSemester, form.careerIntention, form.gradType,
      form.gender, form.militaryStatus, form.enlistYear, form.enlistMonth,
      form.dischargeYear, form.dischargeMonth, 'ko'
    )

    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert([{
          name: form.name, age: parseInt(form.age),
          student_id: form.studentId, year_semester: form.yearSemester,
          gender: form.gender,
          military_status: form.gender === '남' ? form.militaryStatus : null,
          enlist_year: form.enlistYear ? parseInt(form.enlistYear) : null,
          enlist_month: form.enlistMonth ? parseInt(form.enlistMonth) : null,
          discharge_year: form.dischargeYear ? parseInt(form.dischargeYear) : null,
          discharge_month: form.dischargeMonth ? parseInt(form.dischargeMonth) : null,
          department: form.department,
          career_intention: form.careerIntention,
          grad_type: form.careerIntention === '대학원 진학' ? form.gradType : null,
          post_master_plan: showPostMasterPlan ? form.postMasterPlan : null,
          career_goal: form.careerGoal || null,
          future_status: futureStatus, language: lang,
        }])
        .select().single()
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

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-blue-400 bg-gray-50"
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5"
  const toggleClass = (active: boolean) =>
    `py-2.5 rounded-xl border text-sm transition-colors ${active ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-lg w-full p-8">

        <div className="flex justify-end mb-4">
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            <button onClick={() => setLang('ko')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${lang === 'ko' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>한국어</button>
            <button onClick={() => setLang('en')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${lang === 'en' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>English</button>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">{ko ? '현재 나의 정보 입력' : 'Enter Your Current Information'}</h1>
          <p className="text-gray-500 mt-1 text-sm">{ko ? '지금 현재 나의 상황을 입력해주세요 (미래 상황 아님)' : 'Enter your current situation (not the future)'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{ko ? '이름' : 'Name'}</label>
              <input required className={inputClass} placeholder={ko ? '홍길동' : 'John Doe'} value={form.name} onChange={e => update('name', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>{ko ? '현재 나이' : 'Current Age'}</label>
              <input required type="number" min="18" max="40" className={inputClass} placeholder="20" value={form.age} onChange={e => update('age', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{ko ? '학번' : 'Student ID'}</label>
              <input required className={inputClass} placeholder="20210001" value={form.studentId} onChange={e => update('studentId', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>{ko ? '현재 학년/학기' : 'Current Year/Semester'}</label>
              <select required className={inputClass} value={form.yearSemester} onChange={e => update('yearSemester', e.target.value)}>
                <option value="">{ko ? '선택' : 'Select'}</option>
                {YEAR_SEMESTER_KO.map((v, i) => (
                  <option key={v} value={v}>{ko ? v : YEAR_SEMESTER_EN[i]}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>
              {ko ? '학과' : 'Department'}
              <span className="text-gray-400 font-normal ml-1 text-xs">
                {ko ? '(1학년의 경우, 희망 학과)' : '(For Year 1, select your intended department)'}
              </span>
            </label>
            <select required className={inputClass} value={form.department} onChange={e => update('department', e.target.value)}>
              <option value="">{ko ? '선택' : 'Select'}</option>
              {DEPARTMENTS_KO.map((d, i) => (
                <option key={d} value={d}>{ko ? d : `${DEPARTMENTS_EN[i]} (${d})`}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>{ko ? '성별' : 'Gender'}</label>
            <div className="flex gap-3">
              {[['남', 'Male'], ['여', 'Female']].map(([kv, ev]) => (
                <button key={kv} type="button"
                  onClick={() => { update('gender', kv); update('militaryStatus', ''); update('enlistYear', ''); update('enlistMonth', ''); update('dischargeYear', ''); update('dischargeMonth', '') }}
                  className={`flex-1 ${toggleClass(form.gender === kv)}`}>{ko ? kv : ev}</button>
              ))}
            </div>
          </div>

          {form.gender === '남' && (
            <div>
              <label className={labelClass}>{ko ? '군 복무 여부' : 'Military Service Status'}</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ['입대 예정', 'Planned Enlistment'],
                  ['병역 완료', 'Completed'],
                  ['면제', 'Exempt'],
                  ['전문연구원', 'Research Professional'],
                  ['잘 모름', 'Not Sure'],
                ].map(([kv, ev]) => (
                  <button key={kv} type="button"
                    onClick={() => { update('militaryStatus', kv); update('enlistYear', ''); update('enlistMonth', ''); update('dischargeYear', ''); update('dischargeMonth', '') }}
                    className={toggleClass(form.militaryStatus === kv)}>{ko ? kv : ev}</button>
                ))}
              </div>

              {/* 입대 예정 날짜 */}
              {form.militaryStatus === '입대 예정' && (
                <div className="mt-3 bg-gray-50 rounded-xl p-4">
                  <label className="block text-sm text-gray-600 mb-2">{ko ? '입대 예정 시기' : 'Planned Enlistment Date'}</label>
                  <div className="flex gap-2">
                    <select className={`${inputClass} flex-1`} value={form.enlistYear} onChange={e => update('enlistYear', e.target.value)}>
                      <option value="">{ko ? '년도' : 'Year'}</option>
                      {Array.from({length: 6}, (_, i) => currentYear + i).map(y => <option key={y} value={y}>{y}{ko ? '년' : ''}</option>)}
                    </select>
                    <select className={`${inputClass} flex-1`} value={form.enlistMonth} onChange={e => update('enlistMonth', e.target.value)}>
                      <option value="">{ko ? '월' : 'Month'}</option>
                      {Array.from({length: 12}, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}{ko ? '월' : ''}</option>)}
                    </select>
                  </div>
                  {form.enlistYear && form.enlistMonth && (
                    <p className="text-xs text-blue-600 mt-2">
                      ✅ {ko ? '전역 예정: ' : 'Expected discharge: '}
                      <strong>{(() => { const d = fromM(toM(parseInt(form.enlistYear), parseInt(form.enlistMonth)) + 18); return `${d.year}${ko ? '년 ' : '/'}${d.month}${ko ? '월' : ''}` })()}</strong>
                      {ko ? ' (1년 6개월)' : ' (18 months)'}
                    </p>
                  )}
                </div>
              )}

              {/* 전문연구원 시작 날짜 */}
              {form.militaryStatus === '전문연구원' && (
                <div className="mt-3 bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <p className="text-xs text-purple-700 mb-3">
                    💡 {ko
                      ? '전문연구원은 박사과정 시작과 함께 시작됩니다. Phase 1 (소속 연구실 2년, 박사과정에 포함) → Phase 2 (외부 연구기관 1년)'
                      : 'Starts with the PhD program. Phase 1 (home lab 2yrs, included in PhD) → Phase 2 (external lab 1yr)'}
                  </p>
                  <label className="block text-sm text-gray-600 mb-2">{ko ? '전문연구원 시작 예정 시기' : 'Planned Start Date'}</label>
                  <div className="flex gap-2">
                    <select className={`${inputClass} flex-1`} value={form.enlistYear} onChange={e => update('enlistYear', e.target.value)}>
                      <option value="">{ko ? '년도' : 'Year'}</option>
                      {Array.from({length: 8}, (_, i) => currentYear + i).map(y => <option key={y} value={y}>{y}{ko ? '년' : ''}</option>)}
                    </select>
                    <select className={`${inputClass} flex-1`} value={form.enlistMonth} onChange={e => update('enlistMonth', e.target.value)}>
                      <option value="">{ko ? '월' : 'Month'}</option>
                      {Array.from({length: 12}, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}{ko ? '월' : ''}</option>)}
                    </select>
                  </div>
                  {form.enlistYear && form.enlistMonth && (
                    <div className="mt-2 text-xs text-purple-600 space-y-0.5">
                      {(() => {
                        const sM = toM(parseInt(form.enlistYear), parseInt(form.enlistMonth))
                        const p1 = fromM(sM + 24)
                        const end = fromM(sM + 36)
                        return <>
                          <p>📍 Phase 1: {form.enlistYear}{ko ? '년 ' : '/'}{form.enlistMonth}{ko ? '월' : ''} ~ {p1.year}{ko ? '년 ' : '/'}{p1.month}{ko ? '월 (소속 연구실, 박사과정 포함)' : ' (home lab, PhD)'}</p>
                          <p>📍 Phase 2: {p1.year}{ko ? '년 ' : '/'}{p1.month}{ko ? '월' : ''} ~ {end.year}{ko ? '년 ' : '/'}{end.month}{ko ? '월 (외부 연구기관)' : ' (external lab)'}</p>
                        </>
                      })()}
                    </div>
                  )}
                </div>
              )}
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
                {[['석사', "Master's (2yr)"], ['석박통합', 'Integrated MS-PhD (5-6yr)']].map(([kv, ev]) => (
                  <button key={kv} type="button"
                    onClick={() => { update('gradType', kv); update('postMasterPlan', '') }}
                    className={`flex-1 ${toggleClass(form.gradType === kv)}`}>{ko ? kv : ev}</button>
                ))}
              </div>
            </div>
          )}

          {showPostMasterPlan && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <label className="block text-sm font-medium text-blue-800 mb-2">
                🎓 {ko ? '석사 졸업 후 계획은?' : "Plans after Master's?"}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[['취업 목표','Employment'],['박사 진학','PhD'],['모르겠음','Undecided']].map(([kv, ev]) => (
                  <button key={kv} type="button" onClick={() => update('postMasterPlan', kv)}
                    className={`py-2.5 rounded-xl border text-sm transition-colors ${form.postMasterPlan === kv ? 'bg-blue-500 text-white border-blue-500' : 'border-blue-200 text-blue-700 hover:bg-blue-100'}`}>
                    {ko ? kv : ev}
                  </button>
                ))}
              </div>
            </div>
          )}

          {futurePreview && (
            <div className="text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2 leading-relaxed">
              📍 {ko ? '3년 뒤 예상 상태: ' : '3-year forecast: '}<strong>{futurePreview}</strong>
              {showPostMasterPlan && form.postMasterPlan && <span> → {form.postMasterPlan}</span>}
            </div>
          )}

          <div>
            <label className={labelClass}>
              {ko ? '희망 세부 분야 또는 진로 목표' : 'Desired Field or Career Goal'}
              <span className="text-gray-400 font-normal ml-1">{ko ? '(선택)' : '(optional)'}</span>
            </label>
            <textarea
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-blue-400 bg-gray-50 resize-none"
              rows={3}
              placeholder={ko ? '예) AI 연구자, 반도체 설계 엔지니어, 스타트업 창업 등 자유롭게 적어주세요' : 'e.g., AI researcher, semiconductor engineer, startup founder...'}
              value={form.careerGoal}
              onChange={e => update('careerGoal', e.target.value)}
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <p className="font-semibold mb-1">⚠️ {ko ? '이용 전 주의사항' : 'Notice Before Use'}</p>
            <p>{ko
              ? 'AI는 점쟁이가 아닙니다. 본 서비스는 진로 계획에 대한 가벼운 조언 정도로만 참고해주시고, 실제 진로 결정은 본인의 판단과 전문가의 조언을 따라주세요.'
              : 'AI is not a fortune teller. Please use this only as a light reference for career planning. Rely on your own judgment and professional advice for actual decisions.'}</p>
          </div>

          <button type="submit" disabled={isLoading} className="w-full py-4 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 disabled:opacity-50">
            {isLoading ? (ko ? '처리 중...' : 'Processing...') : (ko ? '3년 뒤의 나와 대화하기 →' : 'Talk to My Future Self →')}
          </button>
        </form>
      </div>
    </div>
  )
}