'use client'
import { useRouter } from 'next/navigation'

export default function ConsentPage() {
  const router = useRouter()

  const handleAgree = () => {
    sessionStorage.setItem('consent', 'true')
    router.push('/survey')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-lg w-full p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">UNISTletter</h1>
          <p className="text-gray-500 mt-1 text-sm">3년 뒤의 나와 대화하기</p>
        </div>

        <h2 className="text-lg font-semibold text-gray-700 mb-4">개인정보 수집 및 이용 동의</h2>

        <div className="bg-gray-50 rounded-xl p-5 mb-6 text-sm text-gray-600 space-y-3 max-h-72 overflow-y-auto leading-relaxed">
          <div>
            <p className="font-semibold text-gray-700 mb-1">수집 항목</p>
            <p>이름, 나이, 학번, 학년/학기, 성별, 군 복무 여부(남학생), 학과, 진로 의향, 대화 내용</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700 mb-1">수집 목적</p>
            <p>AI 기반 미래 자아 대화 서비스 제공을 위한 맞춤형 응답 생성</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700 mb-1">보유 기간</p>
            <p>수집일로부터 <strong className="text-red-500">30일</strong> 후 자동 삭제됩니다.</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700 mb-1">이용 제한</p>
            <p>수집된 정보는 <strong>AI 학습에 이용되지 않으며</strong>, 본 세션 내 서비스 제공 목적으로만 사용됩니다. 제3자에게 제공되지 않습니다.</p>
          </div>
          <p className="text-xs text-gray-400 pt-1">동의를 거부할 권리가 있으나, 동의 거부 시 서비스 이용이 제한됩니다.</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => alert('서비스를 이용하시려면 동의가 필요합니다.')}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm"
          >
            동의하지 않음
          </button>
          <button
            onClick={handleAgree}
            className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 text-sm"
          >
            동의합니다
          </button>
        </div>
      </div>
    </div>
  )
}