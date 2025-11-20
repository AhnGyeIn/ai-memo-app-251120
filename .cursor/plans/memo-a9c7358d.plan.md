<!-- a9c7358d-c593-4f80-9112-5deaa16c89af 42d85263-0f10-4829-b9ca-9a31bc79b6f8 -->
# 메모 상세 보기 모달 계획

## 1. 카드 선택 이벤트 확장

- `src/components/MemoItem.tsx`에 `onSelect` 콜백 props 추가
- 카드 전체를 클릭 시 상세 모달을 열도록 `onClick` 핸들링하고, 기존 편집/삭제 버튼에는 `event.stopPropagation()` 적용해 오동작 방지

## 2. 리스트→페이지 선택 흐름 연결

- `src/components/MemoList.tsx`에 `onSelectMemo` prop을 전달·호출하도록 변경
- `src/app/page.tsx`에서 `handleSelectMemo`를 만들어 `MemoList`에 내려 상세 모달 state를 관리

## 3. 상세 모달 컴포넌트 작성

- `src/components/MemoViewerModal.tsx` 신설: 메모 제목/본문/태그/작성·수정일, 편집/삭제 버튼 UI 구성
- ESC 키 `keydown` 이벤트와 배경 클릭으로 `onClose` 호출되도록 처리하고, 모달 내부 클릭은 전파 차단

## 4. 페이지 상태 및 편집/삭제 연동

- `page.tsx`에 `selectedMemo` state와 `isViewerOpen` 플래그를 추가해 모달 열림/닫힘 제어
- 모달의 편집 버튼 → 기존 `MemoForm`을 편집 모드로 열고, 삭제 버튼은 `deleteMemo` 실행 후 모달 닫기

### To-dos

- [ ] MemoItem/List에 onSelect 흐름 추가
- [ ] MemoViewerModal 컴포넌트 구현
- [ ] page.tsx 상태/모달 연동 및 편집·삭제 처리