'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Lang = 'ko' | 'en'

export default function ConsentPage() {
  const router = useRouter()
  const [lang, setLang] = useState<Lang>('ko')
  const ko = lang === 'ko'

  const handleAgree = () => {
    sessionStorage.setItem('consent', 'true')
    sessionStorage.setItem('preferredLang', lang)
    router.push('/survey')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-lg w-full p-8">

        <div className="flex justify-end mb-4">
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            <button onClick={() => setLang('ko')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${lang === 'ko' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>한국어</button>
            <button onClick={() => setLang('en')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${lang === 'en' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>English</button>
          </div>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">UNISTletter</h1>
          <p className="text-gray-500 mt-1 text-sm">{ko ? '3년 뒤의 나와 대화하기' : 'Talk to Your Future Self'}</p>
        </div>

        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          {ko ? '개인정보 수집 및 이용 동의' : 'Privacy Policy Agreement'}
        </h2>

        <div className="bg-gray-50 rounded-xl p-5 mb-6 text-sm text-gray-600 space-y-3 max-h-72 overflow-y-auto leading-relaxed">
          <div className="bg-blue-50 rounded-lg p-3 text-blue-700 text-xs">
            <p className="font-semibold mb-1">📌 {ko ? '서비스 소개' : 'About This Service'}</p>
            <p>{ko
              ? '본 웹페이지는 유니스트(UNIST) PSC(Problem Solving and Communication) 수업의 일환으로 G4 팀이 직접 제작하였습니다.'
              : 'This webpage was created by Team G4 as part of the PSC (Problem Solving and Communication) course at UNIST.'}</p>
          </div>

          <div>
            <p className="font-semibold text-gray-700 mb-1">{ko ? '수집 항목' : 'Information Collected'}</p>
            <p>{ko
              ? '이름, 나이, 학번, 학년/학기, 성별, 군 복무 여부(남학생), 학과, 진로 의향, 대화 내용'
              : 'Name, age, student ID, year/semester, gender, military service status (male), department, career intention, conversation content'}</p>
          </div>

          <div>
            <p className="font-semibold text-gray-700 mb-1">{ko ? '수집 목적' : 'Purpose'}</p>
            <p>{ko
              ? 'PSC 수업 연구 목적의 AI 기반 미래 자아 대화 서비스 제공'
              : 'Providing AI-based future self conversation service for PSC course research'}</p>
          </div>

          <div>
            <p className="font-semibold text-gray-700 mb-1">{ko ? '보유 기간' : 'Retention Period'}</p>
            <p>{ko
              ? <span>수집일로부터 <strong className="text-red-500">30일</strong> 후 자동 삭제됩니다.</span>
              : <span>Automatically deleted <strong className="text-red-500">30 days</strong> after collection.</span>}</p>
          </div>

          <div>
            <p className="font-semibold text-gray-700 mb-1">{ko ? '이용 제한' : 'Usage Restrictions'}</p>
            <p>{ko
              ? '수집된 정보는 AI 학습에 이용되지 않으며, 본 세션 내 서비스 제공 목적으로만 사용됩니다. 제3자에게 제공되지 않습니다.'
              : 'Information will not be used for AI training and will only be used within this session. Not shared with third parties.'}</p>
          </div>

          <p className="text-xs text-gray-400 pt-1">{ko
            ? '동의를 거부할 권리가 있으나, 동의 거부 시 서비스 이용이 제한됩니다.'
            : 'You have the right to refuse, but refusal will limit your use of the service.'}</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => alert(ko ? '서비스를 이용하시려면 동의가 필요합니다.' : 'Consent is required to use this service.')}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm"
          >
            {ko ? '동의하지 않음' : 'Decline'}
          </button>
          <button
            onClick={handleAgree}
            className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 text-sm"
          >
            {ko ? '동의합니다' : 'I Agree'}
          </button>
        </div>
      </div>
    </div>
  )
}