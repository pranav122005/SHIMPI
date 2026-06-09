import { useState, useEffect, useRef, useCallback } from "react";

/* ── Google Fonts ─────────────────────────────────────────────── */
const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&family=Jost:wght@100;200;300;400;500;600&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap');

    :root {
      --ink:       #080808;
      --ink-2:     #111111;
      --ink-3:     #1c1c1c;
      --ink-4:     #262626;
      --ink-5:     #333333;
      --silver-7:  #484848;
      --silver-6:  #5a5a5a;
      --silver-5:  #737373;
      --silver-4:  #8c8c8c;
      --silver-3:  #aaaaaa;
      --silver-2:  #c8c8c8;
      --silver-1:  #e2e2e2;
      --white:     #f4f1ec;
      --gold:      #c8ad7e;
      --gold-lt:   #e0ccaa;
      --gold-dk:   #9e8558;
      --font-hd:   'Playfair Display', Georgia, serif;
      --font-sub:  'EB Garamond', Georgia, serif;
      --font-body: 'Jost', system-ui, sans-serif;
      --ease-silk: cubic-bezier(0.25,0.1,0.25,1);
      --ease-out:  cubic-bezier(0.22,1,0.36,1);
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; font-size: 16px; }
    body {
      background: var(--ink);
      color: var(--white);
      font-family: var(--font-body);
      line-height: 1.65;
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
    }

    ::selection { background: var(--gold); color: var(--ink); }
    ::-webkit-scrollbar { width: 3px; }
    ::-webkit-scrollbar-track { background: var(--ink); }
    ::-webkit-scrollbar-thumb { background: var(--ink-5); }

    button, input, select, textarea { font-family: var(--font-body); }
    button { cursor: pointer; border: none; background: none; }
    a { color: inherit; text-decoration: none; }

    /* ── Keyframes ── */
    @keyframes fadeUp    { from { opacity:0; transform:translateY(36px); } to { opacity:1; transform:translateY(0); } }
    @keyframes fadeIn    { from { opacity:0; } to { opacity:1; } }
    @keyframes scaleIn   { from { opacity:0; transform:scale(0.94); } to { opacity:1; transform:scale(1); } }
    @keyframes slideLeft { from { transform:translateX(0); } to { transform:translateX(-50%); } }
    @keyframes spin      { to { transform:rotate(360deg); } }
    @keyframes float     { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-10px);} }
    @keyframes toast     { from{opacity:0;transform:translateY(16px) scale(.97);} to{opacity:1;transform:translateY(0) scale(1);} }
    @keyframes shimmer   { 0%{background-position:-200% 0;} 100%{background-position:200% 0;} }
    @keyframes drawLine  { from{width:0;} to{width:100%;} }
    @keyframes pulse     { 0%,100%{opacity:.5;} 50%{opacity:1;} }
    @keyframes revealUp  { from{clip-path:inset(100% 0 0 0);} to{clip-path:inset(0% 0 0 0);} }

    .anim-fade-up  { animation: fadeUp  .85s var(--ease-out) both; }
    .anim-d1       { animation-delay: .12s; }
    .anim-d2       { animation-delay: .24s; }
    .anim-d3       { animation-delay: .36s; }
    .anim-d4       { animation-delay: .52s; }
    .anim-d5       { animation-delay: .68s; }
    .anim-scale-in { animation: scaleIn .6s var(--ease-out) both; }
    .anim-fade-in  { animation: fadeIn  .6s ease both; }

    /* ── Grain overlay ── */
    body::before {
      content:''; position:fixed; inset:0; pointer-events:none; z-index:9999;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
      opacity: 0.025;
    }

    /* ── Gold rule line ── */
    .gold-rule { width:40px; height:1px; background:var(--gold); }

    /* ── Section label ── */
    .sect-label {
      font-family: var(--font-body);
      font-size: 10px;
      letter-spacing: .32em;
      color: var(--gold);
      text-transform: uppercase;
      font-weight: 400;
    }

    /* ── Display heading ── */
    .disp-hd {
      font-family: var(--font-hd);
      font-weight: 300;
      line-height: 1.1;
      color: var(--white);
    }

    /* ── Responsive helpers ── */
    @media(max-width:768px) {
      .hide-mobile { display:none !important; }
      .show-mobile { display:flex !important; }
      .grid-1-mob  { grid-template-columns:1fr !important; }
      .gap-2-mob   { gap:2rem !important; }
    }
  `}</style>
);

/* ═══════════════════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════════════════ */
const Toast = ({ toasts, remove }) => (
  <div style={{ position:"fixed", bottom:"2rem", right:"2rem", zIndex:9000, display:"flex", flexDirection:"column", gap:"10px" }}>
    {toasts.map(t => (
      <div key={t.id} style={{
        display:"flex", alignItems:"center", gap:"14px",
        background: t.type==="success" ? "var(--ink-3)" : "#1a0909",
        border:`1px solid ${t.type==="success"?"var(--gold)":"#b04040"}`,
        padding:"1rem 1.25rem", minWidth:"300px", maxWidth:"380px",
        animation:"toast .4s ease both", boxShadow:"0 24px 60px rgba(0,0,0,.7)"
      }}>
        <span style={{ color: t.type==="success"?"var(--gold)":"#d66", fontSize:"16px" }}>
          {t.type==="success" ? "✦" : "✕"}
        </span>
        <div style={{ flex:1 }}>
          <p style={{ fontSize:"12px", fontWeight:500, letterSpacing:".08em", color: t.type==="success"?"var(--gold)":"#d66", marginBottom:"2px" }}>{t.title}</p>
          <p style={{ fontSize:"12px", color:"var(--silver-4)", fontWeight:300 }}>{t.msg}</p>
        </div>
        <button onClick={() => remove(t.id)} style={{ color:"var(--silver-6)", fontSize:"18px" }}>×</button>
      </div>
    ))}
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   NAVBAR
═══════════════════════════════════════════════════════════════ */
const Navbar = ({ page, setPage }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const nav = [
    {id:"home",    label:"Home"},
    {id:"atelier", label:"Atelier"},
    {id:"services",label:"Services"},
    {id:"gallery", label:"Gallery"},
    {id:"customize",label:"Customize"},
    {id:"book",    label:"Consult"},
    {id:"orders",  label:"Orders"},
  ];

  const go = (id) => { setPage(id); setMobileOpen(false); window.scrollTo({top:0,behavior:"smooth"}); };

  return (
    <>
      <nav style={{
        position:"fixed", top:0, left:0, right:0, zIndex:800,
        padding: scrolled ? ".9rem 3rem" : "1.6rem 3rem",
        background: scrolled ? "rgba(8,8,8,.93)" : "transparent",
        backdropFilter: scrolled ? "blur(24px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(200,173,126,.1)" : "none",
        transition:"all .5s var(--ease-silk)",
        display:"flex", alignItems:"center", justifyContent:"space-between"
      }}>
        {/* Logo */}
        <button onClick={() => go("home")} style={{
          fontFamily:"var(--font-hd)", fontSize:"1.5rem", fontWeight:500,
          letterSpacing:".22em", color:"var(--white)", cursor:"pointer",
          display:"flex", alignItems:"center", gap:"10px"
        }}>
          <span style={{ color:"var(--gold)", fontSize:"1rem", letterSpacing:0 }}>✦</span>
          SHIMPI
        </button>

        {/* Desktop nav */}
        <div className="hide-mobile" style={{ display:"flex", gap:"2.5rem", alignItems:"center" }}>
          {nav.map(n => (
            <button key={n.id} onClick={() => go(n.id)} style={{
              fontSize:"10px", letterSpacing:".22em", textTransform:"uppercase",
              color: page===n.id ? "var(--gold)" : "var(--silver-4)",
              borderBottom: page===n.id ? "1px solid var(--gold)" : "1px solid transparent",
              paddingBottom:"3px", transition:"color .3s", fontWeight:400
            }}>{n.label}</button>
          ))}
        </div>

        {/* CTA + hamburger */}
        <div style={{ display:"flex", alignItems:"center", gap:"1.5rem" }}>
          <button onClick={() => go("customize")} className="hide-mobile" style={{
            padding:".6rem 1.5rem", border:"1px solid var(--gold)",
            color:"var(--gold)", fontSize:"9px", letterSpacing:".22em", textTransform:"uppercase",
            background:"transparent", fontWeight:400, transition:"all .35s"
          }}
            onMouseEnter={e=>{e.currentTarget.style.background="var(--gold)";e.currentTarget.style.color="var(--ink)";}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="var(--gold)";}}>
            Customize
          </button>
          <button onClick={() => setMobileOpen(true)} className="show-mobile" style={{ display:"none", color:"var(--white)" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
              <line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="14" x2="21" y2="14"/>
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{
          position:"fixed", inset:0, zIndex:900,
          background:"rgba(8,8,8,.98)", display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", gap:"2.5rem"
        }}>
          <button onClick={() => setMobileOpen(false)} style={{ position:"absolute", top:"2rem", right:"2rem", color:"var(--white)", fontSize:"26px" }}>×</button>
          <div style={{ fontFamily:"var(--font-hd)", fontSize:".9rem", color:"var(--gold)", letterSpacing:".3em", marginBottom:"1rem" }}>✦ SHIMPI ✦</div>
          {nav.map(n => (
            <button key={n.id} onClick={() => go(n.id)} style={{
              fontFamily:"var(--font-hd)", fontSize:"2.2rem", fontWeight:300, letterSpacing:".04em",
              color: page===n.id ? "var(--gold)" : "var(--white)"
            }}>{n.label}</button>
          ))}
          <button onClick={() => go("book")} style={{
            marginTop:"1rem", padding:".9rem 3rem", border:"1px solid var(--gold)",
            color:"var(--gold)", fontSize:"10px", letterSpacing:".22em", textTransform:"uppercase"
          }}>Book Consultation</button>
        </div>
      )}
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   HERO
═══════════════════════════════════════════════════════════════ */
const Hero = ({ setPage }) => (
  <section style={{ position:"relative", height:"100vh", minHeight:"680px", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>

    {/* Layered backgrounds */}
    <div style={{ position:"absolute", inset:0, background:"linear-gradient(160deg,#0d0d0d 0%,#191512 45%,#0a0a0a 100%)" }} />
    <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(ellipse at 25% 35%, rgba(200,173,126,.09) 0%,transparent 55%), radial-gradient(ellipse at 75% 65%, rgba(200,173,126,.05) 0%,transparent 45%)" }} />

    {/* SVG suit silhouette */}
    <div style={{ position:"absolute", right:"6%", top:"50%", transform:"translateY(-50%)", opacity:.07, pointerEvents:"none" }}>
      <svg width="380" height="580" viewBox="0 0 380 580" fill="none">
        {/* Jacket body */}
        <path d="M190 80 L80 140 L60 360 L160 380 L190 320 L220 380 L320 360 L300 140 Z" fill="var(--gold)" />
        {/* Lapels */}
        <path d="M190 80 L140 200 L190 240 L240 200 Z" fill="var(--ink-4)" />
        {/* Tie */}
        <path d="M183 170 L185 280 L190 300 L195 280 L197 170 Z" fill="var(--gold)" opacity=".6" />
        {/* Shoulders */}
        <path d="M80 140 L60 120 L30 160 L60 200 L80 180Z" fill="var(--gold)" opacity=".7"/>
        <path d="M300 140 L320 120 L350 160 L320 200 L300 180Z" fill="var(--gold)" opacity=".7"/>
        {/* Collar */}
        <path d="M155 90 L190 130 L225 90 L210 80 L190 110 L170 80Z" fill="var(--white)" opacity=".15"/>
        {/* Buttons */}
        <circle cx="190" cy="260" r="4" fill="var(--gold)" opacity=".5"/>
        <circle cx="190" cy="280" r="4" fill="var(--gold)" opacity=".5"/>
        <circle cx="190" cy="300" r="4" fill="var(--gold)" opacity=".5"/>
      </svg>
    </div>

    {/* Decorative lines */}
    <div style={{ position:"absolute", top:"12%", left:"5%", width:"1px", height:"38%", background:"linear-gradient(to bottom,transparent,var(--gold),transparent)", opacity:.35 }} />
    <div style={{ position:"absolute", bottom:"12%", right:"7%", width:"1px", height:"28%", background:"linear-gradient(to bottom,transparent,var(--silver-6),transparent)", opacity:.4 }} />
    <div style={{ position:"absolute", top:"14%", left:"6%", right:"6%", height:"1px", background:"linear-gradient(to right,transparent,rgba(200,173,126,.18),transparent)" }} />
    <div style={{ position:"absolute", bottom:"14%", left:"6%", right:"6%", height:"1px", background:"linear-gradient(to right,transparent,rgba(200,173,126,.12),transparent)" }} />

    {/* Floating ornaments */}
    <div style={{ position:"absolute", top:"18%", left:"8%", animation:"float 7s ease-in-out infinite" }}>
      <svg width="52" height="52" viewBox="0 0 52 52" fill="none"><rect x="1" y="1" width="50" height="50" stroke="var(--gold)" strokeWidth=".5" opacity=".3"/><rect x="10" y="10" width="32" height="32" stroke="var(--gold)" strokeWidth=".5" opacity=".2" transform="rotate(45 26 26)"/></svg>
    </div>
    <div style={{ position:"absolute", bottom:"22%", right:"10%", animation:"float 9s 2s ease-in-out infinite" }}>
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><circle cx="18" cy="18" r="17" stroke="var(--gold)" strokeWidth=".5" opacity=".3"/><circle cx="18" cy="18" r="10" stroke="var(--gold)" strokeWidth=".5" opacity=".2"/></svg>
    </div>

    {/* Content */}
    <div style={{ position:"relative", zIndex:10, textAlign:"center", padding:"0 2rem", maxWidth:"860px" }}>
      <p className="anim-fade-up sect-label" style={{ marginBottom:"2rem", display:"block" }}>
        Est. 2008 &nbsp;·&nbsp; Nagpur, Maharashtra &nbsp;·&nbsp; Bespoke Formal Tailoring
      </p>

      <h1 className="anim-fade-up anim-d1 disp-hd" style={{ fontSize:"clamp(3.8rem,9vw,7.5rem)", marginBottom:"1.5rem" }}>
        Tailored
        <br />
        <em style={{ color:"var(--gold)", fontStyle:"italic", fontWeight:300 }}>Perfection</em>
        <br />
        for the Modern Gentleman
      </h1>

      <p className="anim-fade-up anim-d2" style={{
        fontFamily:"var(--font-sub)", fontSize:"1.15rem", fontStyle:"italic",
        color:"var(--silver-4)", maxWidth:"480px", margin:"0 auto 3rem", lineHeight:1.85, fontWeight:400
      }}>
        Every stitch, a statement. Every suit, a signature.<br/>Luxury formal wear crafted to your exact measure.
      </p>

      <div className="anim-fade-up anim-d3" style={{ display:"flex", gap:"1.25rem", justifyContent:"center", flexWrap:"wrap" }}>
        <Btn primary onClick={() => setPage("customize")}>Customize Your Suit</Btn>
        <Btn onClick={() => setPage("book")}>Book Consultation</Btn>
      </div>

      {/* Stats */}
      <div className="anim-fade-up anim-d4" style={{ display:"flex", gap:"3.5rem", justifyContent:"center", marginTop:"4.5rem", flexWrap:"wrap" }}>
        {[["2000+","Suits Crafted"],["99%","Client Satisfaction"],["17+","Years Excellence"],["24pt","Measurement System"]].map(([n,l]) => (
          <div key={n} style={{ textAlign:"center" }}>
            <div style={{ fontFamily:"var(--font-hd)", fontSize:"1.9rem", fontWeight:400, color:"var(--gold)", lineHeight:1 }}>{n}</div>
            <div style={{ fontSize:"9px", letterSpacing:".22em", color:"var(--silver-6)", textTransform:"uppercase", marginTop:"6px" }}>{l}</div>
          </div>
        ))}
      </div>
    </div>

    {/* Scroll cue */}
    <div style={{ position:"absolute", bottom:"2.5rem", left:"50%", transform:"translateX(-50%)", display:"flex", flexDirection:"column", alignItems:"center", gap:"8px", animation:"float 3s ease-in-out infinite" }}>
      <span style={{ fontSize:"9px", letterSpacing:".22em", color:"var(--silver-6)" }}>SCROLL</span>
      <div style={{ width:"1px", height:"50px", background:"linear-gradient(to bottom,var(--gold),transparent)" }} />
    </div>
  </section>
);

/* ── Button Component ─────────────────────────────────────────── */
const Btn = ({ children, onClick, primary, style: sx }) => {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding:".9rem 2.5rem",
        border:"1px solid var(--gold)",
        background: primary ? (hov?"transparent":"var(--gold)") : (hov?"var(--gold)":"transparent"),
        color: primary ? (hov?"var(--gold)":"var(--ink)") : (hov?"var(--ink)":"var(--gold)"),
        fontSize:"10px", letterSpacing:".22em", textTransform:"uppercase",
        fontWeight:500, transition:"all .4s var(--ease-silk)", ...sx
      }}>
      {children}
    </button>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MARQUEE
═══════════════════════════════════════════════════════════════ */
const Marquee = () => {
  const items = ["Custom Suits","Tuxedos","Blazers","Business Suits","Wedding Suits","Formal Shirts","Waistcoats","Dress Trousers","Corporate Wear","Morning Coats","Double-Breasted Jackets","Alterations & Tailoring"];
  return (
    <div style={{ borderTop:"1px solid var(--ink-4)", borderBottom:"1px solid var(--ink-4)", background:"var(--ink-2)", padding:".9rem 0", overflow:"hidden" }}>
      <div style={{ display:"flex", animation:"slideLeft 28s linear infinite", width:"max-content" }}>
        {[...items,...items,...items].map((item,i) => (
          <span key={i} style={{ whiteSpace:"nowrap", padding:"0 2.5rem", fontSize:"10px", letterSpacing:".25em", textTransform:"uppercase", color:"var(--silver-6)" }}>
            {item}&nbsp;&nbsp;<span style={{ color:"var(--gold)" }}>✦</span>
          </span>
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   ATELIER SECTION
═══════════════════════════════════════════════════════════════ */
const Atelier = () => (
  <section style={{ padding:"9rem 3rem", maxWidth:"1280px", margin:"0 auto" }}>
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"7rem", alignItems:"center" }} className="grid-1-mob gap-2-mob">

      <div>
        <p className="sect-label" style={{ marginBottom:"1.5rem", display:"block" }}>The Atelier</p>
        <h2 className="disp-hd" style={{ fontSize:"clamp(2.5rem,5vw,4rem)", marginBottom:"2.5rem" }}>
          Where Cloth Becomes<br /><em style={{ color:"var(--gold)" }}>Character</em>
        </h2>
        <div style={{ width:"40px", height:"1px", background:"var(--gold)", marginBottom:"2.5rem" }} />
        <p style={{ color:"var(--silver-4)", lineHeight:1.95, marginBottom:"1.5rem", fontWeight:300, fontSize:".95rem" }}>
          Founded in 2008 by master tailor Ramesh Shimpi, our atelier has served as the sanctuary for gentlemen who understand that true elegance begins with fit. We don't make clothes — we craft confidence.
        </p>
        <p style={{ color:"var(--silver-6)", lineHeight:1.9, fontWeight:300, fontSize:".9rem", marginBottom:"3rem" }}>
          From the charcoal wool of a boardroom suit to the ivory silk of a wedding tuxedo, every garment that leaves our studio is stitched with four generations of tailoring heritage and the precision of modern pattern engineering.
        </p>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"2.5rem" }}>
          {[
            ["Master Craftsmen","12 senior tailors — average 18 years of formal wear experience"],
            ["Finest Fabrics","Italian wool, Egyptian cotton & Japanese linen sourced directly"],
            ["24-Point Fit","Our proprietary measurement system ensures absolute precision"],
            ["Heritage Finishing","Hand-stitched buttonholes, canvas fronts & hand-pressed seams"]
          ].map(([t,d]) => (
            <div key={t}>
              <div style={{ width:"20px", height:"1px", background:"var(--gold)", marginBottom:"12px" }} />
              <p style={{ fontSize:"11px", fontWeight:500, letterSpacing:".12em", color:"var(--white)", marginBottom:"6px", textTransform:"uppercase" }}>{t}</p>
              <p style={{ fontSize:"12px", color:"var(--silver-6)", lineHeight:1.75, fontWeight:300 }}>{d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Visual panel */}
      <div style={{ position:"relative" }}>
        {/* Main panel */}
        <div style={{ position:"relative", paddingTop:"125%", background:"linear-gradient(160deg,var(--ink-4),var(--ink-3))", overflow:"hidden" }}>
          <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(ellipse at 60% 30%, rgba(200,173,126,.07) 0%,transparent 60%)" }} />
          {/* Fabric texture grid */}
          <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(200,173,126,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(200,173,126,.03) 1px,transparent 1px)", backgroundSize:"24px 24px" }} />
          {/* Centre display */}
          <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"2rem" }}>
            <svg width="120" height="180" viewBox="0 0 120 180" fill="none" opacity=".35">
              <path d="M60 20 L20 40 L15 130 L50 140 L60 110 L70 140 L105 130 L100 40 Z" stroke="var(--gold)" strokeWidth=".8"/>
              <path d="M60 20 L42 70 L60 85 L78 70 Z" stroke="var(--gold)" strokeWidth=".6"/>
              <line x1="60" y1="70" x2="60" y2="110" stroke="var(--gold)" strokeWidth=".4"/>
              <circle cx="60" cy="82" r="2" fill="var(--gold)"/>
              <circle cx="60" cy="91" r="2" fill="var(--gold)"/>
              <circle cx="60" cy="100" r="2" fill="var(--gold)"/>
            </svg>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:"9px", letterSpacing:".3em", color:"rgba(200,173,126,.35)", textTransform:"uppercase" }}>Atelier Shimpi</div>
              <div style={{ fontFamily:"var(--font-hd)", fontSize:"3.5rem", color:"rgba(200,173,126,.06)", lineHeight:1 }}>✦</div>
            </div>
            {/* Measurement guide lines */}
            {[0,20,40,60,80].map(p => (
              <div key={p} style={{ position:"absolute", left:"14px", top:`${15+p*.75}%`, display:"flex", alignItems:"center", gap:"6px" }}>
                <div style={{ width:"8px", height:"1px", background:"rgba(200,173,126,.25)" }} />
                <span style={{ fontSize:"8px", fontFamily:"monospace", color:"rgba(200,173,126,.15)" }}>{p*2}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Floating badge */}
        <div style={{ position:"absolute", bottom:"-2rem", right:"-2rem", background:"var(--ink-3)", border:"1px solid var(--ink-5)", padding:"1.5rem 2rem" }}>
          <div style={{ fontFamily:"var(--font-hd)", fontSize:"2.5rem", fontWeight:400, color:"var(--gold)", lineHeight:1 }}>17+</div>
          <div style={{ fontSize:"9px", letterSpacing:".22em", color:"var(--silver-6)", textTransform:"uppercase", marginTop:"4px" }}>Years Excellence</div>
        </div>
        <div style={{ position:"absolute", top:"-1.5rem", left:"-1.5rem", width:"70px", height:"70px", border:"1px solid rgba(200,173,126,.18)" }} />
      </div>
    </div>
  </section>
);

/* ═══════════════════════════════════════════════════════════════
   SERVICES
═══════════════════════════════════════════════════════════════ */
const Services = ({ setPage }) => {
  const services = [
    {
      num:"01", title:"Custom Suits",
      desc:"The pinnacle of formal dressing. Hand-cut, canvassed and fitted across three sessions for absolute precision.",
      detail:"Italian wool · English tweed · Bespoke canvas · 3 fittings",
      price:"From ₹9,500"
    },
    {
      num:"02", title:"Tuxedos & Evening Wear",
      desc:"Black-tie authority crafted in silk-faced lapels, barathea wool and peak or shawl collar silhouettes.",
      detail:"Silk lapels · Self-fabric buttons · Grosgrain trim",
      price:"From ₹14,500"
    },
    {
      num:"03", title:"Blazers & Sport Coats",
      desc:"Versatile tailoring for the gentleman who moves between boardroom and social engagements with ease.",
      detail:"Flannel · Hopsack · Linen · Tweed options",
      price:"From ₹6,800"
    },
    {
      num:"04", title:"Formal Shirts",
      desc:"Sea Island cotton and Egyptian percale shaped to your collar, cuff and placket preferences. Impeccably finished.",
      detail:"Hand-sewn buttonholes · Bespoke collar · Monogram option",
      price:"From ₹2,800"
    },
    {
      num:"05", title:"Waistcoats",
      desc:"The mark of a true gentleman. Single or double-breasted, in fine wool, silk or linen to complete any formal ensemble.",
      detail:"Adjustable back strap · 5 or 6 button · Bespoke lining",
      price:"From ₹3,200"
    },
    {
      num:"06", title:"Wedding Suits",
      desc:"Your most important suit. Crafted over six to eight weeks with unlimited consultations and fittings.",
      detail:"Ivory · Cream · Classic grey · Herringbone options",
      price:"From ₹18,000"
    },
    {
      num:"07", title:"Corporate Wear",
      desc:"Dress codes that communicate authority. Capsule wardrobe planning with seasonal rotating options.",
      detail:"Pinstripe · Chalk stripe · Solid · Check patterns",
      price:"From ₹8,000"
    },
    {
      num:"08", title:"Alterations",
      desc:"Precision tailoring breathes new life into your existing wardrobe. From heritage pieces to recent purchases.",
      detail:"Inseam · Waist · Shoulders · Sleeves · Chest",
      price:"From ₹450"
    },
  ];

  return (
    <section style={{ padding:"9rem 3rem", background:"var(--ink-2)" }}>
      <div style={{ maxWidth:"1280px", margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:"5rem" }}>
          <p className="sect-label" style={{ marginBottom:"1rem", display:"block" }}>What We Offer</p>
          <h2 className="disp-hd" style={{ fontSize:"clamp(2.5rem,5vw,3.8rem)", marginBottom:"1.5rem" }}>
            Formal <em style={{ color:"var(--gold)" }}>Services</em>
          </h2>
          <div style={{ width:"40px", height:"1px", background:"var(--gold)", margin:"0 auto" }} />
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:"1px", background:"var(--ink-4)" }}>
          {services.map(s => <ServiceCard key={s.num} s={s} setPage={setPage} />)}
        </div>
      </div>
    </section>
  );
};

const ServiceCard = ({ s, setPage }) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => setPage("customize")}
      style={{
        background: hov ? "var(--ink-3)" : "var(--ink-2)",
        padding:"2.5rem 2.25rem",
        transition:"background .35s",
        cursor:"pointer",
        borderBottom: hov ? "2px solid var(--gold)" : "2px solid transparent"
      }}
    >
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"1.5rem" }}>
        <span style={{ fontFamily:"var(--font-hd)", fontSize:"3rem", fontWeight:300, color:"rgba(200,173,126,.15)", lineHeight:1 }}>{s.num}</span>
        <span style={{ color: hov ? "var(--gold)" : "var(--silver-7)", fontSize:"18px", transition:"color .3s" }}>→</span>
      </div>
      <h3 style={{ fontFamily:"var(--font-hd)", fontSize:"1.3rem", fontWeight:400, color: hov?"var(--white)":"var(--silver-2)", marginBottom:"1rem", letterSpacing:".02em" }}>{s.title}</h3>
      <p style={{ fontSize:"13px", color:"var(--silver-6)", lineHeight:1.85, marginBottom:"1.5rem", fontWeight:300 }}>{s.desc}</p>
      <p style={{ fontSize:"10px", color: hov?"rgba(200,173,126,.6)":"var(--silver-7)", letterSpacing:".12em", textTransform:"uppercase", marginBottom:"1.25rem", borderTop:"1px solid var(--ink-5)", paddingTop:"1rem" }}>{s.detail}</p>
      <span style={{ fontSize:"12px", color:"var(--gold)", letterSpacing:".08em" }}>{s.price}</span>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   GALLERY
═══════════════════════════════════════════════════════════════ */
const Gallery = () => {
  const [filter, setFilter] = useState("All");
  const cats = ["All","Suits","Tuxedos","Blazers","Corporate","Wedding"];

  const items = [
    { cat:"Suits",     h:340, label:"Charcoal Three-Piece", sub:"Italian Wool",   shade:"#1a1a1a" },
    { cat:"Tuxedos",   h:430, label:"Midnight Black Tuxedo",sub:"Barathea Wool",  shade:"#141414" },
    { cat:"Wedding",   h:280, label:"Ivory Morning Coat",   sub:"Fine Merino",    shade:"#1e1c18" },
    { cat:"Corporate", h:390, label:"Navy Pinstripe Suit",  sub:"Hopsack Wool",   shade:"#161820" },
    { cat:"Blazers",   h:310, label:"Camel Linen Blazer",   sub:"Irish Linen",    shade:"#1c1a16" },
    { cat:"Suits",     h:360, label:"Dark Grey Windowpane", sub:"English Tweed",  shade:"#181818" },
    { cat:"Tuxedos",   h:260, label:"Shawl Collar Dinner",  sub:"Silk Lapels",    shade:"#121212" },
    { cat:"Corporate", h:420, label:"Chalk Stripe Two-Piece",sub:"Super 120s",    shade:"#161616" },
    { cat:"Wedding",   h:300, label:"Cream Three-Piece",    sub:"Fine Wool Blend",shade:"#1e1c1a" },
    { cat:"Blazers",   h:370, label:"Double-Breasted Navy", sub:"Flannel",        shade:"#141820" },
    { cat:"Suits",     h:290, label:"Classic Herringbone",  sub:"Harris Tweed",   shade:"#1a1816" },
    { cat:"Tuxedos",   h:350, label:"White Dinner Jacket",  sub:"Tropical Wool",  shade:"#1e1e1e" },
  ];

  const filtered = filter==="All" ? items : items.filter(i=>i.cat===filter);

  return (
    <section style={{ padding:"9rem 3rem", background:"var(--ink)" }}>
      <div style={{ maxWidth:"1400px", margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:"4rem" }}>
          <p className="sect-label" style={{ marginBottom:"1rem", display:"block" }}>Portfolio</p>
          <h2 className="disp-hd" style={{ fontSize:"clamp(2.5rem,5vw,3.8rem)", marginBottom:"2.5rem" }}>
            The <em style={{ color:"var(--gold)" }}>Collection</em>
          </h2>
          <div style={{ display:"flex", justifyContent:"center", gap:"2.5rem", flexWrap:"wrap" }}>
            {cats.map(c => (
              <button key={c} onClick={() => setFilter(c)} style={{
                fontSize:"10px", letterSpacing:".22em", textTransform:"uppercase",
                color: filter===c ? "var(--gold)" : "var(--silver-6)",
                borderBottom: filter===c ? "1px solid var(--gold)" : "1px solid transparent",
                paddingBottom:"4px", transition:"all .3s", background:"none", border:"none",
                borderBottomStyle:"solid", cursor:"pointer"
              }}>{c}</button>
            ))}
          </div>
        </div>

        <div style={{ columns:"3 260px", gap:"6px" }}>
          {filtered.map((item, i) => <GalleryCard key={`${filter}-${i}`} item={item} />)}
        </div>
      </div>
    </section>
  );
};

const GalleryCard = ({ item }) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position:"relative", height:`${item.h}px`,
        background: item.shade, marginBottom:"6px",
        overflow:"hidden", cursor:"pointer", breakInside:"avoid",
        transition:"transform .5s var(--ease-out)",
        transform: hov ? "scale(1.01)" : "scale(1)"
      }}
    >
      {/* Pattern */}
      <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(200,173,126,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(200,173,126,.04) 1px,transparent 1px)", backgroundSize:"18px 18px" }} />
      {/* Light */}
      <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(ellipse at 50% 20%,rgba(200,173,126,.09) 0%,transparent 65%)" }} />
      {/* Centre suit icon */}
      <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", opacity: hov ? .15 : .08, transition:"opacity .5s" }}>
        <svg width="90" height="130" viewBox="0 0 90 130" fill="none">
          <path d="M45 8 L12 25 L8 100 L32 108 L45 82 L58 108 L82 100 L77 25 Z" stroke="var(--gold)" strokeWidth=".8"/>
          <path d="M45 8 L30 50 L45 62 L60 50 Z" stroke="var(--gold)" strokeWidth=".6"/>
          <circle cx="45" cy="72" r="2.5" fill="var(--gold)"/>
          <circle cx="45" cy="82" r="2.5" fill="var(--gold)"/>
          <circle cx="45" cy="92" r="2.5" fill="var(--gold)"/>
        </svg>
      </div>

      {/* Hover overlay */}
      <div style={{ position:"absolute", inset:0, background:`rgba(0,0,0,${hov?.35:.55})`, transition:"background .5s" }} />

      {/* Info */}
      <div style={{
        position:"absolute", bottom:0, left:0, right:0,
        padding:"1.5rem", background:"linear-gradient(to top,rgba(0,0,0,.8),transparent)",
        transform: hov ? "translateY(0)" : "translateY(8px)",
        opacity: hov ? 1 : 0, transition:"all .4s var(--ease-out)"
      }}>
        <p className="sect-label" style={{ fontSize:"9px", marginBottom:"4px" }}>{item.cat}</p>
        <p style={{ fontFamily:"var(--font-hd)", fontSize:"1rem", color:"var(--white)", fontWeight:400 }}>{item.label}</p>
        <p style={{ fontSize:"11px", color:"var(--silver-5)", marginTop:"2px", fontWeight:300 }}>{item.sub}</p>
      </div>

      {/* Plus */}
      {hov && (
        <div style={{ position:"absolute", top:"1rem", right:"1rem", width:"30px", height:"30px", border:"1px solid rgba(200,173,126,.5)", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--gold)", fontSize:"16px" }}>+</div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   CUSTOMIZE FORM — multi-step measurement system
═══════════════════════════════════════════════════════════════ */
const Customize = ({ addToast }) => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    garment:"", style:"", lapel:"", buttons:"", lining:"", fabric:"",
    fit:"slim",
    chest:"", waist:"", shoulder:"", sleeve:"", neck:"", inseam:"", hip:"", height:"",
    name:"", phone:"", email:"", delivery:"", notes:""
  });

  const up = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const steps = ["Garment","Measurements","Style","Details","Review"];
  const totalSteps = steps.length;

  const garments = [
    {id:"suit",       label:"Custom Suit",        icon:"🧥"},
    {id:"tuxedo",     label:"Tuxedo",             icon:"🎩"},
    {id:"blazer",     label:"Blazer",             icon:"👔"},
    {id:"shirt",      label:"Formal Shirt",       icon:"👕"},
    {id:"waistcoat",  label:"Waistcoat",          icon:"🦺"},
    {id:"wedding",    label:"Wedding Suit",       icon:"💍"},
    {id:"corporate",  label:"Corporate Wear",     icon:"💼"},
    {id:"trousers",   label:"Dress Trousers",     icon:"👖"},
  ];
  const fabrics = ["Super 120s Wool","Italian Cashmere Blend","Barathea Wool","English Tweed","Harris Tweed","Egyptian Cotton","Sea Island Cotton","Irish Linen","French Flannel","Japanese Mohair"];
  const lapels = ["Notch Lapel","Peak Lapel","Shawl Lapel","Double Breasted"];
  const linings = ["Plain Silk","Printed Silk","Satin","Acetate (Standard)","Unlined","Half-Lined"];

  const measurements = [
    {k:"chest",    l:"Chest",          tip:"Around fullest part — arms relaxed at sides"},
    {k:"waist",    l:"Waist",          tip:"At natural waistline — breathe normally"},
    {k:"hip",      l:"Hip / Seat",     tip:"Around fullest part of the seat"},
    {k:"shoulder", l:"Shoulder",       tip:"Seam to seam across shoulder blades"},
    {k:"sleeve",   l:"Sleeve Length",  tip:"Shoulder seam to wrist bone"},
    {k:"neck",     l:"Neck",           tip:"Around base of neck — add 1cm ease"},
    {k:"inseam",   l:"Inseam",         tip:"Crotch seam to bottom of ankle"},
    {k:"height",   l:"Height",         tip:"Bare feet — stand straight against wall"},
  ];

  const handleSubmit = () => {
    if (!form.name || !form.phone) {
      addToast({type:"error", title:"Missing Details", msg:"Please complete your contact information."});
      return;
    }
    addToast({type:"success", title:"Order Received!", msg:`Your bespoke ${form.garment||"garment"} order has been placed. We'll contact you within 24 hours.`});
    setStep(0);
    setForm({ garment:"", style:"", lapel:"", buttons:"", lining:"", fabric:"", fit:"slim", chest:"", waist:"", shoulder:"", sleeve:"", neck:"", inseam:"", hip:"", height:"", name:"", phone:"", email:"", delivery:"", notes:"" });
  };

  return (
    <section style={{ minHeight:"100vh", padding:"8rem 3rem 5rem", background:"var(--ink)" }}>
      <div style={{ maxWidth:"960px", margin:"0 auto" }}>

        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:"5rem" }}>
          <p className="sect-label" style={{ marginBottom:"1rem", display:"block" }}>Bespoke Order</p>
          <h2 className="disp-hd" style={{ fontSize:"clamp(2.2rem,5vw,3.5rem)", marginBottom:"1.5rem" }}>
            Customize Your <em style={{ color:"var(--gold)" }}>Garment</em>
          </h2>
          <p style={{ color:"var(--silver-6)", fontSize:"14px", fontWeight:300, maxWidth:"480px", margin:"0 auto" }}>
            Walk through our bespoke ordering process — every detail crafted to your specification.
          </p>
        </div>

        {/* Progress stepper */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"4rem", gap:0 }}>
          {steps.map((s, i) => (
            <div key={s} style={{ display:"flex", alignItems:"center" }}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"8px" }}>
                <button
                  onClick={() => i < step && setStep(i)}
                  style={{
                    width:"44px", height:"44px", borderRadius:"50%",
                    border:`1px solid ${i<=step?"var(--gold)":"var(--ink-5)"}`,
                    background: i<step ? "var(--gold)" : i===step ? "rgba(200,173,126,.12)" : "var(--ink-3)",
                    color: i<step ? "var(--ink)" : i===step ? "var(--gold)" : "var(--silver-7)",
                    fontSize:"13px", fontWeight:500, transition:"all .4s",
                    cursor: i<step ? "pointer" : "default"
                  }}
                >
                  {i < step ? "✓" : i+1}
                </button>
                <span style={{ fontSize:"9px", letterSpacing:".18em", textTransform:"uppercase", color: i===step?"var(--white)":"var(--silver-7)", whiteSpace:"nowrap" }}>{s}</span>
              </div>
              {i < totalSteps-1 && (
                <div style={{ width:"60px", height:"1px", background: i<step?"var(--gold)":"var(--ink-5)", margin:"0 8px", marginBottom:"22px", transition:"background .4s" }} />
              )}
            </div>
          ))}
        </div>

        {/* Form panels */}
        <div style={{ background:"var(--ink-2)", border:"1px solid var(--ink-4)", padding:"3.5rem" }}>
          <div key={step} className="anim-scale-in">

            {/* STEP 0 — Garment Selection */}
            {step===0 && (
              <div>
                <h3 className="disp-hd" style={{ fontSize:"2rem", marginBottom:".5rem" }}>Choose Your Garment</h3>
                <p style={{ color:"var(--silver-6)", fontSize:"13px", fontWeight:300, marginBottom:"2.5rem" }}>Select the formal wear piece you'd like us to craft for you.</p>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:"1rem", marginBottom:"2.5rem" }}>
                  {garments.map(g => (
                    <button key={g.id} onClick={() => up("garment", g.label)}
                      style={{
                        padding:"1.25rem 1rem", textAlign:"center",
                        border: form.garment===g.label ? "1px solid var(--gold)" : "1px solid var(--ink-5)",
                        background: form.garment===g.label ? "rgba(200,173,126,.08)" : "var(--ink-3)",
                        color: form.garment===g.label ? "var(--gold)" : "var(--silver-4)",
                        transition:"all .3s", display:"flex", flexDirection:"column", alignItems:"center", gap:"8px",
                        cursor:"pointer"
                      }}>
                      <span style={{ fontSize:"1.75rem" }}>{g.icon}</span>
                      <span style={{ fontSize:"12px", letterSpacing:".06em" }}>{g.label}</span>
                    </button>
                  ))}
                </div>
                <div>
                  <label style={{ fontSize:"10px", letterSpacing:".18em", color:"var(--silver-5)", textTransform:"uppercase", display:"block", marginBottom:"10px" }}>Special Notes / Design References</label>
                  <textarea value={form.notes} onChange={e => up("notes", e.target.value)}
                    placeholder="Describe your vision, reference photos, occasion, any specific requirements..."
                    rows={4}
                    style={{ width:"100%", background:"var(--ink-3)", border:"1px solid var(--ink-5)", color:"var(--white)", padding:"1rem", fontSize:"14px", resize:"vertical", outline:"none", fontFamily:"var(--font-body)", fontWeight:300, lineHeight:1.75 }} />
                </div>
              </div>
            )}

            {/* STEP 1 — Measurements */}
            {step===1 && (
              <div>
                <h3 className="disp-hd" style={{ fontSize:"2rem", marginBottom:".5rem" }}>Your Measurements</h3>
                <p style={{ color:"var(--silver-6)", fontSize:"13px", fontWeight:300, marginBottom:"2.5rem" }}>All measurements in centimetres. Use our guide below for accuracy.</p>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.5rem", marginBottom:"2.5rem" }} className="grid-1-mob">
                  {measurements.map(({k,l,tip}) => (
                    <div key={k}>
                      <label style={{ fontSize:"10px", letterSpacing:".18em", color:"var(--silver-5)", textTransform:"uppercase", display:"block", marginBottom:"6px" }}>{l}</label>
                      <div style={{ display:"flex", border:"1px solid var(--ink-5)", background:"var(--ink-3)" }}>
                        <input type="number" value={form[k]} onChange={e => up(k, e.target.value)} placeholder="—"
                          style={{ flex:1, padding:".8rem 1rem", background:"transparent", border:"none", color:"var(--white)", fontSize:"15px", outline:"none", fontFamily:"var(--font-body)", fontWeight:300 }} />
                        <span style={{ padding:".8rem 1rem", color:"var(--silver-7)", fontSize:"12px", borderLeft:"1px solid var(--ink-5)", display:"flex", alignItems:"center" }}>cm</span>
                      </div>
                      <p style={{ fontSize:"10px", color:"var(--silver-7)", marginTop:"4px", lineHeight:1.5 }}>{tip}</p>
                    </div>
                  ))}
                </div>

                {/* Measurement guide */}
                <div style={{ padding:"1.75rem", background:"var(--ink-3)", border:"1px solid rgba(200,173,126,.12)" }}>
                  <p className="sect-label" style={{ marginBottom:"1.25rem", display:"block" }}>✦ &nbsp;Measurement Guide</p>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:"1.25rem" }}>
                    {[
                      ["Chest","Arms relaxed. Tape under armpits at fullest point."],
                      ["Waist","Natural waist — not where trousers sit. Exhale gently."],
                      ["Shoulder","Across back, seam point to seam point."],
                      ["Sleeve","Shoulder seam to wrist — arm slightly bent."],
                    ].map(([t,d]) => (
                      <div key={t} style={{ borderLeft:"1px solid rgba(200,173,126,.25)", paddingLeft:"1rem" }}>
                        <p style={{ fontSize:"11px", fontWeight:500, color:"var(--silver-2)", marginBottom:"4px" }}>{t}</p>
                        <p style={{ fontSize:"11px", color:"var(--silver-7)", lineHeight:1.65 }}>{d}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2 — Style Preferences */}
            {step===2 && (
              <div>
                <h3 className="disp-hd" style={{ fontSize:"2rem", marginBottom:".5rem" }}>Style Preferences</h3>
                <p style={{ color:"var(--silver-6)", fontSize:"13px", fontWeight:300, marginBottom:"2.5rem" }}>Define the construction and aesthetic details of your garment.</p>

                {/* Fit */}
                <div style={{ marginBottom:"2.5rem" }}>
                  <label style={{ fontSize:"10px", letterSpacing:".18em", color:"var(--silver-5)", textTransform:"uppercase", display:"block", marginBottom:"1.25rem" }}>Fit Preference</label>
                  <div style={{ display:"flex", gap:"1rem", flexWrap:"wrap" }}>
                    {[
                      {id:"slim",    label:"Slim Fit",     desc:"Close-cut, tapered silhouette"},
                      {id:"tailored",label:"Tailored Fit", desc:"Slightly suppressed — clean & modern"},
                      {id:"regular", label:"Regular Fit",  desc:"Classic cut with ease of movement"},
                    ].map(f => (
                      <div key={f.id} onClick={() => up("fit", f.id)}
                        style={{
                          flex:"1 1 160px", padding:"1.25rem", cursor:"pointer",
                          border: form.fit===f.id ? "1px solid var(--gold)" : "1px solid var(--ink-5)",
                          background: form.fit===f.id ? "rgba(200,173,126,.07)" : "var(--ink-3)",
                          transition:"all .3s"
                        }}>
                        <p style={{ fontSize:"12px", fontWeight:500, color: form.fit===f.id?"var(--gold)":"var(--silver-2)", marginBottom:"4px", letterSpacing:".06em" }}>{f.label}</p>
                        <p style={{ fontSize:"11px", color:"var(--silver-7)", fontWeight:300 }}>{f.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lapel */}
                <div style={{ marginBottom:"2.5rem" }}>
                  <label style={{ fontSize:"10px", letterSpacing:".18em", color:"var(--silver-5)", textTransform:"uppercase", display:"block", marginBottom:"1.25rem" }}>Lapel Style</label>
                  <div style={{ display:"flex", gap:"1rem", flexWrap:"wrap" }}>
                    {lapels.map(l => (
                      <button key={l} onClick={() => up("lapel", l)}
                        style={{
                          padding:".75rem 1.25rem", cursor:"pointer", fontSize:"12px", letterSpacing:".06em",
                          border: form.lapel===l ? "1px solid var(--gold)" : "1px solid var(--ink-5)",
                          background: form.lapel===l ? "rgba(200,173,126,.07)" : "var(--ink-3)",
                          color: form.lapel===l ? "var(--gold)" : "var(--silver-4)",
                          transition:"all .3s", fontFamily:"var(--font-body)"
                        }}>{l}</button>
                    ))}
                  </div>
                </div>

                {/* Fabric */}
                <div style={{ marginBottom:"2.5rem" }}>
                  <label style={{ fontSize:"10px", letterSpacing:".18em", color:"var(--silver-5)", textTransform:"uppercase", display:"block", marginBottom:"1.25rem" }}>Fabric Selection</label>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(175px,1fr))", gap:"1rem" }}>
                    {fabrics.map(f => (
                      <div key={f} onClick={() => up("fabric", f)}
                        style={{
                          cursor:"pointer", padding:"1rem 1.25rem",
                          border: form.fabric===f ? "1px solid var(--gold)" : "1px solid var(--ink-5)",
                          background: form.fabric===f ? "rgba(200,173,126,.07)" : "var(--ink-3)",
                          transition:"all .3s"
                        }}>
                        {/* Fabric swatch */}
                        <div style={{ width:"100%", height:"42px", marginBottom:"10px", background: form.fabric===f?"rgba(200,173,126,.12)":"var(--ink-4)", display:"flex", alignItems:"center", justifyContent:"center", backgroundImage:`repeating-linear-gradient(45deg,rgba(200,173,126,.${form.fabric===f?"12":"06"}) 0px,rgba(200,173,126,.${form.fabric===f?"12":"06"}) 1px,transparent 1px,transparent 8px)` }}>
                          <span style={{ fontSize:"14px", opacity:.4 }}>▦</span>
                        </div>
                        <p style={{ fontSize:"12px", color: form.fabric===f?"var(--gold)":"var(--silver-4)", fontWeight: form.fabric===f?500:300 }}>{f}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lining */}
                <div>
                  <label style={{ fontSize:"10px", letterSpacing:".18em", color:"var(--silver-5)", textTransform:"uppercase", display:"block", marginBottom:"1.25rem" }}>Lining Preference</label>
                  <div style={{ display:"flex", gap:"1rem", flexWrap:"wrap" }}>
                    {linings.map(l => (
                      <button key={l} onClick={() => up("lining", l)}
                        style={{
                          padding:".75rem 1.25rem", cursor:"pointer", fontSize:"12px",
                          border: form.lining===l ? "1px solid var(--gold)" : "1px solid var(--ink-5)",
                          background: form.lining===l ? "rgba(200,173,126,.07)" : "var(--ink-3)",
                          color: form.lining===l ? "var(--gold)" : "var(--silver-4)",
                          transition:"all .3s", fontFamily:"var(--font-body)", letterSpacing:".04em"
                        }}>{l}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3 — Contact Details */}
            {step===3 && (
              <div>
                <h3 className="disp-hd" style={{ fontSize:"2rem", marginBottom:".5rem" }}>Your Details</h3>
                <p style={{ color:"var(--silver-6)", fontSize:"13px", fontWeight:300, marginBottom:"2.5rem" }}>Contact information for order confirmation and consultation scheduling.</p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.5rem" }} className="grid-1-mob">
                  {[
                    {k:"name",     t:"text",  l:"Full Name"},
                    {k:"phone",    t:"tel",   l:"Phone Number"},
                    {k:"email",    t:"email", l:"Email Address"},
                    {k:"delivery", t:"date",  l:"Preferred Delivery Date"},
                  ].map(({k,t,l}) => (
                    <div key={k}>
                      <label style={{ fontSize:"10px", letterSpacing:".18em", color:"var(--silver-5)", textTransform:"uppercase", display:"block", marginBottom:"8px" }}>{l}</label>
                      <input type={t} value={form[k]} onChange={e => up(k, e.target.value)}
                        style={{ width:"100%", padding:".85rem 1rem", background:"var(--ink-3)", border:"1px solid var(--ink-5)", color:"var(--white)", fontSize:"14px", outline:"none", fontFamily:"var(--font-body)", fontWeight:300 }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 4 — Review */}
            {step===4 && (
              <div>
                <h3 className="disp-hd" style={{ fontSize:"2rem", marginBottom:"2rem" }}>Order Review</h3>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.5rem", marginBottom:"2rem" }} className="grid-1-mob">
                  {/* Garment summary */}
                  <div style={{ background:"var(--ink-3)", border:"1px solid var(--ink-5)", padding:"1.75rem" }}>
                    <p className="sect-label" style={{ marginBottom:"1.25rem", display:"block" }}>Garment Details</p>
                    {[
                      ["Garment",      form.garment||"—"],
                      ["Fabric",       form.fabric||"—"],
                      ["Fit",          form.fit],
                      ["Lapel",        form.lapel||"—"],
                      ["Lining",       form.lining||"—"],
                    ].map(([l,v]) => (
                      <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:".65rem 0", borderBottom:"1px solid var(--ink-4)" }}>
                        <span style={{ fontSize:"11px", color:"var(--silver-6)", letterSpacing:".1em", textTransform:"uppercase" }}>{l}</span>
                        <span style={{ fontSize:"13px", color:"var(--silver-2)", fontWeight:300 }}>{v}</span>
                      </div>
                    ))}
                  </div>

                  {/* Measurements summary */}
                  <div style={{ background:"var(--ink-3)", border:"1px solid var(--ink-5)", padding:"1.75rem" }}>
                    <p className="sect-label" style={{ marginBottom:"1.25rem", display:"block" }}>Measurements</p>
                    {[
                      ["Chest",      form.chest     ? `${form.chest} cm`    : "—"],
                      ["Waist",      form.waist     ? `${form.waist} cm`    : "—"],
                      ["Shoulder",   form.shoulder  ? `${form.shoulder} cm` : "—"],
                      ["Sleeve",     form.sleeve    ? `${form.sleeve} cm`   : "—"],
                      ["Height",     form.height    ? `${form.height} cm`   : "—"],
                    ].map(([l,v]) => (
                      <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:".65rem 0", borderBottom:"1px solid var(--ink-4)" }}>
                        <span style={{ fontSize:"11px", color:"var(--silver-6)", letterSpacing:".1em", textTransform:"uppercase" }}>{l}</span>
                        <span style={{ fontSize:"13px", color:"var(--silver-2)", fontWeight:300 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contact summary */}
                <div style={{ background:"var(--ink-3)", border:"1px solid var(--ink-5)", padding:"1.75rem", marginBottom:"2rem" }}>
                  <p className="sect-label" style={{ marginBottom:"1.25rem", display:"block" }}>Contact</p>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }} className="grid-1-mob">
                    {[["Name",form.name||"—"],["Phone",form.phone||"—"],["Email",form.email||"—"],["Delivery",form.delivery||"—"]].map(([l,v]) => (
                      <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:".65rem 0", borderBottom:"1px solid var(--ink-4)" }}>
                        <span style={{ fontSize:"11px", color:"var(--silver-6)", textTransform:"uppercase", letterSpacing:".1em" }}>{l}</span>
                        <span style={{ fontSize:"13px", color:"var(--silver-2)", fontWeight:300 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {form.notes && (
                  <div style={{ padding:"1.5rem", background:"rgba(200,173,126,.06)", border:"1px solid rgba(200,173,126,.18)" }}>
                    <p className="sect-label" style={{ marginBottom:"8px", display:"block" }}>Special Instructions</p>
                    <p style={{ fontSize:"13px", color:"var(--silver-4)", lineHeight:1.75, fontWeight:300 }}>{form.notes}</p>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Navigation */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:"3rem", paddingTop:"2rem", borderTop:"1px solid var(--ink-4)" }}>
            <button onClick={() => setStep(s => Math.max(0, s-1))} disabled={step===0}
              style={{ padding:".85rem 2rem", border:"1px solid var(--ink-5)", color: step===0?"var(--silver-7)":"var(--silver-4)", background:"transparent", fontSize:"10px", letterSpacing:".18em", textTransform:"uppercase", cursor:step===0?"default":"pointer", transition:"all .3s", fontFamily:"var(--font-body)" }}>
              ← Previous
            </button>
            <div style={{ display:"flex", gap:"6px" }}>
              {steps.map((_,i) => (
                <div key={i} style={{ width: i===step?"24px":"6px", height:"6px", background: i<=step?"var(--gold)":"var(--ink-5)", borderRadius:"3px", transition:"all .4s" }} />
              ))}
            </div>
            {step < totalSteps-1 ? (
              <Btn primary onClick={() => setStep(s => s+1)}>Next →</Btn>
            ) : (
              <Btn primary onClick={handleSubmit}>Place Order ✦</Btn>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════
   BOOKING
═══════════════════════════════════════════════════════════════ */
const Book = ({ addToast }) => {
  const [type, setType] = useState("measurement");
  const [selDate, setSelDate] = useState(null);
  const [selTime, setSelTime] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const today = new Date();
  const days = Array.from({length:14}, (_,i) => { const d=new Date(today); d.setDate(today.getDate()+i+1); return d; });
  const times = ["10:00 AM","11:00 AM","11:30 AM","12:00 PM","2:00 PM","3:00 PM","3:30 PM","4:00 PM","4:30 PM","5:00 PM"];

  const typeOpts = [
    {id:"measurement",  label:"Measurement",    desc:"First visit — full 24-point body measurement"},
    {id:"fitting",      label:"Fitting Session", desc:"Try on and refine the toile / basted garment"},
    {id:"consultation", label:"Consultation",    desc:"Discuss styles, fabrics and options with the master"},
    {id:"final",        label:"Final Pickup",    desc:"Collect your completed bespoke garment"},
  ];

  const confirm = () => {
    if (!selDate || !selTime || !name || !phone) {
      addToast({type:"error", title:"Missing Details", msg:"Please complete all required fields."});
      return;
    }
    setConfirmed(true);
    addToast({type:"success", title:"Appointment Confirmed!", msg:`${type} session booked for ${selDate.toDateString()} at ${selTime}.`});
  };

  if (confirmed) return (
    <section style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:"8rem 3rem" }}>
      <div style={{ textAlign:"center", maxWidth:"500px" }} className="anim-scale-in">
        <div style={{ width:"80px", height:"80px", border:"1px solid var(--gold)", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 2rem", fontSize:"2rem", color:"var(--gold)" }}>✦</div>
        <h2 className="disp-hd" style={{ fontSize:"2.8rem", marginBottom:"1.25rem" }}>
          <em style={{ color:"var(--gold)" }}>Confirmed</em>
        </h2>
        <p style={{ color:"var(--silver-4)", lineHeight:1.9, fontWeight:300, marginBottom:"2.5rem" }}>
          Your {type} appointment is reserved for {selDate?.toDateString()} at {selTime}.<br/>
          We'll send a confirmation to your phone.
        </p>
        <Btn onClick={() => { setConfirmed(false); setSelDate(null); setSelTime(null); setName(""); setPhone(""); setEmail(""); }}>
          Book Another Appointment
        </Btn>
      </div>
    </section>
  );

  return (
    <section style={{ minHeight:"100vh", padding:"8rem 3rem 5rem", background:"var(--ink)" }}>
      <div style={{ maxWidth:"1100px", margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:"4.5rem" }}>
          <p className="sect-label" style={{ marginBottom:"1rem", display:"block" }}>Schedule a Visit</p>
          <h2 className="disp-hd" style={{ fontSize:"clamp(2.2rem,5vw,3.5rem)" }}>
            Book a <em style={{ color:"var(--gold)" }}>Consultation</em>
          </h2>
        </div>

        {/* Appointment type */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))", gap:"1rem", marginBottom:"3.5rem" }}>
          {typeOpts.map(t => (
            <div key={t.id} onClick={() => setType(t.id)}
              style={{
                padding:"1.5rem 1.25rem", cursor:"pointer",
                border: type===t.id ? "1px solid var(--gold)" : "1px solid var(--ink-5)",
                background: type===t.id ? "rgba(200,173,126,.07)" : "var(--ink-2)",
                transition:"all .35s"
              }}>
              <p style={{ fontSize:"12px", fontWeight:500, color: type===t.id?"var(--gold)":"var(--silver-2)", marginBottom:"6px", letterSpacing:".06em" }}>{t.label}</p>
              <p style={{ fontSize:"11px", color:"var(--silver-7)", fontWeight:300, lineHeight:1.65 }}>{t.desc}</p>
            </div>
          ))}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"2rem" }} className="grid-1-mob">

          {/* Calendar */}
          <div style={{ background:"var(--ink-2)", border:"1px solid var(--ink-4)", padding:"2.25rem" }}>
            <p style={{ fontSize:"10px", letterSpacing:".22em", color:"var(--silver-5)", textTransform:"uppercase", marginBottom:"1.75rem" }}>Select Date</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"4px" }}>
              {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d,i) => (
                <div key={i} style={{ textAlign:"center", fontSize:"9px", color:"var(--silver-7)", padding:"8px 0", letterSpacing:".08em" }}>{d}</div>
              ))}
              {days.map((d,i) => {
                const isSel = selDate?.toDateString()===d.toDateString();
                const isSun = d.getDay()===0;
                return (
                  <button key={i} onClick={() => !isSun && setSelDate(d)} disabled={isSun}
                    style={{
                      textAlign:"center", padding:"9px 4px", fontSize:"13px",
                      background: isSel ? "var(--gold)" : "transparent",
                      color: isSun ? "var(--ink-5)" : isSel ? "var(--ink)" : "var(--silver-4)",
                      cursor: isSun ? "default" : "pointer", transition:"all .2s",
                      fontFamily:"var(--font-body)", border:"none",
                      gridColumnStart: i===0 ? d.getDay()+1 : "auto"
                    }}>{d.getDate()}</button>
                );
              })}
            </div>
            {selDate && <p style={{ fontSize:"11px", color:"var(--gold)", marginTop:"1.25rem", letterSpacing:".08em" }}>✦ &nbsp;{selDate.toDateString()}</p>}
          </div>

          {/* Time + Details */}
          <div style={{ display:"flex", flexDirection:"column", gap:"1.5rem" }}>
            <div style={{ background:"var(--ink-2)", border:"1px solid var(--ink-4)", padding:"2.25rem" }}>
              <p style={{ fontSize:"10px", letterSpacing:".22em", color:"var(--silver-5)", textTransform:"uppercase", marginBottom:"1.5rem" }}>Select Time</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
                {times.map(t => (
                  <button key={t} onClick={() => setSelTime(t)}
                    style={{
                      padding:".65rem", border: selTime===t?"1px solid var(--gold)":"1px solid var(--ink-5)",
                      background: selTime===t?"rgba(200,173,126,.1)":"var(--ink-3)",
                      color: selTime===t?"var(--gold)":"var(--silver-5)",
                      fontSize:"12px", cursor:"pointer", transition:"all .3s", fontFamily:"var(--font-body)"
                    }}>{t}</button>
                ))}
              </div>
            </div>
            <div style={{ background:"var(--ink-2)", border:"1px solid var(--ink-4)", padding:"2.25rem" }}>
              <p style={{ fontSize:"10px", letterSpacing:".22em", color:"var(--silver-5)", textTransform:"uppercase", marginBottom:"1.5rem" }}>Your Information</p>
              <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
                {[["Full Name","text",name,setName],["Phone Number","tel",phone,setPhone],["Email (optional)","email",email,setEmail]].map(([l,t,v,s]) => (
                  <div key={l}>
                    <label style={{ fontSize:"10px", color:"var(--silver-6)", letterSpacing:".12em", textTransform:"uppercase", display:"block", marginBottom:"6px" }}>{l}</label>
                    <input type={t} value={v} onChange={e => s(e.target.value)}
                      style={{ width:"100%", padding:".75rem", background:"var(--ink-3)", border:"1px solid var(--ink-5)", color:"var(--white)", fontSize:"14px", outline:"none", fontFamily:"var(--font-body)", fontWeight:300 }} />
                  </div>
                ))}
                <Btn primary onClick={confirm} style={{ marginTop:".5rem", width:"100%", textAlign:"center" }}>
                  Confirm Appointment
                </Btn>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════
   ORDER TRACKING
═══════════════════════════════════════════════════════════════ */
const Orders = () => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [trackInput, setTrackInput] = useState("");

  const orders = [
    {
      id:"SF-24-00891", item:"Charcoal Super 120s Business Suit", fabric:"Italian Wool", date:"Nov 28, 2024",
      amt:"₹13,500", customer:"Aryan Mehta", phone:"+91 98765 43210",
      status:"stitching",
      stages:[
        {k:"recv",     l:"Measurement Received",  done:true,  date:"Nov 28",  note:"24-point measurements taken at atelier"},
        {k:"cut",      l:"Fabric Cutting",         done:true,  date:"Nov 30",  note:"Charcoal wool cut by master cutter"},
        {k:"stitch",   l:"Stitching in Progress",  done:false, date:"Dec 3",   note:"Canvas construction begun — lapels hand-padded"},
        {k:"fitting",  l:"Fitting Session",        done:false, date:"Dec 6",   note:"First basted fitting — customer to attend"},
        {k:"qc",       l:"Quality Check",          done:false, date:"Dec 9",   note:"Final inspection by master tailor"},
        {k:"ready",    l:"Ready for Collection",   done:false, date:"Dec 11",  note:"Pressing, bagging and delivery"},
      ]
    },
    {
      id:"SF-24-00734", item:"Midnight Black Tuxedo", fabric:"Barathea Wool, Silk Lapels", date:"Nov 10, 2024",
      amt:"₹22,000", customer:"Aryan Mehta", phone:"+91 98765 43210",
      status:"delivered",
      stages:[
        {k:"recv",     l:"Measurement Received",  done:true,  date:"Nov 10", note:""},
        {k:"cut",      l:"Fabric Cutting",         done:true,  date:"Nov 12", note:""},
        {k:"stitch",   l:"Stitching in Progress",  done:true,  date:"Nov 17", note:""},
        {k:"fitting",  l:"Fitting Session",        done:true,  date:"Nov 20", note:""},
        {k:"qc",       l:"Quality Check",          done:true,  date:"Nov 22", note:""},
        {k:"ready",    l:"Delivered",              done:true,  date:"Nov 25", note:"Delivered to client residence"},
      ]
    },
    {
      id:"SF-24-01045", item:"3-Piece Wedding Suit — Ivory Merino", fabric:"Fine Merino Wool", date:"Dec 2, 2024",
      amt:"₹28,500", customer:"Aryan Mehta", phone:"+91 98765 43210",
      status:"cutting",
      stages:[
        {k:"recv",     l:"Measurement Received",  done:true,  date:"Dec 2",  note:"Wedding consultation complete"},
        {k:"cut",      l:"Fabric Cutting",         done:false, date:"Dec 5",  note:"Ivory merino sourced from Milan"},
        {k:"stitch",   l:"Stitching in Progress",  done:false, date:"Dec 10", note:""},
        {k:"fitting",  l:"Fitting Session",        done:false, date:"Dec 15", note:""},
        {k:"qc",       l:"Quality Check",          done:false, date:"Dec 18", note:""},
        {k:"ready",    l:"Ready for Collection",   done:false, date:"Dec 20", note:""},
      ]
    },
  ];

  const o = orders[activeIdx];
  const doneCount = o.stages.filter(s => s.done).length;
  const pct = Math.round((doneCount / o.stages.length) * 100);

  const statusColor = { delivered:"var(--gold)", stitching:"var(--silver-3)", cutting:"var(--silver-5)" };

  return (
    <section style={{ minHeight:"100vh", padding:"8rem 3rem 5rem", background:"var(--ink)" }}>
      <div style={{ maxWidth:"1200px", margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:"4rem" }}>
          <p className="sect-label" style={{ marginBottom:"1rem", display:"block" }}>Track Your Order</p>
          <h2 className="disp-hd" style={{ fontSize:"clamp(2.2rem,5vw,3.5rem)" }}>
            Order <em style={{ color:"var(--gold)" }}>Dashboard</em>
          </h2>
        </div>

        {/* Track input */}
        <div style={{ display:"flex", gap:0, maxWidth:"500px", margin:"0 auto 3.5rem", border:"1px solid var(--ink-5)" }}>
          <input value={trackInput} onChange={e => setTrackInput(e.target.value)}
            placeholder="Enter Order ID (e.g. SF-24-00891)"
            style={{ flex:1, padding:".85rem 1.25rem", background:"var(--ink-2)", border:"none", color:"var(--white)", fontSize:"13px", outline:"none", fontFamily:"var(--font-body)", fontWeight:300 }} />
          <button style={{ padding:".85rem 1.5rem", background:"var(--gold)", color:"var(--ink)", fontSize:"10px", letterSpacing:".18em", textTransform:"uppercase", border:"none", cursor:"pointer", fontWeight:500, whiteSpace:"nowrap" }}>
            Track
          </button>
        </div>

        {/* Order tabs */}
        <div style={{ display:"flex", gap:"1rem", marginBottom:"2.5rem", flexWrap:"wrap" }}>
          {orders.map((ord,i) => (
            <button key={ord.id} onClick={() => setActiveIdx(i)}
              style={{
                padding:".75rem 1.5rem",
                border: i===activeIdx ? "1px solid var(--gold)" : "1px solid var(--ink-5)",
                background: i===activeIdx ? "rgba(200,173,126,.08)" : "var(--ink-2)",
                color: i===activeIdx ? "var(--gold)" : "var(--silver-5)",
                fontSize:"11px", letterSpacing:".1em", cursor:"pointer", transition:"all .3s",
                fontFamily:"var(--font-body)"
              }}>
              {ord.id}
            </button>
          ))}
        </div>

        {/* Main panel */}
        <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:"2rem" }} className="grid-1-mob">

          {/* Tracking timeline */}
          <div style={{ background:"var(--ink-2)", border:"1px solid var(--ink-4)", padding:"2.5rem" }}>
            {/* Header */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"2.5rem", flexWrap:"wrap", gap:"1rem" }}>
              <div>
                <p className="sect-label" style={{ marginBottom:"6px", display:"block" }}>#{o.id}</p>
                <h3 style={{ fontFamily:"var(--font-hd)", fontSize:"1.4rem", fontWeight:400, color:"var(--white)", marginBottom:"4px" }}>{o.item}</h3>
                <p style={{ fontSize:"12px", color:"var(--silver-6)", fontWeight:300 }}>{o.fabric}</p>
              </div>
              <div style={{ textAlign:"right" }}>
                <span style={{ fontSize:"10px", letterSpacing:".18em", textTransform:"uppercase", color:statusColor[o.status]||"var(--silver-4)", border:`1px solid ${statusColor[o.status]||"var(--silver-7)"}`, padding:".4rem 1rem" }}>
                  {o.status.charAt(0).toUpperCase()+o.status.slice(1)}
                </span>
                <p style={{ fontSize:"12px", color:"var(--silver-6)", marginTop:"8px" }}>Ordered: {o.date}</p>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom:"2.5rem" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"8px" }}>
                <span style={{ fontSize:"10px", color:"var(--silver-6)", letterSpacing:".12em" }}>PROGRESS</span>
                <span style={{ fontSize:"10px", color:"var(--gold)", letterSpacing:".12em" }}>{pct}%</span>
              </div>
              <div style={{ height:"3px", background:"var(--ink-4)", position:"relative" }}>
                <div style={{ position:"absolute", left:0, top:0, bottom:0, width:`${pct}%`, background:"var(--gold)", transition:"width .8s var(--ease-out)" }} />
              </div>
            </div>

            {/* Stages */}
            <div>
              {o.stages.map((stage,i) => (
                <div key={stage.k} style={{ display:"flex", gap:"1.5rem", marginBottom:"0" }}>
                  {/* Icon + connector */}
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0 }}>
                    <div style={{
                      width:"38px", height:"38px", borderRadius:"50%",
                      border:`1px solid ${stage.done?"var(--gold)":"var(--ink-5)"}`,
                      background: stage.done ? "rgba(200,173,126,.15)" : "var(--ink-3)",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      color: stage.done ? "var(--gold)" : "var(--silver-7)",
                      fontSize:"13px", transition:"all .4s", flexShrink:0
                    }}>
                      {stage.done ? "✓" : String(i+1).padStart(2,"0")}
                    </div>
                    {i < o.stages.length-1 && (
                      <div style={{ width:"1px", flex:1, minHeight:"28px", background: stage.done?"rgba(200,173,126,.3)":"var(--ink-4)", marginTop:"2px" }} />
                    )}
                  </div>

                  <div style={{ paddingTop:"8px", paddingBottom:"1.5rem", flex:1 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"1rem" }}>
                      <p style={{ fontSize:"14px", color: stage.done?"var(--silver-2)":"var(--silver-7)", fontWeight: stage.done?400:300 }}>{stage.l}</p>
                      <span style={{ fontSize:"10px", color:stage.done?"var(--gold)":"var(--silver-7)", letterSpacing:".1em", whiteSpace:"nowrap" }}>{stage.date}</span>
                    </div>
                    {stage.note && stage.done && (
                      <p style={{ fontSize:"11px", color:"var(--silver-7)", marginTop:"4px", fontStyle:"italic", fontFamily:"var(--font-sub)" }}>{stage.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Side info */}
          <div style={{ display:"flex", flexDirection:"column", gap:"1.5rem" }}>
            <div style={{ background:"var(--ink-2)", border:"1px solid var(--ink-4)", padding:"2rem" }}>
              <p style={{ fontSize:"10px", letterSpacing:".22em", color:"var(--silver-5)", textTransform:"uppercase", marginBottom:"1.5rem" }}>Order Details</p>
              {[["Order ID",`#${o.id}`],["Customer",o.customer],["Fabric",o.fabric],["Total",o.amt],["Ordered",o.date]].map(([l,v]) => (
                <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:".7rem 0", borderBottom:"1px solid var(--ink-4)" }}>
                  <span style={{ fontSize:"11px", color:"var(--silver-6)", letterSpacing:".08em" }}>{l}</span>
                  <span style={{ fontSize:"12px", color:"var(--silver-3)", fontWeight:300 }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Download invoice */}
            <button style={{
              width:"100%", padding:"1rem", border:"1px solid var(--ink-5)",
              color:"var(--silver-5)", background:"var(--ink-2)",
              fontSize:"10px", letterSpacing:".18em", textTransform:"uppercase",
              cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px",
              transition:"all .3s", fontFamily:"var(--font-body)"
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor="var(--gold)"; e.currentTarget.style.color="var(--gold)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor="var(--ink-5)"; e.currentTarget.style.color="var(--silver-5)"; }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              Download Invoice
            </button>

            <div style={{ background:"var(--ink-2)", border:"1px solid var(--ink-4)", padding:"2rem" }}>
              <p style={{ fontSize:"10px", letterSpacing:".22em", color:"var(--silver-5)", textTransform:"uppercase", marginBottom:"1.25rem" }}>Need Help?</p>
              <a href="https://wa.me/919876543210" target="_blank" rel="noreferrer"
                style={{ display:"flex", alignItems:"center", gap:"10px", color:"#25d366", fontSize:"13px", fontWeight:300 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{flexShrink:0}}>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                WhatsApp Support
              </a>
              <a href="tel:+919876543210" style={{ display:"flex", alignItems:"center", gap:"10px", color:"var(--silver-4)", fontSize:"13px", fontWeight:300, marginTop:"1rem" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14h0v2.92z"/></svg>
                +91 98765 43210
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════
   TESTIMONIALS
═══════════════════════════════════════════════════════════════ */
const Testimonials = () => {
  const [active, setActive] = useState(0);
  const timerRef = useRef(null);

  const list = [
    { name:"Vikram Nair", role:"Managing Director, Mumbai", quote:"SHIMPI's precision is unparalleled. My charcoal three-piece fits like architecture — every line deliberate. I've worn Savile Row suits and these stand equal.", stars:5 },
    { name:"Aditya Khanna", role:"Groom, March 2024", quote:"My wedding suit was the most admired garment at the event. The ivory merino, hand-padded canvas, hand-sewn buttonholes — true bespoke at a fraction of London prices.", stars:5 },
    { name:"Rohan Desai", role:"Senior Partner, Desai & Associates", quote:"I wear SHIMPI exclusively for court and boardroom. The authority a perfectly tailored suit commands is undeniable. The shoulder line is perfection.", stars:5 },
    { name:"Pradeep Iyer", role:"Film Director, Hyderabad", quote:"As someone deeply conscious of aesthetics, SHIMPI exceeds expectation. My black tuxedo for Cannes was flawless. Every guest asked who made it.", stars:5 },
  ];

  const t = list[active];

  useEffect(() => {
    timerRef.current = setInterval(() => setActive(a => (a+1) % list.length), 5000);
    return () => clearInterval(timerRef.current);
  }, []);

  const go = (i) => { clearInterval(timerRef.current); setActive(i); };

  return (
    <section style={{ padding:"9rem 3rem", background:"var(--ink-2)" }}>
      <div style={{ maxWidth:"860px", margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:"5rem" }}>
          <p className="sect-label" style={{ marginBottom:"1rem", display:"block" }}>Client Testimonials</p>
          <h2 className="disp-hd" style={{ fontSize:"clamp(2.5rem,5vw,3.8rem)" }}>
            The <em style={{ color:"var(--gold)" }}>Verdict</em>
          </h2>
        </div>

        <div key={active} className="anim-fade-in" style={{ textAlign:"center" }}>
          {/* Quote */}
          <div style={{ position:"relative", padding:"3.5rem 3rem", border:"1px solid var(--ink-5)", background:"var(--ink-3)", marginBottom:"3rem" }}>
            <div style={{ fontFamily:"var(--font-hd)", fontSize:"7rem", lineHeight:.7, color:"rgba(200,173,126,.1)", position:"absolute", top:"1.5rem", left:"2rem" }}>"</div>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:"1.5rem" }}>
              {Array(t.stars).fill(0).map((_,i) => <span key={i} style={{ color:"var(--gold)", fontSize:"14px" }}>★</span>)}
            </div>
            <p style={{ fontFamily:"var(--font-sub)", fontSize:"1.2rem", fontStyle:"italic", color:"var(--silver-3)", lineHeight:1.85, fontWeight:400, position:"relative", zIndex:1 }}>
              {t.quote}
            </p>
            <div style={{ width:"36px", height:"1px", background:"var(--gold)", margin:"2.5rem auto 1.5rem" }} />
            <p style={{ fontWeight:500, color:"var(--white)", letterSpacing:".08em", fontSize:"14px" }}>{t.name}</p>
            <p style={{ fontSize:"11px", color:"var(--silver-6)", marginTop:"4px", letterSpacing:".1em" }}>{t.role}</p>
          </div>

          {/* Dots */}
          <div style={{ display:"flex", justifyContent:"center", gap:"10px" }}>
            {list.map((_,i) => (
              <button key={i} onClick={() => go(i)}
                style={{ width:i===active?"28px":"7px", height:"7px", background:i===active?"var(--gold)":"var(--ink-5)", borderRadius:"4px", border:"none", cursor:"pointer", transition:"all .4s" }} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════
   NEWSLETTER
═══════════════════════════════════════════════════════════════ */
const Newsletter = ({ addToast }) => {
  const [email, setEmail] = useState("");
  const sub = () => {
    if (!email.includes("@")) { addToast({type:"error",title:"Invalid Email",msg:"Please enter a valid email."}); return; }
    addToast({type:"success",title:"Subscribed",msg:"Welcome to the inner circle."});
    setEmail("");
  };
  return (
    <section style={{ padding:"7rem 3rem", background:"var(--ink-3)", borderTop:"1px solid var(--ink-4)" }}>
      <div style={{ maxWidth:"560px", margin:"0 auto", textAlign:"center" }}>
        <div style={{ fontFamily:"var(--font-hd)", fontSize:"1rem", color:"var(--gold)", letterSpacing:".25em", marginBottom:"1.5rem" }}>✦ ✦ ✦</div>
        <h2 className="disp-hd" style={{ fontSize:"2.2rem", marginBottom:"1rem" }}>
          The <em style={{ color:"var(--gold)" }}>Inner Circle</em>
        </h2>
        <p style={{ color:"var(--silver-6)", fontSize:"14px", fontWeight:300, marginBottom:"2.5rem", lineHeight:1.8 }}>
          Exclusive seasonal lookbooks, first access to consultation slots, and the occasional invitation to private trunk shows.
        </p>
        <div style={{ display:"flex", border:"1px solid var(--ink-5)" }}>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com"
            onKeyDown={e=>e.key==="Enter"&&sub()}
            style={{ flex:1, padding:"1rem 1.25rem", background:"var(--ink-2)", border:"none", color:"var(--white)", fontSize:"14px", outline:"none", fontFamily:"var(--font-body)", fontWeight:300 }} />
          <button onClick={sub}
            style={{ padding:"1rem 1.75rem", background:"var(--gold)", color:"var(--ink)", fontSize:"10px", letterSpacing:".2em", textTransform:"uppercase", border:"none", cursor:"pointer", fontWeight:500, whiteSpace:"nowrap" }}>
            Subscribe
          </button>
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════
   FOOTER
═══════════════════════════════════════════════════════════════ */
const Footer = ({ setPage }) => (
  <footer style={{ background:"var(--ink)", borderTop:"1px solid var(--ink-4)", padding:"5rem 3rem 2.5rem" }}>
    <div style={{ maxWidth:"1280px", margin:"0 auto" }}>
      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", gap:"4rem", marginBottom:"4rem" }} className="grid-1-mob gap-2-mob">
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"1.5rem" }}>
            <span style={{ color:"var(--gold)", fontSize:"1rem" }}>✦</span>
            <span style={{ fontFamily:"var(--font-hd)", fontSize:"1.8rem", fontWeight:500, letterSpacing:".2em", color:"var(--white)" }}>SHIMPI</span>
          </div>
          <p style={{ color:"var(--silver-7)", fontSize:"13px", lineHeight:1.95, fontWeight:300, maxWidth:"260px", marginBottom:"2rem" }}>
            Bespoke formal tailoring since 2008. Where precision meets artistry — and every suit tells the story of the gentleman who wears it.
          </p>
          <div style={{ display:"flex", gap:"1rem" }}>
            {[["Instagram","📷"],["Facebook","📘"],["Pinterest","📌"],["YouTube","▶"]].map(([s,i]) => (
              <div key={s} title={s} style={{ width:"34px", height:"34px", border:"1px solid var(--ink-5)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:"13px", transition:"border-color .3s" }}
                onMouseEnter={e=>e.currentTarget.style.borderColor="var(--gold)"}
                onMouseLeave={e=>e.currentTarget.style.borderColor="var(--ink-5)"}>
                {i}
              </div>
            ))}
          </div>
        </div>

        {[
          ["Navigate",   [["home","Home"],["atelier","Atelier"],["services","Services"],["gallery","Gallery"],["customize","Customize"],["book","Consult"],["orders","Orders"]]],
          ["Formal Wear",null],
          ["Contact",    null],
        ].map(([h, items], col) => (
          <div key={h}>
            <p style={{ fontSize:"10px", letterSpacing:".25em", color:"var(--silver-6)", textTransform:"uppercase", marginBottom:"1.5rem" }}>{h}</p>
            {h==="Navigate" && items.map(([id,label]) => (
              <div key={id} style={{ marginBottom:".7rem" }}>
                <button onClick={() => setPage(id)}
                  style={{ fontSize:"13px", color:"var(--silver-7)", cursor:"pointer", background:"none", border:"none", fontFamily:"var(--font-body)", fontWeight:300, transition:"color .25s" }}
                  onMouseEnter={e=>e.target.style.color="var(--gold)"}
                  onMouseLeave={e=>e.target.style.color="var(--silver-7)"}>{label}</button>
              </div>
            ))}
            {h==="Formal Wear" && ["Custom Suits","Tuxedos","Blazers","Formal Shirts","Waistcoats","Wedding Suits","Corporate Wear","Alterations"].map(item => (
              <div key={item} style={{ marginBottom:".7rem" }}>
                <span style={{ fontSize:"13px", color:"var(--silver-7)", fontWeight:300 }}>{item}</span>
              </div>
            ))}
            {h==="Contact" && (
              <>
                <p style={{ fontSize:"13px", color:"var(--silver-7)", fontWeight:300, lineHeight:1.9, marginBottom:".75rem" }}>
                  SHIMPI Atelier<br/>MG Road, Civil Lines<br/>Nagpur — 440 001
                </p>
                <p style={{ fontSize:"13px", color:"var(--silver-7)", fontWeight:300, marginBottom:".5rem" }}>+91 98765 43210</p>
                <p style={{ fontSize:"13px", color:"var(--silver-7)", fontWeight:300 }}>contact@shimpi.fashion</p>
                <p style={{ fontSize:"11px", color:"var(--silver-7)", marginTop:"1.5rem", fontWeight:300 }}>Mon–Sat: 10am – 7pm<br/>Sun: By appointment</p>
              </>
            )}
          </div>
        ))}
      </div>

      <div style={{ borderTop:"1px solid var(--ink-3)", paddingTop:"2rem", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"1rem" }}>
        <p style={{ fontSize:"11px", color:"var(--ink-5)" }}>© 2025 SHIMPI Fashion. All rights reserved. Crafted with precision in Nagpur, India.</p>
        <p style={{ fontSize:"11px", color:"var(--ink-5)" }}>Privacy Policy &nbsp;·&nbsp; Terms of Service</p>
      </div>
    </div>
  </footer>
);

/* ═══════════════════════════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════════════════════════ */
export default function App() {
  const [page, setPage] = useState("home");
  const [toasts, setToasts] = useState([]);

  const addToast = t => {
    const id = Date.now();
    setToasts(ts => [...ts, {...t, id}]);
    setTimeout(() => setToasts(ts => ts.filter(x => x.id !== id)), 5200);
  };
  const remove = id => setToasts(ts => ts.filter(x => x.id !== id));

  const go = useCallback(p => { setPage(p); window.scrollTo({top:0,behavior:"smooth"}); }, []);

  const renderPage = () => {
    switch(page) {
      case "home": return (
        <>
          <Hero setPage={go} />
          <Marquee />
          <Atelier />
          <Services setPage={go} />
          <Gallery />
          <Testimonials />
          <Newsletter addToast={addToast} />
        </>
      );
      case "atelier":   return <><div style={{paddingTop:"80px"}}><Atelier /></div><Testimonials /></>;
      case "services":  return <><div style={{paddingTop:"80px"}}><Services setPage={go} /></div></>;
      case "gallery":   return <><div style={{paddingTop:"80px"}}><Gallery /></div></>;
      case "customize": return <Customize addToast={addToast} />;
      case "book":      return <Book addToast={addToast} />;
      case "orders":    return <Orders />;
      default:          return <Hero setPage={go} />;
    }
  };

  return (
    <>
      <FontLoader />
      <Navbar page={page} setPage={go} />
      <main key={page} style={{ animation:"fadeIn .45s ease" }}>
        {renderPage()}
      </main>
      <Footer setPage={go} />
      <Toast toasts={toasts} remove={remove} />

      {/* WhatsApp FAB */}
      <a href="https://wa.me/919876543210" target="_blank" rel="noreferrer"
        style={{
          position:"fixed", bottom:"2rem", left:"2rem", width:"50px", height:"50px",
          background:"#25d366", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
          boxShadow:"0 4px 24px rgba(37,211,102,.3)", zIndex:700, animation:"float 4s ease-in-out infinite"
        }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
      </a>
    </>
  );
}
