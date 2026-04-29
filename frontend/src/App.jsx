import { useState, useEffect, useRef } from "react";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

// ── 상수 ──────────────────────────────────────────────────────────────────
const THEMES = [
  { id:"cyber",  name:"사이버 블루", bg:"#070d1a", panel:"rgba(0,180,255,0.06)",  acc:"#00b8ff", bdr:"rgba(0,180,255,0.22)",  glow:"rgba(0,184,255,0.18)"  },
  { id:"neon",   name:"네온 퍼플",   bg:"#0c070f", panel:"rgba(170,80,255,0.06)", acc:"#aa50ff", bdr:"rgba(170,80,255,0.22)", glow:"rgba(170,80,255,0.18)" },
  { id:"aurora", name:"오로라 그린", bg:"#071209", panel:"rgba(40,210,80,0.06)",  acc:"#28d250", bdr:"rgba(40,210,80,0.22)",  glow:"rgba(40,210,80,0.18)"  },
  { id:"gold",   name:"골드",        bg:"#110a00", panel:"rgba(255,160,20,0.06)", acc:"#ffa014", bdr:"rgba(255,160,20,0.22)", glow:"rgba(255,160,20,0.18)" },
  { id:"rose",   name:"로즈",        bg:"#12030a", panel:"rgba(255,55,95,0.06)",  acc:"#ff375f", bdr:"rgba(255,55,95,0.22)",  glow:"rgba(255,55,95,0.18)"  },
];

const AVATARS    = ["🚀","⭐","🎯","💎","🔥","🌟","💫","🦋","🎨","🎵","📸","🛍️","💼","🌙","☀️","🦄","🐉","🍀","🎪","🏆","🎬","🎤","💡","🌈","🐬"];
const LINK_ICONS = ["🔗","📺","📸","🛍️","💌","🎵","📝","💼","🎮","🌐","📱","💬","🎯","⭐","🚀","💰","📊","🎨","📡","🏆","▶️","💻","📧","🛒","🎁","🎓","🔔","🌿","🏋️"];

const DEFAULT_LINKS = [
  { id:1, title:"유튜브 채널",     url:"https://youtube.com/@creator",  icon:"📺", desc:"매주 업로드되는 메인 채널",  clicks:421, active:true  },
  { id:2, title:"틱톡 채널",       url:"https://tiktok.com/@creator",   icon:"🎵", desc:"숏폼 영상 & 챌린지 콘텐츠", clicks:356, active:true  },
  { id:3, title:"인스타그램",      url:"https://instagram.com/creator", icon:"📸", desc:"일상 & 비하인드 콘텐츠",    clicks:318, active:true  },
  { id:4, title:"공동구매 스토어", url:"https://shop.example.kr",       icon:"🛍️", desc:"진행 중인 공구 보러가기",   clicks:267, active:true  },
  { id:5, title:"뉴스레터 구독",   url:"https://news.example.kr",       icon:"💌", desc:"주간 인사이트 무료 구독",   clicks:189, active:false },
];

const DEFAULT_PROFILE = {
  name:"나의 채널", username:"mycreator",
  bio:"💫 콘텐츠 크리에이터 | 일상 & 라이프스타일\n📩 비즈니스 문의는 링크를 통해 연락 주세요!",
  avatar:"🚀", theme:"cyber", links: DEFAULT_LINKS,
};

const WEEK_DATA = () => ["월","화","수","목","금","토","일"].map(function(d) {
  return { day:d, 방문자: Math.floor(Math.random()*400)+120, 클릭: Math.floor(Math.random()*180)+60 };
});

const PIE_SRC = [
  { name:"틱톡",      value:34, color:"#ff4466" },
  { name:"인스타그램",value:31, color:"#e040fb" },
  { name:"유튜브",    value:22, color:"#ff5252" },
  { name:"직접 방문", value:13, color:"#69f0ae" },
];

const load  = function(k,fb){ try{ var v=localStorage.getItem(k); return v?JSON.parse(v):fb; }catch(e){ return fb; } };
const store = function(k,v) { try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} };

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "");

async function callGemini(system, userMsg) {
  var res = await fetch(API_BASE + "/api/claude", {   // /api/claude → 백엔드가 Gemini로 라우팅
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model:"gemini-2.0-flash", max_tokens:1000, system:system, messages:[{ role:"user", content:userMsg }] }),
  });
  if (!res.ok) throw new Error("API Error: " + res.status);
  var data = await res.json();
  return (data.content || []).map(function(b){ return b.text||""; }).join("") || "응답 없음";
}

