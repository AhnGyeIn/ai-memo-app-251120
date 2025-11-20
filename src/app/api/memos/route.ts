import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabaseAdmin'
import { Memo, MemoFormData } from '@/types/memo'

// GET: 메모 목록 조회 (필터링 지원)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    let query = supabaseAdmin
      .from('memos')
      .select('*')
      .order('created_at', { ascending: false })

    // 카테고리 필터링
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    // 검색 필터링 (제목, 내용)
    // 태그 검색은 클라이언트 사이드에서 처리
    if (search && search.trim()) {
      const searchPattern = `%${search.toLowerCase()}%`
      query = query.or(`title.ilike.${searchPattern},content.ilike.${searchPattern}`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Supabase query error:', error)
      throw error
    }

    // DB 형식을 Memo 타입으로 변환
    const memos: Memo[] =
      data?.map(item => ({
        id: item.id,
        title: item.title,
        content: item.content,
        category: item.category,
        tags: item.tags || [],
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      })) || []

    return NextResponse.json(memos)
  } catch (error) {
    console.error('Failed to fetch memos:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to fetch memos', details: errorMessage },
      { status: 500 }
    )
  }
}

// POST: 새 메모 생성
export async function POST(request: NextRequest) {
  try {
    const body: MemoFormData = await request.json()

    // 유효성 검사
    if (!body.title || !body.content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('memos')
      .insert({
        title: body.title,
        content: body.content,
        category: body.category || 'personal',
        tags: body.tags || [],
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // DB 형식을 Memo 타입으로 변환
    const memo: Memo = {
      id: data.id,
      title: data.title,
      content: data.content,
      category: data.category,
      tags: data.tags || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }

    return NextResponse.json(memo, { status: 201 })
  } catch (error) {
    console.error('Failed to create memo:', error)
    return NextResponse.json(
      { error: 'Failed to create memo' },
      { status: 500 }
    )
  }
}

