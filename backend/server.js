/**
 * LINKFORGE PRO — Backend API Proxy Server
 * Google Gemini API를 안전하게 프록시합니다 (API 키를 클라이언트에 노출하지 않음)
 */

require("dotenv").config();
const express   = require("express");
const cors      = require("cors");
const helmet    = require("helmet");
const rateLimit = require("express-rate-limit");
const fetch     = require("node-fetch");

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || "http://localhost:5173",
  methods: ["GET","POST"],
  allowedHeaders: ["Content-Type"],
}));
app.use(express.json({ limit: "1mb" }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
});

app.get("/health", function(req, res) {
  res.json({ status:"ok", service:"LINKFORGE PRO Backend (Gemini)", version:"2.1.0", timestamp: new Date().toISOString() });
});

/**
 * POST /api/gemini  (기본 엔드포인트)
 * POST /api/claude  (하위 호환성 유지 — 동일하게 Gemini 호출)
 *
 * Body: { system: string, messages: [{ role: "user"|"model", content: string }], max_tokens?: number, model?: string }
 */
async function handleGemini(req, res) {
  var apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "서버에 GEMINI_API_KEY가 설정되지 않았습니다." });
  }

  var model      = req.body.model || "gemini-2.0-flash";
  var max_tokens = req.body.max_tokens || 1000;
  var system     = req.body.system || "";
  var messages   = req.body.messages;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages 필드가 필요합니다." });
  }

  // Anthropic 형식 → Gemini 형식 변환
  var geminiContents = messages.map(function(m) {
    return {
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    };
  });

  var requestBody = {
    contents: geminiContents,
    generationConfig: {
      maxOutputTokens: max_tokens,
      temperature: 0.7,
    },
  };

  // 시스템 지시사항 추가 (Gemini는 systemInstruction 필드 사용)
  if (system) {
    requestBody.systemInstruction = { parts: [{ text: system }] };
  }

  var geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey;

  try {
    var response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      var errText = await response.text();
      console.error("[Gemini API Error]", response.status, errText);
      return res.status(response.status).json({
        error: "Gemini API 호출 실패",
        detail: response.status === 400 ? "요청 형식을 확인하세요." :
                response.status === 403 ? "API 키를 확인하세요." :
                "잠시 후 다시 시도해주세요.",
      });
    }

    var data = await response.json();

    // Gemini 응답 → Anthropic 호환 형식으로 변환 (프론트엔드 코드 변경 최소화)
    var text = "";
    try {
      text = data.candidates[0].content.parts[0].text || "";
    } catch(e) {
      text = "응답 없음";
    }

    res.json({
      content: [{ type: "text", text: text }],
      model: model,
      usage: {
        input_tokens:  data.usageMetadata ? data.usageMetadata.promptTokenCount     || 0 : 0,
        output_tokens: data.usageMetadata ? data.usageMetadata.candidatesTokenCount || 0 : 0,
      },
    });
  } catch(err) {
    console.error("[Server Error]", err.message);
    res.status(500).json({ error: "서버 내부 오류: " + err.message });
  }
}

app.post("/api/gemini", limiter, handleGemini);
// 하위 호환 — 프론트엔드의 /api/claude 호출을 Gemini로 투명하게 처리
app.post("/api/claude", limiter, handleGemini);

app.use(function(req, res) {
  res.status(404).json({ error: "엔드포인트를 찾을 수 없습니다." });
});

app.listen(PORT, function() {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║   ⚡ LINKFORGE PRO — Backend Server      ║");
  console.log("║   http://localhost:" + PORT + "               ║");
  console.log("║   🤖 AI: Google Gemini 2.0 Flash         ║");
  console.log("╚══════════════════════════════════════════╝");
  if (!process.env.GEMINI_API_KEY) {
    console.warn("⚠️  경고: GEMINI_API_KEY가 .env에 설정되지 않았습니다!");
  } else {
    console.log("✅  Gemini API 키 확인 완료");
  }
});