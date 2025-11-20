# 📝 메모 앱 (Memo App)

**핸즈온 실습용 Next.js 메모 애플리케이션**

Supabase 기반의 완전한 CRUD 기능을 갖춘 메모 앱으로, MCP 연동 및 GitHub PR 생성 실습의 기반이 되는 프로젝트입니다.

## 🚀 주요 기능

- ✅ 메모 생성, 읽기, 수정, 삭제 (CRUD)
- 📂 카테고리별 메모 분류 (개인, 업무, 학습, 아이디어, 기타)
- 🏷️ 태그 시스템으로 메모 태깅
- 🔍 제목, 내용, 태그 기반 실시간 검색
- 📱 반응형 디자인 (모바일, 태블릿, 데스크톱)
- 💾 Supabase 데이터베이스 기반 데이터 저장
- 🤖 AI 요약 기능 (Gemini API) 및 데이터베이스 저장
- 🎨 모던한 UI/UX with Tailwind CSS

## 🛠 기술 스택

- **Framework**: Next.js 15.4.4 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini API
- **State Management**: React Hooks (useState, useEffect, useMemo)
- **Package Manager**: npm

## 📦 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. Supabase 설정

#### 2-1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. 프로젝트 설정에서 API URL과 Anon Key 확인

#### 2-2. 데이터베이스 스키마 생성

Supabase SQL Editor에서 `supabase/sql/create_memo_tables.sql` 파일의 내용을 실행하여 테이블을 생성합니다.

또는 Supabase Dashboard의 SQL Editor에서 다음 SQL을 실행:

```sql
-- 메모 테이블 생성
CREATE TABLE IF NOT EXISTS memos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 메모 요약 테이블 생성
CREATE TABLE IF NOT EXISTS memo_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memo_id UUID NOT NULL REFERENCES memos(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(memo_id)
);

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 트리거 생성
CREATE TRIGGER update_memos_updated_at
  BEFORE UPDATE ON memos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_memos_category ON memos(category);
CREATE INDEX IF NOT EXISTS idx_memos_created_at ON memos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memo_summaries_memo_id ON memo_summaries(memo_id);
```

