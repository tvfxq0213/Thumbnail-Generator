# NHK Easy News Thumbnail Generator

네이버 블로그 **NHK Easy News** 시리즈용 1200×1200 썸네일을 빠르게 제작하는 웹 기반 도구입니다.

무인양품(MUJI) 교재 느낌의 심플한 디자인으로, 제목·회차·태그만 입력하면 PNG/JPG로 저장할 수 있습니다.

## 설치 방법

별도의 빌드 과정이나 패키지 설치가 필요 없습니다.

1. 이 저장소를 클론하거나 ZIP으로 다운로드합니다.

```bash
git clone https://github.com/tvfxq0213/NHK-Thumbnail-Generator.git
cd NHK-Thumbnail-Generator
```

2. `index.html`을 브라우저에서 엽니다.

```bash
# macOS
open index.html

# Windows
start index.html
```

> **참고:** html2canvas와 Google Fonts는 CDN에서 로드됩니다. 최초 실행 시 인터넷 연결이 필요합니다.

## 사용 방법

1. **한국어 제목**과 **일본어 제목**을 입력합니다.
2. **JLPT**, **카테고리**, **회차번호**를 입력합니다.
   - 회차 `23` → 미리보기에 `#023`으로 표시됩니다.
3. 우측 미리보기에서 실시간으로 결과를 확인합니다.
4. **PNG 저장** 또는 **JPG 저장** 버튼을 클릭합니다.
   - 파일명 예: `023_정시에출발하다.png`
5. 상단 **🌙** 버튼으로 다크모드를, **컬러 테마** 버튼으로 포인트 색상을 변경할 수 있습니다.

## 기능 설명

| 기능 | 설명 |
|------|------|
| 실시간 미리보기 | 입력 즉시 썸네일에 반영 |
| 자동 폰트 크기 | 한국어(48~78px), 일본어(42~56px) 제목 길이에 따라 조절 |
| 자동 줄바꿈 | 긴 제목은 2~3줄로 자동 배치 (`line-break`, `word-break` 활용) |
| 회차 포맷 | 001, 023, 125 등 3자리 `#` 형식 자동 변환 |
| 컬러 테마 | Green, Blue, Orange, Red, Purple, Gray |
| 다크모드 | Light / Dark 원클릭 전환 |
| 고해상도 저장 | html2canvas 2배 스케일, 배경 포함, 투명도 없음 |
| PNG 로딩 표시 | PNG 저장 전 1초 로딩 애니메이션 |
| localStorage | JLPT, 카테고리 값 자동 저장·복원 |
| 반응형 | 데스크톱(좌 입력 / 우 미리보기), 모바일(세로 배치) |

## 폴더 구조

```
NHK-Thumbnail-Generator/
├── index.html          # 메인 HTML
├── css/
│   └── style.css       # BEM 방식 스타일
├── js/
│   └── app.js          # Vanilla JS (모듈화)
├── assets/
│   └── logo.svg        # 로고 에셋
└── README.md
```

## 사용 라이브러리

| 라이브러리 | 용도 | 로드 방식 |
|-----------|------|----------|
| [html2canvas](https://html2canvas.hertzen.com/) v1.4.1 | 썸네일 이미지 변환 | jsDelivr CDN |
| [Pretendard](https://github.com/orioncactus/pretendard) | 한국어 폰트 | jsDelivr CDN |
| [Noto Sans JP](https://fonts.google.com/noto/specimen/Noto+Sans+JP) | 일본어 폰트 | Google Fonts |

## 추가 예정 기능

- [ ] 썸네일 배경색 커스터마이즈
- [ ] 저작권 문구 편집
- [ ] 최근 생성 기록 목록
- [ ] 키보드 단축키 (Ctrl+S 저장 등)
- [ ] PWA 오프라인 지원

## 라이선스

개인 블로그 용도로 자유롭게 사용할 수 있습니다.
