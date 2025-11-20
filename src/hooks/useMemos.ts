'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Memo, MemoFormData } from '@/types/memo'

export const useMemos = () => {
  const [memos, setMemos] = useState<Memo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // 메모 로드
  useEffect(() => {
    const loadMemos = async () => {
      setLoading(true)
      setError(null)
      try {
        // 시드 데이터 생성 (기존 데이터가 없을 때만)
        await fetch('/api/memos/seed', { method: 'POST' })

        // 메모 목록 조회
        const response = await fetch('/api/memos')
        if (!response.ok) {
          throw new Error('Failed to load memos')
        }
        const loadedMemos: Memo[] = await response.json()
        setMemos(loadedMemos)
      } catch (err) {
        console.error('Failed to load memos:', err)
        setError(err instanceof Error ? err.message : 'Failed to load memos')
      } finally {
        setLoading(false)
      }
    }

    loadMemos()
  }, [])

  // 메모 생성
  const createMemo = useCallback(async (formData: MemoFormData): Promise<Memo> => {
    try {
      const response = await fetch('/api/memos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to create memo')
      }

      const newMemo: Memo = await response.json()
      setMemos(prev => [newMemo, ...prev])
      return newMemo
    } catch (err) {
      console.error('Failed to create memo:', err)
      throw err
    }
  }, [])

  // 메모 업데이트
  const updateMemo = useCallback(
    async (id: string, formData: MemoFormData): Promise<void> => {
      try {
        const response = await fetch(`/api/memos/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          throw new Error('Failed to update memo')
        }

        const updatedMemo: Memo = await response.json()
        setMemos(prev => prev.map(memo => (memo.id === id ? updatedMemo : memo)))
      } catch (err) {
        console.error('Failed to update memo:', err)
        throw err
      }
    },
    []
  )

  // 메모 삭제
  const deleteMemo = useCallback(async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/memos/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete memo')
      }

      setMemos(prev => prev.filter(memo => memo.id !== id))
    } catch (err) {
      console.error('Failed to delete memo:', err)
      throw err
    }
  }, [])

  // 메모 교체 (태그 생성 등으로 업데이트된 메모를 반영)
  const replaceMemo = useCallback((updatedMemo: Memo): void => {
    setMemos(prev => prev.map(memo => (memo.id === updatedMemo.id ? updatedMemo : memo)))
  }, [])

  // 메모 검색
  const searchMemos = useCallback((query: string): void => {
    setSearchQuery(query)
  }, [])

  // 카테고리 필터링
  const filterByCategory = useCallback((category: string): void => {
    setSelectedCategory(category)
  }, [])

  // 특정 메모 가져오기
  const getMemoById = useCallback(
    (id: string): Memo | undefined => {
      return memos.find(memo => memo.id === id)
    },
    [memos]
  )

  // 필터링된 메모 목록
  const filteredMemos = useMemo(() => {
    let filtered = memos

    // 카테고리 필터링
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(memo => memo.category === selectedCategory)
    }

    // 검색 필터링
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        memo =>
          memo.title.toLowerCase().includes(query) ||
          memo.content.toLowerCase().includes(query) ||
          memo.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    return filtered
  }, [memos, selectedCategory, searchQuery])

  // 모든 메모 삭제
  const clearAllMemos = useCallback(async (): Promise<void> => {
    try {
      // 모든 메모를 순차적으로 삭제
      const deletePromises = memos.map(memo =>
        fetch(`/api/memos/${memo.id}`, { method: 'DELETE' })
      )
      await Promise.all(deletePromises)
      setMemos([])
      setSearchQuery('')
      setSelectedCategory('all')
    } catch (err) {
      console.error('Failed to clear all memos:', err)
      throw err
    }
  }, [memos])

  // 통계 정보
  const stats = useMemo(() => {
    const totalMemos = memos.length
    const categoryCounts = memos.reduce(
      (acc, memo) => {
        acc[memo.category] = (acc[memo.category] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return {
      total: totalMemos,
      byCategory: categoryCounts,
      filtered: filteredMemos.length,
    }
  }, [memos, filteredMemos])

  return {
    // 상태
    memos: filteredMemos,
    allMemos: memos,
    loading,
    error,
    searchQuery,
    selectedCategory,
    stats,

    // 메모 CRUD
    createMemo,
    updateMemo,
    deleteMemo,
    getMemoById,
    replaceMemo,

    // 필터링 & 검색
    searchMemos,
    filterByCategory,

    // 유틸리티
    clearAllMemos,
  }
}