const MANUAL_SECTIONS = [
  { id:"intro",  icon:"⚡",  color:"#00b8ff", title:"LINKFORGE PRO 란?",       steps:[], tips:[], desc:"인스타그램·틱톡 SNS에서 프로필 링크를 하나만 등록할 수 있는 제약을 해결하는 AI 기반 멀티링크 플랫폼입니다." },
  { id:"start",  icon:"🚀",  color:"#28d250", title:"처음 시작하기 (5분)",      steps:["편집기 탭 열기","아바타 선택","이름·사용자명 입력","바이오 작성 (AI 자동생성 가능)","링크 추가 시작"], tips:[] },
  { id:"links",  icon:"🔗",  color:"#aa50ff", title:"링크 추가 & 관리",         steps:["'+ 링크 추가' 클릭","제목·URL 입력","아이콘 선택","설명 추가 (선택)","추가하기 클릭"], tips:["중요 링크는 상단 배치","5~7개가 가장 효과적","비시즌 링크는 OFF 처리"] },
  { id:"tiktok", icon:"🎵",  color:"#ff4466", title:"틱톡 채널 연결하기",       steps:["틱톡 앱 → 프로필 → 공유 → 링크 복사","링크 추가 폼 → 제목: 틱톡 채널","URL에 복사한 주소 붙여넣기","아이콘 🎵 선택 → 추가"], tips:["설명란에 '매일 업로드' 문구로 클릭률 향상","틱톡 팔로워가 많다면 최상단 배치"] },
  { id:"theme",  icon:"🎨",  color:"#ffa014", title:"테마 & 디자인",            steps:[], tips:["SNS 피드 컬러와 유사한 테마 선택","시즌별로 바꿔 신선함 유지"] },
  { id:"ai",     icon:"🤖",  color:"#aa50ff", title:"AI 스튜디오 활용",         steps:["도구 선택","추가 정보 입력 (구체적일수록 좋음)","AI 실행 클릭","결과 확인 후 적용"], tips:["바이오: 팔로워수·분야·타겟을 구체적으로","수익화 전략: 분기마다 실행 추천"] },
  { id:"faq",    icon:"❓",  color:"#ffa014", title:"자주 묻는 질문", steps:[], tips:[],
    faqs:[
      { q:"링크는 몇 개까지 추가할 수 있나요?", a:"제한 없이 추가 가능합니다. 5~7개가 가장 효과적입니다." },
      { q:"저장이 자동으로 되나요?",             a:"네, 모든 변경사항은 즉시 브라우저에 자동 저장됩니다." },
      { q:"AI 기능이 작동하지 않아요.",          a:"backend/.env에 ANTHROPIC_API_KEY가 올바른지 확인하세요." },
      { q:"QR 코드를 인쇄할 수 있나요?",        a:"QR 버튼 → 생성된 이미지 우클릭 → 이미지로 저장." },
    ]
  },
];

