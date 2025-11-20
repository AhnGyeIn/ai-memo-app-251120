import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabaseAdmin'
import { sampleMemos } from '@/utils/seedData'

// POST: 시드 데이터 생성
export async function POST() {
  try {
    // 기존 메모 개수 확인
    const { count, error: countError } = await supabaseAdmin
      .from('memos')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      throw countError
    }

    // 이미 데이터가 있으면 스킵
    if (count && count > 0) {
      return NextResponse.json({
        message: 'Seed data already exists',
        skipped: true,
      })
    }

    // 시드 데이터 삽입
    const memosToInsert = sampleMemos.map(memo => ({
      id: memo.id,
      title: memo.title,
      content: memo.content,
      category: memo.category,
      tags: memo.tags,
      created_at: memo.createdAt,
      updated_at: memo.updatedAt,
    }))

    const { error: insertError } = await supabaseAdmin
      .from('memos')
      .insert(memosToInsert)

    if (insertError) {
      throw insertError
    }

    return NextResponse.json({
      message: 'Seed data created successfully',
      count: sampleMemos.length,
    })
  } catch (error) {
    console.error('Failed to seed data:', error)
    return NextResponse.json(
      { error: 'Failed to seed data' },
      { status: 500 }
    )
  }
}

