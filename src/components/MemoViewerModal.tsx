'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Memo, MEMO_CATEGORIES, MemoCategory } from '@/types/memo'

const MarkdownPreview = dynamic(
  () => import('@uiw/react-markdown-preview'),
  {
    ssr: false,
    loading: () => (
      <div className="h-32 bg-gray-50 rounded-lg animate-pulse" />
    ),
  }
)

interface MemoViewerModalProps {
  memo: Memo | null
  isOpen: boolean
  onClose: () => void
  onEdit: (memo: Memo) => void
  onDelete: (id: string) => void
  onMemoUpdate: (memo: Memo) => void
}

export default function MemoViewerModal({
   memo,
   isOpen,
   onClose,
   onEdit,
   onDelete,
   onMemoUpdate,
 }: MemoViewerModalProps) {
   const [summary, setSummary] = useState<string | null>(null)
   const [isSummarizing, setIsSummarizing] = useState(false)
   const [summaryError, setSummaryError] = useState<string | null>(null)
   const [isLoadingSummary, setIsLoadingSummary] = useState(false)
   const [isGeneratingTags, setIsGeneratingTags] = useState(false)
   const [tagsError, setTagsError] = useState<string | null>(null)

   useEffect(() => {
     if (!isOpen) return

     const handleKeyDown = (event: KeyboardEvent) => {
       if (event.key === 'Escape') {
         onClose()
       }
     }

     window.addEventListener('keydown', handleKeyDown)
     return () => window.removeEventListener('keydown', handleKeyDown)
   }, [isOpen, onClose])

   // 모달이 열릴 때 저장된 요약 불러오기
   useEffect(() => {
     if (!isOpen || !memo) {
      setSummary(null)
      setSummaryError(null)
      setIsSummarizing(false)
      setIsLoadingSummary(false)
      setIsGeneratingTags(false)
      setTagsError(null)
      return
    }

    const loadSummary = async () => {
      setIsLoadingSummary(true)
      setSummaryError(null)
      try {
        const response = await fetch(`/api/memos/${memo.id}/summary`)
        if (!response.ok) {
          throw new Error('Failed to load summary')
        }
        const data = await response.json()
        if (data.summary) {
          setSummary(data.summary)
        }
      } catch {
        // 요약이 없으면 에러로 처리하지 않음
        console.log('No saved summary found')
      } finally {
        setIsLoadingSummary(false)
      }
    }

    loadSummary()
   }, [isOpen, memo])

   if (!isOpen || !memo) return null

   const handleSummarize = async () => {
     if (!memo.content || memo.content.trim().length < 10) {
       setSummaryError('메모 내용이 너무 짧아 요약할 수 없습니다.')
       return
     }

     setIsSummarizing(true)
     setSummaryError(null)

     try {
       const response = await fetch(`/api/memos/${memo.id}/summary`, {
         method: 'POST',
       })

       const data = await response.json()

       if (!response.ok) {
         throw new Error(data.error || '요약 생성에 실패했습니다.')
       }

       setSummary(data.summary)
     } catch (error) {
       console.error('Summarize error:', error)
       setSummaryError(
         error instanceof Error
           ? error.message
           : '요약 생성 중 오류가 발생했습니다.'
       )
     } finally {
      setIsSummarizing(false)
    }
  }

   const formatDateTime = (dateString: string) => {
     const date = new Date(dateString)
     return date.toLocaleString('ko-KR', {
       year: 'numeric',
       month: 'long',
       day: 'numeric',
       hour: '2-digit',
       minute: '2-digit',
     })
   }

   const handleDelete = () => {
     if (window.confirm('이 메모를 삭제하시겠습니까?')) {
       onDelete(memo.id)
     }
   }

   const handleGenerateTags = async () => {
     if (!memo || !memo.content || memo.content.trim().length < 10) {
       setTagsError('메모 내용이 너무 짧아 태그를 생성할 수 없습니다.')
       return
     }

     setIsGeneratingTags(true)
     setTagsError(null)

     try {
       const response = await fetch(`/api/memos/${memo.id}/tags`, {
         method: 'POST',
       })

       const data = await response.json()

       if (!response.ok) {
         throw new Error(data.error || '태그 생성에 실패했습니다.')
       }

       // 업데이트된 메모로 상태 갱신
       const updatedMemo: Memo = data
       onMemoUpdate(updatedMemo)
       // 모달의 메모 상태도 업데이트하기 위해 부모 컴포넌트에 알림
       // 실제로는 onMemoUpdate가 이미 상태를 업데이트하므로 여기서는 로컬 상태만 갱신
     } catch (error) {
       console.error('Tag generation error:', error)
       setTagsError(
         error instanceof Error
           ? error.message
           : '태그 생성 중 오류가 발생했습니다.'
       )
     } finally {
       setIsGeneratingTags(false)
     }
   }

   return (
     <div
       className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
       onClick={onClose}
     >
       <div
         className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
         onClick={event => event.stopPropagation()}
       >
         <div className="p-6 space-y-6">
           <div className="flex justify-between items-start gap-4">
             <div>
               <div className="flex items-center gap-3 mb-3">
                 <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                   {MEMO_CATEGORIES[memo.category as MemoCategory]}
                 </span>
                 <span className="text-sm text-gray-500">
                   수정 {formatDateTime(memo.updatedAt)}
                 </span>
               </div>
               <h2 className="text-2xl font-bold text-gray-900 whitespace-pre-wrap break-words">
                 {memo.title}
               </h2>
             </div>
             <button
               onClick={onClose}
               className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
             >
               <svg
                 className="w-5 h-5"
                 fill="none"
                 stroke="currentColor"
                 viewBox="0 0 24 24"
               >
                 <path
                   strokeLinecap="round"
                   strokeLinejoin="round"
                   strokeWidth={2}
                   d="M6 18L18 6M6 6l12 12"
                 />
               </svg>
             </button>
           </div>

          {/* 요약 섹션 */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">메모 요약</h3>
              <button
                onClick={handleSummarize}
                disabled={isSummarizing || isLoadingSummary || !memo.content || memo.content.trim().length < 10}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {isSummarizing ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    요약 생성 중...
                  </span>
                ) : (
                  '요약 생성'
                )}
              </button>
            </div>

            {isLoadingSummary && (
              <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-500">요약을 불러오는 중...</p>
              </div>
            )}

            {summaryError && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{summaryError}</p>
              </div>
            )}

            {summary && !isLoadingSummary && (
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {summary}
                </p>
              </div>
            )}

            {!summary && !summaryError && !isSummarizing && !isLoadingSummary && (
              <p className="text-sm text-gray-500 italic">
                요약 버튼을 클릭하면 AI가 메모 내용을 요약해드립니다.
              </p>
            )}
          </div>

          <div data-color-mode="light" className="w-full markdown-preview-wrapper">
            <MarkdownPreview source={memo.content} />
          </div>

          {/* 태그 섹션 */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">태그</h3>
              <button
                onClick={handleGenerateTags}
                disabled={isGeneratingTags || !memo.content || memo.content.trim().length < 10}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {isGeneratingTags ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    태그 생성 중...
                  </span>
                ) : (
                  '태그 추천'
                )}
              </button>
            </div>

            {tagsError && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{tagsError}</p>
              </div>
            )}

            {memo.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {memo.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">
                태그 추천 버튼을 클릭하면 AI가 메모 내용을 분석하여 적절한 태그를 생성해드립니다.
              </p>
            )}
          </div>

           <div className="flex items-center justify-between text-sm text-gray-500">
             <span>작성 {formatDateTime(memo.createdAt)}</span>
             <div className="flex gap-2">
               <button
                 onClick={() => onEdit(memo)}
                 className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
               >
                 편집
               </button>
               <button
                 onClick={handleDelete}
                 className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
               >
                 삭제
               </button>
             </div>
           </div>
         </div>
       </div>
     </div>
   )
 }

