import { useState, useEffect, useRef, useCallback } from "react";

/* ── Google Fonts: Cormorant Garamond + DM Sans ─────────────── */
const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&family=DM+Sans:ital,opsz,wght@0,9..40,200;0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,200;1,9..40,300&display=swap');
    :root {
      --black: #0a0a0a;
      --white: #f5f2ed;
      --gray-900: #111111;
      --gray-800: #1a1a1a;
      --gray-700: #242424;
      --gray-600: #333333;
      --gray-500: #555555;
      --gray-400: #888888;
      --gray-300: #aaaaaa;
      --gray-200: #cccccc;
      --gray-100: #e5e2dd;
      --accent: #c9b99a;
      --accent-light: #e8d9c4;
      --font-display: 'Cormorant Garamond', Georgia, serif;
      --font-body: 'DM Sans', system-ui, sans-serif;
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body {
      background: var(--black);
      color: var(--white);
      font-family: var(--font-body);
      font-size: 16px;
      line-height: 1.6;
      overflow-x: hidden;
    }
    ::selection { background: var(--accent); color: var(--black); }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: var(--black); }
    ::-webkit-scrollbar-thumb { background: var(--gray-600); border-radius: 2px; }

    /* Animations */
    @keyframes fadeUp { from { opacity:0; transform:translateY(40px); } to { opacity:1; transform:translateY(0); } }
    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
    @keyframes slideLeft { from { transform:translateX(0); } to { transform:translateX(-50%); } }
    @keyframes shimmer { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
    @keyframes pulseGold { 0%,100% { opacity:0.6; } 50% { opacity:1; } }
    @keyframes drawLine { from { width:0; } to { width:100%; } }
    @keyframes scaleIn { from { opacity:0; transform:scale(0.92); } to { opacity:1; transform:scale(1); } }
    @keyframes float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-12px); } }
    @keyframes rotate { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
    @keyframes toastIn { from { opacity:0; transform:translateY(20px) scale(0.95); } to { opacity:1; transform:translateY(0) scale(1); } }

    .fade-up { animation: fadeUp 0.8s cubic-bezier(0.22,1,0.36,1) forwards; }
    .fade-up-delay-1 { animation: fadeUp 0.8s 0.15s cubic-bezier(0.22,1,0.36,1) both; }
    .fade-up-delay-2 { animation: fadeUp 0.8s 0.3s cubic-bezier(0.22,1,0.36,1) both; }
    .fade-up-delay-3 { animation: fadeUp 0.8s 0.45s cubic-bezier(0.22,1,0.36,1) both; }
    .fade-up-delay-4 { animation: fadeUp 0.8s 0.6s cubic-bezier(0.22,1,0.36,1) both; }
    .scale-in { animation: scaleIn 0.6s cubic-bezier(0.22,1,0.36,1) forwards; }

    /* Global resets */
    button { cursor: pointer; border: none; background: none; font-family: var(--font-body); }
    input, select, textarea { font-family: var(--font-body); }
    a { color: inherit; text-decoration: none; }
  `}</style>
);

/* ── Toast Notification ──────────────────────────────────────── */
const Toast = ({ toasts, removeToast }) => (
  <div style={{ position:"fixed", bottom:"2rem", right:"2rem", zIndex:9999, display:"flex", flexDirection:"column", gap:"12px" }}>
    {toasts.map(t => (
      <div key={t.id} style={{ background:t.type==="success"?"#1a1a1a":"#1a0a0a", border:`1px solid ${t.type==="success"?"var(--accent)":"#c94444"}`, borderRadius:"4px", padding:"1rem 1.25rem", minWidth:"280px", maxWidth:"360px", display:"flex", alignItems:"center", gap:"12px", animation:"toastIn 0.4s ease forwards", boxShadow:"0 20px 60px rgba(0,0,0,0.6)" }}>
        <span style={{ fontSize:"18px" }}>{t.type==="success"?"✓":"✗"}</span>
        <div style={{ flex:1 }}>
          <p style={{ fontSize:"13px", fontWeight:500, color:t.type==="success"?"var(--accent)":"#ff6b6b", marginBottom:"2px" }}>{t.title}</p>
          <p style={{ fontSize:"12px", color:"var(--gray-300)" }}>{t.msg}</p>
        </div>
        <button onClick={() => removeToast(t.id)} style={{ color:"var(--gray-500)", fontSize:"18px", lineHeight:1 }}>×</button>
      </div>
    ))}
  </div>
);

/* ── Navbar ──────────────────────────────────────────────────── */
const Navbar = ({ activePage, setActivePage, cartCount }) => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const navItems = [
    { id:"home", label:"Home" },
    { id:"about", label:"Atelier" },
    { id:"services", label:"Services" },
    { id:"gallery", label:"Gallery" },
    { id:"customize", label:"Customize" },
    { id:"book", label:"Book" },
    { id:"orders", label:"Orders" },
  ];

  return (
    <>
      <nav style={{
        position:"fixed", top:0, left:0, right:0, zIndex:1000,
        padding: scrolled ? "0.75rem 2.5rem" : "1.5rem 2.5rem",
        background: scrolled ? "rgba(10,10,10,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(201,185,154,0.12)" : "none",
        transition: "all 0.5s cubic-bezier(0.22,1,0.36,1)",
        display:"flex", alignItems:"center", justifyContent:"space-between"
      }}>
        <button onClick={() => setActivePage("home")} style={{ fontFamily:"var(--font-display)", fontSize:"1.6rem", fontWeight:600, letterSpacing:"0.12em", color:"var(--white)", cursor:"pointer" }}>
          SHIMPI
        </button>
        <div style={{ display:"flex", gap:"2rem", alignItems:"center" }} className="desktop-nav">
          {navItems.map(n => (
            <button key={n.id} onClick={() => setActivePage(n.id)} style={{
              fontSize:"11px", letterSpacing:"0.18em", fontWeight:400, textTransform:"uppercase",
              color: activePage===n.id ? "var(--accent)" : "var(--gray-300)",
              transition:"color 0.3s", cursor:"pointer",
              borderBottom: activePage===n.id ? "1px solid var(--accent)" : "1px solid transparent",
              paddingBottom:"2px"
            }}>
              {n.label}
            </button>
          ))}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"1.25rem" }}>
          <button onClick={() => setActivePage("orders")} style={{ position:"relative", color:"var(--gray-300)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/></svg>
            {cartCount > 0 && <span style={{ position:"absolute", top:"-6px", right:"-6px", background:"var(--accent)", color:"var(--black)", fontSize:"9px", fontWeight:600, width:"16px", height:"16px", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center" }}>{cartCount}</span>}
          </button>
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ color:"var(--white)", display:"none" }} className="mobile-menu-btn">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
        </div>
      </nav>
      {menuOpen && (
        <div style={{ position:"fixed", inset:0, zIndex:999, background:"rgba(10,10,10,0.98)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"2rem" }}>
          <button onClick={() => setMenuOpen(false)} style={{ position:"absolute", top:"2rem", right:"2rem", color:"var(--white)", fontSize:"28px" }}>×</button>
          {navItems.map(n => (
            <button key={n.id} onClick={() => { setActivePage(n.id); setMenuOpen(false); }} style={{ fontFamily:"var(--font-display)", fontSize:"2.5rem", fontWeight:300, color: activePage===n.id ? "var(--accent)" : "var(--white)", letterSpacing:"0.08em" }}>
              {n.label}
            </button>
          ))}
        </div>
      )}
      <style>{`
        @media(max-width:768px) { .desktop-nav { display:none !important; } .mobile-menu-btn { display:block !important; } }
      `}</style>
    </>
  );
};

/* ── Hero Section ────────────────────────────────────────────── */
const Hero = ({ setActivePage }) => (
  <section style={{ position:"relative", height:"100vh", minHeight:"700px", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
    {/* Background texture */}
    <div style={{ position:"absolute", inset:0, background:"linear-gradient(135deg, #0a0a0a 0%, #1a1510 40%, #0d0d0d 70%, #0a0a0a 100%)" }} />
    <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(ellipse at 30% 40%, rgba(201,185,154,0.07) 0%, transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(201,185,154,0.04) 0%, transparent 50%)" }} />
    {/* Decorative lines */}
    <div style={{ position:"absolute", top:"15%", left:"5%", width:"1px", height:"40%", background:"linear-gradient(to bottom, transparent, var(--accent), transparent)", opacity:0.4 }} />
    <div style={{ position:"absolute", top:"25%", right:"8%", width:"1px", height:"30%", background:"linear-gradient(to bottom, transparent, var(--gray-600), transparent)", opacity:0.6 }} />
    <div style={{ position:"absolute", top:"18%", left:"8%", right:"8%", height:"1px", background:"linear-gradient(to right, transparent, rgba(201,185,154,0.2), transparent)" }} />
    <div style={{ position:"absolute", bottom:"18%", left:"8%", right:"8%", height:"1px", background:"linear-gradient(to right, transparent, rgba(201,185,154,0.15), transparent)" }} />

    {/* Floating elements */}
    <div style={{ position:"absolute", top:"20%", left:"10%", animation:"float 6s ease-in-out infinite" }}>
      <div style={{ width:"60px", height:"60px", border:"1px solid rgba(201,185,154,0.2)", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ width:"40px", height:"40px", border:"1px solid rgba(201,185,154,0.15)", borderRadius:"50%" }} />
      </div>
    </div>
    <div style={{ position:"absolute", bottom:"25%", right:"12%", animation:"float 8s 2s ease-in-out infinite" }}>
      <div style={{ width:"40px", height:"40px", border:"1px solid rgba(201,185,154,0.15)", transform:"rotate(45deg)" }} />
    </div>

    <div style={{ position:"relative", textAlign:"center", padding:"0 2rem", maxWidth:"900px" }}>
      <p className="fade-up" style={{ fontFamily:"var(--font-body)", fontSize:"11px", letterSpacing:"0.35em", color:"var(--accent)", textTransform:"uppercase", marginBottom:"2rem", opacity:0.9 }}>
        Est. 2008 · Nagpur, Maharashtra
      </p>
      <h1 className="fade-up-delay-1" style={{ fontFamily:"var(--font-display)", fontSize:"clamp(3.5rem, 10vw, 8rem)", fontWeight:300, lineHeight:0.95, letterSpacing:"-0.01em", marginBottom:"2rem", color:"var(--white)" }}>
        Perfect Fit.
        <br />
        <em style={{ fontStyle:"italic", color:"var(--accent)", fontWeight:300 }}>Crafted</em> For You.
      </h1>
      <p className="fade-up-delay-2" style={{ fontFamily:"var(--font-body)", fontSize:"1rem", color:"var(--gray-400)", letterSpacing:"0.06em", maxWidth:"480px", margin:"0 auto 3rem", lineHeight:1.8, fontWeight:300 }}>
        Bespoke tailoring where tradition meets precision. Every stitch tells your story.
      </p>
      <div className="fade-up-delay-3" style={{ display:"flex", gap:"1.25rem", justifyContent:"center", flexWrap:"wrap" }}>
        <button onClick={() => setActivePage("customize")} style={{
          background:"var(--accent)", color:"var(--black)", padding:"0.9rem 2.5rem",
          fontSize:"11px", letterSpacing:"0.2em", textTransform:"uppercase", fontWeight:500,
          border:"1px solid var(--accent)", transition:"all 0.4s",
          cursor:"pointer"
        }} onMouseEnter={e => { e.target.style.background="transparent"; e.target.style.color="var(--accent)"; }}
           onMouseLeave={e => { e.target.style.background="var(--accent)"; e.target.style.color="var(--black)"; }}>
          Customize Now
        </button>
        <button onClick={() => setActivePage("book")} style={{
          background:"transparent", color:"var(--white)", padding:"0.9rem 2.5rem",
          fontSize:"11px", letterSpacing:"0.2em", textTransform:"uppercase", fontWeight:500,
          border:"1px solid rgba(245,242,237,0.3)", transition:"all 0.4s"
        }} onMouseEnter={e => { e.target.style.borderColor="var(--accent)"; e.target.style.color="var(--accent)"; }}
           onMouseLeave={e => { e.target.style.borderColor="rgba(245,242,237,0.3)"; e.target.style.color="var(--white)"; }}>
          Book Consultation
        </button>
      </div>
      <div className="fade-up-delay-4" style={{ display:"flex", gap:"3rem", justifyContent:"center", marginTop:"4rem" }}>
        {[["1500+","Garments Crafted"],["98%","Satisfaction Rate"],["15+","Years Excellence"]].map(([n,l]) => (
          <div key={n} style={{ textAlign:"center" }}>
            <div style={{ fontFamily:"var(--font-display)", fontSize:"2rem", fontWeight:500, color:"var(--accent)" }}>{n}</div>
            <div style={{ fontSize:"10px", letterSpacing:"0.2em", color:"var(--gray-500)", textTransform:"uppercase", marginTop:"4px" }}>{l}</div>
          </div>
        ))}
      </div>
    </div>

    <div style={{ position:"absolute", bottom:"2.5rem", left:"50%", transform:"translateX(-50%)", animation:"float 3s ease-in-out infinite" }}>
      <div style={{ width:"1px", height:"60px", background:"linear-gradient(to bottom, var(--accent), transparent)", margin:"0 auto" }} />
    </div>
  </section>
);

/* ── Marquee Strip ───────────────────────────────────────────── */
const Marquee = () => {
  const items = ["Custom Suits","Bridal Wear","Sherwanis","Bespoke Shirts","Salwar Kameez","Lehengas","Trousers","Jackets","Alterations","Traditional Wear"];
  return (
    <div style={{ background:"var(--gray-900)", borderTop:"1px solid var(--gray-700)", borderBottom:"1px solid var(--gray-700)", padding:"0.85rem 0", overflow:"hidden" }}>
      <div style={{ display:"flex", animation:"slideLeft 20s linear infinite", width:"max-content" }}>
        {[...items,...items,...items].map((item, i) => (
          <span key={i} style={{ whiteSpace:"nowrap", padding:"0 2rem", fontSize:"11px", letterSpacing:"0.2em", textTransform:"uppercase", color:"var(--gray-500)" }}>
            {item} <span style={{ color:"var(--accent)", marginLeft:"2rem" }}>✦</span>
          </span>
        ))}
      </div>
    </div>
  );
};

/* ── About Section ───────────────────────────────────────────── */
const About = () => (
  <section style={{ padding:"8rem 2.5rem", maxWidth:"1200px", margin:"0 auto" }}>
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6rem", alignItems:"center" }}>
      <div>
        <p style={{ fontSize:"10px", letterSpacing:"0.3em", color:"var(--accent)", textTransform:"uppercase", marginBottom:"1.5rem" }}>Our Story</p>
        <h2 style={{ fontFamily:"var(--font-display)", fontSize:"clamp(2.5rem, 5vw, 4rem)", fontWeight:300, lineHeight:1.1, marginBottom:"2rem", color:"var(--white)" }}>
          Where Every Thread<br />Tells a <em style={{ fontStyle:"italic", color:"var(--accent)" }}>Story</em>
        </h2>
        <p style={{ color:"var(--gray-400)", lineHeight:1.9, marginBottom:"1.5rem", fontWeight:300 }}>
          Founded in 2008 by master tailor Ramesh Shimpi, our atelier has been the sanctuary for those who understand that true elegance is in the fit. We believe clothing is not merely fabric—it is identity, confidence, and artistry made tangible.
        </p>
        <p style={{ color:"var(--gray-500)", lineHeight:1.9, fontWeight:300, fontSize:"0.95rem" }}>
          From intricate wedding sherwanis to crisp business suits, every garment that leaves our studio is a testament to four generations of tailoring heritage, combined with the precision of modern pattern-making technology.
        </p>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"2rem", marginTop:"3rem" }}>
          {[["Master Craftsmen","Our team of 12 senior tailors average 18 years of experience"],["Premium Fabrics","Sourced from the finest mills in Surat, Italy and Japan"],["Exact Measurements","24-point body measurement for a truly personal fit"],["Heritage Techniques","Hand-finishing using traditional Maharashtrian methods"]].map(([t,d]) => (
            <div key={t}>
              <div style={{ width:"24px", height:"1px", background:"var(--accent)", marginBottom:"1rem" }} />
              <p style={{ fontSize:"12px", fontWeight:500, letterSpacing:"0.1em", color:"var(--white)", marginBottom:"0.5rem", textTransform:"uppercase" }}>{t}</p>
              <p style={{ fontSize:"13px", color:"var(--gray-500)", lineHeight:1.7, fontWeight:300 }}>{d}</p>
            </div>
          ))}
        </div>
      </div>
      <div style={{ position:"relative" }}>
        <div style={{ position:"relative", paddingTop:"130%", background:"linear-gradient(135deg, var(--gray-800) 0%, var(--gray-900) 100%)", overflow:"hidden" }}>
          {/* Simulated fashion photography */}
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(160deg, rgba(201,185,154,0.05) 0%, transparent 60%)" }} />
          <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontFamily:"var(--font-display)", fontSize:"6rem", color:"rgba(201,185,154,0.08)", lineHeight:1 }}>✦</div>
              <div style={{ fontSize:"10px", letterSpacing:"0.3em", color:"var(--gray-700)", textTransform:"uppercase", marginTop:"1rem" }}>Atelier Since 2008</div>
            </div>
          </div>
          {/* Measurement tape visual */}
          {[0,25,50,75,100].map(p => (
            <div key={p} style={{ position:"absolute", left:"1rem", top:`${10+p*0.8}%`, display:"flex", alignItems:"center", gap:"8px" }}>
              <div style={{ width:"6px", height:"1px", background:"rgba(201,185,154,0.3)" }} />
              <span style={{ fontSize:"9px", color:"rgba(201,185,154,0.2)", fontFamily:"monospace" }}>{p}</span>
            </div>
          ))}
        </div>
        <div style={{ position:"absolute", bottom:"-2rem", right:"-2rem", background:"var(--gray-900)", border:"1px solid var(--gray-700)", padding:"1.5rem 2rem" }}>
          <div style={{ fontFamily:"var(--font-display)", fontSize:"3rem", fontWeight:300, color:"var(--accent)", lineHeight:1 }}>15+</div>
          <div style={{ fontSize:"10px", letterSpacing:"0.2em", color:"var(--gray-500)", textTransform:"uppercase", marginTop:"4px" }}>Years of Excellence</div>
        </div>
        <div style={{ position:"absolute", top:"-1.5rem", left:"-1.5rem", width:"80px", height:"80px", border:"1px solid rgba(201,185,154,0.2)" }} />
      </div>
    </div>
    <style>{`@media(max-width:768px){section > div { grid-template-columns:1fr !important; gap:3rem !important; }}`}</style>
  </section>
);

/* ── Services Section ────────────────────────────────────────── */
const Services = ({ setActivePage }) => {
  const services = [
    { icon:"👔", title:"Custom Suits", desc:"Perfectly tailored business and formal suits with premium wool and linen blends", price:"From ₹8,500" },
    { icon:"👕", title:"Bespoke Shirts", desc:"Hand-stitched shirts in Egyptian cotton, linen and performance fabrics", price:"From ₹2,200" },
    { icon:"🎭", title:"Wedding & Sherwani", desc:"Exquisite bridal collections and groom sherwanis for your most special day", price:"From ₹18,000" },
    { icon:"✂️", title:"Expert Alterations", desc:"Precision alterations that breathe new life into your existing wardrobe", price:"From ₹350" },
    { icon:"🌸", title:"Traditional Wear", desc:"Authentic kurtas, dhotis, and ethnic ensembles crafted with cultural pride", price:"From ₹3,500" },
    { icon:"👗", title:"Women's Tailoring", desc:"Blouses, salwar kameez, lehengas, and contemporary silhouettes for modern women", price:"From ₹4,000" },
  ];
  return (
    <section style={{ padding:"8rem 2.5rem", background:"var(--gray-900)" }}>
      <div style={{ maxWidth:"1200px", margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:"5rem" }}>
          <p style={{ fontSize:"10px", letterSpacing:"0.3em", color:"var(--accent)", textTransform:"uppercase", marginBottom:"1rem" }}>What We Offer</p>
          <h2 style={{ fontFamily:"var(--font-display)", fontSize:"clamp(2.5rem, 5vw, 3.5rem)", fontWeight:300, color:"var(--white)" }}>
            Our <em style={{ fontStyle:"italic", color:"var(--accent)" }}>Services</em>
          </h2>
          <div style={{ width:"60px", height:"1px", background:"var(--accent)", margin:"2rem auto 0" }} />
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(320px, 1fr))", gap:"1.5px", background:"var(--gray-700)" }}>
          {services.map((s, i) => (
            <ServiceCard key={i} service={s} setActivePage={setActivePage} />
          ))}
        </div>
      </div>
    </section>
  );
};

const ServiceCard = ({ service, setActivePage }) => {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: hov ? "var(--gray-800)" : "var(--gray-900)", padding:"2.5rem 2rem", transition:"all 0.4s", cursor:"pointer", borderBottom: hov ? "1px solid var(--accent)" : "1px solid transparent" }}
      onClick={() => setActivePage("customize")}>
      <div style={{ fontSize:"2rem", marginBottom:"1.5rem", filter: hov ? "none" : "grayscale(0.3)" }}>{service.icon}</div>
      <h3 style={{ fontFamily:"var(--font-display)", fontSize:"1.4rem", fontWeight:400, color: hov ? "var(--white)" : "var(--gray-200)", marginBottom:"1rem", letterSpacing:"0.02em" }}>{service.title}</h3>
      <p style={{ fontSize:"14px", color:"var(--gray-500)", lineHeight:1.8, marginBottom:"1.5rem", fontWeight:300 }}>{service.desc}</p>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:"12px", color:"var(--accent)", letterSpacing:"0.08em" }}>{service.price}</span>
        <span style={{ color: hov ? "var(--accent)" : "var(--gray-600)", transition:"all 0.3s", fontSize:"18px" }}>→</span>
      </div>
    </div>
  );
};

/* ── Multi-Step Measurement Form ─────────────────────────────── */
const CustomizeForm = ({ addToast }) => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    clothingType:"", fabric:"", fitPreference:"slim", instructions:"",
    chest:"", waist:"", hips:"", shoulder:"", sleeveLength:"", neck:"", inseam:"", height:"",
    name:"", phone:"", email:"", deliveryDate:""
  });

  const steps = ["Garment","Measurements","Style","Details","Review"];
  const fabrics = ["Egyptian Cotton","Premium Linen","Wool Blend","Silk","Italian Wool","Khadi","Pure Cotton","Polyester Blend"];
  const garments = ["Formal Suit","Casual Shirt","Sherwani","Traditional Kurta","Trouser","Blazer","Women's Salwar Kameez","Lehenga Blouse","Wedding Saree Blouse"];

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    addToast({ type:"success", title:"Order Placed!", msg:`Your custom ${form.clothingType} has been booked. We'll contact you within 24 hours.` });
    setStep(0);
    setForm({ clothingType:"", fabric:"", fitPreference:"slim", instructions:"", chest:"", waist:"", hips:"", shoulder:"", sleeveLength:"", neck:"", inseam:"", height:"", name:"", phone:"", email:"", deliveryDate:"" });
  };

  return (
    <section style={{ minHeight:"100vh", padding:"8rem 2.5rem 4rem", background:"var(--black)" }}>
      <div style={{ maxWidth:"900px", margin:"0 auto" }}>
        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:"4rem" }}>
          <p style={{ fontSize:"10px", letterSpacing:"0.3em", color:"var(--accent)", textTransform:"uppercase", marginBottom:"1rem" }}>Bespoke Creation</p>
          <h2 style={{ fontFamily:"var(--font-display)", fontSize:"clamp(2rem, 5vw, 3.5rem)", fontWeight:300, color:"var(--white)" }}>
            Your <em style={{ fontStyle:"italic", color:"var(--accent)" }}>Custom</em> Order
          </h2>
        </div>

        {/* Progress */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"0", marginBottom:"4rem" }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center" }}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"8px", cursor: i <= step ? "pointer" : "default" }}
                onClick={() => i <= step && setStep(i)}>
                <div style={{
                  width:"40px", height:"40px", borderRadius:"50%",
                  background: i < step ? "var(--accent)" : i === step ? "transparent" : "transparent",
                  border: i === step ? "1px solid var(--accent)" : i < step ? "1px solid var(--accent)" : "1px solid var(--gray-600)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  color: i <= step ? "var(--accent)" : "var(--gray-600)", fontSize:"13px", fontWeight:500,
                  transition:"all 0.4s"
                }}>
                  {i < step ? "✓" : i+1}
                </div>
                <span style={{ fontSize:"10px", letterSpacing:"0.15em", textTransform:"uppercase", color: i === step ? "var(--white)" : "var(--gray-600)", display:"none" }} className="step-label">{s}</span>
              </div>
              {i < steps.length-1 && (
                <div style={{ width:"80px", height:"1px", background: i < step ? "var(--accent)" : "var(--gray-700)", margin:"0 4px", transition:"all 0.4s" }} />
              )}
            </div>
          ))}
        </div>

        {/* Form Panels */}
        <div style={{ background:"var(--gray-900)", border:"1px solid var(--gray-700)", padding:"3rem" }}>
          {step === 0 && (
            <div className="scale-in">
              <h3 style={{ fontFamily:"var(--font-display)", fontSize:"1.8rem", fontWeight:300, color:"var(--white)", marginBottom:"0.5rem" }}>Choose Your Garment</h3>
              <p style={{ color:"var(--gray-500)", fontSize:"14px", marginBottom:"2.5rem", fontWeight:300 }}>Select the type of clothing you'd like us to craft for you.</p>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(160px, 1fr))", gap:"1rem", marginBottom:"2.5rem" }}>
                {garments.map(g => (
                  <button key={g} onClick={() => update("clothingType", g)} style={{
                    padding:"1rem", border: form.clothingType===g ? "1px solid var(--accent)" : "1px solid var(--gray-700)",
                    background: form.clothingType===g ? "rgba(201,185,154,0.08)" : "var(--black)",
                    color: form.clothingType===g ? "var(--accent)" : "var(--gray-400)",
                    fontSize:"13px", textAlign:"center", transition:"all 0.3s", fontFamily:"var(--font-body)",
                    cursor:"pointer"
                  }}>{g}</button>
                ))}
              </div>
              <div>
                <label style={{ fontSize:"11px", letterSpacing:"0.15em", color:"var(--gray-400)", textTransform:"uppercase", display:"block", marginBottom:"1rem" }}>Special Instructions (Optional)</label>
                <textarea value={form.instructions} onChange={e => update("instructions", e.target.value)}
                  placeholder="Any specific requirements, design preferences, or references..."
                  rows={4} style={{
                    width:"100%", background:"var(--black)", border:"1px solid var(--gray-700)", color:"var(--white)",
                    padding:"1rem", fontSize:"14px", resize:"vertical", outline:"none", fontWeight:300,
                    fontFamily:"var(--font-body)", lineHeight:1.7
                  }} />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="scale-in">
              <h3 style={{ fontFamily:"var(--font-display)", fontSize:"1.8rem", fontWeight:300, color:"var(--white)", marginBottom:"0.5rem" }}>Your Measurements</h3>
              <p style={{ color:"var(--gray-500)", fontSize:"14px", marginBottom:"2.5rem", fontWeight:300 }}>All measurements in centimetres. Need help? <a onClick={() => {}} style={{ color:"var(--accent)", cursor:"pointer", textDecoration:"underline" }}>View guide</a></p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.5rem" }}>
                {[
                  ["chest","Chest"],["waist","Waist"],["hips","Hips / Seat"],["shoulder","Shoulder Width"],
                  ["sleeveLength","Sleeve Length"],["neck","Neck"],["inseam","Inseam"],["height","Height"]
                ].map(([k,l]) => (
                  <div key={k}>
                    <label style={{ fontSize:"11px", letterSpacing:"0.15em", color:"var(--gray-400)", textTransform:"uppercase", display:"block", marginBottom:"8px" }}>{l}</label>
                    <div style={{ display:"flex", alignItems:"center", border:"1px solid var(--gray-700)", background:"var(--black)" }}>
                      <input type="number" value={form[k]} onChange={e => update(k, e.target.value)} placeholder="0.0"
                        style={{ flex:1, padding:"0.75rem 1rem", background:"transparent", border:"none", color:"var(--white)", fontSize:"15px", outline:"none", fontFamily:"var(--font-body)" }} />
                      <span style={{ padding:"0.75rem 1rem", color:"var(--gray-600)", fontSize:"12px", borderLeft:"1px solid var(--gray-800)" }}>cm</span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Measurement Guide Visual */}
              <div style={{ marginTop:"2rem", padding:"1.5rem", background:"var(--black)", border:"1px solid var(--gray-800)" }}>
                <p style={{ fontSize:"11px", letterSpacing:"0.2em", color:"var(--accent)", textTransform:"uppercase", marginBottom:"1rem" }}>✦ Measurement Tips</p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"1rem" }}>
                  {[["Chest","Measure around fullest part, arms relaxed"],["Waist","Measure at natural waistline, breathe normally"],["Hip","Measure around fullest part of hips"]].map(([t,d]) => (
                    <div key={t}>
                      <p style={{ fontSize:"12px", fontWeight:500, color:"var(--gray-300)", marginBottom:"4px" }}>{t}</p>
                      <p style={{ fontSize:"11px", color:"var(--gray-600)", lineHeight:1.6 }}>{d}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="scale-in">
              <h3 style={{ fontFamily:"var(--font-display)", fontSize:"1.8rem", fontWeight:300, color:"var(--white)", marginBottom:"0.5rem" }}>Style Preferences</h3>
              <p style={{ color:"var(--gray-500)", fontSize:"14px", marginBottom:"2.5rem", fontWeight:300 }}>Choose your fabric and preferred fit style.</p>
              
              <div style={{ marginBottom:"2.5rem" }}>
                <label style={{ fontSize:"11px", letterSpacing:"0.15em", color:"var(--gray-400)", textTransform:"uppercase", display:"block", marginBottom:"1.5rem" }}>Fabric Selection</label>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(180px, 1fr))", gap:"1rem" }}>
                  {fabrics.map(f => (
                    <div key={f} onClick={() => update("fabric", f)} style={{ cursor:"pointer", padding:"1rem 1.25rem", border: form.fabric===f ? "1px solid var(--accent)" : "1px solid var(--gray-700)", background: form.fabric===f ? "rgba(201,185,154,0.06)" : "var(--black)", transition:"all 0.3s" }}>
                      <div style={{ width:"100%", height:"50px", background: form.fabric===f ? "rgba(201,185,154,0.1)" : "var(--gray-800)", marginBottom:"10px", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <span style={{ fontSize:"20px", opacity:0.5 }}>▦</span>
                      </div>
                      <p style={{ fontSize:"13px", color: form.fabric===f ? "var(--accent)" : "var(--gray-400)", fontWeight: form.fabric===f ? 500 : 300 }}>{f}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize:"11px", letterSpacing:"0.15em", color:"var(--gray-400)", textTransform:"uppercase", display:"block", marginBottom:"1.5rem" }}>Fit Preference</label>
                <div style={{ display:"flex", gap:"1rem" }}>
                  {["slim","regular","oversized"].map(fit => (
                    <button key={fit} onClick={() => update("fitPreference", fit)} style={{
                      flex:1, padding:"1.25rem", border: form.fitPreference===fit ? "1px solid var(--accent)" : "1px solid var(--gray-700)",
                      background: form.fitPreference===fit ? "rgba(201,185,154,0.08)" : "var(--black)",
                      color: form.fitPreference===fit ? "var(--accent)" : "var(--gray-500)",
                      fontSize:"12px", textTransform:"uppercase", letterSpacing:"0.15em", transition:"all 0.3s",
                      cursor:"pointer", fontFamily:"var(--font-body)"
                    }}>
                      {fit === "slim" ? "Slim Fit" : fit === "regular" ? "Regular Fit" : "Oversized"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="scale-in">
              <h3 style={{ fontFamily:"var(--font-display)", fontSize:"1.8rem", fontWeight:300, color:"var(--white)", marginBottom:"0.5rem" }}>Your Details</h3>
              <p style={{ color:"var(--gray-500)", fontSize:"14px", marginBottom:"2.5rem", fontWeight:300 }}>Contact information for your order confirmation.</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.5rem" }}>
                {[["name","text","Full Name"],["phone","tel","Phone Number"],["email","email","Email Address"],["deliveryDate","date","Preferred Delivery"]].map(([k,t,l]) => (
                  <div key={k}>
                    <label style={{ fontSize:"11px", letterSpacing:"0.15em", color:"var(--gray-400)", textTransform:"uppercase", display:"block", marginBottom:"8px" }}>{l}</label>
                    <input type={t} value={form[k]} onChange={e => update(k, e.target.value)}
                      style={{ width:"100%", padding:"0.85rem 1rem", background:"var(--black)", border:"1px solid var(--gray-700)", color:"var(--white)", fontSize:"14px", outline:"none", fontFamily:"var(--font-body)", fontWeight:300 }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="scale-in">
              <h3 style={{ fontFamily:"var(--font-display)", fontSize:"1.8rem", fontWeight:300, color:"var(--white)", marginBottom:"2rem" }}>Order Review</h3>
              <div style={{ display:"grid", gap:"1px", background:"var(--gray-700)", marginBottom:"2rem" }}>
                {[
                  ["Garment",form.clothingType || "—"],
                  ["Fabric",form.fabric || "—"],
                  ["Fit",form.fitPreference],
                  ["Chest",form.chest ? `${form.chest} cm` : "—"],
                  ["Waist",form.waist ? `${form.waist} cm` : "—"],
                  ["Height",form.height ? `${form.height} cm` : "—"],
                  ["Customer",form.name || "—"],
                  ["Contact",form.phone || "—"],
                  ["Delivery",form.deliveryDate || "—"],
                ].map(([l,v]) => (
                  <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"1rem 1.25rem", background:"var(--gray-900)" }}>
                    <span style={{ fontSize:"12px", letterSpacing:"0.1em", color:"var(--gray-500)", textTransform:"uppercase" }}>{l}</span>
                    <span style={{ fontSize:"14px", color:"var(--gray-200)", fontWeight:300 }}>{v}</span>
                  </div>
                ))}
              </div>
              {form.instructions && (
                <div style={{ padding:"1.25rem", background:"var(--black)", border:"1px solid var(--gray-700)", marginBottom:"2rem" }}>
                  <p style={{ fontSize:"11px", color:"var(--accent)", letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:"8px" }}>Special Instructions</p>
                  <p style={{ fontSize:"14px", color:"var(--gray-400)", lineHeight:1.7, fontWeight:300 }}>{form.instructions}</p>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:"3rem", paddingTop:"2rem", borderTop:"1px solid var(--gray-800)" }}>
            <button onClick={() => setStep(s => Math.max(0, s-1))} disabled={step===0} style={{
              padding:"0.85rem 2rem", border:"1px solid var(--gray-700)", color: step===0 ? "var(--gray-700)" : "var(--gray-400)",
              background:"transparent", fontSize:"12px", letterSpacing:"0.15em", textTransform:"uppercase",
              cursor: step===0 ? "default" : "pointer", transition:"all 0.3s"
            }}>← Previous</button>
            <span style={{ fontSize:"12px", color:"var(--gray-600)" }}>{steps[step]}</span>
            {step < 4 ? (
              <button onClick={() => setStep(s => s+1)} style={{
                padding:"0.85rem 2rem", background:"var(--accent)", color:"var(--black)",
                fontSize:"12px", letterSpacing:"0.15em", textTransform:"uppercase", cursor:"pointer",
                border:"1px solid var(--accent)", transition:"all 0.3s", fontWeight:500
              }}>Next →</button>
            ) : (
              <button onClick={handleSubmit} style={{
                padding:"0.85rem 2.5rem", background:"var(--accent)", color:"var(--black)",
                fontSize:"12px", letterSpacing:"0.15em", textTransform:"uppercase", cursor:"pointer",
                border:"1px solid var(--accent)", fontWeight:500
              }}>Place Order ✓</button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ── Gallery Section ─────────────────────────────────────────── */
const Gallery = () => {
  const [filter, setFilter] = useState("All");
  const categories = ["All","Suits","Wedding","Traditional","Women's"];
  
  const items = [
    { cat:"Suits", h:300, tone:"rgba(30,25,20,0.9)", label:"Charcoal Three-Piece" },
    { cat:"Wedding", h:420, tone:"rgba(25,20,15,0.9)", label:"Silk Sherwani" },
    { cat:"Traditional", h:260, tone:"rgba(20,20,25,0.9)", label:"Royal Kurta Set" },
    { cat:"Women's", h:380, tone:"rgba(25,15,20,0.9)", label:"Designer Lehenga" },
    { cat:"Suits", h:350, tone:"rgba(20,25,25,0.9)", label:"Navy Pinstripe Suit" },
    { cat:"Traditional", h:280, tone:"rgba(30,20,15,0.9)", label:"Angarkha Kurta" },
    { cat:"Women's", h:400, tone:"rgba(20,20,30,0.9)", label:"Anarkali Ensemble" },
    { cat:"Suits", h:320, tone:"rgba(25,25,20,0.9)", label:"Cream Linen Blazer" },
    { cat:"Wedding", h:360, tone:"rgba(30,25,20,0.9)", label:"Bridal Saree Blouse" },
  ];

  const filtered = filter === "All" ? items : items.filter(i => i.cat === filter);

  return (
    <section style={{ padding:"8rem 2.5rem", background:"var(--black)" }}>
      <div style={{ maxWidth:"1400px", margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:"4rem" }}>
          <p style={{ fontSize:"10px", letterSpacing:"0.3em", color:"var(--accent)", textTransform:"uppercase", marginBottom:"1rem" }}>Portfolio</p>
          <h2 style={{ fontFamily:"var(--font-display)", fontSize:"clamp(2.5rem,5vw,3.5rem)", fontWeight:300, color:"var(--white)", marginBottom:"2rem" }}>
            Our <em style={{ fontStyle:"italic", color:"var(--accent)" }}>Work</em>
          </h2>
          <div style={{ display:"flex", justifyContent:"center", gap:"2rem", flexWrap:"wrap" }}>
            {categories.map(c => (
              <button key={c} onClick={() => setFilter(c)} style={{
                fontSize:"11px", letterSpacing:"0.2em", textTransform:"uppercase", cursor:"pointer",
                color: filter===c ? "var(--accent)" : "var(--gray-500)",
                borderBottom: filter===c ? "1px solid var(--accent)" : "1px solid transparent",
                paddingBottom:"4px", transition:"all 0.3s", background:"none", border:"none",
                borderBottomStyle:"solid"
              }}>{c}</button>
            ))}
          </div>
        </div>
        <div style={{ columns:"3 280px", gap:"6px" }}>
          {filtered.map((item, i) => (
            <GalleryItem key={`${filter}-${i}`} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
};

const GalleryItem = ({ item }) => {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ position:"relative", height:`${item.h}px`, background:item.tone, marginBottom:"6px", overflow:"hidden", cursor:"pointer", breakInside:"avoid" }}>
      <div style={{ position:"absolute", inset:0, backgroundImage:`radial-gradient(ellipse at 50% 30%, rgba(201,185,154,0.08) 0%, transparent 70%)` }} />
      {/* Grid pattern */}
      <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(201,185,154,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(201,185,154,0.03) 1px, transparent 1px)", backgroundSize:"20px 20px" }} />
      <div style={{ position:"absolute", inset:0, background:`rgba(0,0,0,${hov?0.4:0.6})`, transition:"all 0.5s" }} />
      <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"1.5rem", transform: hov ? "translateY(0)" : "translateY(10px)", opacity: hov ? 1 : 0, transition:"all 0.4s" }}>
        <span style={{ fontSize:"10px", letterSpacing:"0.2em", color:"var(--accent)", textTransform:"uppercase" }}>{item.cat}</span>
        <p style={{ fontFamily:"var(--font-display)", fontSize:"1.1rem", color:"var(--white)", marginTop:"4px" }}>{item.label}</p>
      </div>
      {hov && <div style={{ position:"absolute", top:"1rem", right:"1rem", width:"32px", height:"32px", border:"1px solid rgba(201,185,154,0.5)", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--accent)", fontSize:"16px" }}>+</div>}
    </div>
  );
};

/* ── Appointment Booking ─────────────────────────────────────── */
const BookAppointment = ({ addToast }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [type, setType] = useState("measurement");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const today = new Date();
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i + 1);
    return d;
  });

  const times = ["10:00 AM","11:00 AM","11:30 AM","12:00 PM","2:00 PM","3:00 PM","3:30 PM","4:00 PM","4:30 PM","5:00 PM"];

  const handleBook = () => {
    if (!selectedDate || !selectedTime || !name || !phone) {
      addToast({ type:"error", title:"Missing Details", msg:"Please fill all required fields." });
      return;
    }
    setSubmitted(true);
    addToast({ type:"success", title:"Appointment Confirmed!", msg:`${type} appointment booked for ${selectedDate.toDateString()} at ${selectedTime}` });
  };

  if (submitted) return (
    <section style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:"8rem 2.5rem" }}>
      <div style={{ textAlign:"center", maxWidth:"500px" }}>
        <div style={{ width:"80px", height:"80px", border:"1px solid var(--accent)", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 2rem", fontSize:"2rem" }}>✓</div>
        <h2 style={{ fontFamily:"var(--font-display)", fontSize:"2.5rem", fontWeight:300, color:"var(--white)", marginBottom:"1rem" }}>
          <em style={{ fontStyle:"italic", color:"var(--accent)" }}>Confirmed</em>
        </h2>
        <p style={{ color:"var(--gray-400)", lineHeight:1.8, fontWeight:300, marginBottom:"2rem" }}>
          Your {type} appointment is confirmed for {selectedDate?.toDateString()} at {selectedTime}. We'll send confirmation to your phone.
        </p>
        <button onClick={() => { setSubmitted(false); setSelectedDate(null); setSelectedTime(null); setName(""); setPhone(""); }}
          style={{ padding:"0.85rem 2rem", border:"1px solid var(--accent)", color:"var(--accent)", background:"transparent", fontSize:"12px", letterSpacing:"0.15em", textTransform:"uppercase", cursor:"pointer" }}>
          Book Another
        </button>
      </div>
    </section>
  );

  return (
    <section style={{ minHeight:"100vh", padding:"8rem 2.5rem 4rem", background:"var(--black)" }}>
      <div style={{ maxWidth:"1000px", margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:"4rem" }}>
          <p style={{ fontSize:"10px", letterSpacing:"0.3em", color:"var(--accent)", textTransform:"uppercase", marginBottom:"1rem" }}>Schedule Your Visit</p>
          <h2 style={{ fontFamily:"var(--font-display)", fontSize:"clamp(2rem,5vw,3.5rem)", fontWeight:300, color:"var(--white)" }}>
            Book an <em style={{ fontStyle:"italic", color:"var(--accent)" }}>Appointment</em>
          </h2>
        </div>

        {/* Type Selection */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"1rem", marginBottom:"3rem" }}>
          {[["measurement","📏","Measurement"],["fitting","👕","Fitting"],["consultation","💬","Consultation"],["delivery","📦","Delivery"]].map(([v,icon,label]) => (
            <button key={v} onClick={() => setType(v)} style={{
              padding:"1.25rem 1rem", border: type===v ? "1px solid var(--accent)" : "1px solid var(--gray-700)",
              background: type===v ? "rgba(201,185,154,0.08)" : "var(--gray-900)",
              color: type===v ? "var(--accent)" : "var(--gray-500)", cursor:"pointer",
              display:"flex", flexDirection:"column", alignItems:"center", gap:"8px", transition:"all 0.3s"
            }}>
              <span style={{ fontSize:"1.5rem" }}>{icon}</span>
              <span style={{ fontSize:"11px", letterSpacing:"0.15em", textTransform:"uppercase" }}>{label}</span>
            </button>
          ))}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"2rem" }}>
          {/* Calendar */}
          <div style={{ background:"var(--gray-900)", border:"1px solid var(--gray-700)", padding:"2rem" }}>
            <p style={{ fontSize:"11px", letterSpacing:"0.2em", color:"var(--gray-500)", textTransform:"uppercase", marginBottom:"1.5rem" }}>Select Date</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"4px" }}>
              {["S","M","T","W","T","F","S"].map((d,i) => (
                <div key={i} style={{ textAlign:"center", fontSize:"10px", color:"var(--gray-600)", padding:"8px 0", letterSpacing:"0.1em" }}>{d}</div>
              ))}
              {days.map((d, i) => {
                const isSel = selectedDate?.toDateString() === d.toDateString();
                const isWknd = d.getDay() === 0;
                return (
                  <button key={i} onClick={() => !isWknd && setSelectedDate(d)} disabled={isWknd}
                    style={{ textAlign:"center", padding:"8px 4px", fontSize:"13px",
                      background: isSel ? "var(--accent)" : "transparent",
                      color: isWknd ? "var(--gray-800)" : isSel ? "var(--black)" : "var(--gray-300)",
                      border: isSel ? "none" : "1px solid transparent", cursor: isWknd ? "default" : "pointer",
                      transition:"all 0.2s", fontFamily:"var(--font-body)",
                      gridColumnStart: i===0 ? d.getDay()+1 : "auto"
                    }}>
                    {d.getDate()}
                  </button>
                );
              })}
            </div>
            {selectedDate && <p style={{ fontSize:"12px", color:"var(--accent)", marginTop:"1rem", letterSpacing:"0.1em" }}>Selected: {selectedDate.toDateString()}</p>}
          </div>

          {/* Time + Details */}
          <div style={{ display:"flex", flexDirection:"column", gap:"1.5rem" }}>
            <div style={{ background:"var(--gray-900)", border:"1px solid var(--gray-700)", padding:"2rem" }}>
              <p style={{ fontSize:"11px", letterSpacing:"0.2em", color:"var(--gray-500)", textTransform:"uppercase", marginBottom:"1.5rem" }}>Select Time</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
                {times.map(t => (
                  <button key={t} onClick={() => setSelectedTime(t)} style={{
                    padding:"0.65rem", border: selectedTime===t ? "1px solid var(--accent)" : "1px solid var(--gray-700)",
                    background: selectedTime===t ? "rgba(201,185,154,0.1)" : "var(--black)",
                    color: selectedTime===t ? "var(--accent)" : "var(--gray-400)",
                    fontSize:"13px", cursor:"pointer", transition:"all 0.3s", fontFamily:"var(--font-body)"
                  }}>{t}</button>
                ))}
              </div>
            </div>
            <div style={{ background:"var(--gray-900)", border:"1px solid var(--gray-700)", padding:"2rem" }}>
              <p style={{ fontSize:"11px", letterSpacing:"0.2em", color:"var(--gray-500)", textTransform:"uppercase", marginBottom:"1.5rem" }}>Your Details</p>
              {[["Name","text",name,setName],["Phone","tel",phone,setPhone]].map(([l,t,v,s]) => (
                <div key={l} style={{ marginBottom:"1rem" }}>
                  <label style={{ fontSize:"11px", color:"var(--gray-600)", letterSpacing:"0.1em", textTransform:"uppercase", display:"block", marginBottom:"6px" }}>{l}</label>
                  <input type={t} value={v} onChange={e => s(e.target.value)}
                    style={{ width:"100%", padding:"0.75rem", background:"var(--black)", border:"1px solid var(--gray-700)", color:"var(--white)", fontSize:"14px", outline:"none", fontFamily:"var(--font-body)" }} />
                </div>
              ))}
              <button onClick={handleBook} style={{
                width:"100%", padding:"1rem", background:"var(--accent)", color:"var(--black)",
                fontSize:"12px", letterSpacing:"0.2em", textTransform:"uppercase", cursor:"pointer",
                border:"1px solid var(--accent)", fontWeight:500, marginTop:"0.5rem"
              }}>Confirm Booking</button>
            </div>
          </div>
        </div>
      </div>
      <style>{`@media(max-width:768px){section>div>div:last-child{grid-template-columns:1fr !important;}}`}</style>
    </section>
  );
};

/* ── Order Tracking ──────────────────────────────────────────── */
const OrderTracking = () => {
  const [activeOrder, setActiveOrder] = useState(0);
  const orders = [
    {
      id:"SF12345678", item:"Charcoal Business Suit", fabric:"Italian Wool", date:"2025-05-28",
      status:"stitching", amount:"₹12,500", customer:"Aryan Patel",
      stages:[
        { key:"measurement", label:"Measurement Received", done:true, date:"May 28" },
        { key:"cutting", label:"Fabric Cutting", done:true, date:"May 30" },
        { key:"stitching", label:"Stitching in Progress", done:false, date:"Jun 2" },
        { key:"quality_check", label:"Quality Check", done:false, date:"Jun 4" },
        { key:"ready", label:"Ready for Delivery", done:false, date:"Jun 6" },
      ]
    },
    {
      id:"SF98765432", item:"Silk Sherwani Set", fabric:"Banarasi Silk", date:"2025-05-20",
      status:"delivered", amount:"₹24,000", customer:"Aryan Patel",
      stages:[
        { key:"measurement", label:"Measurement Received", done:true, date:"May 20" },
        { key:"cutting", label:"Fabric Cutting", done:true, date:"May 22" },
        { key:"stitching", label:"Stitching in Progress", done:true, date:"May 26" },
        { key:"quality_check", label:"Quality Check", done:true, date:"May 28" },
        { key:"ready", label:"Delivered", done:true, date:"May 30" },
      ]
    },
  ];

  const o = orders[activeOrder];
  const doneCount = o.stages.filter(s => s.done).length;
  const progress = (doneCount / o.stages.length) * 100;

  return (
    <section style={{ minHeight:"100vh", padding:"8rem 2.5rem 4rem", background:"var(--black)" }}>
      <div style={{ maxWidth:"1100px", margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:"4rem" }}>
          <p style={{ fontSize:"10px", letterSpacing:"0.3em", color:"var(--accent)", textTransform:"uppercase", marginBottom:"1rem" }}>Track Your Order</p>
          <h2 style={{ fontFamily:"var(--font-display)", fontSize:"clamp(2rem,5vw,3.5rem)", fontWeight:300, color:"var(--white)" }}>
            Order <em style={{ fontStyle:"italic", color:"var(--accent)" }}>Status</em>
          </h2>
        </div>

        {/* Order Selector */}
        <div style={{ display:"flex", gap:"1rem", marginBottom:"2.5rem", overflowX:"auto", paddingBottom:"0.5rem" }}>
          {orders.map((ord, i) => (
            <button key={i} onClick={() => setActiveOrder(i)} style={{
              padding:"1rem 1.5rem", border: activeOrder===i ? "1px solid var(--accent)" : "1px solid var(--gray-700)",
              background: activeOrder===i ? "rgba(201,185,154,0.06)" : "var(--gray-900)",
              cursor:"pointer", whiteSpace:"nowrap", transition:"all 0.3s"
            }}>
              <p style={{ fontSize:"12px", color:"var(--accent)", letterSpacing:"0.1em", marginBottom:"4px" }}>#{ord.id}</p>
              <p style={{ fontSize:"13px", color:"var(--gray-300)" }}>{ord.item}</p>
              <p style={{ fontSize:"11px", color: ord.status==="delivered" ? "#4caf50" : "var(--accent)", marginTop:"4px", textTransform:"uppercase", letterSpacing:"0.1em" }}>{ord.status.replace("_"," ")}</p>
            </button>
          ))}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:"2rem" }}>
          {/* Main Panel */}
          <div>
            {/* Progress Bar */}
            <div style={{ background:"var(--gray-900)", border:"1px solid var(--gray-700)", padding:"2rem 2.5rem", marginBottom:"1.5rem" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.5rem" }}>
                <div>
                  <p style={{ fontFamily:"var(--font-display)", fontSize:"1.3rem", color:"var(--white)" }}>{o.item}</p>
                  <p style={{ fontSize:"12px", color:"var(--gray-500)", marginTop:"4px" }}>{o.fabric} · {o.date}</p>
                </div>
                <div style={{ textAlign:"right" }}>
                  <p style={{ fontFamily:"var(--font-display)", fontSize:"1.4rem", color:"var(--accent)" }}>{o.amount}</p>
                  <p style={{ fontSize:"11px", color: o.status==="delivered" ? "#4caf50" : "var(--accent)", textTransform:"uppercase", letterSpacing:"0.1em" }}>{o.status.replace("_"," ")}</p>
                </div>
              </div>
              <div style={{ height:"2px", background:"var(--gray-700)", borderRadius:"1px", overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${progress}%`, background:"var(--accent)", transition:"width 1s ease", borderRadius:"1px" }} />
              </div>
              <p style={{ fontSize:"11px", color:"var(--gray-600)", marginTop:"8px" }}>{Math.round(progress)}% Complete</p>
            </div>

            {/* Timeline */}
            <div style={{ background:"var(--gray-900)", border:"1px solid var(--gray-700)", padding:"2rem 2.5rem" }}>
              <p style={{ fontSize:"11px", letterSpacing:"0.2em", color:"var(--gray-500)", textTransform:"uppercase", marginBottom:"2rem" }}>Progress Timeline</p>
              {o.stages.map((stage, i) => (
                <div key={i} style={{ display:"flex", gap:"1.5rem", marginBottom: i < o.stages.length-1 ? "1.5rem" : 0 }}>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
                    <div style={{ width:"32px", height:"32px", borderRadius:"50%", border: stage.done ? "1px solid var(--accent)" : "1px solid var(--gray-700)", background: stage.done ? "rgba(201,185,154,0.1)" : "transparent", display:"flex", alignItems:"center", justifyContent:"center", color: stage.done ? "var(--accent)" : "var(--gray-700)", fontSize:"14px", flexShrink:0 }}>
                      {stage.done ? "✓" : "○"}
                    </div>
                    {i < o.stages.length-1 && <div style={{ width:"1px", flex:1, background: stage.done ? "rgba(201,185,154,0.3)" : "var(--gray-800)", marginTop:"4px", minHeight:"20px" }} />}
                  </div>
                  <div style={{ paddingTop:"6px", flex:1 }}>
                    <p style={{ fontSize:"14px", color: stage.done ? "var(--gray-200)" : "var(--gray-600)", fontWeight: stage.done ? 400 : 300 }}>{stage.label}</p>
                    <p style={{ fontSize:"11px", color:"var(--gray-700)", marginTop:"2px" }}>{stage.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Side Panel */}
          <div style={{ display:"flex", flexDirection:"column", gap:"1.5rem" }}>
            <div style={{ background:"var(--gray-900)", border:"1px solid var(--gray-700)", padding:"1.75rem" }}>
              <p style={{ fontSize:"11px", letterSpacing:"0.2em", color:"var(--gray-500)", textTransform:"uppercase", marginBottom:"1.25rem" }}>Order Details</p>
              {[["Order ID",`#${o.id}`],["Customer",o.customer],["Fabric",o.fabric],["Amount",o.amount]].map(([l,v]) => (
                <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"0.75rem 0", borderBottom:"1px solid var(--gray-800)" }}>
                  <span style={{ fontSize:"12px", color:"var(--gray-600)" }}>{l}</span>
                  <span style={{ fontSize:"13px", color:"var(--gray-300)" }}>{v}</span>
                </div>
              ))}
            </div>
            <button style={{ width:"100%", padding:"1rem", border:"1px solid var(--gray-700)", color:"var(--gray-400)", background:"var(--gray-900)", fontSize:"12px", letterSpacing:"0.15em", textTransform:"uppercase", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              Download Invoice
            </button>
            <div style={{ background:"var(--gray-900)", border:"1px solid var(--gray-700)", padding:"1.75rem" }}>
              <p style={{ fontSize:"11px", letterSpacing:"0.2em", color:"var(--gray-500)", textTransform:"uppercase", marginBottom:"1rem" }}>Need Help?</p>
              <a href="https://wa.me/919876543210" style={{ display:"flex", alignItems:"center", gap:"10px", color:"#25d366", fontSize:"14px" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                WhatsApp Us
              </a>
            </div>
          </div>
        </div>
      </div>
      <style>{`@media(max-width:768px){section>div>div:nth-child(3){grid-template-columns:1fr !important;}}`}</style>
    </section>
  );
};

/* ── Testimonials ────────────────────────────────────────────── */
const Testimonials = () => {
  const [active, setActive] = useState(0);
  const testimonials = [
    { name:"Priya Sharma", role:"Corporate Executive, Mumbai", rating:5, text:"SHIMPI transformed my entire wardrobe. The precision of their measurements and quality of fabric is unmatched. My confidence in boardroom meetings has genuinely doubled." },
    { name:"Rahul Mehta", role:"Groom, December 2024", rating:5, text:"My wedding sherwani was a masterpiece. Everyone at the wedding asked about my outfit. The team worked with my vision and exceeded every expectation. Absolutely stunning." },
    { name:"Anjali Desai", role:"Fashion Blogger", rating:5, text:"As someone who covers fashion professionally, I'm hard to impress. SHIMPI's craftsmanship is genuinely world-class. The fit is extraordinary—like the garment was made FOR my body." },
    { name:"Vikram Joshi", role:"Entrepreneur, Nagpur", rating:5, text:"I've worn tailored suits from London and Mumbai. SHIMPI's work stands proudly alongside the best. The attention to detail in the finishing is remarkable. My permanent tailor now." },
  ];
  const t = testimonials[active];

  return (
    <section style={{ padding:"8rem 2.5rem", background:"var(--gray-900)" }}>
      <div style={{ maxWidth:"900px", margin:"0 auto", textAlign:"center" }}>
        <p style={{ fontSize:"10px", letterSpacing:"0.3em", color:"var(--accent)", textTransform:"uppercase", marginBottom:"1rem" }}>Client Stories</p>
        <h2 style={{ fontFamily:"var(--font-display)", fontSize:"clamp(2rem,5vw,3.5rem)", fontWeight:300, color:"var(--white)", marginBottom:"5rem" }}>
          What They <em style={{ fontStyle:"italic", color:"var(--accent)" }}>Say</em>
        </h2>
        <div style={{ position:"relative", padding:"3rem", border:"1px solid var(--gray-700)", background:"var(--black)" }}>
          <div style={{ fontFamily:"var(--font-display)", fontSize:"6rem", lineHeight:0.8, color:"rgba(201,185,154,0.1)", marginBottom:"1.5rem" }}>"</div>
          <p style={{ fontFamily:"var(--font-display)", fontSize:"1.3rem", fontWeight:300, color:"var(--gray-200)", lineHeight:1.8, marginBottom:"2.5rem", fontStyle:"italic" }}>
            {t.text}
          </p>
          <div style={{ width:"40px", height:"1px", background:"var(--accent)", margin:"0 auto 1.5rem" }} />
          <p style={{ fontWeight:500, color:"var(--white)", letterSpacing:"0.08em" }}>{t.name}</p>
          <p style={{ fontSize:"12px", color:"var(--gray-500)", marginTop:"4px", letterSpacing:"0.1em" }}>{t.role}</p>
          <div style={{ display:"flex", justifyContent:"center", gap:"4px", marginTop:"1rem" }}>
            {Array(t.rating).fill(0).map((_,i) => <span key={i} style={{ color:"var(--accent)", fontSize:"14px" }}>★</span>)}
          </div>
        </div>
        <div style={{ display:"flex", justifyContent:"center", gap:"12px", marginTop:"2rem" }}>
          {testimonials.map((_,i) => (
            <button key={i} onClick={() => setActive(i)} style={{ width: i===active ? "32px" : "8px", height:"8px", background: i===active ? "var(--accent)" : "var(--gray-700)", border:"none", cursor:"pointer", transition:"all 0.4s", borderRadius:"4px" }} />
          ))}
        </div>
      </div>
    </section>
  );
};

/* ── FAQ Accordion ───────────────────────────────────────────── */
const FAQ = () => {
  const [open, setOpen] = useState(null);
  const faqs = [
    ["How long does tailoring typically take?","Most garments are ready within 10–15 days. For wedding and elaborate ceremonial wear, we recommend 3–4 weeks for perfection. Rush orders of 5–7 days are available for select garments at a premium."],
    ["How do I know my measurements are accurate?","Our in-house team takes a comprehensive 24-point measurement at your first visit. For online orders, we provide a detailed measurement guide with video tutorials. Alterations are free if our initial measurements are imprecise."],
    ["What fabrics do you work with?","We source premium fabrics from Surat's finest mills, imported Italian wool, Egyptian cotton, Japanese linen, and artisan silks from Varanasi. We also work with client-provided fabric."],
    ["Do you offer alterations for purchased garments?","Absolutely. We expertly alter store-bought and second-hand garments. From simple hemming to structural changes, our tailors handle all complexity levels."],
    ["Is there a try-on fitting session?","Yes—all custom garments include a minimum of one fitting session. Complex garments like suits and sherwanis include two fittings to ensure a perfect result."],
    ["Can I order online if I'm not in Nagpur?","Yes. We serve clients across India. Use our online measurement guide, submit your measurements, and we ship your finished garment. Video consultations are also available."],
  ];

  return (
    <section style={{ padding:"8rem 2.5rem", background:"var(--black)" }}>
      <div style={{ maxWidth:"800px", margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:"4rem" }}>
          <p style={{ fontSize:"10px", letterSpacing:"0.3em", color:"var(--accent)", textTransform:"uppercase", marginBottom:"1rem" }}>Questions</p>
          <h2 style={{ fontFamily:"var(--font-display)", fontSize:"clamp(2rem,5vw,3.5rem)", fontWeight:300, color:"var(--white)" }}>
            Frequently <em style={{ fontStyle:"italic", color:"var(--accent)" }}>Asked</em>
          </h2>
        </div>
        {faqs.map(([q,a], i) => (
          <div key={i} style={{ borderTop:"1px solid var(--gray-800)", overflow:"hidden" }}>
            <button onClick={() => setOpen(open===i ? null : i)} style={{ width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", padding:"1.5rem 0", background:"none", cursor:"pointer", textAlign:"left" }}>
              <span style={{ fontSize:"15px", color:"var(--gray-200)", fontWeight:300, paddingRight:"2rem", lineHeight:1.5 }}>{q}</span>
              <span style={{ color:"var(--accent)", fontSize:"20px", flexShrink:0, transition:"transform 0.3s", transform: open===i ? "rotate(45deg)" : "rotate(0)" }}>+</span>
            </button>
            <div style={{ maxHeight: open===i ? "400px" : "0", overflow:"hidden", transition:"max-height 0.5s cubic-bezier(0.22,1,0.36,1)" }}>
              <p style={{ fontSize:"14px", color:"var(--gray-500)", lineHeight:1.9, paddingBottom:"1.5rem", fontWeight:300 }}>{a}</p>
            </div>
          </div>
        ))}
        <div style={{ borderTop:"1px solid var(--gray-800)" }} />
      </div>
    </section>
  );
};

/* ── AI Size Recommendation ──────────────────────────────────── */
const AIRecommendation = ({ addToast }) => {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [build, setBuild] = useState("athletic");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const recommend = () => {
    if (!height || !weight) { addToast({ type:"error", title:"Missing Info", msg:"Please enter height and weight." }); return; }
    setLoading(true);
    setResult(null);
    setTimeout(() => {
      const h = parseFloat(height), w = parseFloat(weight);
      const bmi = w / ((h/100)**2);
      const chest = build==="athletic" ? Math.round(h*0.52+2) : build==="slim" ? Math.round(h*0.50) : Math.round(h*0.54+4);
      const waist = build==="athletic" ? Math.round(h*0.44) : build==="slim" ? Math.round(h*0.41) : Math.round(h*0.47+2);
      setResult({ chest, waist, hip: Math.round(chest+4), shoulder: Math.round(chest*0.44), sleeve: Math.round(h*0.345), neck: Math.round(chest*0.40), fit: bmi < 22 ? "Slim Fit" : bmi < 26 ? "Regular Fit" : "Regular/Relaxed Fit" });
      setLoading(false);
    }, 1800);
  };

  return (
    <section style={{ padding:"6rem 2.5rem", background:"var(--gray-900)", borderTop:"1px solid var(--gray-800)" }}>
      <div style={{ maxWidth:"900px", margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:"3rem" }}>
          <p style={{ fontSize:"10px", letterSpacing:"0.3em", color:"var(--accent)", textTransform:"uppercase", marginBottom:"1rem" }}>Smart Fitting</p>
          <h2 style={{ fontFamily:"var(--font-display)", fontSize:"clamp(1.8rem,4vw,3rem)", fontWeight:300, color:"var(--white)" }}>
            AI Size <em style={{ fontStyle:"italic", color:"var(--accent)" }}>Recommendation</em>
          </h2>
          <p style={{ color:"var(--gray-500)", fontSize:"14px", marginTop:"1rem", fontWeight:300 }}>Enter basic details and our algorithm generates your perfect starting measurements.</p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"2rem" }}>
          <div style={{ background:"var(--black)", border:"1px solid var(--gray-700)", padding:"2rem" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem", marginBottom:"1.5rem" }}>
              {[["Height (cm)",height,setHeight],["Weight (kg)",weight,setWeight]].map(([l,v,s]) => (
                <div key={l}>
                  <label style={{ fontSize:"11px", color:"var(--gray-600)", letterSpacing:"0.1em", textTransform:"uppercase", display:"block", marginBottom:"6px" }}>{l}</label>
                  <input type="number" value={v} onChange={e => s(e.target.value)} placeholder="0"
                    style={{ width:"100%", padding:"0.75rem", background:"var(--gray-900)", border:"1px solid var(--gray-700)", color:"var(--white)", fontSize:"15px", outline:"none", fontFamily:"var(--font-body)" }} />
                </div>
              ))}
            </div>
            <div style={{ marginBottom:"1.5rem" }}>
              <label style={{ fontSize:"11px", color:"var(--gray-600)", letterSpacing:"0.1em", textTransform:"uppercase", display:"block", marginBottom:"8px" }}>Build Type</label>
              <div style={{ display:"flex", gap:"8px" }}>
                {["slim","athletic","broad"].map(b => (
                  <button key={b} onClick={() => setBuild(b)} style={{ flex:1, padding:"0.65rem", border: build===b ? "1px solid var(--accent)" : "1px solid var(--gray-700)", background: build===b ? "rgba(201,185,154,0.08)" : "transparent", color: build===b ? "var(--accent)" : "var(--gray-500)", fontSize:"12px", textTransform:"uppercase", letterSpacing:"0.1em", cursor:"pointer", fontFamily:"var(--font-body)", transition:"all 0.3s" }}>{b}</button>
                ))}
              </div>
            </div>
            <button onClick={recommend} style={{ width:"100%", padding:"1rem", background:"var(--accent)", color:"var(--black)", fontSize:"12px", letterSpacing:"0.2em", textTransform:"uppercase", cursor:"pointer", border:"none", fontWeight:500 }}>
              {loading ? "Calculating..." : "Get Recommendations →"}
            </button>
          </div>
          <div style={{ background:"var(--black)", border:"1px solid var(--gray-700)", padding:"2rem", position:"relative", overflow:"hidden" }}>
            {loading && (
              <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(10,10,10,0.9)" }}>
                <div style={{ textAlign:"center" }}>
                  <div style={{ width:"40px", height:"40px", border:"1px solid var(--accent)", borderTopColor:"transparent", borderRadius:"50%", animation:"rotate 0.8s linear infinite", margin:"0 auto 1rem" }} />
                  <p style={{ fontSize:"12px", color:"var(--accent)", letterSpacing:"0.1em" }}>Analysing...</p>
                </div>
              </div>
            )}
            {result ? (
              <>
                <p style={{ fontSize:"11px", letterSpacing:"0.2em", color:"var(--accent)", textTransform:"uppercase", marginBottom:"1.5rem" }}>Recommended Measurements</p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }}>
                  {[["Chest",result.chest],["Waist",result.waist],["Hip",result.hip],["Shoulder",result.shoulder],["Sleeve",result.sleeve],["Neck",result.neck]].map(([l,v]) => (
                    <div key={l} style={{ padding:"0.75rem", background:"var(--gray-900)", border:"1px solid var(--gray-800)" }}>
                      <p style={{ fontSize:"10px", color:"var(--gray-600)", letterSpacing:"0.1em", textTransform:"uppercase" }}>{l}</p>
                      <p style={{ fontFamily:"var(--font-display)", fontSize:"1.4rem", color:"var(--accent)", marginTop:"4px" }}>{v} <span style={{ fontSize:"12px", color:"var(--gray-600)" }}>cm</span></p>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:"1.5rem", padding:"1rem", background:"rgba(201,185,154,0.06)", border:"1px solid rgba(201,185,154,0.15)" }}>
                  <p style={{ fontSize:"12px", color:"var(--accent)", fontWeight:500 }}>Suggested Fit: {result.fit}</p>
                  <p style={{ fontSize:"11px", color:"var(--gray-600)", marginTop:"4px" }}>Based on your proportions and build type</p>
                </div>
              </>
            ) : (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%", flexDirection:"column", gap:"1rem", opacity:0.4 }}>
                <div style={{ fontSize:"3rem" }}>📐</div>
                <p style={{ fontSize:"13px", color:"var(--gray-600)", textAlign:"center", fontWeight:300 }}>Your recommendations will appear here after analysis</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ── Newsletter ───────────────────────────────────────────────── */
const Newsletter = ({ addToast }) => {
  const [email, setEmail] = useState("");
  const handleSub = () => {
    if (!email.includes("@")) { addToast({ type:"error", title:"Invalid Email", msg:"Please enter a valid email address." }); return; }
    addToast({ type:"success", title:"Subscribed!", msg:"Welcome to the SHIMPI inner circle. Expect exclusive updates." });
    setEmail("");
  };
  return (
    <section style={{ padding:"6rem 2.5rem", background:"var(--gray-900)", borderTop:"1px solid var(--gray-800)" }}>
      <div style={{ maxWidth:"600px", margin:"0 auto", textAlign:"center" }}>
        <p style={{ fontSize:"10px", letterSpacing:"0.3em", color:"var(--accent)", textTransform:"uppercase", marginBottom:"1rem" }}>Stay Connected</p>
        <h2 style={{ fontFamily:"var(--font-display)", fontSize:"2.5rem", fontWeight:300, color:"var(--white)", marginBottom:"1rem" }}>
          The <em style={{ fontStyle:"italic", color:"var(--accent)" }}>Inner Circle</em>
        </h2>
        <p style={{ color:"var(--gray-500)", fontSize:"14px", marginBottom:"2.5rem", fontWeight:300, lineHeight:1.8 }}>
          Receive exclusive invitations, seasonal collections, and first access to limited appointment slots.
        </p>
        <div style={{ display:"flex", gap:"0", background:"var(--black)", border:"1px solid var(--gray-700)" }}>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com"
            onKeyDown={e => e.key==="Enter" && handleSub()}
            style={{ flex:1, padding:"1rem 1.25rem", background:"transparent", border:"none", color:"var(--white)", fontSize:"14px", outline:"none", fontFamily:"var(--font-body)", fontWeight:300 }} />
          <button onClick={handleSub} style={{ padding:"1rem 1.75rem", background:"var(--accent)", color:"var(--black)", fontSize:"11px", letterSpacing:"0.2em", textTransform:"uppercase", cursor:"pointer", border:"none", fontWeight:500, whiteSpace:"nowrap" }}>
            Subscribe
          </button>
        </div>
      </div>
    </section>
  );
};

/* ── Footer ──────────────────────────────────────────────────── */
const Footer = ({ setActivePage }) => (
  <footer style={{ background:"var(--black)", borderTop:"1px solid var(--gray-800)", padding:"5rem 2.5rem 2rem" }}>
    <div style={{ maxWidth:"1200px", margin:"0 auto" }}>
      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", gap:"4rem", marginBottom:"4rem" }}>
        <div>
          <div style={{ fontFamily:"var(--font-display)", fontSize:"2rem", fontWeight:600, letterSpacing:"0.12em", color:"var(--white)", marginBottom:"1.5rem" }}>SHIMPI</div>
          <p style={{ color:"var(--gray-600)", fontSize:"14px", lineHeight:1.9, fontWeight:300, maxWidth:"280px" }}>
            Bespoke tailoring since 2008. Where precision meets artistry, and every garment is a reflection of you.
          </p>
          <div style={{ display:"flex", gap:"1rem", marginTop:"2rem" }}>
            {[["Instagram","📷"],["Facebook","📘"],["WhatsApp","💬"],["Pinterest","📌"]].map(([s,i]) => (
              <div key={s} style={{ width:"36px", height:"36px", border:"1px solid var(--gray-700)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:"14px" }} title={s}>{i}</div>
            ))}
          </div>
        </div>
        {[["Navigate",["home","about","services","gallery","customize","book","orders"]],
          ["Services",["Custom Suits","Sherwanis","Blouses","Alterations","Kurtas","Lehengas"]],
          ["Contact",["SHIMPI Atelier\nMG Road, Nagpur","Maharashtra — 440001","+91 98765 43210","contact@shimpi.fashion"]]
        ].map(([h, items]) => (
          <div key={h}>
            <p style={{ fontSize:"11px", letterSpacing:"0.2em", color:"var(--gray-500)", textTransform:"uppercase", marginBottom:"1.5rem" }}>{h}</p>
            {items.map((item, i) => (
              <div key={i} style={{ marginBottom:"0.75rem" }}>
                {h === "Navigate" ? (
                  <button onClick={() => setActivePage(item)} style={{ fontSize:"14px", color:"var(--gray-600)", cursor:"pointer", background:"none", border:"none", fontFamily:"var(--font-body)", textTransform:"capitalize", transition:"color 0.2s" }}
                    onMouseEnter={e => e.target.style.color="var(--accent)"}
                    onMouseLeave={e => e.target.style.color="var(--gray-600)"}>{item}</button>
                ) : (
                  <p style={{ fontSize:"13px", color:"var(--gray-600)", fontWeight:300, lineHeight:1.7 }}>{item}</p>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ borderTop:"1px solid var(--gray-900)", paddingTop:"2rem", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"1rem" }}>
        <p style={{ fontSize:"12px", color:"var(--gray-700)" }}>© 2025 SHIMPI Fashion. All rights reserved. Crafted with precision.</p>
        <p style={{ fontSize:"12px", color:"var(--gray-700)" }}>Made in Nagpur, Maharashtra 🇮🇳</p>
      </div>
    </div>
    <style>{`@media(max-width:768px){footer>div>div:first-child{grid-template-columns:1fr !important; gap:2rem !important;}}`}</style>
  </footer>
);

/* ── Main App ────────────────────────────────────────────────── */
export default function App() {
  const [activePage, setActivePage] = useState("home");
  const [toasts, setToasts] = useState([]);
  const [cartCount] = useState(2);

  const addToast = (t) => {
    const id = Date.now();
    setToasts(ts => [...ts, { ...t, id }]);
    setTimeout(() => setToasts(ts => ts.filter(t => t.id !== id)), 5000);
  };
  const removeToast = (id) => setToasts(ts => ts.filter(t => t.id !== id));

  const handleSetPage = useCallback((p) => {
    setActivePage(p);
    window.scrollTo({ top:0, behavior:"smooth" });
  }, []);

  const renderPage = () => {
    switch(activePage) {
      case "home": return (
        <>
          <Hero setActivePage={handleSetPage} />
          <Marquee />
          <About />
          <Services setActivePage={handleSetPage} />
          <Gallery />
          <Testimonials />
          <AIRecommendation addToast={addToast} />
          <FAQ />
          <Newsletter addToast={addToast} />
        </>
      );
      case "about": return <><div style={{ paddingTop:"80px" }}><About /></div><Testimonials /><FAQ /></>;
      case "services": return <><div style={{ paddingTop:"80px" }}><Services setActivePage={handleSetPage} /></div><AIRecommendation addToast={addToast} /></>;
      case "gallery": return <><div style={{ paddingTop:"80px" }}><Gallery /></div></>;
      case "customize": return <CustomizeForm addToast={addToast} />;
      case "book": return <BookAppointment addToast={addToast} />;
      case "orders": return <OrderTracking />;
      default: return <Hero setActivePage={handleSetPage} />;
    }
  };

  return (
    <>
      <FontLoader />
      <Navbar activePage={activePage} setActivePage={handleSetPage} cartCount={cartCount} />
      <main style={{ animation:"fadeIn 0.5s ease" }} key={activePage}>
        {renderPage()}
      </main>
      <Footer setActivePage={handleSetPage} />
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* WhatsApp FAB */}
      <a href="https://wa.me/919876543210" target="_blank" rel="noreferrer" style={{
        position:"fixed", bottom:"2rem", left:"2rem", width:"52px", height:"52px",
        background:"#25d366", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
        boxShadow:"0 4px 20px rgba(37,211,102,0.3)", zIndex:998, animation:"float 4s ease-in-out infinite"
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
      </a>
    </>
  );
}
