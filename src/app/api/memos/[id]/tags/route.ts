import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabaseAdmin'
import { generateTags } from '@/utils/gemini'
import { Memo } from '@/types/memo'

// POST: 태그 생성 및 저장
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 메모 조회
    const { data: memo, error: memoError } = await supabaseAdmin
      .from('memos')
      .select('content')
      .eq('id', id)
      .single()

    if (memoError) {
      if (memoError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Memo not found' }, { status: 404 })
      }
      throw memoError
    }

    if (!memo.content || memo.content.trim().length < 10) {
      return NextResponse.json(
        { error: 'Content is too short to generate tags' },
        { status: 400 }
      )
    }

    // 태그 생성
    const tags = await generateTags(memo.content)

    // 태그 업데이트
    const { data: updatedMemo, error: updateError } = await supabaseAdmin
      .from('memos')
      .update({ tags })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    // DB 형식을 Memo 타입으로 변환
    const result: Memo = {
      id: updatedMemo.id,
      title: updatedMemo.title,
      content: updatedMemo.content,
      category: updatedMemo.category,
      tags: updatedMemo.tags || [],
      createdAt: updatedMemo.created_at,
      updatedAt: updatedMemo.updated_at,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to generate and save tags:', error)

    if (error instanceof Error) {
      if (error.message.includes('GEMINI_API_KEY')) {
        return NextResponse.json(
          { error: 'API key is not configured' },
          { status: 500 }
        )
      }

      if (error.message.includes('too short')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate tags. Please try again later.' },
      { status: 500 }
    )
  }
}