export default function App() {
  var [tab, setTab]           = useState("editor");
  var [profile, setProfile]   = useState(function(){ return load("lf_profile", DEFAULT_PROFILE); });
  var [weekData]              = useState(WEEK_DATA);
  var [showAdd, setShowAdd]   = useState(false);
  var [newLink, setNewLink]   = useState({ title:"", url:"", icon:"🔗", desc:"" });
  var [aiTool, setAiTool]     = useState("bio");
  var [aiInput, setAiInput]   = useState("");
  var [aiOut, setAiOut]       = useState("");
  var [aiLoading, setAiLoading] = useState(false);
  var [aiError, setAiError]   = useState("");
  var [toast, setToast]       = useState(null);
  var [copied, setCopied]     = useState(false);
  var [showQR, setShowQR]     = useState(false);
  var [manSec, setManSec]     = useState("intro");
  var canvasRef = useRef(null);

  var th = THEMES.find(function(t){ return t.id === profile.theme; }) || THEMES[0];

  var update = function(patch) {
    var next = Object.assign({}, profile, patch);
    setProfile(next);
    store("lf_profile", next);
  };

  var notify = function(msg, type) {
    setToast({ msg:msg, type:type||"ok" });
    setTimeout(function(){ setToast(null); }, 3000);
  };

  useEffect(function() {
    if (!showQR || !canvasRef.current) return;
    var cv = canvasRef.current, cx = cv.getContext("2d");
    var url = "linkforge.io/" + profile.username;
    var size = 21, cell = 6;
    cv.width = cv.height = size * cell;
    cx.fillStyle = "#fff"; cx.fillRect(0,0,cv.width,cv.height);
    var seed = url.split("").reduce(function(a,c){ return a + c.charCodeAt(0); }, 0);
    var rng = function(x,y){ var v=(x*73856093^y*19349663^seed*83492791)%127; return v<0?v+127:v; };
    cx.fillStyle = "#111";
    for (var y=0; y<size; y++) {
      for (var x=0; x<size; x++) {
        var corner = (x<7&&y<7)||(x>13&&y<7)||(x<7&&y>13);
        var inF = (x>=1&&x<=5&&y>=1&&y<=5)||(x>=15&&x<=19&&y>=1&&y<=5)||(x>=1&&x<=5&&y>=15&&y<=19);
        if (corner) {
          if (!((x===0||x===6)&&(y===0||y===6))&&!((x===14||x===20)&&(y===0||y===6))&&!((x===0||x===6)&&(y===14||y===20)))
            cx.fillRect(x*cell,y*cell,cell,cell);
        } else if (inF) {
          cx.fillRect(x*cell,y*cell,cell,cell);
        } else if (rng(x,y)%2===0) {
          cx.fillRect(x*cell,y*cell,cell,cell);
        }
      }
    }
  }, [showQR, profile.username]);

  var runAI = async function() {
    setAiLoading(true); setAiOut(""); setAiError("");
    var SYS = {
      bio:      "당신은 SNS 크리에이터 전문 카피라이터입니다. 이모지를 포함한 매력적인 한국어 바이오를 150자 이내로 작성합니다.",
      title:    "당신은 디지털 마케팅 전문가입니다. 클릭률을 높이는 제목(15자 이내)과 설명(30자 이내)을 한국어로 제안합니다.\n형식:\n제목: [제목]\n설명: [설명]",
      strategy: "당신은 SNS 수익화 전략 컨설턴트입니다. 링크 구성을 분석하고 수익화 전략 5가지를 한국어로 제안합니다.",
      review:   "당신은 개인 브랜딩 전문가입니다. ✅ 잘된 점 / ⚠️ 개선점 / 💡 추천 액션 형식으로 한국어로 피드백합니다.",
    };
    var USR = {
      bio:      "바이오 작성:\n" + (aiInput || "이름: " + profile.name),
      title:    "제목 최적화:\n" + (aiInput || "https://example.com"),
      strategy: "링크 구성:\n" + profile.links.map(function(l){ return "- " + l.title + ": " + l.url; }).join("\n") + "\n추가정보: " + aiInput,
      review:   "프로필:\n이름: " + profile.name + "\n바이오: " + profile.bio + "\n링크: " + profile.links.map(function(l){ return l.title; }).join(", "),
    };
    try {
      var text = await callGemini(SYS[aiTool], USR[aiTool]);
      setAiOut(text);
    } catch(e) {
      setAiError("AI 호출 실패: 백엔드 서버 연결을 확인하세요. (" + e.message + ")");
    }
    setAiLoading(false);
  };

  var addLink = function() {
    if (!newLink.title.trim() || !newLink.url.trim()) return;
    var url = newLink.url;
    if (!/^https?:\/\//.test(url)) url = "https://" + url;
    update({ links: profile.links.concat([Object.assign({}, newLink, { url:url, id:Date.now(), clicks:0, active:true })]) });
    setNewLink({ title:"", url:"", icon:"🔗", desc:"" });
    setShowAdd(false);
    notify("링크가 추가되었습니다! 🔗");
  };

  var removeLink = function(id) {
    update({ links: profile.links.filter(function(l){ return l.id !== id; }) });
    notify("삭제되었습니다.", "warn");
  };

  var toggleLink = function(id) {
    update({ links: profile.links.map(function(l){ return l.id===id ? Object.assign({},l,{active:!l.active}) : l; }) });
  };

  var moveLink = function(idx, dir) {
    var arr = profile.links.slice(), sw = idx+dir;
    if (sw<0 || sw>=arr.length) return;
    var tmp = arr[idx]; arr[idx] = arr[sw]; arr[sw] = tmp;
    update({ links: arr });
  };

  var copyUrl = function() {
    navigator.clipboard.writeText("https://linkforge.io/" + profile.username).then(function(){
      setCopied(true); setTimeout(function(){ setCopied(false); }, 2000);
    });
  };

  var totalClicks   = profile.links.reduce(function(s,l){ return s+(l.clicks||0); }, 0);
  var totalVisitors = weekData.reduce(function(s,d){ return s+d["방문자"]; }, 0);
  var ctr = totalVisitors > 0 ? ((totalClicks/totalVisitors)*100).toFixed(1) : 0;

  // 스타일 헬퍼 (template literal 없이 string concatenation 사용)
  var card  = { background:th.panel, border:"1px solid " + th.bdr, borderRadius:16, padding:"18px 20px" };
  var btn   = { background:th.acc, color:"#05080f", border:"none", borderRadius:10, padding:"9px 20px", cursor:"pointer", fontWeight:700, fontSize:13 };
  var ghost = { background:"transparent", color:th.acc, border:"1px solid " + th.bdr, borderRadius:10, padding:"8px 16px", cursor:"pointer", fontSize:13 };
  var inp   = { width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid " + th.bdr, borderRadius:10, padding:"9px 13px", color:"#e2e4e8", fontSize:13, outline:"none", boxSizing:"border-box" };
  var lbl   = { fontSize:11, color:"#6b7280", marginBottom:4, display:"block" };
  var tag   = { background:th.panel, border:"1px solid " + th.bdr, borderRadius:6, padding:"3px 8px", fontSize:11, color:th.acc };

  var ProfileCard = function() {
    return (
      <div style={{ width:300, background:th.bg, minHeight:520, borderRadius:20, padding:"28px 16px", display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
        <div style={{ fontSize:54, lineHeight:1, filter:"drop-shadow(0 0 16px " + th.glow + ")" }}>{profile.avatar}</div>
        <div style={{ fontSize:19, fontWeight:800, color:"#fff", marginTop:4 }}>{profile.name}</div>
        <div style={{ fontSize:11, color:th.acc }}>@{profile.username}</div>
        <div style={{ fontSize:12, color:"#9ca3af", textAlign:"center", whiteSpace:"pre-line", lineHeight:1.65, maxWidth:250 }}>{profile.bio}</div>
        <div style={{ width:"100%", display:"flex", flexDirection:"column", gap:9, marginTop:6 }}>
          {profile.links.filter(function(l){ return l.active; }).map(function(lk) {
            return (
              <a key={lk.id} href={lk.url} target="_blank" rel="noopener noreferrer"
                style={{ display:"flex", alignItems:"center", gap:11, background:th.panel, border:"1px solid " + th.bdr, borderRadius:13, padding:"12px 14px", textDecoration:"none" }}>
                <span style={{ fontSize:20 }}>{lk.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#fff" }}>{lk.title}</div>
                  {lk.desc && <div style={{ fontSize:10, color:"#6b7280", marginTop:1 }}>{lk.desc}</div>}
                </div>
                <span style={{ color:th.acc, fontSize:15 }}>›</span>
              </a>
            );
          })}
        </div>
        <div style={{ marginTop:14, fontSize:9, color:"#374151" }}>⚡ LINKFORGE PRO</div>
      </div>
    );
  };

  var TABS     = [["editor","✏️ 편집기"],["preview","📱 미리보기"],["analytics","📊 분석"],["ai","🤖 AI 스튜디오"],["manual","📖 매뉴얼"]];
  var AI_TOOLS = [["bio","✍️ 바이오 작성기"],["title","🎯 제목 최적화"],["strategy","💰 수익화 전략"],["review","🔍 프로필 리뷰"]];

  return (
    <div style={{ minHeight:"100vh", background:th.bg, color:"#e2e4e8", fontFamily:"'Segoe UI',system-ui,sans-serif", fontSize:14 }}>
      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", top:16, right:16, background:toast.type==="warn"?"#dc6f2a":th.acc, color:"#05080f", borderRadius:11, padding:"11px 18px", fontWeight:700, fontSize:13, zIndex:9999 }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ background:"rgba(0,0,0,0.55)", backdropFilter:"blur(18px)", borderBottom:"1px solid " + th.bdr, padding:"0 20px", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", height:54 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:18 }}>⚡</span>
            <span style={{ fontWeight:900, fontSize:17, color:th.acc }}>LINKFORGE</span>
            <span style={{ fontSize:9, background:th.panel, border:"1px solid " + th.bdr, color:th.acc, borderRadius:5, padding:"2px 7px", fontWeight:800 }}>PRO</span>
          </div>
          <div style={{ display:"flex", gap:2 }}>
            {TABS.map(function(t) {
              return (
                <button key={t[0]} onClick={function(){ setTab(t[0]); }}
                  style={{ background:tab===t[0]?th.acc:"transparent", color:tab===t[0]?"#05080f":"#6b7280", border:"none", borderRadius:8, padding:"5px 13px", cursor:"pointer", fontWeight:tab===t[0]?800:400, fontSize:13 }}>
                  {t[1]}
                </button>
              );
            })}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:11, color:"#4b5563" }}>linkforge.io/{profile.username}</span>
            <button onClick={copyUrl} style={Object.assign({},btn,{padding:"5px 13px",fontSize:12})}>{copied?"✓ 복사됨":"🔗 복사"}</button>
            <button onClick={function(){ setShowQR(!showQR); }} style={Object.assign({},ghost,{padding:"5px 13px",fontSize:12})}>QR</button>
          </div>
        </div>
      </div>

      {/* QR Modal */}
      {showQR && (
        <div onClick={function(){ setShowQR(false); }} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div onClick={function(e){ e.stopPropagation(); }} style={{ background:"#fff", borderRadius:20, padding:28, textAlign:"center" }}>
            <canvas ref={canvasRef} style={{ display:"block" }} />
            <div style={{ marginTop:12, fontSize:12, color:"#374151", fontWeight:700 }}>linkforge.io/{profile.username}</div>
            <button onClick={function(){ setShowQR(false); }} style={{ marginTop:12, background:"#111", color:"#fff", border:"none", borderRadius:8, padding:"7px 22px", cursor:"pointer" }}>닫기</button>
          </div>
        </div>
      )}

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"22px 20px" }}>

        {/* EDITOR */}
        {tab==="editor" && (
          <div style={{ display:"grid", gridTemplateColumns:"300px 1fr", gap:20 }}>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div style={card}>
                <div style={{ fontSize:12, fontWeight:800, color:th.acc, marginBottom:14 }}>👤 프로필 설정</div>
                <div style={{ marginBottom:14 }}>
                  <span style={lbl}>아바타</span>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                    {AVATARS.map(function(a) {
                      return (
                        <button key={a} onClick={function(){ update({avatar:a}); }}
                          style={{ fontSize:17, background:profile.avatar===a?th.acc+"25":"transparent", border:"1px solid " + (profile.avatar===a?th.acc:th.bdr), borderRadius:8, width:34, height:34, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          {a}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  <div><span style={lbl}>이름</span><input value={profile.name} onChange={function(e){ update({name:e.target.value}); }} style={inp} placeholder="채널명" /></div>
                  <div><span style={lbl}>사용자명</span><input value={profile.username} onChange={function(e){ update({username:e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,"")}); }} style={inp} placeholder="username" /></div>
                  <div><span style={lbl}>바이오</span><textarea value={profile.bio} onChange={function(e){ update({bio:e.target.value}); }} style={Object.assign({},inp,{height:84,resize:"vertical",lineHeight:1.6})} placeholder="나를 소개하는 문구" /></div>
                </div>
              </div>
              <div style={card}>
                <div style={{ fontSize:12, fontWeight:800, color:th.acc, marginBottom:12 }}>🎨 테마</div>
                <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                  {THEMES.map(function(t) {
                    return (
                      <button key={t.id} onClick={function(){ update({theme:t.id}); }}
                        style={{ display:"flex", alignItems:"center", gap:10, background:profile.theme===t.id?t.acc+"12":"transparent", border:"1px solid " + (profile.theme===t.id?t.acc:"rgba(255,255,255,0.07)"), borderRadius:9, padding:"9px 12px", cursor:"pointer" }}>
                        <div style={{ width:18, height:18, borderRadius:5, background:t.acc, flexShrink:0 }} />
                        <span style={{ fontSize:12, color:profile.theme===t.id?t.acc:"#6b7280", fontWeight:profile.theme===t.id?700:400 }}>{t.name}</span>
                        {profile.theme===t.id && <span style={{ marginLeft:"auto", color:t.acc }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={card}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                <div style={{ fontSize:12, fontWeight:800, color:th.acc }}>🔗 링크 관리 <span style={{ color:"#6b7280", fontWeight:400 }}>({profile.links.length}개)</span></div>
                <button onClick={function(){ setShowAdd(!showAdd); }} style={btn}>+ 링크 추가</button>
              </div>
              {showAdd && (
                <div style={{ background:"rgba(0,0,0,0.35)", border:"1px solid " + th.bdr, borderRadius:14, padding:16, marginBottom:16 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:th.acc, marginBottom:12 }}>새 링크 추가</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                    <div><span style={lbl}>링크 제목 *</span><input value={newLink.title} onChange={function(e){ setNewLink(Object.assign({},newLink,{title:e.target.value})); }} style={inp} placeholder="예: 틱톡 채널" /></div>
                    <div><span style={lbl}>URL *</span><input value={newLink.url} onChange={function(e){ setNewLink(Object.assign({},newLink,{url:e.target.value})); }} style={inp} placeholder="https://..." /></div>
                  </div>
                  <div style={{ marginBottom:10 }}><span style={lbl}>설명</span><input value={newLink.desc} onChange={function(e){ setNewLink(Object.assign({},newLink,{desc:e.target.value})); }} style={inp} placeholder="짧은 설명 (선택)" /></div>
                  <div style={{ marginBottom:14 }}>
                    <span style={lbl}>아이콘</span>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                      {LINK_ICONS.map(function(ico) {
                        return (
                          <button key={ico} onClick={function(){ setNewLink(Object.assign({},newLink,{icon:ico})); }}
                            style={{ fontSize:16, background:newLink.icon===ico?th.acc+"25":"transparent", border:"1px solid " + (newLink.icon===ico?th.acc:th.bdr), borderRadius:6, width:30, height:30, cursor:"pointer" }}>
                            {ico}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={addLink} style={btn}>추가하기</button>
                    <button onClick={function(){ setShowAdd(false); }} style={ghost}>취소</button>
                  </div>
                </div>
              )}
              <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
                {profile.links.map(function(lk, idx) {
                  return (
                    <div key={lk.id} style={{ background:"rgba(0,0,0,0.25)", border:"1px solid " + (lk.active?th.bdr:"rgba(255,255,255,0.04)"), borderRadius:13, padding:"12px 14px", opacity:lk.active?1:0.5 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <span style={{ fontSize:22, flexShrink:0 }}>{lk.icon}</span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:700, color:"#e2e4e8", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{lk.title}</div>
                          <div style={{ fontSize:10, color:"#4b5563", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginTop:2 }}>{lk.url}</div>
                          {lk.desc && <div style={{ fontSize:10, color:"#6b7280", marginTop:1 }}>{lk.desc}</div>}
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:5, flexShrink:0 }}>
                          <span style={tag}>{lk.clicks}</span>
                          <button onClick={function(){ moveLink(idx,-1); }} style={{ background:"transparent", border:"1px solid " + th.bdr, borderRadius:6, width:26, height:26, color:"#9ca3af", cursor:"pointer", fontSize:11, display:"flex", alignItems:"center", justifyContent:"center" }}>↑</button>
                          <button onClick={function(){ moveLink(idx,1); }}  style={{ background:"transparent", border:"1px solid " + th.bdr, borderRadius:6, width:26, height:26, color:"#9ca3af", cursor:"pointer", fontSize:11, display:"flex", alignItems:"center", justifyContent:"center" }}>↓</button>
                          <button onClick={function(){ toggleLink(lk.id); }} style={{ background:lk.active?th.acc+"20":"rgba(255,255,255,0.04)", border:"1px solid " + (lk.active?th.acc:"rgba(255,255,255,0.08)"), borderRadius:6, padding:"3px 9px", cursor:"pointer", fontSize:11, color:lk.active?th.acc:"#6b7280", fontWeight:800 }}>{lk.active?"ON":"OFF"}</button>
                          <button onClick={function(){ removeLink(lk.id); }} style={{ background:"rgba(255,50,50,0.08)", border:"1px solid rgba(255,50,50,0.18)", borderRadius:6, width:26, height:26, color:"#f87171", cursor:"pointer", fontSize:15, display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* PREVIEW */}
        {tab==="preview" && (
          <div style={{ display:"flex", justifyContent:"center", paddingTop:12 }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:12, color:"#6b7280", marginBottom:5 }}>공개 프로필 미리보기</div>
              <div style={{ fontSize:12, color:th.acc, fontWeight:700, marginBottom:18 }}>linkforge.io/{profile.username}</div>
              <div style={{ width:340, background:"#1c1c1e", borderRadius:46, padding:11, boxShadow:"0 0 80px rgba(0,0,0,0.9), 0 0 40px " + th.glow, border:"2.5px solid #2a2a2c" }}>
                <div style={{ background:"#000", borderRadius:36, overflow:"hidden" }}>
                  <div style={{ background:"#000", padding:"8px 20px 5px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:10, color:"#fff", fontWeight:700 }}>9:41</span>
                    <div style={{ width:90, height:18, background:"#1c1c1e", borderRadius:10 }} />
                    <span style={{ fontSize:9, color:"#fff" }}>▣ ▣ ▣</span>
                  </div>
                  <div style={{ maxHeight:660, overflowY:"auto" }}><ProfileCard /></div>
                </div>
              </div>
              <div style={{ display:"flex", gap:10, justifyContent:"center", marginTop:18 }}>
                <button onClick={copyUrl} style={btn}>🔗 링크 복사</button>
                <button onClick={function(){ setShowQR(true); }} style={ghost}>QR 코드</button>
                <button onClick={function(){ setTab("editor"); }} style={ghost}>✏️ 편집</button>
              </div>
            </div>
          </div>
        )}

        {/* ANALYTICS */}
        {tab==="analytics" && (
          <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
              {[
                {lbl:"총 방문자",val:totalVisitors.toLocaleString(),ico:"👥",sub:"지난 7일"},
                {lbl:"총 클릭수",val:totalClicks.toLocaleString(),ico:"🖱️",sub:"전체 링크"},
                {lbl:"CTR",val:ctr+"%",ico:"📈",sub:"클릭률"},
                {lbl:"활성 링크",val:profile.links.filter(function(l){return l.active;}).length+"개",ico:"🔗",sub:"전체 " + profile.links.length + "개"},
              ].map(function(m) {
                return (
                  <div key={m.lbl} style={Object.assign({},card,{textAlign:"center"})}>
                    <div style={{ fontSize:26, marginBottom:6 }}>{m.ico}</div>
                    <div style={{ fontSize:24, fontWeight:900, color:th.acc }}>{m.val}</div>
                    <div style={{ fontSize:12, color:"#d1d5db", marginTop:4 }}>{m.lbl}</div>
                    <div style={{ fontSize:10, color:"#4b5563", marginTop:2 }}>{m.sub}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:18 }}>
              <div style={card}>
                <div style={{ fontSize:12, fontWeight:800, color:th.acc, marginBottom:14 }}>📈 방문자 & 클릭 추이</div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={weekData}>
                    <XAxis dataKey="day" stroke="#374151" tick={{fill:"#6b7280",fontSize:11}} />
                    <YAxis stroke="#374151" tick={{fill:"#6b7280",fontSize:11}} />
                    <Tooltip contentStyle={{background:"#111827",border:"1px solid " + th.bdr,borderRadius:8,color:"#e2e4e8",fontSize:12}} />
                    <Line type="monotone" dataKey="방문자" stroke={th.acc} strokeWidth={2.5} dot={{fill:th.acc,r:3}} />
                    <Line type="monotone" dataKey="클릭"   stroke="#f97316" strokeWidth={2}   dot={{fill:"#f97316",r:3}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={card}>
                <div style={{ fontSize:12, fontWeight:800, color:th.acc, marginBottom:14 }}>🌐 트래픽 소스</div>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie data={PIE_SRC} cx="50%" cy="50%" innerRadius={42} outerRadius={65} paddingAngle={4} dataKey="value">
                      {PIE_SRC.map(function(e,i){ return <Cell key={i} fill={e.color} />; })}
                    </Pie>
                    <Tooltip contentStyle={{background:"#111827",border:"1px solid " + th.bdr,borderRadius:8,color:"#e2e4e8",fontSize:12}} formatter={function(v,n){ return [v+"%",n]; }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display:"flex", flexDirection:"column", gap:5, marginTop:8 }}>
                  {PIE_SRC.map(function(d) {
                    return (
                      <div key={d.name} style={{ display:"flex", alignItems:"center", gap:7, fontSize:11 }}>
                        <div style={{ width:8, height:8, borderRadius:2, background:d.color, flexShrink:0 }} />
                        <span style={{ color:"#9ca3af", flex:1 }}>{d.name}</span>
                        <span style={{ color:"#e2e4e8", fontWeight:700 }}>{d.value}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div style={card}>
              <div style={{ fontSize:12, fontWeight:800, color:th.acc, marginBottom:14 }}>🔗 링크별 클릭수</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={profile.links.map(function(l){ return { name:l.title.slice(0,10), 클릭수:l.clicks||0 }; })}>
                  <XAxis dataKey="name" stroke="#374151" tick={{fill:"#6b7280",fontSize:11}} />
                  <YAxis stroke="#374151" tick={{fill:"#6b7280",fontSize:11}} />
                  <Tooltip contentStyle={{background:"#111827",border:"1px solid " + th.bdr,borderRadius:8,color:"#e2e4e8",fontSize:12}} />
                  <Bar dataKey="클릭수" fill={th.acc} radius={[5,5,0,0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* AI STUDIO */}
        {tab==="ai" && (
          <div style={{ display:"grid", gridTemplateColumns:"200px 1fr", gap:18 }}>
            <div style={card}>
              <div style={{ fontSize:12, fontWeight:800, color:th.acc, marginBottom:14 }}>🤖 AI 도구</div>
              <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                {AI_TOOLS.map(function(t) {
                  return (
                    <button key={t[0]} onClick={function(){ setAiTool(t[0]); setAiOut(""); setAiInput(""); setAiError(""); }}
                      style={{ background:aiTool===t[0]?th.acc+"12":"transparent", border:"1px solid " + (aiTool===t[0]?th.acc:th.bdr), borderRadius:10, padding:"11px 12px", cursor:"pointer", textAlign:"left", fontSize:12, fontWeight:aiTool===t[0]?700:400, color:aiTool===t[0]?th.acc:"#9ca3af" }}>
                      {t[1]}
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop:14, padding:10, background:"rgba(0,0,0,0.3)", border:"1px solid " + th.bdr, borderRadius:9, fontSize:10, color:"#6b7280", lineHeight:1.7 }}>
                🤖 Gemini 2.0 Flash<br />백엔드 프록시 경유<br />API 키 서버 보관
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div style={card}>
                <div style={{ fontSize:14, fontWeight:800, color:th.acc, marginBottom:12 }}>
                  {(AI_TOOLS.find(function(t){ return t[0]===aiTool; }) || [])[1]}
                </div>
                <span style={lbl}>추가 정보 입력 (구체적일수록 정확)</span>
                <textarea value={aiInput} onChange={function(e){ setAiInput(e.target.value); }} style={Object.assign({},inp,{height:90,resize:"vertical",lineHeight:1.6})} placeholder="분야, 팔로워수, 특징 등을 입력하세요" />
                <div style={{ display:"flex", gap:10, marginTop:12 }}>
                  <button onClick={runAI} disabled={aiLoading} style={Object.assign({},btn,{opacity:aiLoading?0.55:1})}>{aiLoading?"⏳ AI 분석 중...":"🚀 AI 실행"}</button>
                  {aiOut && <button onClick={function(){ setAiOut(""); }} style={ghost}>초기화</button>}
                </div>
                {aiError && <div style={{ marginTop:12, fontSize:12, color:"#f87171", background:"rgba(255,50,50,0.08)", border:"1px solid rgba(255,50,50,0.2)", borderRadius:8, padding:"10px 14px" }}>{aiError}</div>}
              </div>
              {(aiOut || aiLoading) && (
                <div style={card}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                    <div style={{ fontSize:12, fontWeight:800, color:th.acc }}>💡 AI 생성 결과</div>
                    <div style={{ display:"flex", gap:8 }}>
                      {aiTool==="bio" && aiOut && <button onClick={function(){ update({bio:aiOut}); notify("바이오 적용! ✨"); }} style={Object.assign({},btn,{padding:"5px 13px",fontSize:11})}>✓ 적용</button>}
                      {aiOut && <button onClick={function(){ navigator.clipboard.writeText(aiOut).then(function(){ notify("복사됨!"); }); }} style={Object.assign({},ghost,{padding:"5px 13px",fontSize:11})}>📋 복사</button>}
                    </div>
                  </div>
                  {aiLoading
                    ? <div style={{ display:"flex", alignItems:"center", gap:12, color:"#6b7280", fontSize:13 }}><div style={{ width:18, height:18, border:"2px solid " + th.bdr, borderTop:"2px solid " + th.acc, borderRadius:"50%", animation:"spin 0.9s linear infinite" }} />Gemini가 분석 중...</div>
                    : <div style={{ fontSize:13, color:"#d1d5db", lineHeight:1.75, whiteSpace:"pre-wrap" }}>{aiOut}</div>
                  }
                </div>
              )}
            </div>
          </div>
        )}

        {/* MANUAL */}
        {tab==="manual" && (
          <div style={{ display:"grid", gridTemplateColumns:"210px 1fr", gap:18 }}>
            <div style={card}>
              <div style={{ fontSize:12, fontWeight:800, color:th.acc, marginBottom:14 }}>📖 목차</div>
              <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                {MANUAL_SECTIONS.map(function(s) {
                  return (
                    <button key={s.id} onClick={function(){ setManSec(s.id); }}
                      style={{ display:"flex", alignItems:"center", gap:8, background:manSec===s.id?s.color+"15":"transparent", border:"1px solid " + (manSec===s.id?s.color:th.bdr), borderRadius:9, padding:"9px 12px", cursor:"pointer", textAlign:"left", fontSize:12, fontWeight:manSec===s.id?700:400, color:manSec===s.id?s.color:"#9ca3af" }}>
                      <span>{s.icon}</span>{s.title}
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={card}>
              {MANUAL_SECTIONS.filter(function(s){ return s.id===manSec; }).map(function(sec) {
                return (
                  <div key={sec.id}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20, paddingBottom:16, borderBottom:"1px solid " + th.bdr }}>
                      <div style={{ width:42, height:42, borderRadius:12, background:sec.color+"18", border:"1.5px solid " + sec.color+"40", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{sec.icon}</div>
                      <div>
                        <div style={{ fontSize:16, fontWeight:800, color:"#fff" }}>{sec.title}</div>
                        <div style={{ fontSize:11, color:"#6b7280", marginTop:2 }}>LINKFORGE PRO 가이드</div>
                      </div>
                    </div>
                    {sec.desc && <div style={{ fontSize:13, color:"#9ca3af", lineHeight:1.7, marginBottom:18, background:"rgba(255,255,255,0.02)", border:"1px solid " + th.bdr, borderRadius:10, padding:"14px 16px" }}>{sec.desc}</div>}
                    {sec.steps.length > 0 && (
                      <div style={{ marginBottom:18 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:sec.color, marginBottom:10 }}>📋 단계별 가이드</div>
                        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                          {sec.steps.map(function(s,i) {
                            return (
                              <div key={i} style={{ display:"flex", gap:12, background:"rgba(255,255,255,0.02)", border:"1px solid " + th.bdr, borderRadius:10, padding:"12px 14px", alignItems:"flex-start" }}>
                                <div style={{ width:26, height:26, borderRadius:"50%", background:sec.color+"18", border:"1.5px solid " + sec.color+"50", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:900, color:sec.color, flexShrink:0 }}>{i+1}</div>
                                <div style={{ fontSize:12, color:"#9ca3af", lineHeight:1.6, paddingTop:2 }}>{s}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {sec.tips.length > 0 && (
                      <div style={{ background:sec.color+"0c", border:"1px solid " + sec.color+"35", borderRadius:10, padding:"14px 16px", marginBottom:18 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:sec.color, marginBottom:10 }}>💡 핵심 팁</div>
                        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                          {sec.tips.map(function(t,i) {
                            return <div key={i} style={{ display:"flex", gap:8, fontSize:12, color:"#d1d5db", lineHeight:1.55 }}><span style={{ color:sec.color, flexShrink:0 }}>•</span>{t}</div>;
                          })}
                        </div>
                      </div>
                    )}
                    {sec.faqs && (
                      <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:sec.color, marginBottom:4 }}>❓ 자주 묻는 질문</div>
                        {sec.faqs.map(function(f,i) {
                          return (
                            <div key={i} style={{ background:"rgba(255,255,255,0.02)", border:"1px solid " + th.bdr, borderRadius:10, padding:"14px 16px" }}>
                              <div style={{ fontSize:13, fontWeight:700, color:"#fff", marginBottom:6 }}>Q. {f.q}</div>
                              <div style={{ fontSize:12, color:"#9ca3af", lineHeight:1.6 }}>A. {f.a}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}