#### 2-3. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_gemini_api_key
```

### 3. 개발 서버 실행

```bash
npm run dev
```

### 4. 브라우저 접속

```
http://localhost:3000
```

### 5. 시드 데이터 생성 (선택사항)

앱을 처음 실행하면 자동으로 시드 데이터가 생성됩니다. 수동으로 생성하려면:

```bash
curl -X POST http://localhost:3000/api/memos/seed
```

또는 npm script 사용:

```bash
npm run supabase:seed
```

## 📁 프로젝트 구조

```
memo-app/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── memos/
│   │   │       ├── route.ts              # 메모 CRUD API
│   │   │       ├── seed/
│   │   │       │   └── route.ts          # 시드 데이터 API
│   │   │       └── [id]/
│   │   │           ├── route.ts          # 개별 메모 API
│   │   │           └── summary/
│   │   │               └── route.ts      # 요약 API
│   │   ├── globals.css                   # 글로벌 스타일
│   │   ├── layout.tsx                    # 루트 레이아웃
│   │   └── page.tsx                     # 메인 페이지
│   ├── components/
│   │   ├── MemoForm.tsx                 # 메모 생성/편집 폼
│   │   ├── MemoItem.tsx                 # 개별 메모 카드
│   │   ├── MemoList.tsx                 # 메모 목록 및 필터
│   │   └── MemoViewerModal.tsx          # 메모 상세 보기 모달
│   ├── hooks/
│   │   └── useMemos.ts                  # 메모 관리 커스텀 훅
│   ├── types/
│   │   └── memo.ts                      # 메모 타입 정의
│   └── utils/
│       ├── supabaseClient.ts            # Supabase 클라이언트
│       ├── supabaseAdmin.ts             # Supabase 관리자 클라이언트
│       ├── gemini.ts                    # Gemini API 유틸리티
│       └── seedData.ts                  # 샘플 데이터
├── supabase/
│   └── sql/
│       └── create_memo_tables.sql       # 데이터베이스 스키마
└── README.md                            # 프로젝트 문서
```

## 💡 주요 컴포넌트

### MemoItem

- 개별 메모를 카드 형태로 표시
- 편집/삭제 액션 버튼
- 카테고리 배지 및 태그 표시
- 날짜 포맷팅 및 텍스트 클램핑

### MemoForm

- 메모 생성/편집을 위한 모달 폼
- 제목, 내용, 카테고리, 태그 입력
- 태그 추가/제거 기능
- 폼 검증 및 에러 처리

### MemoList

- 메모 목록 그리드 표시
- 실시간 검색 및 카테고리 필터링
- 통계 정보 및 빈 상태 처리
- 반응형 그리드 레이아웃

## 📊 데이터 구조

```typescript
interface Memo {
  id: string // 고유 식별자
  title: string // 메모 제목
  content: string // 메모 내용
  category: string // 카테고리 (personal, work, study, idea, other)
  tags: string[] // 태그 배열
  createdAt: string // 생성 날짜 (ISO string)
  updatedAt: string // 수정 날짜 (ISO string)
}
```

## 🎯 실습 시나리오

이 프로젝트는 다음 3가지 실습의 기반으로 사용됩니다:

### 실습 1: Supabase MCP 마이그레이션 (45분)

- LocalStorage → Supabase 데이터베이스 전환
- MCP를 통한 자동 스키마 생성
- 기존 데이터 무손실 마이그레이션

### 실습 2: 기능 확장 + GitHub PR (60분)

- 메모 즐겨찾기 기능 추가
- Cursor Custom Modes로 PR 생성
- 코드 리뷰 및 협업 실습

### 실습 3: Playwright MCP 테스트 (45분)

- E2E 테스트 작성
- 브라우저 자동화 및 시각적 테스트
- 성능 측정 및 리포트

자세한 실습 가이드는 강의자료를 참고하세요.

## 🎨 샘플 데이터

앱 첫 실행 시 6개의 샘플 메모가 자동으로 생성됩니다:

- 프로젝트 회의 준비 (업무)
- React 18 새로운 기능 학습 (학습)
- 새로운 앱 아이디어: 습관 트래커 (아이디어)
- 주말 여행 계획 (개인)
- 독서 목록 (개인)
- 성능 최적화 아이디어 (아이디어)

## 🔧 개발 가이드

### 메모 CRUD 작업

```typescript
// useMemos 훅 사용 예시
const {
  memos, // 필터링된 메모 목록
  loading, // 로딩 상태
  createMemo, // 메모 생성
  updateMemo, // 메모 수정
  deleteMemo, // 메모 삭제
  searchMemos, // 검색
  filterByCategory, // 카테고리 필터링
  stats, // 통계 정보
} = useMemos()
```

### API 엔드포인트

#### 메모 CRUD

```typescript
// 메모 목록 조회
GET /api/memos?category=work&search=React

// 메모 생성
POST /api/memos
Body: { title, content, category, tags }

// 메모 수정
PATCH /api/memos/[id]
Body: { title?, content?, category?, tags? }

// 메모 삭제
DELETE /api/memos/[id]

// 시드 데이터 생성
POST /api/memos/seed
```

#### 요약 API

```typescript
// 요약 조회
GET /api/memos/[id]/summary

// 요약 생성 및 저장
POST /api/memos/[id]/summary
```

## 🚀 배포

### Vercel 배포

```bash
npm run build
npx vercel --prod
```

### Netlify 배포

```bash
npm run build
# dist 폴더를 Netlify에 드래그 앤 드롭
```

## 📄 라이선스

MIT License - 학습 및 실습 목적으로 자유롭게 사용 가능합니다.

## 🤝 기여

이 프로젝트는 교육용으로 제작되었습니다. 개선사항이나 버그 리포트는 이슈나 PR로 제출해 주세요.

---

**Made with ❤️ for hands-on workshop**
