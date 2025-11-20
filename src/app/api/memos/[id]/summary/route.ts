import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabaseAdmin'
import { generateSummary } from '@/utils/gemini'

// GET: 저장된 요약 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data, error } = await supabaseAdmin
      .from('memo_summaries')
      .select('summary')
      .eq('memo_id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ summary: null })
      }
      throw error
    }

    return NextResponse.json({ summary: data.summary })
  } catch (error) {
    console.error('Failed to fetch summary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch summary' },
      { status: 500 }
    )
  }
}

// POST: 요약 생성 및 저장
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
        { error: 'Content is too short to summarize' },
        { status: 400 }
      )
    }

    // 요약 생성
    const summary = await generateSummary(memo.content)

    // 요약 저장 (upsert)
    const { error: upsertError } = await supabaseAdmin
      .from('memo_summaries')
      .upsert(
        {
          memo_id: id,
          summary: summary,
        },
        {
          onConflict: 'memo_id',
        }
      )

    if (upsertError) {
      throw upsertError
    }

    return NextResponse.json({ summary })
  } catch (error) {
    console.error('Failed to generate and save summary:', error)

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
      { error: 'Failed to generate summary. Please try again later.' },
      { status: 500 }
    )
  }
}

