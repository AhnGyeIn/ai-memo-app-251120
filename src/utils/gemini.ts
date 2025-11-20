import { GoogleGenAI } from '@google/genai'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const DEFAULT_MODEL = 'gemini-2.0-flash-001'

if (!GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY is not set in environment variables')
}

export function getGeminiClient() {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured')
  }
  return new GoogleGenAI({ apiKey: GEMINI_API_KEY })
}

export async function generateSummary(content: string): Promise<string> {
  if (!content || content.trim().length === 0) {
    throw new Error('Content is required for summarization')
  }

  if (content.trim().length < 10) {
    throw new Error('Content is too short to summarize')
  }

  const client = getGeminiClient()
  
  const prompt = `다음 메모 내용을 간결하고 명확하게 요약해주세요. 핵심 내용만 2-3문장으로 정리해주세요:\n\n${content}`

  try {
    const response = await client.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
    })

    // 응답에서 텍스트 추출 (다양한 응답 형식 지원)
    let summary: string | undefined
    
    if (typeof response.text === 'string') {
      summary = response.text
    } else if (typeof response.text === 'function') {
      summary = response.text()
    } else if (response.candidates && response.candidates[0]?.content?.parts?.[0]?.text) {
      summary = response.candidates[0].content.parts[0].text
    } else if (response.response?.text) {
      summary = typeof response.response.text === 'function' 
        ? response.response.text() 
        : response.response.text
    }

    if (!summary || summary.trim().length === 0) {
      throw new Error('Failed to generate summary')
    }

    return summary.trim()
  } catch (error) {
    console.error('Gemini API error:', error)
    throw new Error('Failed to generate summary. Please try again later.')
  }
}

export async function generateTags(content: string): Promise<string[]> {
  if (!content || content.trim().length === 0) {
    throw new Error('Content is required for tag generation')
  }

  if (content.trim().length < 10) {
    throw new Error('Content is too short to generate tags')
  }

  const client = getGeminiClient()
  
  const prompt = `다음 메모 내용을 분석하여 핵심 키워드를 3~5개 추출해주세요. 각 키워드는 콤마로 구분하고, 한국어로 작성해주세요. 예시: "프로젝트, 개발, 회의, 일정, 우선순위"\n\n메모 내용:\n${content}`

  try {
    const response = await client.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
    })

    // 응답에서 텍스트 추출 (다양한 응답 형식 지원)
    let tagsText: string | undefined
    
    if (typeof response.text === 'string') {
      tagsText = response.text
    } else if (typeof response.text === 'function') {
      tagsText = response.text()
    } else if (response.candidates && response.candidates[0]?.content?.parts?.[0]?.text) {
      tagsText = response.candidates[0].content.parts[0].text
    } else if (response.response?.text) {
      tagsText = typeof response.response.text === 'function' 
        ? response.response.text() 
        : response.response.text
    }

    if (!tagsText || tagsText.trim().length === 0) {
      throw new Error('Failed to generate tags')
    }

    // 콤마로 분리하고 정리
    const tags = tagsText
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .map(tag => tag.toLowerCase())
      .filter((tag, index, array) => array.indexOf(tag) === index) // 중복 제거

    if (tags.length === 0) {
      throw new Error('Failed to generate tags')
    }

    return tags
  } catch (error) {
    console.error('Gemini API error:', error)
    throw new Error('Failed to generate tags. Please try again later.')
  }
}

