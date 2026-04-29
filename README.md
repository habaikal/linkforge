# ⚡ LINKFORGE PRO

> AI 기반 멀티링크 플랫폼 — Google Gemini 2.0 Flash 탑재

SNS 프로필에 링크 하나만 등록할 수 있는 제약을 해결하는 **올인원 링크 허브**입니다.  
**Google Gemini AI**가 바이오 작성, 제목 최적화, 수익화 전략, 프로필 리뷰를 자동으로 제안합니다.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/habaikal/linkforge)

---

## ✨ 주요 기능

| 기능 | 설명 |
|------|------|
| 🔗 멀티링크 관리 | 링크 추가·정렬·ON/OFF·삭제 |
| 🎨 5가지 테마 | 사이버 블루, 네온 퍼플, 오로라 그린, 골드, 로즈 |
| 🤖 AI 스튜디오 | Gemini 2.0 Flash 기반 바이오·제목·전략·리뷰 |
| 📊 분석 대시보드 | 방문자·클릭·CTR·트래픽 소스 시각화 |
| 📱 모바일 미리보기 | 실시간 스마트폰 화면 미리보기 |
| QR 코드 생성 | 오프라인 프로모션용 QR 즉시 생성 |
| 💾 자동 저장 | LocalStorage 실시간 저장 |

---

## 🚀 빠른 시작

### 필요 사항
- Node.js 18+
- Google Gemini API 키 ([무료 발급](https://aistudio.google.com/app/apikey))

### 1. 레포지토리 클론
```bash
git clone https://github.com/habaikal/linkforge.git
cd linkforge
```

### 2. 백엔드 설정
```bash
cd backend
cp .env.example .env
# .env 파일을 열어 GEMINI_API_KEY 입력
npm install
npm start        # 포트 3001
```

### 3. 프론트엔드 설정
```bash
cd ../frontend
npm install
npm run dev      # http://localhost:5173
```

---

## 📁 프로젝트 구조

```
linkforge/
├── .github/
│   └── workflows/
│       └── deploy.yml        # GitHub Actions CI/CD
├── backend/
│   ├── server.js             # Express + Gemini API 프록시
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # 메인 React 컴포넌트
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── docker-compose.yml
├── vercel.json
└── README.md
```

---

## 🌐 Vercel 배포

### 환경 변수 설정
Vercel 대시보드 → Settings → Environment Variables:

| 변수명 | 값 |
|--------|-----|
| `GEMINI_API_KEY` | Gemini API 키 |
| `ALLOWED_ORIGIN` | 프론트엔드 배포 URL |

### GitHub Secrets (Actions 자동 배포용)

| Secret | 설명 |
|--------|------|
| `VERCEL_TOKEN` | Vercel CLI 토큰 |
| `VERCEL_ORG_ID` | Vercel 조직 ID |
| `VERCEL_PROJECT_ID` | Vercel 프로젝트 ID |

---

## 🐳 Docker Compose

```bash
# .env 파일 생성 후
docker-compose up -d
```

---

## 🤖 AI 스튜디오 기능

| 도구 | 설명 |
|------|------|
| ✍️ 바이오 작성기 | 크리에이터 정보 → 매력적인 바이오 자동 생성 |
| 🎯 제목 최적화 | URL → 클릭률 높은 제목·설명 제안 |
| 💰 수익화 전략 | 링크 구성 분석 → 5가지 수익화 전략 |
| 🔍 프로필 리뷰 | 잘된 점·개선점·추천 액션 피드백 |

---

## 📄 라이선스

MIT License © 2025 LINKFORGE PRO