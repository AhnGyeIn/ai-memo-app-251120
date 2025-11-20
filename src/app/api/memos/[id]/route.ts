import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabaseAdmin'
import { Memo, MemoFormData } from '@/types/memo'

// GET: 특정 메모 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data, error } = await supabaseAdmin
      .from('memos')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Memo not found' }, { status: 404 })
      }
      throw error
    }

    const memo: Memo = {
      id: data.id,
      title: data.title,
      content: data.content,
      category: data.category,
      tags: data.tags || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }

    return NextResponse.json(memo)
  } catch (error) {
    console.error('Failed to fetch memo:', error)
    return NextResponse.json(
      { error: 'Failed to fetch memo' },
      { status: 500 }
    )
  }
}

// PATCH: 메모 업데이트
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body: Partial<MemoFormData> = await request.json()

    const updateData: Record<string, unknown> = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.content !== undefined) updateData.content = body.content
    if (body.category !== undefined) updateData.category = body.category
    if (body.tags !== undefined) updateData.tags = body.tags

    const { data, error } = await supabaseAdmin
      .from('memos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Memo not found' }, { status: 404 })
      }
      throw error
    }

    const memo: Memo = {
      id: data.id,
      title: data.title,
      content: data.content,
      category: data.category,
      tags: data.tags || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }

    return NextResponse.json(memo)
  } catch (error) {
    console.error('Failed to update memo:', error)
    return NextResponse.json(
      { error: 'Failed to update memo' },
      { status: 500 }
    )
  }
}

// DELETE: 메모 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { error } = await supabaseAdmin.from('memos').delete().eq('id', id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete memo:', error)
    return NextResponse.json(
      { error: 'Failed to delete memo' },
      { status: 500 }
    )
  }
}

