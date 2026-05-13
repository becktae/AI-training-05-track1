# TDD — Playwright 테스트 정의서

## 테스트 환경
- **도구**: Playwright (MCP: `playwright-mcp`)
- **대상**: `index.html` (file:// 또는 로컬 서버)
- **실행 방법**: `npx playwright test` 또는 playwright-mcp를 통한 세션 내 직접 검증
- **원칙**: "열림/닫힘" 상태 확인만으로는 불충분. 상세 텍스트가 실제로 viewport 내에서 visible 상태인지 검증한다.

---

## 공통 검증 기준

```javascript
// 텍스트 visible 판정 기준
// - display: none → FAIL
// - visibility: hidden → FAIL
// - opacity: 0 → FAIL
// - max-height: 0 (overflow hidden) → FAIL
// - 위 조건 없고 viewport 내에 위치 → PASS
```

---

## STEP 1 — Overview 검증

### TC-01: 기본 렌더링
```
목적: 6개 stat 카드가 모두 렌더링되어 텍스트가 보이는지 확인
검증 항목:
  - "7" 텍스트가 stat-number 안에 visible
  - "일" 단위 텍스트가 visible
  - "4" 텍스트가 visible
  - "Amtrak" 텍스트가 visible
  - "18" 텍스트가 visible
  - "무료" 텍스트가 visible
  - "ESTA" 텍스트가 visible
기대 결과: 6개 카드 전부 visible = PASS
```

### TC-02: stat 카드 클릭 → 상세 텍스트 visible
```
목적: 카드 클릭 후 상세 설명이 실제로 보이는지 확인
시나리오 (7일 카드):
  1. "7일" 또는 "총 여행 기간" 카드 클릭
  2. 확장/팝오버 후 아래 텍스트가 visible 인지 검증:
     - "2025년 5월 10일"
     - "5월 16일"
     - "비행 포함"
기대 결과: 3개 텍스트 전부 visible = PASS
실패 예시: 요소가 DOM에 존재하지만 max-height:0 또는 opacity:0 상태 = FAIL

시나리오 (4개 도시 카드):
  1. "4개 도시" 카드 클릭
  2. 아래 텍스트가 visible 인지 검증:
     - "뉴욕"
     - "워싱턴 D.C."
     - "필라델피아"
     - "보스턴"
기대 결과: 4개 텍스트 전부 visible = PASS
```

---

## STEP 2 — Cities 검증

### TC-03: 도시 카드 기본 렌더링
```
목적: 4개 도시 카드의 핵심 텍스트가 모두 visible
검증 항목:
  - "뉴욕" 텍스트 visible
  - "New York" 텍스트 visible
  - "Day 1" 텍스트 visible (또는 "Day 1 – 2")
  - "워싱턴 D.C." 텍스트 visible
  - "필라델피아" 텍스트 visible
  - "보스턴" 텍스트 visible
  - "Boston" 텍스트 visible
기대 결과: 전부 visible = PASS
```

### TC-04: 도시 카드 클릭 → 모달 상세 정보 visible
```
시나리오 (뉴욕 카드):
  1. 뉴욕 city-card 클릭
  2. 모달 또는 패널 열림 확인
  3. 아래 텍스트가 visible 인지 검증:
     - "미드타운"
     - "자유의 여신상 페리"
     - "$24"
     - "메트로카드"
기대 결과: 4개 텍스트 visible = PASS

시나리오 (워싱턴 D.C. 카드):
  1. D.C. city-card 클릭
  2. 아래 텍스트 visible 검증:
     - "스미소니언"
     - "무료"
     - "국회의사당"
     - "house.gov"
기대 결과: 4개 텍스트 visible = PASS

TC-04-C: 모달 닫기
  1. 모달 열린 상태에서 ESC 키 입력
  2. 모달 컨테이너가 hidden/removed 상태인지 확인
  3. 상세 텍스트 "미드타운"이 not visible 인지 확인
기대 결과: 상세 텍스트 not visible = PASS
```

---

## STEP 3 — Itinerary 검증

### TC-05: 타임라인 기본 렌더링
```
목적: D1~D7 라벨과 날짜가 모두 visible
검증 항목:
  - "D1" 텍스트 visible
  - "D7" 텍스트 visible
  - "5/10 토" 텍스트 visible
  - "5/16 금" 텍스트 visible
  - "뉴욕 도착" 텍스트 visible
  - "보스턴 마무리" 텍스트 visible (또는 Day 7 제목)
기대 결과: 전부 visible = PASS
```

### TC-06: Day 카드 클릭 → 상세 일정 텍스트 visible
```
시나리오 (Day 1 카드):
  1. D1 타임라인 카드 클릭
  2. accordion 확장 후 아래 텍스트 visible 검증:
     - "09:00"
     - "JFK"
     - "타임스퀘어"
     - "에어트레인"
기대 결과: 4개 텍스트 visible = PASS

시나리오 (Day 3 카드 — 이동일):
  1. D3 카드 클릭
  2. 아래 텍스트 visible 검증:
     - "Penn Station"
     - "Union Station"
     - "2시간 45분" (또는 "2h 45m")
     - "링컨 기념관"
기대 결과: 4개 텍스트 visible = PASS

시나리오 (Day 7 카드):
  1. D7 카드 클릭
  2. 아래 텍스트 visible 검증:
     - "Boston Common" (또는 "보스턴 코먼")
     - "프리덤 트레일"
     - "BOS"
     - "출국"
기대 결과: 4개 텍스트 visible = PASS

TC-06-D: 다른 카드 클릭 시 이전 카드 닫힘 (단일 오픈 방식인 경우)
  1. D1 카드 열기
  2. D3 카드 클릭
  3. D1 상세 텍스트 "에어트레인" not visible 확인
  4. D3 상세 텍스트 "Penn Station" visible 확인
기대 결과: PASS
```

---

## STEP 4 — Weather 검증

### TC-07: 날씨 카드 기본 렌더링
```
목적: 4개 도시 기온 범위 텍스트 visible
검증 항목:
  - "14 – 22°C" visible (뉴욕)
  - "16 – 26°C" visible (D.C.)
  - "14 – 24°C" visible (필라델피아)
  - "12 – 20°C" visible (보스턴)
기대 결과: 전부 visible = PASS
```

### TC-08: 날씨 카드 클릭 → 상세 팁 visible
```
시나리오 (뉴욕 날씨 카드):
  1. 뉴욕 weather-card 클릭
  2. 아래 텍스트 visible 검증:
     - "라일락" (또는 "튤립")
     - "레이어링"
     - "우산"
기대 결과: 3개 텍스트 visible = PASS

시나리오 (보스턴 날씨 카드):
  1. 보스턴 weather-card 클릭
  2. 아래 텍스트 visible 검증:
     - "찰스강"
     - "바람막이"
     - "Boston Marathon" (또는 "마라톤")
기대 결과: 3개 텍스트 visible = PASS
```

---

## STEP 5 — Budget 검증

### TC-09: 예산 테이블 기본 렌더링
```
목적: 테이블 모든 항목이 visible
검증 항목:
  - "항공권" 텍스트 visible
  - "Amtrak 열차" 텍스트 visible
  - "식비" 텍스트 visible
  - "340 – 530만원" 텍스트 visible (총합)
기대 결과: 전부 visible = PASS
```

### TC-10: 테이블 행 클릭 → 상세 비용 정보 visible
```
시나리오 (항공권 행):
  1. 항공권 테이블 행 클릭
  2. 아래 텍스트 visible 검증:
     - "직항"
     - "경유"
     - "JFK"
     - "BOS"
기대 결과: 4개 텍스트 visible = PASS

시나리오 (숙박 행):
  1. 숙박 행 클릭
  2. 아래 텍스트 visible 검증:
     - "$180"
     - "미드타운"
     - "캐피털 힐"
기대 결과: 3개 텍스트 visible = PASS

시나리오 (Amtrak 행):
  1. Amtrak 행 클릭
  2. 아래 텍스트 visible 검증:
     - "$30"
     - "amtrak.com"
기대 결과: 2개 텍스트 visible = PASS
```

---

## STEP 6 — Checklist 검증

### TC-11: 체크리스트 항목 렌더링
```
목적: 4개 카테고리 제목과 핵심 항목 텍스트 visible
검증 항목:
  - "필수 서류" 텍스트 visible
  - "ESTA" 텍스트 visible
  - "교통 예약" 텍스트 visible
  - "Amtrak" 텍스트 visible
  - "관광 예약" 텍스트 visible
  - "자유의 여신상" 텍스트 visible
기대 결과: 전부 visible = PASS
```

### TC-12: 체크박스 클릭 → 상태 토글 + 인라인 팁 visible
```
시나리오 (ESTA 항목):
  1. "ESTA 전자여행허가 신청" 체크박스 클릭
  2. 체크 상태 확인 (checked attribute 또는 시각적 변화)
  3. 인라인 팁 텍스트 visible 검증:
     - "cbp.dhs.gov" (또는 "esta.cbp")
     - "$21"
     - "72시간"
기대 결과: 체크 상태 + 3개 텍스트 visible = PASS

TC-12-B: 새로고침 후 체크 상태 유지 (localStorage)
  1. "ESTA" 항목 체크
  2. 페이지 reload
  3. "ESTA" 항목이 여전히 checked 상태인지 확인
기대 결과: 체크 상태 유지 = PASS
```

---

## STEP 7 — Tips 검증

### TC-13: 팁 카드 기본 렌더링
```
목적: 6개 팁 카드 제목과 배지 텍스트 visible
검증 항목:
  - "Amtrak 예약" 텍스트 visible
  - "D.C. 박물관은 전부 무료" 텍스트 visible (또는 유사)
  - "팁은 15~20%" 텍스트 visible (또는 팁 문화 제목)
  - "로브스터 롤" 텍스트 visible
  - "eSIM" 텍스트 visible
  - "Memorial Day" 텍스트 visible
기대 결과: 전부 visible = PASS
```

### TC-14: 팁 카드 클릭 → 상세 텍스트 visible
```
시나리오 (Amtrak 팁 카드):
  1. Amtrak 팁 카드 클릭
  2. 아래 텍스트 visible 검증:
     - "Acela"
     - "$150"
     - "Northeast Regional"
     - "30~40분"
기대 결과: 4개 텍스트 visible = PASS

시나리오 (로브스터 롤 팁 카드):
  1. 로브스터 롤 팁 카드 클릭
  2. 아래 텍스트 visible 검증:
     - "James Hook"
     - "Luke's Lobster"
     - "$28"
기대 결과: 3개 텍스트 visible = PASS
```

---

## 전체 페이지 스모크 테스트

### TC-00: 페이지 기본 로드
```
목적: index.html 로드 시 필수 요소 존재 및 visible
검증 항목:
  1. <title> 태그에 "5월" 텍스트 포함
  2. <nav> 요소 visible
  3. "2025년 5월 10일" 텍스트 visible
  4. "5월 16일" 텍스트 visible
  5. 네비게이션 링크 7개 이상 visible
  6. footer 요소 visible
  7. "뉴욕" + "워싱턴" + "필라델피아" + "보스턴" 전부 visible
기대 결과: 전부 통과 = PASS
실패 시: 페이지 로드 자체 실패 또는 구조적 문제
```

### TC-15: 반응형 — 모바일 뷰포트 (375px)
```
목적: 모바일 너비에서 핵심 텍스트 visible 유지
설정: viewport width = 375px
검증 항목:
  - "5월 미국" 텍스트 visible (hero)
  - "D1" 타임라인 아이템 visible
  - "7일" stat 카드 visible
  - nav 요소 visible (collapsed 형태도 허용)
기대 결과: 전부 visible = PASS
```

### TC-16: 키보드 접근성
```
목적: Tab 키로 인터랙티브 요소 접근 가능
시나리오:
  1. Tab 키 반복 입력으로 포커스 이동
  2. 도시 카드 포커스 시 Enter 키로 상세 열기
  3. 상세 열린 후 "워싱턴 D.C." 상세 텍스트 visible 확인
  4. ESC 키로 닫기
기대 결과: keyboard만으로 STEP 2 상세 열기/닫기 가능 = PASS
```

---

## 테스트 실행 우선순위

| 우선순위 | 테스트 케이스 | 이유 |
|----------|---------------|------|
| P0 (필수) | TC-00, TC-05, TC-09 | 기본 렌더링 — 실패 시 전체 페이지 결함 |
| P1 (핵심) | TC-02, TC-06, TC-10 | 주요 인터랙션 — 클릭 시 상세 텍스트 visible |
| P2 (권장) | TC-04, TC-08, TC-14 | 모달/팝오버 상세 내용 검증 |
| P3 (선택) | TC-12-B, TC-15, TC-16 | localStorage, 반응형, 접근성 |
