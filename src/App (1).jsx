import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Leaflet ikon düzeltmesi
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const SUPA_URL = "https://ysvfwvebxdshwagtlmdc.supabase.co"
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzdmZ3dmVieGRzaHdhZ3RsbWRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NzYzNzAsImV4cCI6MjA4ODM1MjM3MH0.bPkuzVTmRI35JarvPxKkeU5ZQMrUwbgAxAk5ui8Mf4Y"
const sb = createClient(SUPA_URL, SUPA_KEY)

// ─── SMS GÖNDERİCİ ───────────────────────────────────────────────────────────
const smsSend = async (telefon, mesaj) => {
  try {
    const r = await fetch('/api/sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telefon, mesaj })
    })
    const d = await r.json()
    return d.success
  } catch(e) {
    console.log('SMS hatası:', e)
    return false
  }
}

// ─── OTP ÜRETİCİ ─────────────────────────────────────────────────────────────
const otpUret = () => Math.floor(100000 + Math.random() * 900000).toString()

// ─── TELEFON FORMAT ───────────────────────────────────────────────────────────
const telFormat = (tel) => tel.replace(/\D/g, '').replace(/^90/, '').replace(/^0/, '')

// ─── RENK PALETİ ─────────────────────────────────────────────────────────────
const C = {
  bg:"#0b0f1e", card:"#111827", card2:"#0f1929", border:"#1e2d45",
  accent:"#e8500a", accentL:"#f26419", accentGlow:"rgba(232,80,10,0.15)",
  navy:"#1e3a5f", text:"#f1f5f9", muted:"#94a3b8", dim:"#475569",
  success:"#22c55e", error:"#ef4444", warn:"#f59e0b",
  inBg:"#0f1929", inBorder:"#1e3a5f"
}

const btnP = {
  padding:"12px 24px", borderRadius:"10px", border:"none",
  background:"linear-gradient(135deg,#e8500a,#c44008)",
  color:"#fff", fontSize:"14px", fontWeight:"700", cursor:"pointer"
}
const btnS = {
  padding:"12px 24px", borderRadius:"10px",
  border:"1px solid "+C.border, background:"transparent",
  color:C.text, fontSize:"14px", fontWeight:"600", cursor:"pointer"
}
const modalStyle = {
  position:"fixed", inset:0, background:"rgba(0,0,0,0.78)",
  display:"flex", alignItems:"center", justifyContent:"center",
  zIndex:200, padding:"16px", backdropFilter:"blur(4px)"
}
const mBox = {
  background:C.card, border:"1px solid "+C.border, borderRadius:"20px",
  padding:"32px", width:"100%", maxWidth:"480px", maxHeight:"92vh",
  overflowY:"auto", boxShadow:"0 24px 80px rgba(0,0,0,0.6)", position:"relative"
}

// ─── INPUT BİLEŞENİ ──────────────────────────────────────────────────────────
function Inp({ label, placeholder, type="text", value, onChange, optional }) {
  const [f, sf] = useState(false)
  return (
    <div>
      <label style={{ display:"block", fontSize:"11px", fontWeight:"700", color:C.muted, letterSpacing:"0.5px", textTransform:"uppercase", marginBottom:"5px", marginTop:"14px" }}>
        {label}{optional && <span style={{ color:C.dim, fontWeight:"400", textTransform:"none" }}> (isteğe bağlı)</span>}
      </label>
      <input
        type={type} placeholder={placeholder} value={value} onChange={onChange}
        onFocus={()=>sf(true)} onBlur={()=>sf(false)}
        style={{ width:"100%", padding:"10px 13px", borderRadius:"9px", border:"1px solid "+(f?C.accent:C.inBorder), background:C.inBg, color:C.text, fontSize:"13px", outline:"none", boxSizing:"border-box" }}
      />
    </div>
  )
}

// ─── ALERT BİLEŞENİ ──────────────────────────────────────────────────────────
function Alert({ type, msg }) {
  if (!msg) return null
  const bg = type==="error" ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)"
  const border = type==="error" ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"
  const color = type==="error" ? C.error : C.success
  return (
    <div style={{ background:bg, border:"1px solid "+border, borderRadius:"10px", padding:"10px 14px", fontSize:"12px", color, marginTop:"14px" }}>
      {msg}
    </div>
  )
}

// ─── HARİTA BİLEŞENİ ─────────────────────────────────────────────────────────
function MapPicker({ konum, onKonumSec }) {
  function MapClick() {
    useMapEvents({ click(e) { onKonumSec({ lat: e.latlng.lat, lng: e.latlng.lng }) } })
    return null
  }
  return (
    <div style={{ borderRadius:"10px", overflow:"hidden", border:"1px solid "+C.inBorder, marginTop:"8px" }}>
      <div style={{ background:C.inBg, padding:"8px 12px", fontSize:"11px", color:C.muted, borderBottom:"1px solid "+C.inBorder }}>
        🗺️ Haritaya tıklayarak konum seçin
      </div>
      <MapContainer
        center={konum ? [konum.lat, konum.lng] : [39.9334, 32.8597]}
        zoom={konum ? 15 : 6}
        style={{ height:"220px", width:"100%" }}
      >
        <TileLayer
          attribution='© OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {konum && <Marker position={[konum.lat, konum.lng]} />}
        <MapClick />
      </MapContainer>
      {konum && (
        <div style={{ background:C.inBg, padding:"8px 12px", fontSize:"11px", color:C.success, borderTop:"1px solid "+C.inBorder }}>
          ✅ Konum seçildi: {konum.lat.toFixed(5)}, {konum.lng.toFixed(5)}
        </div>
      )}
    </div>
  )
}

// ─── YASAL MODAL ─────────────────────────────────────────────────────────────
function YasalModal({ tip, onClose }) {
  const [metin, setMetin] = useState("")
  const [loading, setLoading] = useState(true)
  const basliklar = {
    kullanim:{icon:"📋",baslik:"Kullanım Koşulları"},
    kvkk:{icon:"🔐",baslik:"KVKK Aydınlatma Metni"},
    gizlilik:{icon:"🔏",baslik:"Gizlilik Politikası"},
    iade:{icon:"↩️",baslik:"İade & İptal"},
  }
  const info = basliklar[tip] || { icon:"📄", baslik:"Yasal Metin" }
  useEffect(() => {
    sb.from("ayarlar").select("deger").eq("id","yasal_"+tip).maybeSingle()
      .then(({ data }) => { setMetin(data?.deger || "Bu metin henüz eklenmemiştir."); setLoading(false) })
  }, [tip])
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:"16px" }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:C.card, border:"1px solid "+C.border, borderRadius:"18px", width:"100%", maxWidth:"640px", maxHeight:"88vh", display:"flex", flexDirection:"column" }}>
        <div style={{ padding:"20px 24px", borderBottom:"1px solid "+C.border, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:"15px", fontWeight:"800" }}>{info.icon} {info.baslik}</div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:C.muted, fontSize:"22px", cursor:"pointer" }}>✕</button>
        </div>
        <div style={{ overflowY:"auto", padding:"24px", flex:1 }}>
          {loading
            ? <div style={{ textAlign:"center", color:C.dim, padding:"40px" }}>⏳ Yükleniyor...</div>
            : <div style={{ fontSize:"13px", color:C.muted, lineHeight:"1.9", whiteSpace:"pre-wrap" }}>{metin}</div>
          }
        </div>
        <div style={{ padding:"16px 24px", borderTop:"1px solid "+C.border, textAlign:"right" }}>
          <button onClick={onClose} style={{ ...btnP, padding:"10px 24px", fontSize:"13px", boxShadow:"none" }}>Kapat</button>
        </div>
      </div>
    </div>
  )
}

// ─── FOOTER MODAL ─────────────────────────────────────────────────────────────
function FooterModal({ tip, onClose }) {
  const [form, setForm] = useState({ ad:"", tel:"", mesaj:"" })
  const [yukleniyor, setYukleniyor] = useState(false)
  const [msg, setMsg] = useState({ type:"", text:"" })
  const basliklar = {
    kimiz:{icon:"🏢",baslik:"Biz Kimiz"},
    iletisim:{icon:"📨",baslik:"İletişim"},
    sikayet:{icon:"⚠️",baslik:"Şikayet"},
    oneri:{icon:"💡",baslik:"Öneri & İstek"},
    sss:{icon:"❓",baslik:"Sık Sorulan Sorular"}
  }
  const sss = [
    { s:"Nasıl kurye olabilirim?", c:"Anasayfadan 'Kurye Ol' butonuna tıklayarak ücretsiz kayıt olabilirsiniz." },
    { s:"Ödeme ne zaman yapılır?", c:"Tamamlanan teslimatların ödemeleri ayın ilk iş günü hesabınıza aktarılır." },
    { s:"Hangi araçlarla çalışabilirim?", c:"Motorsiklet, otomobil, kamyonet ve kamyon ile çalışabilirsiniz." },
    { s:"Referans sistemi nasıl çalışır?", c:"Davet kodunuzla kayıt olan kişilerin işlemlerinden prim kazanırsınız." },
    { s:"Teslimat bölgesi var mı?", c:"Şu an tüm Türkiye genelinde hizmet vermekteyiz." }
  ]
  const gonder = async () => {
    if (!form.ad||!form.mesaj) { setMsg({ type:"error", text:"Ad ve mesaj zorunlu!" }); return }
    setYukleniyor(true)
    await sb.from("talepler").insert({ tip, ad:form.ad, tel:form.tel, mesaj:form.mesaj, okundu:false, created_at:new Date().toISOString() })
    setMsg({ type:"success", text:"✅ Talebiniz alındı!" })
    setYukleniyor(false)
    setTimeout(onClose, 2500)
  }
  const h = basliklar[tip] || { icon:"📋", baslik:"Bilgi" }
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:"16px" }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:C.card, border:"1px solid "+C.border, borderRadius:"18px", padding:"28px", width:"100%", maxWidth:"480px", maxHeight:"85vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
          <div style={{ fontSize:"17px", fontWeight:"800" }}>{h.icon} {h.baslik}</div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:C.muted, fontSize:"22px", cursor:"pointer" }}>✕</button>
        </div>
        {tip==="kimiz" && (
          <div style={{ fontSize:"13px", color:C.muted, lineHeight:"2" }}>
            <p><b style={{color:C.text}}>MotoTeslim</b>, Türkiye genelinde hızlı ve güvenilir teslimat hizmeti sunan yerli bir platformdur.</p>
            <p style={{color:C.accent, fontWeight:"700", marginTop:"10px"}}>📧 info@mototeslim.com</p>
          </div>
        )}
        {tip==="sss" && (
          <div>
            {sss.map((x,i) => (
              <div key={i} style={{ borderBottom:"1px solid "+C.border, paddingBottom:"14px", marginBottom:"14px" }}>
                <div style={{ fontSize:"13px", fontWeight:"700", marginBottom:"6px" }}>❓ {x.s}</div>
                <div style={{ fontSize:"12px", color:C.muted, lineHeight:"1.7" }}>{x.c}</div>
              </div>
            ))}
          </div>
        )}
        {["iletisim","sikayet","oneri"].includes(tip) && (
          <div>
            {[
              { l:"Adınız Soyadınız *", k:"ad", ph:"Adınız" },
              { l:"Telefon", k:"tel", ph:"05xx xxx xx xx" },
              { l:"Mesajınız *", k:"mesaj", ph:"Mesajınızı yazın...", multi:true }
            ].map(f => (
              <div key={f.k} style={{ marginBottom:"14px" }}>
                <div style={{ fontSize:"11px", color:C.muted, fontWeight:"600", marginBottom:"5px" }}>{f.l}</div>
                {f.multi
                  ? <textarea value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))} placeholder={f.ph} rows={4}
                      style={{ width:"100%", padding:"10px 12px", borderRadius:"10px", border:"1px solid "+C.inBorder, background:C.inBg, color:C.text, fontSize:"13px", outline:"none", resize:"vertical", boxSizing:"border-box", fontFamily:"inherit" }}/>
                  : <input value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))} placeholder={f.ph}
                      style={{ width:"100%", padding:"10px 12px", borderRadius:"10px", border:"1px solid "+C.inBorder, background:C.inBg, color:C.text, fontSize:"13px", outline:"none", boxSizing:"border-box" }}/>
                }
              </div>
            ))}
            {msg.text && (
              <div style={{ padding:"10px 12px", borderRadius:"8px", marginBottom:"12px", fontSize:"12px", fontWeight:"600", background:msg.type==="success"?"rgba(34,197,94,0.15)":"rgba(239,68,68,0.15)", color:msg.type==="success"?C.success:C.error }}>
                {msg.text}
              </div>
            )}
            <button onClick={gonder} disabled={yukleniyor}
              style={{ ...btnP, width:"100%", boxShadow:"none", opacity:yukleniyor?0.7:1 }}>
              {yukleniyor ? "⏳ Gönderiliyor..." : "📩 Gönder"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── SÖZLEŞME ONAY BİLEŞENİ ──────────────────────────────────────────────────
function Sozlesmeler({ sozlesme, setSozlesme, kvkk, setKvkk, onYasal }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"8px", marginTop:"12px" }}>
      {[
        { s:sozlesme, fn:setSozlesme, tip:"kullanim", label:"Kullanım Koşulları ve Satış Sözleşmesini" },
        { s:kvkk, fn:setKvkk, tip:"kvkk", label:"KVKK Aydınlatma Metnini" }
      ].map(x => (
        <label key={x.tip} style={{ display:"flex", alignItems:"flex-start", gap:"10px", cursor:"pointer", padding:"9px 12px", borderRadius:"9px", border:"1px solid "+(x.s?"rgba(34,197,94,0.4)":"rgba(239,68,68,0.2)"), background:x.s?"rgba(34,197,94,0.05)":"rgba(239,68,68,0.03)" }}>
          <input type="checkbox" checked={x.s} onChange={e=>x.fn(e.target.checked)} style={{ width:"15px", height:"15px", accentColor:C.success, cursor:"pointer", flexShrink:0, marginTop:"2px" }}/>
          <span style={{ fontSize:"12px", color:C.muted }}>
            <span onClick={e=>{e.preventDefault();onYasal(x.tip)}} style={{ color:"#60a5fa", textDecoration:"underline", cursor:"pointer" }}>{x.label}</span> okudum ve kabul ediyorum. *
          </span>
        </label>
      ))}
    </div>
  )
}

// ─── KURYE GİRİŞ MODALI ──────────────────────────────────────────────────────
function KuryeGiris({ onClose, onSuccess }) {
  const [form, setForm] = useState({ tel:"", sifre:"" })
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState({ type:"", msg:"" })
  const [sifreModal, setSifreModal] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]:e.target.value }))

  const giris = async () => {
    if (!form.tel||!form.sifre) { setAlert({ type:"error", msg:"Telefon ve şifre zorunludur." }); return }
    setLoading(true); setAlert({ type:"", msg:"" })
    const tel = telFormat(form.tel)
    const { data, error } = await sb.from("kuryeler").select("*").eq("tel", tel).eq("sifre", form.sifre).maybeSingle()
    if (error||!data) {
      setAlert({ type:"error", msg:"Telefon veya şifre hatalı." })
    } else {
      localStorage.setItem("mt_user", JSON.stringify({ id:data.id, ad:data.ad, soyad:data.soyad, tel:data.tel, tip:"kurye" }))
      onSuccess({ name:data.ad+" "+data.soyad, type:"kurye", tel:data.tel, id:data.id })
    }
    setLoading(false)
  }

  return (
    <div style={modalStyle} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={mBox}>
        <button style={{ position:"absolute", top:"14px", right:"16px", background:"none", border:"none", color:C.muted, fontSize:"22px", cursor:"pointer" }} onClick={onClose}>✕</button>
        <div style={{ fontSize:"18px", fontWeight:"800", marginBottom:"4px" }}>🏍 Kurye Girişi</div>
        <div style={{ fontSize:"12px", color:C.muted, marginBottom:"16px" }}>Hesabına giriş yap</div>
        <Inp label="Telefon" placeholder="0532 123 4567" value={form.tel} onChange={set("tel")}/>
        <Inp label="Şifre" placeholder="••••••••" type="password" value={form.sifre} onChange={set("sifre")}/>
        <Alert type={alert.type} msg={alert.msg}/>
        <button onClick={giris} disabled={loading} style={{ ...btnP, width:"100%", marginTop:"18px", boxShadow:"none", opacity:loading?0.7:1 }}>
          {loading ? "⏳ Giriş yapılıyor..." : "Giriş Yap"}
        </button>
        <div style={{ textAlign:"center", marginTop:"12px" }}>
          <span onClick={()=>setSifreModal(true)} style={{ fontSize:"12px", color:C.muted, cursor:"pointer", textDecoration:"underline" }}>
            Şifremi unuttum
          </span>
        </div>
      </div>
      {sifreModal && <SifreUnuttum tip="kurye" onClose={()=>setSifreModal(false)}/>}
    </div>
  )
}

// ─── ŞİFREMİ UNUTTUM ─────────────────────────────────────────────────────────
function SifreUnuttum({ tip, onClose }) {
  const [tel, setTel] = useState("")
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState({ type:"", msg:"" })

  const gonder = async () => {
    if (!tel.trim()) { setAlert({ type:"error", msg:"Telefon numaranızı girin." }); return }
    setLoading(true); setAlert({ type:"", msg:"" })
    const t = telFormat(tel)
    const tablo = tip==="kurye" ? "kuryeler" : "musteriler"
    const { data } = await sb.from(tablo).select("ad, sifre").eq("tel", t).maybeSingle()
    if (!data) {
      setAlert({ type:"error", msg:"Bu telefon numarası kayıtlı değil." })
    } else {
      const mesaj = `MotoTeslim: Sayın ${data.ad}, şifreniz: ${data.sifre}`
      const ok = await smsSend(t, mesaj)
      if (ok) {
        setAlert({ type:"success", msg:"✅ Şifreniz SMS ile gönderildi!" })
        setTimeout(onClose, 2500)
      } else {
        setAlert({ type:"error", msg:"SMS gönderilemedi. Lütfen tekrar deneyin." })
      }
    }
    setLoading(false)
  }

  return (
    <div style={modalStyle} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ ...mBox, maxWidth:"420px" }}>
        <button style={{ position:"absolute", top:"14px", right:"16px", background:"none", border:"none", color:C.muted, fontSize:"22px", cursor:"pointer" }} onClick={onClose}>✕</button>
        <div style={{ fontSize:"18px", fontWeight:"800", marginBottom:"4px" }}>🔑 Şifremi Unuttum</div>
        <div style={{ fontSize:"12px", color:C.muted, marginBottom:"16px" }}>Kayıtlı telefon numaranıza şifreniz SMS ile gönderilecektir.</div>
        <Inp label="Telefon" placeholder="0532 123 4567" value={tel} onChange={e=>setTel(e.target.value)}/>
        <Alert type={alert.type} msg={alert.msg}/>
        <button onClick={gonder} disabled={loading} style={{ ...btnP, width:"100%", marginTop:"16px", boxShadow:"none", opacity:loading?0.7:1 }}>
          {loading ? "⏳ Gönderiliyor..." : "📱 SMS Gönder"}
        </button>
      </div>
    </div>
  )
}

// ─── KURYE KAYIT MODALI ───────────────────────────────────────────────────────
function KuryeKayit({ onClose, onSuccess }) {
  const [step, setStep] = useState(1) // 1:kişisel, 2:araç, 3:vergi, 4:otp
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState({ type:"", msg:"" })
  const [sozlesme, setSozlesme] = useState(false)
  const [kvkk, setKvkk] = useState(false)
  const [yasal, setYasal] = useState(null)
  const [otpKod, setOtpKod] = useState("")
  const [otpGirilen, setOtpGirilen] = useState("")
  const [geriSayim, setGeriSayim] = useState(0)
  const [form, setForm] = useState({
    ad:"", soyad:"", tc:"", tel:"", sifre:"",
    arac:"motorsiklet", marka:"", model:"", plaka:"",
    vergiNo:"", vergiD:"", iban:"", refKod:""
  })
  const [err, setErr] = useState({})
  const set = k => e => setForm(f => ({ ...f, [k]:e.target.value }))

  useEffect(() => {
    if (geriSayim > 0) {
      const t = setTimeout(() => setGeriSayim(g => g-1), 1000)
      return () => clearTimeout(t)
    }
  }, [geriSayim])

  const v1 = () => {
    const e = {}
    if (!form.ad.trim()) e.ad = "Zorunlu"
    if (!form.soyad.trim()) e.soyad = "Zorunlu"
    if (!form.tel.trim()) e.tel = "Zorunlu"
    if (form.sifre.length < 6) e.sifre = "En az 6 karakter"
    return e
  }
  const v2 = () => {
    const e = {}
    if (!form.plaka.trim()) e.plaka = "Zorunlu"
    return e
  }

  const next = () => {
    const e = step===1?v1():step===2?v2():{}
    if (Object.keys(e).length) { setErr(e); return }
    setErr({})
    setStep(step+1)
  }

  const otpGonder = async () => {
    setLoading(true); setAlert({ type:"", msg:"" })
    const tel = telFormat(form.tel)

    // Kayıtlı mı kontrol
    const { data:mevcut } = await sb.from("kuryeler").select("id").eq("tel", tel).maybeSingle()
    if (mevcut) { setAlert({ type:"error", msg:"Bu telefon zaten kayıtlı." }); setLoading(false); return }

    const kod = otpUret()
    setOtpKod(kod)

    // OTP'yi geçici olarak tabloya yaz
    await sb.from("kuryeler").upsert({
      tel, otp:kod, otp_zaman:new Date().toISOString(),
      ad:form.ad, soyad:form.soyad, sifre:form.sifre,
      arac_turu:form.arac, plaka:form.plaka, durum:"otp_bekliyor"
    }, { onConflict:"tel" })

    const ok = await smsSend(tel, `MotoTeslim kayit kodunuz: ${kod} - Bu kodu kimseyle paylasmayiniz.`)
    if (ok) {
      setAlert({ type:"success", msg:"✅ Doğrulama kodu gönderildi!" })
      setGeriSayim(60)
      setStep(4)
    } else {
      setAlert({ type:"error", msg:"SMS gönderilemedi. Lütfen tekrar deneyin." })
    }
    setLoading(false)
  }

  const otpDogrula = async () => {
    if (otpGirilen !== otpKod) { setAlert({ type:"error", msg:"Kod hatalı! Tekrar deneyin." }); return }
    setLoading(true)
    const tel = telFormat(form.tel)
    const { error } = await sb.from("kuryeler").update({
      ad:form.ad, soyad:form.soyad, tc:form.tc, sifre:form.sifre,
      arac_turu:form.arac, arac_marka:form.marka, arac_model:form.model,
      plaka:form.plaka, vergi_no:form.vergiNo, vergi_dairesi:form.vergiD,
      iban:form.iban, iban_ad:form.ad+" "+form.soyad,
      durum:"beklemede", otp:null, otp_zaman:null,
      ref_kod:tel, davetci_kod:form.refKod.trim()||null
    }).eq("tel", tel)

    if (error) {
      setAlert({ type:"error", msg:"Kayıt hatası: "+error.message })
    } else {
      localStorage.setItem("mt_user", JSON.stringify({ ad:form.ad, soyad:form.soyad, tel, tip:"kurye" }))
      onSuccess({ name:form.ad+" "+form.soyad, type:"kurye", tel })
    }
    setLoading(false)
  }

  const adimlar = ["Kişisel","Araç","Vergi","Doğrula"]

  return (
    <div style={modalStyle} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={mBox}>
        <button style={{ position:"absolute", top:"14px", right:"16px", background:"none", border:"none", color:C.muted, fontSize:"22px", cursor:"pointer" }} onClick={onClose}>✕</button>

        {/* Adım göstergesi */}
        <div style={{ display:"flex", gap:"4px", marginBottom:"22px" }}>
          {adimlar.map((s,i) => (
            <div key={i} style={{ flex:1, textAlign:"center" }}>
              <div style={{ width:"24px", height:"24px", borderRadius:"50%", margin:"0 auto 4px", background:step>i+1?C.success:step===i+1?C.accent:C.inBg, border:"2px solid "+(step>=i+1?(step>i+1?C.success:C.accent):C.border), display:"flex", alignItems:"center", justifyContent:"center", fontSize:"10px", fontWeight:"700", color:step>=i+1?"#fff":C.dim }}>
                {step>i+1?"✔":i+1}
              </div>
              <div style={{ fontSize:"9px", color:step===i+1?C.accent:C.dim, fontWeight:"600" }}>{s}</div>
            </div>
          ))}
        </div>

        {/* ADIM 1: KİŞİSEL */}
        {step===1 && (
          <>
            <div style={{ fontSize:"18px", fontWeight:"800", marginBottom:"12px" }}>🏍 Kurye Ol</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
              <div><Inp label="Ad" placeholder="Ahmet" value={form.ad} onChange={set("ad")}/>{err.ad&&<div style={{color:C.error,fontSize:"10px"}}>{err.ad}</div>}</div>
              <div><Inp label="Soyad" placeholder="Yılmaz" value={form.soyad} onChange={set("soyad")}/>{err.soyad&&<div style={{color:C.error,fontSize:"10px"}}>{err.soyad}</div>}</div>
            </div>
            <Inp label="TC Kimlik No" placeholder="12345678901" value={form.tc} onChange={set("tc")} optional/>
            <div><Inp label="Telefon" placeholder="0532 123 4567" value={form.tel} onChange={set("tel")}/>{err.tel&&<div style={{color:C.error,fontSize:"10px"}}>{err.tel}</div>}</div>
            <div><Inp label="Şifre" placeholder="En az 6 karakter" type="password" value={form.sifre} onChange={set("sifre")}/>{err.sifre&&<div style={{color:C.error,fontSize:"10px"}}>{err.sifre}</div>}</div>
            <Inp label="Referans Kodu" placeholder="Sizi davet edenin tel no" value={form.refKod} onChange={set("refKod")} optional/>
          </>
        )}

        {/* ADIM 2: ARAÇ */}
        {step===2 && (
          <>
            <div style={{ fontSize:"18px", fontWeight:"800", marginBottom:"12px" }}>🚗 Araç Bilgileri</div>
            <div style={{ display:"flex", gap:"8px", marginBottom:"12px" }}>
              {[{v:"motorsiklet",e:"🏍",l:"Motorsiklet"},{v:"otomobil",e:"🚗",l:"Otomobil"},{v:"kamyonet",e:"🚚",l:"Kamyonet"}].map(a => (
                <div key={a.v} onClick={()=>setForm(f=>({...f,arac:a.v}))}
                  style={{ flex:1, padding:"10px 6px", borderRadius:"10px", textAlign:"center", cursor:"pointer", border:"2px solid "+(form.arac===a.v?C.accent:C.border), background:form.arac===a.v?C.accentGlow:C.inBg, fontSize:"11px", fontWeight:"700", color:form.arac===a.v?C.accent:C.muted }}>
                  <div style={{ fontSize:"18px", marginBottom:"3px" }}>{a.e}</div>
                  <div>{a.l}</div>
                </div>
              ))}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
              <Inp label="Araç Markası" placeholder="Honda" value={form.marka} onChange={set("marka")} optional/>
              <Inp label="Araç Modeli" placeholder="PCX 125" value={form.model} onChange={set("model")} optional/>
            </div>
            <div><Inp label="Plaka" placeholder="34 ABC 123" value={form.plaka} onChange={set("plaka")}/>{err.plaka&&<div style={{color:C.error,fontSize:"10px"}}>{err.plaka}</div>}</div>
          </>
        )}

        {/* ADIM 3: VERGİ + SÖZLEŞME */}
        {step===3 && (
          <>
            <div style={{ fontSize:"18px", fontWeight:"800", marginBottom:"12px" }}>📋 Vergi Bilgileri</div>
            <Inp label="Vergi No" placeholder="1234567890" value={form.vergiNo} onChange={set("vergiNo")} optional/>
            <Inp label="Vergi Dairesi" placeholder="Kadıköy Vergi Dairesi" value={form.vergiD} onChange={set("vergiD")} optional/>
            <Inp label="IBAN" placeholder="TR00 0000 0000 0000 0000 0000 00" value={form.iban} onChange={set("iban")} optional/>
            <Sozlesmeler sozlesme={sozlesme} setSozlesme={setSozlesme} kvkk={kvkk} setKvkk={setKvkk} onYasal={setYasal}/>
          </>
        )}

        {/* ADIM 4: OTP DOĞRULAMA */}
        {step===4 && (
          <>
            <div style={{ fontSize:"18px", fontWeight:"800", marginBottom:"8px" }}>📱 Telefon Doğrulama</div>
            <div style={{ background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:"10px", padding:"12px", marginBottom:"12px", fontSize:"12px", color:C.success }}>
              <b>{form.tel}</b> numarasına 6 haneli kod gönderildi.
            </div>
            <label style={{ display:"block", fontSize:"11px", fontWeight:"700", color:C.muted, letterSpacing:"0.5px", textTransform:"uppercase", marginBottom:"5px", marginTop:"14px" }}>Doğrulama Kodu</label>
            <input
              value={otpGirilen} onChange={e=>setOtpGirilen(e.target.value)}
              placeholder="123456" maxLength={6}
              style={{ width:"100%", padding:"14px", borderRadius:"9px", border:"1px solid "+C.inBorder, background:C.inBg, color:C.text, fontSize:"22px", fontWeight:"800", textAlign:"center", letterSpacing:"10px", outline:"none", boxSizing:"border-box" }}
            />
            <div style={{ textAlign:"center", marginTop:"10px" }}>
              {geriSayim > 0
                ? <span style={{ fontSize:"12px", color:C.dim }}>Yeniden gönder: {geriSayim}s</span>
                : <span onClick={otpGonder} style={{ fontSize:"12px", color:C.accent, cursor:"pointer", textDecoration:"underline" }}>Kodu tekrar gönder</span>
              }
            </div>
          </>
        )}

        <Alert type={alert.type} msg={alert.msg}/>

        {/* BUTONLAR */}
        <div style={{ display:"flex", gap:"10px", marginTop:"20px" }}>
          {step>1 && step<4 && (
            <button onClick={()=>setStep(step-1)} style={{ ...btnS, flex:"none", padding:"10px 18px", fontSize:"13px" }}>← Geri</button>
          )}
          {step===1 && (
            <button onClick={next} style={{ ...btnP, flex:1, padding:"11px", boxShadow:"none" }}>Devam →</button>
          )}
          {step===2 && (
            <button onClick={next} style={{ ...btnP, flex:1, padding:"11px", boxShadow:"none" }}>Devam →</button>
          )}
          {step===3 && (
            <button onClick={otpGonder} disabled={loading||!sozlesme||!kvkk}
              style={{ ...btnP, flex:1, padding:"11px", boxShadow:"none", opacity:(loading||!sozlesme||!kvkk)?0.5:1 }}>
              {loading ? "⏳ Gönderiliyor..." : "📱 SMS Kodu Gönder"}
            </button>
          )}
          {step===4 && (
            <button onClick={otpDogrula} disabled={loading||otpGirilen.length<6}
              style={{ ...btnP, flex:1, padding:"11px", boxShadow:"none", opacity:(loading||otpGirilen.length<6)?0.5:1 }}>
              {loading ? "⏳ Doğrulanıyor..." : "✅ Kaydı Tamamla"}
            </button>
          )}
        </div>
      </div>
      {yasal && <YasalModal tip={yasal} onClose={()=>setYasal(null)}/>}
    </div>
  )
}

// ─── GÖNDERİCİ MODAL ─────────────────────────────────────────────────────────
function GondericiModal({ onClose, onSuccess }) {
  const [tab, setTab] = useState("giris")
  const [alert, setAlert] = useState({ type:"", msg:"" })
  const [loading, setLoading] = useState(false)
  const [sozlesme, setSozlesme] = useState(false)
  const [kvkk, setKvkk] = useState(false)
  const [yasal, setYasal] = useState(null)
  const [sifreModal, setSifreModal] = useState(false)
  const [otpKod, setOtpKod] = useState("")
  const [otpGirilen, setOtpGirilen] = useState("")
  const [otpAdim, setOtpAdim] = useState(false)
  const [geriSayim, setGeriSayim] = useState(0)
  const [form, setForm] = useState({ ad:"", soyad:"", tel:"", sifre:"", adres:"", refKod:"" })
  const [err, setErr] = useState({})
  const set = k => e => setForm(f => ({ ...f, [k]:e.target.value }))

  useEffect(() => {
    if (geriSayim > 0) {
      const t = setTimeout(() => setGeriSayim(g => g-1), 1000)
      return () => clearTimeout(t)
    }
  }, [geriSayim])

  // GİRİŞ
  const giris = async () => {
    if (!form.tel||!form.sifre) { setAlert({ type:"error", msg:"Telefon ve şifre zorunludur." }); return }
    setLoading(true); setAlert({ type:"", msg:"" })
    const tel = telFormat(form.tel)
    const { data } = await sb.from("musteriler").select("*").eq("tel", tel).eq("sifre", form.sifre).maybeSingle()
    if (!data) {
      setAlert({ type:"error", msg:"Telefon veya şifre hatalı." })
    } else {
      localStorage.setItem("mt_user", JSON.stringify({ id:data.id, ad:data.ad, soyad:data.soyad, tel:data.tel, tip:"musteri", adres:data.adres||"" }))
      onSuccess({ name:data.ad+" "+data.soyad, type:"uye", tel:data.tel, adres:data.adres||"" }, true)
    }
    setLoading(false)
  }

  // OTP GÖNDER
  const otpGonder = async () => {
    const e = {}
    if (!form.ad.trim()) e.ad="Zorunlu"
    if (!form.soyad.trim()) e.soyad="Zorunlu"
    if (!form.tel.trim()) e.tel="Zorunlu"
    if (form.sifre.length<6) e.sifre="En az 6 karakter"
    if (Object.keys(e).length) { setErr(e); return }
    setLoading(true); setAlert({ type:"", msg:"" })
    const tel = telFormat(form.tel)

    const { data:mevcut } = await sb.from("musteriler").select("id").eq("tel", tel).maybeSingle()
    if (mevcut) { setAlert({ type:"error", msg:"Bu telefon zaten kayıtlı. Giriş yapın." }); setLoading(false); return }

    const kod = otpUret()
    setOtpKod(kod)
    await sb.from("musteriler").upsert({
      tel, otp:kod, otp_zaman:new Date().toISOString(),
      ad:form.ad, soyad:form.soyad, sifre:form.sifre, adres:form.adres
    }, { onConflict:"tel" })
    const ok = await smsSend(tel, `MotoTeslim kayit kodunuz: ${kod} - Bu kodu kimseyle paylasmayiniz.`)
    if (ok) {
      setAlert({ type:"success", msg:"✅ Doğrulama kodu gönderildi!" })
      setOtpAdim(true)
      setGeriSayim(60)
    } else {
      setAlert({ type:"error", msg:"SMS gönderilemedi." })
    }
    setLoading(false)
  }

  // OTP DOĞRULA
  const otpDogrula = async () => {
    if (otpGirilen !== otpKod) { setAlert({ type:"error", msg:"Kod hatalı!" }); return }
    setLoading(true)
    const tel = telFormat(form.tel)
    await sb.from("musteriler").update({
      ad:form.ad, soyad:form.soyad, sifre:form.sifre,
      adres:form.adres, ref_kod:tel,
      davetci_kod:form.refKod.trim()||null,
      bakiye:0, otp:null, otp_zaman:null
    }).eq("tel", tel)
    localStorage.setItem("mt_user", JSON.stringify({ ad:form.ad, soyad:form.soyad, tel, tip:"musteri", adres:form.adres }))
    onSuccess({ name:form.ad+" "+form.soyad, type:"uye", tel, adres:form.adres }, true)
    setLoading(false)
  }

  // MİSAFİR
  const misafir = () => {
    const e = {}
    if (!form.ad.trim()) e.ad="Zorunlu"
    if (!form.soyad.trim()) e.soyad="Zorunlu"
    if (!form.tel.trim()) e.tel="Zorunlu"
    if (!form.adres.trim()) e.adres="Zorunlu"
    if (Object.keys(e).length) { setErr(e); return }
    onSuccess({ name:form.ad+" "+form.soyad, type:"misafir", tel:form.tel, adres:form.adres })
  }

  return (<>
    <div style={modalStyle} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={mBox}>
        <button style={{ position:"absolute", top:"14px", right:"16px", background:"none", border:"none", color:C.muted, fontSize:"22px", cursor:"pointer" }} onClick={onClose}>✕</button>
        <div style={{ fontSize:"18px", fontWeight:"800", marginBottom:"4px" }}>📦 Paket Gönder</div>
        <div style={{ fontSize:"12px", color:C.muted, marginBottom:"16px" }}>Giriş yap veya misafir olarak devam et</div>

        <div style={{ display:"flex", gap:"6px", marginBottom:"20px", background:C.inBg, borderRadius:"10px", padding:"4px" }}>
          {[["giris","Giriş Yap"],["kayit","Kayıt Ol"],["misafir","Misafir"]].map(([v,l]) => (
            <button key={v} onClick={()=>{setTab(v);setErr({});setAlert({type:"",msg:""});setOtpAdim(false)}}
              style={{ flex:1, padding:"8px", borderRadius:"7px", border:"none", background:tab===v?C.accent:"transparent", color:tab===v?"#fff":C.muted, fontSize:"12px", fontWeight:"700", cursor:"pointer" }}>
              {l}
            </button>
          ))}
        </div>

        {/* GİRİŞ */}
        {tab==="giris" && (
          <>
            <Inp label="Telefon" placeholder="0532 123 4567" value={form.tel} onChange={set("tel")}/>
            <Inp label="Şifre" placeholder="••••••••" type="password" value={form.sifre} onChange={set("sifre")}/>
            <Alert type={alert.type} msg={alert.msg}/>
            <button onClick={giris} disabled={loading} style={{ ...btnP, width:"100%", marginTop:"16px", boxShadow:"none", opacity:loading?0.7:1 }}>
              {loading ? "⏳ Giriş yapılıyor..." : "Giriş Yap"}
            </button>
            <div style={{ textAlign:"center", marginTop:"12px" }}>
              <span onClick={()=>setSifreModal(true)} style={{ fontSize:"12px", color:C.muted, cursor:"pointer", textDecoration:"underline" }}>Şifremi unuttum</span>
            </div>
          </>
        )}

        {/* KAYIT */}
        {tab==="kayit" && !otpAdim && (
          <>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
              <div><Inp label="Ad" placeholder="Ahmet" value={form.ad} onChange={set("ad")}/>{err.ad&&<div style={{color:C.error,fontSize:"10px"}}>{err.ad}</div>}</div>
              <div><Inp label="Soyad" placeholder="Yılmaz" value={form.soyad} onChange={set("soyad")}/>{err.soyad&&<div style={{color:C.error,fontSize:"10px"}}>{err.soyad}</div>}</div>
            </div>
            <div><Inp label="Telefon" placeholder="0532 123 4567" value={form.tel} onChange={set("tel")}/>{err.tel&&<div style={{color:C.error,fontSize:"10px"}}>{err.tel}</div>}</div>
            <div><Inp label="Şifre" placeholder="En az 6 karakter" type="password" value={form.sifre} onChange={set("sifre")}/>{err.sifre&&<div style={{color:C.error,fontSize:"10px"}}>{err.sifre}</div>}</div>
            <Inp label="Adres" placeholder="Mahalle, Sokak, No..." value={form.adres} onChange={set("adres")} optional/>
            <Sozlesmeler sozlesme={sozlesme} setSozlesme={setSozlesme} kvkk={kvkk} setKvkk={setKvkk} onYasal={setYasal}/>
            <Alert type={alert.type} msg={alert.msg}/>
            <button onClick={otpGonder} disabled={loading||!sozlesme||!kvkk}
              style={{ ...btnP, width:"100%", marginTop:"16px", boxShadow:"none", opacity:(loading||!sozlesme||!kvkk)?0.5:1 }}>
              {loading ? "⏳ Gönderiliyor..." : "📱 SMS Kodu Gönder"}
            </button>
          </>
        )}

        {/* OTP ADIMI */}
        {tab==="kayit" && otpAdim && (
          <>
            <div style={{ background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:"10px", padding:"12px", marginBottom:"12px", fontSize:"12px", color:C.success }}>
              📱 <b>{form.tel}</b> numarasına 6 haneli kod gönderildi.
            </div>
            <label style={{ display:"block", fontSize:"11px", fontWeight:"700", color:C.muted, letterSpacing:"0.5px", textTransform:"uppercase", marginBottom:"5px", marginTop:"14px" }}>Doğrulama Kodu</label>
            <input value={otpGirilen} onChange={e=>setOtpGirilen(e.target.value)} placeholder="123456" maxLength={6}
              style={{ width:"100%", padding:"14px", borderRadius:"9px", border:"1px solid "+C.inBorder, background:C.inBg, color:C.text, fontSize:"22px", fontWeight:"800", textAlign:"center", letterSpacing:"10px", outline:"none", boxSizing:"border-box" }}/>
            <div style={{ textAlign:"center", marginTop:"10px" }}>
              {geriSayim > 0
                ? <span style={{ fontSize:"12px", color:C.dim }}>Yeniden gönder: {geriSayim}s</span>
                : <span onClick={otpGonder} style={{ fontSize:"12px", color:C.accent, cursor:"pointer", textDecoration:"underline" }}>Kodu tekrar gönder</span>
              }
            </div>
            <Alert type={alert.type} msg={alert.msg}/>
            <button onClick={otpDogrula} disabled={loading||otpGirilen.length<6}
              style={{ ...btnP, width:"100%", marginTop:"16px", boxShadow:"none", opacity:(loading||otpGirilen.length<6)?0.5:1 }}>
              {loading ? "⏳ Doğrulanıyor..." : "✅ Kayıt Tamamla"}
            </button>
          </>
        )}

        {/* MİSAFİR */}
        {tab==="misafir" && (
          <>
            <div style={{ background:C.accentGlow, border:"1px solid rgba(232,80,10,0.3)", borderRadius:"10px", padding:"10px 13px", fontSize:"12px", color:C.accentL, marginBottom:"14px" }}>
              👋 Hesap açmadan da gönderim yapabilirsin.
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
              <div><Inp label="Ad" placeholder="Ahmet" value={form.ad} onChange={set("ad")}/>{err.ad&&<div style={{color:C.error,fontSize:"10px"}}>{err.ad}</div>}</div>
              <div><Inp label="Soyad" placeholder="Yılmaz" value={form.soyad} onChange={set("soyad")}/>{err.soyad&&<div style={{color:C.error,fontSize:"10px"}}>{err.soyad}</div>}</div>
            </div>
            <div><Inp label="Telefon" placeholder="0532 123 4567" value={form.tel} onChange={set("tel")}/>{err.tel&&<div style={{color:C.error,fontSize:"10px"}}>{err.tel}</div>}</div>
            <div><Inp label="Adres" placeholder="Tam adresiniz" value={form.adres} onChange={set("adres")}/>{err.adres&&<div style={{color:C.error,fontSize:"10px"}}>{err.adres}</div>}</div>
            <Sozlesmeler sozlesme={sozlesme} setSozlesme={setSozlesme} kvkk={kvkk} setKvkk={setKvkk} onYasal={setYasal}/>
            <button onClick={misafir} disabled={!sozlesme||!kvkk}
              style={{ ...btnP, width:"100%", marginTop:"16px", boxShadow:"none", opacity:(!sozlesme||!kvkk)?0.5:1 }}>
              Misafir Olarak Devam →
            </button>
          </>
        )}
      </div>
    </div>
    {sifreModal && <SifreUnuttum tip="musteri" onClose={()=>setSifreModal(false)}/>}
    {yasal && <YasalModal tip={yasal} onClose={()=>setYasal(null)}/>}
  </>)
}

// ─── PAKET GÖNDER ────────────────────────────────────────────────────────────
function PaketGonder({ user, onClose }) {
  const [step, setStep] = useState(1)
  const [farkliAdres, setFarkliAdres] = useState(false)
  const [gonKonum, setGonKonum] = useState(null)
  const [alKonum, setAlKonum] = useState(null)
  const [haritaAcik, setHaritaAcik] = useState(null)
  const [form, setForm] = useState({
    gonAd:user?user.name.split(" ")[0]||"":"", gonSoyad:user?user.name.split(" ")[1]||"":"",
    gonTel:user?user.tel||"":"", gonAdres:user?user.adres||"":"",
    alAd:"", alSoyad:"", alTel:"", alAdres:"",
    agirlik:"", en:"", boy:"", yukseklik:"", aciklama:"",
    odemeYontemi:"kart", kartNo:"", kartAd:"", sson:"", cvv:""
  })
  const [err, setErr] = useState({})
  const [done, setDone] = useState(false)
  const [mesafe, setMesafe] = useState(0)
  const [sure, setSure] = useState("")
  const set = k => e => setForm(f => ({ ...f, [k]:typeof e==="object"&&e.target?e.target.value:e }))

  const kg = parseFloat(form.agirlik)||0
  const desi = (parseFloat(form.en)||0)*(parseFloat(form.boy)||0)*(parseFloat(form.yukseklik)||0)/3000
  const efKg = kg>20&&desi>0 ? Math.max(kg,desi) : kg

  const aracTipi = (() => {
    if (efKg<=0) return null
    if (efKg<=15&&mesafe<=15) return "motorsiklet"
    if (efKg<=250) return "otomobil"
    if (efKg<=3000) return "kamyonet"
    return "kamyon"
  })()

  const aracLabel = { motorsiklet:"🏍 Motorsiklet", otomobil:"🚗 Otomobil", kamyonet:"🚚 Kamyonet", kamyon:"🚛 Kamyon" }[aracTipi] || "—"

  const fiyatHesapla = (tip, km) => {
    const mM = km * 1000
    if (!tip||km<=0) return 0
    if (tip==="motorsiklet") return km<1 ? 90 : 70+Math.ceil(mM/100)*2
    if (tip==="otomobil") return 90+Math.ceil(mM/100)*5
    if (tip==="kamyonet") return km<=10 ? 750+Math.ceil(mM/100)*22 : 750+Math.ceil(km)*23
    if (tip==="kamyon") return km<=10 ? 1500+Math.ceil(mM/100)*35 : 1500+Math.ceil(km)*45
    return 0
  }
  const fiyat = efKg>0&&mesafe>0 ? fiyatHesapla(aracTipi, mesafe) : 0
  const komisyon = Math.ceil(fiyat*0.30)

  const haversine = (lat1,lon1,lat2,lon2) => {
    const R=6371, dLat=(lat2-lat1)*Math.PI/180, dLon=(lon2-lon1)*Math.PI/180
    const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2
    const km=R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))
    return km<0.5?0:Math.ceil(km*1.35)
  }

  useEffect(() => {
    if (gonKonum&&alKonum) {
      const km = haversine(gonKonum.lat,gonKonum.lng,alKonum.lat,alKonum.lng)
      setMesafe(km)
      const dk = km>0?Math.ceil(km*2.5):0
      setSure(dk>=60?Math.floor(dk/60)+"sa "+(dk%60)+"dk":dk>0?dk+" dk":"")
    }
  }, [gonKonum, alKonum])

  const v1 = () => {
    const e = {}
    if (farkliAdres||!user||!user.adres) {
      if (!form.gonAd) e.gonAd="Zorunlu"
      if (!form.gonTel) e.gonTel="Zorunlu"
      if (!gonKonum) e.gonKonum="Haritadan konum seçin"
    }
    if (!form.alAd) e.alAd="Zorunlu"
    if (!form.alTel) e.alTel="Zorunlu"
    if (!alKonum) e.alKonum="Haritadan konum seçin"
    if (!form.agirlik) e.agirlik="Ağırlık zorunludur"
    return e
  }

  const next = async () => {
    const e = step===1?v1():{}
    if (Object.keys(e).length) { setErr(e); return }
    setErr({})
    if (step===2) {
      try {
        const localUser = JSON.parse(localStorage.getItem("mt_user")||"{}")
        await sb.from("teslimatlar").insert({
          musteri_id: localUser.id||null,
          gon_ad: (farkliAdres?form.gonAd:(user?user.name.split(" ")[0]:""))+" "+(farkliAdres?form.gonSoyad:(user?user.name.split(" ")[1]||"":"")),
          gon_tel: farkliAdres?form.gonTel:(user?user.tel:""),
          gon_adres: form.gonAdres,
          gon_lat: gonKonum?.lat||null,
          gon_lng: gonKonum?.lng||null,
          al_ad: form.alAd+" "+form.alSoyad,
          al_tel: form.alTel,
          al_adres: form.alAdres,
          al_lat: alKonum?.lat||null,
          al_lng: alKonum?.lng||null,
          agirlik:efKg, mesafe:mesafe, fiyat, arac_turu:aracTipi||"motorsiklet", durum:"bekliyor"
        })
      } catch(e) { console.log(e) }
      setDone(true)
    } else setStep(2)
  }

  if (done) return (
    <div style={{ maxWidth:"500px", margin:"40px auto", padding:"0 20px", textAlign:"center" }}>
      <div style={{ fontSize:"56px", marginBottom:"16px" }}>🎉</div>
      <div style={{ fontSize:"20px", fontWeight:"900", marginBottom:"8px" }}>Sipariş Oluşturuldu!</div>
      <div style={{ background:C.card, borderRadius:"14px", padding:"20px", border:"1px solid "+C.border, textAlign:"left", marginBottom:"20px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", fontSize:"12px" }}>
          <div style={{ color:C.muted }}>Sipariş No:</div><div style={{ fontWeight:"700" }}>#MT-{Math.floor(Math.random()*9000+1000)}</div>
          <div style={{ color:C.muted }}>Mesafe:</div><div style={{ fontWeight:"700" }}>{mesafe} km</div>
          <div style={{ color:C.muted }}>Tutar:</div><div style={{ fontWeight:"700", color:C.accent }}>₺{fiyat}</div>
          <div style={{ color:C.muted }}>Araç:</div><div style={{ fontWeight:"700" }}>{aracLabel}</div>
        </div>
      </div>
      <button onClick={onClose} style={{ ...btnP, width:"100%", boxShadow:"none" }}>Tamam ✓</button>
    </div>
  )

  return (
    <div style={{ maxWidth:"600px", margin:"0 auto", padding:"20px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"20px" }}>
        <button onClick={step===1?onClose:()=>setStep(1)} style={{ ...btnS, padding:"8px 14px", fontSize:"12px" }}>← Geri</button>
        <div style={{ fontSize:"18px", fontWeight:"800" }}>📦 Paket Gönder</div>
      </div>
      <div style={{ display:"flex", gap:"4px", marginBottom:"24px" }}>
        {["Adres & Ağırlık","Ödeme"].map((s,i) => (
          <div key={i} style={{ flex:1, textAlign:"center" }}>
            <div style={{ height:"4px", borderRadius:"2px", marginBottom:"6px", background:step>i+1?C.success:step===i+1?C.accent:C.border }}/>
            <div style={{ fontSize:"10px", color:step===i+1?C.accent:C.dim, fontWeight:"700" }}>{s}</div>
          </div>
        ))}
      </div>

      {step===1 && (
        <div>
          {/* GÖNDERİCİ */}
          <div style={{ background:C.card2, borderRadius:"12px", padding:"16px", marginBottom:"12px", border:"1px solid "+C.border }}>
            <div style={{ fontSize:"12px", fontWeight:"700", color:C.accent, marginBottom:"10px" }}>📍 GÖNDERİCİ</div>
            {user&&user.adres ? (
              <div>
                <div style={{ background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:"10px", padding:"12px", marginBottom:"12px" }}>
                  <div style={{ fontSize:"11px", color:C.success, fontWeight:"700", marginBottom:"4px" }}>✔ Kayıtlı Hesabınız</div>
                  <div style={{ fontSize:"13px", fontWeight:"600" }}>{user.name}</div>
                  <div style={{ fontSize:"12px", color:C.muted }}>{user.tel} · {user.adres}</div>
                </div>
                <label style={{ display:"flex", alignItems:"center", gap:"10px", cursor:"pointer", padding:"10px 14px", borderRadius:"9px", border:"1px dashed "+(farkliAdres?C.accent:C.border), background:farkliAdres?"rgba(232,80,10,0.06)":"transparent" }}>
                  <input type="checkbox" checked={farkliAdres} onChange={e=>setFarkliAdres(e.target.checked)} style={{ width:"16px", height:"16px", accentColor:C.accent, cursor:"pointer" }}/>
                  <span style={{ fontSize:"13px", color:farkliAdres?C.accent:C.muted, fontWeight:farkliAdres?"700":"500" }}>📍 Farklı adresten gönderim</span>
                </label>
              </div>
            ) : null}
            {(farkliAdres||!user||!user.adres) && (
              <div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
                  <div><Inp label="Ad" placeholder="Ahmet" value={form.gonAd} onChange={set("gonAd")}/>{err.gonAd&&<div style={{color:C.error,fontSize:"10px"}}>{err.gonAd}</div>}</div>
                  <Inp label="Soyad" placeholder="Yılmaz" value={form.gonSoyad} onChange={set("gonSoyad")}/>
                </div>
                <div><Inp label="Telefon" placeholder="0532..." value={form.gonTel} onChange={set("gonTel")}/>{err.gonTel&&<div style={{color:C.error,fontSize:"10px"}}>{err.gonTel}</div>}</div>
                <Inp label="Adres notu" placeholder="Kat, daire..." value={form.gonAdres} onChange={set("gonAdres")} optional/>
              </div>
            )}
            <div style={{ marginTop:"12px" }}>
              <button onClick={()=>setHaritaAcik(haritaAcik==="gon"?null:"gon")}
                style={{ ...btnS, fontSize:"12px", padding:"8px 14px", borderColor:gonKonum?C.success:C.border, color:gonKonum?C.success:C.text }}>
                {gonKonum?"✅ Konum Seçildi — Değiştir":"🗺️ Haritadan Konum Seç"}
              </button>
              {haritaAcik==="gon" && <MapPicker konum={gonKonum} onKonumSec={k=>{setGonKonum(k);setHaritaAcik(null)}}/>}
              {err.gonKonum && <div style={{color:C.error,fontSize:"10px",marginTop:"4px"}}>{err.gonKonum}</div>}
            </div>
          </div>

          {/* ALICI */}
          <div style={{ background:C.card2, borderRadius:"12px", padding:"16px", marginBottom:"12px", border:"1px solid "+C.border }}>
            <div style={{ fontSize:"12px", fontWeight:"700", color:C.success, marginBottom:"10px" }}>📮 ALICI</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
              <div><Inp label="Ad" placeholder="Mehmet" value={form.alAd} onChange={set("alAd")}/>{err.alAd&&<div style={{color:C.error,fontSize:"10px"}}>{err.alAd}</div>}</div>
              <Inp label="Soyad" placeholder="Kaya" value={form.alSoyad} onChange={set("alSoyad")}/>
            </div>
            <div><Inp label="Telefon" placeholder="0533..." value={form.alTel} onChange={set("alTel")}/>{err.alTel&&<div style={{color:C.error,fontSize:"10px"}}>{err.alTel}</div>}</div>
            <Inp label="Adres notu" placeholder="Kat, daire..." value={form.alAdres} onChange={set("alAdres")} optional/>
            <div style={{ marginTop:"12px" }}>
              <button onClick={()=>setHaritaAcik(haritaAcik==="al"?null:"al")}
                style={{ ...btnS, fontSize:"12px", padding:"8px 14px", borderColor:alKonum?C.success:C.border, color:alKonum?C.success:C.text }}>
                {alKonum?"✅ Konum Seçildi — Değiştir":"🗺️ Haritadan Konum Seç"}
              </button>
              {haritaAcik==="al" && <MapPicker konum={alKonum} onKonumSec={k=>{setAlKonum(k);setHaritaAcik(null)}}/>}
              {err.alKonum && <div style={{color:C.error,fontSize:"10px",marginTop:"4px"}}>{err.alKonum}</div>}
            </div>
          </div>

          {/* PAKET */}
          <div style={{ background:C.card2, borderRadius:"12px", padding:"16px", marginBottom:"12px", border:"1px solid "+C.border }}>
            <div style={{ fontSize:"12px", fontWeight:"700", color:C.muted, marginBottom:"10px" }}>⚖️ PAKET BİLGİSİ</div>
            <div><Inp label="Ağırlık (kg)" placeholder="5" type="number" value={form.agirlik} onChange={set("agirlik")}/>{err.agirlik&&<div style={{color:C.error,fontSize:"10px"}}>{err.agirlik}</div>}</div>
            {kg>20 && (
              <div>
                <div style={{ background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.3)", borderRadius:"10px", padding:"10px", fontSize:"12px", color:C.warn, marginTop:"10px" }}>⚠️ 20 kg üzeri için ölçü giriniz.</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px" }}>
                  <Inp label="En (cm)" placeholder="40" type="number" value={form.en} onChange={set("en")}/>
                  <Inp label="Boy (cm)" placeholder="30" type="number" value={form.boy} onChange={set("boy")}/>
                  <Inp label="Yükseklik" placeholder="20" type="number" value={form.yukseklik} onChange={set("yukseklik")}/>
                </div>
              </div>
            )}
            <Inp label="Açıklama" placeholder="Kırılgan..." value={form.aciklama} onChange={set("aciklama")} optional/>
          </div>

          {/* FİYAT */}
          {gonKonum&&alKonum&&mesafe>0&&fiyat>0 && (
            <div style={{ background:"linear-gradient(135deg,rgba(232,80,10,0.12),rgba(30,58,96,0.25))", border:"1px solid "+C.accent, borderRadius:"14px", padding:"18px", marginBottom:"12px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"10px" }}>
                <div style={{ fontSize:"12px", fontWeight:"700", color:C.accent }}>💰 FİYAT HESAPLAMA</div>
                <div style={{ fontSize:"12px", fontWeight:"800", padding:"4px 10px", borderRadius:"8px", background:"rgba(232,80,10,0.15)", color:C.accent }}>{aracLabel}</div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px", fontSize:"12px", marginBottom:"10px" }}>
                <div style={{ color:C.muted }}>Mesafe:</div><div style={{ fontWeight:"600", color:C.success }}>{mesafe} km {sure?"(~"+sure+")":""}</div>
                <div style={{ color:C.muted }}>Komisyon (%30):</div><div style={{ fontWeight:"600", color:C.muted }}>₺{komisyon}</div>
                <div style={{ color:C.muted }}>Kurye kazancı:</div><div style={{ fontWeight:"600", color:C.success }}>₺{fiyat-komisyon}</div>
              </div>
              <div style={{ borderTop:"1px solid rgba(255,255,255,0.1)", paddingTop:"10px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:"13px", fontWeight:"700" }}>Toplam Ücret</span>
                <span style={{ fontSize:"28px", fontWeight:"900", color:C.accent }}>₺{fiyat}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {step===2 && (
        <div>
          <div style={{ background:C.card2, borderRadius:"12px", padding:"14px", border:"1px solid "+C.border, marginBottom:"16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ fontSize:"12px", color:C.muted }}>Toplam Tutar</div>
            <div style={{ fontSize:"24px", fontWeight:"900", color:C.accent }}>₺{fiyat}</div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"10px", marginBottom:"16px" }}>
            {[{v:"kart",icon:"💳",title:"Yeni Kart",sub:"Visa, Mastercard, Troy"},{v:"kayitli",icon:"⚡",title:"Kayıtlı Kart",sub:"•••• 4521"},{v:"cuzdan",icon:"👛",title:"MotoTeslim Cüzdanı",sub:"Bakiye: ₺850"}].map(o=>(
              <div key={o.v} onClick={()=>setForm(f=>({...f,odemeYontemi:o.v}))}
                style={{ padding:"13px 16px", borderRadius:"12px", cursor:"pointer", border:"2px solid "+(form.odemeYontemi===o.v?C.accent:C.border), background:form.odemeYontemi===o.v?C.accentGlow:C.card2 }}>
                <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                  <span style={{ fontSize:"20px" }}>{o.icon}</span>
                  <div>
                    <div style={{ fontSize:"13px", fontWeight:"700", color:form.odemeYontemi===o.v?C.accent:C.text }}>{o.title}</div>
                    <div style={{ fontSize:"11px", color:C.muted }}>{o.sub}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {form.odemeYontemi==="kart" && (
            <div style={{ background:C.card2, borderRadius:"12px", padding:"16px", border:"1px solid "+C.border }}>
              <Inp label="Kart Numarası" placeholder="1234 5678 9012 3456" value={form.kartNo} onChange={set("kartNo")}/>
              <Inp label="Kart Sahibi" placeholder="AHMET YILMAZ" value={form.kartAd} onChange={set("kartAd")}/>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
                <Inp label="Son Kullanma" placeholder="MM/YY" value={form.sson} onChange={set("sson")}/>
                <Inp label="CVV" placeholder="123" type="password" value={form.cvv} onChange={set("cvv")}/>
              </div>
            </div>
          )}
          <div style={{ display:"flex", alignItems:"center", gap:"8px", marginTop:"14px", padding:"10px 12px", background:"rgba(30,58,96,0.3)", borderRadius:"9px", border:"1px solid "+C.navy }}>
            <span>🔒</span><span style={{ fontSize:"11px", color:C.dim }}>Tüm ödemeler <b style={{color:C.muted}}>PayTR</b> ile 256-bit SSL şifreli.</span>
          </div>
        </div>
      )}

      <div style={{ display:"flex", gap:"10px", marginTop:"22px" }}>
        {step===2 && <button onClick={()=>setStep(1)} style={{ ...btnS, flex:"none", padding:"11px 20px", fontSize:"13px" }}>← Geri</button>}
        <button onClick={next} style={{ ...btnP, flex:1, boxShadow:"none", padding:"12px" }}>
          {step===2 ? "💳 Ödemeyi Tamamla" : "Ödemeye Geç →"}
        </button>
      </div>
    </div>
  )
}

// ─── GEÇMİŞ TESLİMATLAR ──────────────────────────────────────────────────────
function GecmisTeslimatlar({ userId }) {
  const [liste, setListe] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    sb.from("teslimatlar").select("*").eq("kurye_id", userId).eq("durum","tamamlandi").order("created_at",{ascending:false}).limit(20)
      .then(({ data }) => { setListe(data||[]); setLoading(false) })
  }, [])
  const netKazanc = f => Math.ceil((f||0)*0.70)
  if (loading) return <div style={{textAlign:"center",color:C.muted,padding:"30px"}}>⏳ Yükleniyor...</div>
  if (!liste.length) return <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:"13px",padding:"40px",textAlign:"center",color:C.muted,fontSize:"13px"}}>Henüz tamamlanan teslimat yok.</div>
  return (
    <div>
      {liste.map(s => (
        <div key={s.id} style={{background:C.card,border:"1px solid "+C.border,borderRadius:"12px",padding:"14px",marginBottom:"10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:"12px",fontWeight:"600"}}>{s.gon_adres||"Konum kayıtlı"}</div>
            <div style={{fontSize:"11px",color:C.muted,marginTop:"2px"}}>→ {s.al_adres||"Konum kayıtlı"}</div>
            <div style={{fontSize:"10px",color:C.dim,marginTop:"3px"}}>{new Date(s.created_at).toLocaleDateString("tr-TR")}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:"15px",fontWeight:"800",color:C.success}}>₺{netKazanc(s.fiyat)}</div>
            <div style={{fontSize:"10px",color:C.dim,marginTop:"2px"}}>{s.agirlik} kg · {s.mesafe||"—"} km</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── KURYE DASHBOARD ─────────────────────────────────────────────────────────
function KuryeDash({ user, onLogout }) {
  const [tab, setTab] = useState("bekleyen")
  const [siparisler, setSiparisler] = useState([])
  const [aktifSiparis, setAktifSiparis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [teslimKodu, setTeslimKodu] = useState("")
  const [teslimHata, setTeslimHata] = useState("")
  const [stats, setStats] = useState({ toplam:0, buAy:0, kazanc:0 })

  const netKazanc = f => Math.ceil((f||0)*0.70)
  const adGizle = ad => {
    if (!ad) return "—"
    return ad.trim().split(" ").map(p => p.length<=2?p:p.slice(0,2)+"*".repeat(p.length-2)).join(" ")
  }

  const yukle = async () => {
    const { data:bek } = await sb.from("teslimatlar").select("*").eq("durum","bekliyor").order("created_at",{ascending:false})
    const { data:akt } = await sb.from("teslimatlar").select("*").eq("kurye_id",user.id).in("durum",["kabul_edildi","yolda"]).maybeSingle()
    const { data:tam } = await sb.from("teslimatlar").select("*").eq("kurye_id",user.id).eq("durum","tamamlandi")
    setSiparisler(bek||[])
    setAktifSiparis(akt||null)
    const buAy = (tam||[]).filter(t=>{const d=new Date(t.created_at),n=new Date();return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear()})
    setStats({ toplam:(tam||[]).length, buAy:buAy.length, kazanc:Math.ceil((tam||[]).reduce((s,t)=>s+(t.fiyat*0.70),0)) })
    setLoading(false)
  }

  useEffect(() => { yukle(); const i=setInterval(yukle,15000); return ()=>clearInterval(i) }, [])

  const kabul = async (s) => {
    await sb.from("teslimatlar").update({ kurye_id:user.id, durum:"kabul_edildi", kabul_zamani:new Date().toISOString() }).eq("id",s.id)
    setAktifSiparis({...s,kurye_id:user.id,durum:"kabul_edildi"})
    setSiparisler(l=>l.filter(x=>x.id!==s.id))
    setTab("aktif")
    const lat=s.gon_lat, lng=s.gon_lng
    window.open(lat&&lng ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving` : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent((s.gon_adres||"")+", Türkiye")}&travelmode=driving`, "_blank")
  }

  const paketiAldim = async () => {
    const kod = Math.floor(1000+Math.random()*9000).toString()
    await sb.from("teslimatlar").update({ durum:"yolda", teslim_kodu:kod }).eq("id",aktifSiparis.id)
    setAktifSiparis({...aktifSiparis,durum:"yolda",teslim_kodu:kod})
    const lat=aktifSiparis.al_lat, lng=aktifSiparis.al_lng
    window.open(lat&&lng ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving` : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent((aktifSiparis.al_adres||"")+", Türkiye")}&travelmode=driving`, "_blank")
    const ok = await smsSend(aktifSiparis.al_tel, `MotoTeslim teslimat kodunuz: ${kod} - Kuryeye bu kodu veriniz.`)
    alert(ok ? "✅ Teslim kodu SMS ile gönderildi!" : "✅ Teslimat başladı! Kod: "+kod)
  }

  const teslimEt = async () => {
    if (teslimKodu!==aktifSiparis.teslim_kodu) { setTeslimHata("Kod hatalı!"); return }
    await sb.from("teslimatlar").update({ durum:"tamamlandi", tamamlanma_zamani:new Date().toISOString() }).eq("id",aktifSiparis.id)
    const kazanc = netKazanc(aktifSiparis.fiyat)
    const { data:k } = await sb.from("kuryeler").select("bakiye").eq("tel",user.tel).maybeSingle()
    await sb.from("kuryeler").update({ bakiye:(parseFloat(k?.bakiye||0))+kazanc }).eq("tel",user.tel)
    setAktifSiparis(null); setTeslimKodu(""); setTeslimHata(""); setTab("bekleyen"); yukle()
    alert("✅ Tamamlandı! ₺"+kazanc+" eklendi!")
  }

  const sonrakiOdul = 50-(stats.toplam%50)

  return (
    <div style={{ maxWidth:"880px", margin:"0 auto", padding:"24px 20px" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"24px" }}>
        <div>
          <div style={{ fontSize:"20px", fontWeight:"800" }}>Merhaba, {user.name.split(" ")[0]} 👋</div>
          <div style={{ fontSize:"12px", color:C.muted, marginTop:"3px" }}>Kurye Paneli</div>
        </div>
        <button onClick={onLogout} style={{ ...btnS, fontSize:"12px", padding:"7px 14px" }}>Çıkış</button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:"12px", marginBottom:"20px" }}>
        {[
          { l:"Bu Ay Teslimat", v:stats.buAy, s:"adet" },
          { l:"Toplam Teslimat", v:stats.toplam, s:"tüm zamanlar" },
          { l:"Toplam Kazanç", v:"₺"+stats.kazanc, s:"net" },
          { l:"Sonraki Ödül", v:sonrakiOdul+" teslimat", s:"Her 50'de ₺50" }
        ].map(x => (
          <div key={x.l} style={{ background:C.card, border:"1px solid "+C.border, borderRadius:"13px", padding:"16px" }}>
            <div style={{ fontSize:"11px", color:C.muted, fontWeight:"600", marginBottom:"5px" }}>{x.l}</div>
            <div style={{ fontSize:"20px", fontWeight:"800" }}>{x.v}</div>
            <div style={{ fontSize:"11px", color:C.muted, marginTop:"3px" }}>{x.s}</div>
          </div>
        ))}
      </div>

      {aktifSiparis && (
        <div style={{ background:"rgba(34,197,94,0.08)", border:"2px solid "+C.success, borderRadius:"14px", padding:"20px", marginBottom:"20px" }}>
          <div style={{ fontSize:"14px", fontWeight:"800", color:C.success, marginBottom:"14px" }}>
            {aktifSiparis.durum==="kabul_edildi" ? "🏍 Gönderici Adresine Git" : "📦 Alıcıya Teslim Et"}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"16px", fontSize:"12px" }}>
            <div style={{ background:"rgba(232,80,10,0.1)", borderRadius:"10px", padding:"12px" }}>
              <div style={{ color:C.accent, fontWeight:"700", marginBottom:"4px" }}>📍 GÖNDERİCİ</div>
              <div style={{ fontWeight:"600" }}>{aktifSiparis.gon_ad}</div>
              <div style={{ color:C.muted }}>{aktifSiparis.gon_tel}</div>
              <div style={{ color:C.muted }}>{aktifSiparis.gon_adres||"Harita konumu"}</div>
            </div>
            <div style={{ background:"rgba(34,197,94,0.08)", borderRadius:"10px", padding:"12px" }}>
              <div style={{ color:C.success, fontWeight:"700", marginBottom:"4px" }}>📮 ALICI</div>
              <div style={{ fontWeight:"600" }}>{adGizle(aktifSiparis.al_ad)}</div>
              <div style={{ color:C.muted }}>{aktifSiparis.al_tel}</div>
              <div style={{ color:C.muted }}>{aktifSiparis.al_adres||"Harita konumu"}</div>
            </div>
          </div>
          {aktifSiparis.durum==="kabul_edildi" && (
            <div style={{ display:"flex", gap:"10px" }}>
              <button onClick={()=>{const l=aktifSiparis.gon_lat,g=aktifSiparis.gon_lng;window.open(l&&g?`https://www.google.com/maps/dir/?api=1&destination=${l},${g}&travelmode=driving`:`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent((aktifSiparis.gon_adres||"")+", Türkiye")}&travelmode=driving`,"_blank")}}
                style={{ ...btnS, flex:1, fontSize:"13px", padding:"10px" }}>🗺️ Haritayı Aç</button>
              <button onClick={paketiAldim} style={{ ...btnP, flex:1, fontSize:"13px", padding:"10px", boxShadow:"none" }}>📦 Paketi Aldım</button>
            </div>
          )}
          {aktifSiparis.durum==="yolda" && (
            <div>
              <div style={{ background:"rgba(34,197,94,0.05)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:"10px", padding:"12px", marginBottom:"12px", fontSize:"12px", color:C.success }}>
                📱 Teslim kodu müşteriye SMS ile gönderildi.
              </div>
              <div style={{ display:"flex", gap:"10px", alignItems:"center", marginBottom:"10px" }}>
                <input value={teslimKodu} onChange={e=>setTeslimKodu(e.target.value)} placeholder="4 haneli kod" maxLength={4}
                  style={{ flex:1, padding:"12px", borderRadius:"9px", border:"1px solid "+C.inBorder, background:C.inBg, color:C.text, fontSize:"18px", fontWeight:"800", textAlign:"center", letterSpacing:"8px", outline:"none" }}/>
                <button onClick={()=>{const l=aktifSiparis.al_lat,g=aktifSiparis.al_lng;window.open(l&&g?`https://www.google.com/maps/dir/?api=1&destination=${l},${g}&travelmode=driving`:`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent((aktifSiparis.al_adres||"")+", Türkiye")}&travelmode=driving`,"_blank")}}
                  style={{ ...btnS, fontSize:"12px", padding:"12px 14px" }}>🗺️</button>
              </div>
              {teslimHata && <div style={{ color:C.error, fontSize:"11px", marginBottom:"8px" }}>⚠️ {teslimHata}</div>}
              <button onClick={teslimEt} style={{ ...btnP, width:"100%", boxShadow:"none" }}>✅ Teslim Ettim</button>
            </div>
          )}
        </div>
      )}

      <div style={{ display:"flex", gap:"6px", marginBottom:"16px", background:C.inBg, borderRadius:"10px", padding:"4px" }}>
        {[["bekleyen","Bekleyen Siparişler"],["gecmis","Geçmiş"]].map(([v,l]) => (
          <button key={v} onClick={()=>setTab(v)}
            style={{ flex:1, padding:"8px", borderRadius:"7px", border:"none", background:tab===v?C.accent:"transparent", color:tab===v?"#fff":C.muted, fontSize:"12px", fontWeight:"700", cursor:"pointer" }}>
            {l}
          </button>
        ))}
      </div>

      {tab==="bekleyen" && (
        <div>
          {loading && <div style={{textAlign:"center",color:C.muted,padding:"40px"}}>⏳ Yükleniyor...</div>}
          {!loading&&!siparisler.length&&!aktifSiparis && <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:"13px",padding:"50px",textAlign:"center",color:C.muted,fontSize:"13px"}}>🏍 Şu an bekleyen sipariş yok.</div>}
          {siparisler.map(s => (
            <div key={s.id} style={{background:C.card,border:"1px solid "+C.border,borderRadius:"13px",padding:"16px",marginBottom:"12px"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:"10px"}}>
                <div style={{fontSize:"11px",color:C.dim}}>#{s.id.slice(-6).toUpperCase()}</div>
                <div style={{fontSize:"13px",fontWeight:"800",color:C.success}}>₺{netKazanc(s.fiyat)} net</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",fontSize:"12px",marginBottom:"10px"}}>
                <div>
                  <div style={{color:C.accent,fontWeight:"700",fontSize:"10px",marginBottom:"2px"}}>📍 GÖNDERİCİ</div>
                  <div style={{fontWeight:"600"}}>{s.gon_ad}</div>
                  <div style={{color:C.muted,fontSize:"11px"}}>{s.gon_adres||"Harita konumu"}</div>
                </div>
                <div>
                  <div style={{color:C.success,fontWeight:"700",fontSize:"10px",marginBottom:"2px"}}>📮 ALICI</div>
                  <div style={{fontWeight:"600"}}>{adGizle(s.al_ad)}</div>
                  <div style={{color:C.muted,fontSize:"11px"}}>{s.al_adres||"Harita konumu"}</div>
                </div>
              </div>
              <button onClick={()=>kabul(s)} disabled={!!aktifSiparis}
                style={{...btnP,width:"100%",boxShadow:"none",fontSize:"13px",padding:"10px",opacity:aktifSiparis?0.4:1,cursor:aktifSiparis?"not-allowed":"pointer"}}>
                {aktifSiparis ? "Önce aktif teslimatı tamamla" : "✅ Kabul Et"}
              </button>
            </div>
          ))}
        </div>
      )}
      {tab==="gecmis" && <GecmisTeslimatlar userId={user.id}/>}
    </div>
  )
}

// ─── ANA UYGULAMA ─────────────────────────────────────────────────────────────
export default function App() {
  const [modal, setModal] = useState(null)
  const [user, setUser] = useState(null)
  const [paketAc, setPaketAc] = useState(false)
  const [kariyerMetin, setKariyerMetin] = useState("")

  useEffect(() => {
    // localStorage'dan oturumu kontrol et
    const kayitli = localStorage.getItem("mt_user")
    if (kayitli) {
      try {
        const u = JSON.parse(kayitli)
        setUser({ name:u.ad+" "+u.soyad, type:u.tip==="kurye"?"kurye":"uye", tel:u.tel, adres:u.adres||"", id:u.id })
      } catch(e) {}
    }
    sb.from("ayarlar").select("deger").eq("id","kariyer_metin").maybeSingle()
      .then(({ data }) => setKariyerMetin(data?.deger||"MotoTeslim ile hem çalış hem kazan!\n\nSen de kurye olarak sisteme katıl, teslimat yap ve referanslarınla ekstra gelir elde et."))
  }, [])

  const logout = () => { localStorage.removeItem("mt_user"); setUser(null); setPaketAc(false) }

  // KURYE PANELİ
  if (user?.type==="kurye") return (
    <div style={{ minHeight:"100vh", background:C.bg }}>
      <nav style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 32px", borderBottom:"1px solid "+C.border, background:"rgba(10,14,26,0.95)", backdropFilter:"blur(12px)", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ fontSize:"20px", fontWeight:"900", color:C.accent }}>🏍 MotoTeslim</div>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <div style={{ width:"30px", height:"30px", borderRadius:"50%", background:C.accent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"13px", fontWeight:"800" }}>{user.name[0]}</div>
          <span style={{ fontSize:"13px", fontWeight:"600" }}>{user.name}</span>
          <button onClick={logout} style={{ ...btnS, fontSize:"12px", padding:"6px 12px" }}>Çıkış</button>
        </div>
      </nav>
      <KuryeDash user={user} onLogout={logout}/>
    </div>
  )

  // MÜŞTERİ PANELİ
  if (user&&(user.type==="uye"||user.type==="misafir")) return (
    <div style={{ minHeight:"100vh", background:C.bg }}>
      <nav style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 32px", borderBottom:"1px solid "+C.border, background:"rgba(10,14,26,0.95)", backdropFilter:"blur(12px)", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ fontSize:"20px", fontWeight:"900", color:C.accent }}>🏍 MotoTeslim</div>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <span style={{ fontSize:"13px", color:C.muted }}>👤 {user.name}</span>
          <button onClick={logout} style={{ ...btnS, fontSize:"12px", padding:"6px 12px" }}>Çıkış</button>
        </div>
      </nav>
      {paketAc
        ? <PaketGonder user={user} onClose={()=>setPaketAc(false)}/>
        : (
          <div style={{ maxWidth:"500px", margin:"60px auto", padding:"0 20px", textAlign:"center" }}>
            <div style={{ fontSize:"44px", marginBottom:"14px" }}>📦</div>
            <div style={{ fontSize:"20px", fontWeight:"800", marginBottom:"6px" }}>Merhaba, {user.name}!</div>
            <div style={{ color:C.muted, marginBottom:"28px" }}>{user.type==="misafir"?"Misafir olarak giriş yaptınız":"Hesabınıza giriş yaptınız"}</div>
            <button onClick={()=>setPaketAc(true)} style={{ ...btnP, width:"100%", marginBottom:"12px" }}>📦 Paket Gönder</button>
            <button onClick={logout} style={{ ...btnS, width:"100%" }}>← Ana Sayfaya Dön</button>
          </div>
        )
      }
    </div>
  )

  // ANA SAYFA
  return (
    <div style={{ minHeight:"100vh", background:C.bg, backgroundImage:"radial-gradient(ellipse at 20% 50%,rgba(232,80,10,0.05) 0%,transparent 60%),radial-gradient(ellipse at 80% 20%,rgba(30,58,96,0.3) 0%,transparent 50%)" }}>
      <nav style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 32px", borderBottom:"1px solid "+C.border, background:"rgba(10,14,26,0.95)", backdropFilter:"blur(12px)", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"16px" }}>
          <div style={{ fontSize:"20px", fontWeight:"900", color:C.accent }}>🏍 MotoTeslim</div>
          <button onClick={()=>setModal("kariyer")} style={{ padding:"6px 14px", borderRadius:"20px", border:"1px solid rgba(232,80,10,0.4)", background:"rgba(232,80,10,0.08)", color:C.accent, fontSize:"12px", fontWeight:"700", cursor:"pointer" }}>🏅 Kariyer Planı</button>
        </div>
        <div>
          <button onClick={()=>setModal("giris")} style={{ padding:"8px 16px", borderRadius:"8px", cursor:"pointer", fontSize:"13px", fontWeight:"700", border:"1px solid "+C.border, background:"transparent", color:C.muted, marginLeft:"8px" }}>Kurye Girişi</button>
          <button onClick={()=>setModal("kayit")} style={{ padding:"8px 16px", borderRadius:"8px", cursor:"pointer", fontSize:"13px", fontWeight:"700", border:"1px solid "+C.accent, background:C.accentGlow, color:C.accent, marginLeft:"8px" }}>Kurye Ol</button>
        </div>
      </nav>

      <div style={{ textAlign:"center", padding:"60px 20px 50px" }}>
        <div style={{ fontSize:"80px", marginBottom:"20px" }}>🏍</div>
        <div style={{ display:"inline-block", padding:"5px 14px", borderRadius:"20px", border:"1px solid "+C.accent, color:C.accent, fontSize:"11px", fontWeight:"700", letterSpacing:"1px", textTransform:"uppercase", marginBottom:"20px" }}>⚡ mototeslim.com — Hızlı Teslimat</div>
        <h1 style={{ fontSize:"clamp(28px,5vw,52px)", fontWeight:"900", lineHeight:"1.1", marginBottom:"16px", letterSpacing:"-1px", color:C.text }}>
          Paketini Gönder,<br/><span style={{ color:C.accent }}>MotoTeslim Halleder</span>
        </h1>
        <p style={{ fontSize:"15px", color:C.muted, maxWidth:"460px", margin:"0 auto 36px", lineHeight:"1.7" }}>
          Yakınındaki kuryelere anında bildirim. Ağırlığa göre uygun araç, şeffaf fiyat, güvenli ödeme.
        </p>
        <div style={{ display:"flex", gap:"12px", justifyContent:"center", flexWrap:"wrap" }}>
          <button onClick={()=>setModal("gonder")} style={btnP}>📦 Paket Gönder</button>
          <button onClick={()=>setModal("kayit")} style={btnS}>🏍 Kurye Ol</button>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))", gap:"18px", padding:"0 32px 70px", maxWidth:"1100px", margin:"0 auto" }}>
        {[
          { i:"⚖️", t:"Akıllı Fiyatlandırma", d:"Ağırlık ve mesafeye göre otomatik hesaplama." },
          { i:"📍", t:"En Yakın Kurye", d:"Önce yakındaki kuryeler bildirim alır." },
          { i:"🔐", t:"Güvenli Teslimat", d:"4 haneli teslim kodu ile güvenli el değiştirme." },
          { i:"💳", t:"PayTR ile Ödeme", d:"Kart ile güvenli ödeme. Kurye ücreti otomatik transfer." }
        ].map(f => (
          <div key={f.t} style={{ background:C.card, border:"1px solid "+C.border, borderRadius:"16px", padding:"26px" }}>
            <div style={{ fontSize:"26px", marginBottom:"12px" }}>{f.i}</div>
            <div style={{ fontSize:"14px", fontWeight:"700", marginBottom:"6px" }}>{f.t}</div>
            <div style={{ fontSize:"12px", color:C.muted, lineHeight:"1.6" }}>{f.d}</div>
          </div>
        ))}
      </div>

      <footer style={{ borderTop:"1px solid "+C.border, background:"rgba(10,14,26,0.95)", padding:"40px 32px 24px" }}>
        <div style={{ maxWidth:"1000px", margin:"0 auto" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:"32px", marginBottom:"32px" }}>
            <div>
              <div style={{ fontSize:"20px", fontWeight:"900", color:C.accent, marginBottom:"12px" }}>🏍 MotoTeslim</div>
              <div style={{ fontSize:"12px", color:C.dim, lineHeight:"1.7" }}>Hızlı, güvenli ve şeffaf teslimat platformu.</div>
            </div>
            {[
              { baslik:"Destek", linkler:[{l:"İletişim",m:"iletisim"},{l:"Şikayet",m:"sikayet"},{l:"Öneri",m:"oneri"},{l:"SSS",m:"sss"}] },
              { baslik:"Yasal", linkler:[{l:"Kullanım Koşulları",m:"kullanim"},{l:"KVKK",m:"kvkk"},{l:"Gizlilik",m:"gizlilik"},{l:"İade & İptal",m:"iade"}] }
            ].map(g => (
              <div key={g.baslik}>
                <div style={{ fontSize:"12px", fontWeight:"800", color:C.text, marginBottom:"12px" }}>{g.baslik}</div>
                {g.linkler.map(l => (
                  <div key={l.l} onClick={()=>setModal(l.m)} style={{ fontSize:"12px", color:C.muted, marginBottom:"8px", cursor:"pointer" }}
                    onMouseEnter={e=>e.target.style.color=C.accent} onMouseLeave={e=>e.target.style.color=C.muted}>{l.l}</div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop:"1px solid "+C.border, paddingTop:"20px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"10px" }}>
            <div style={{ fontSize:"11px", color:C.dim }}>© 2025 MotoTeslim. Tüm hakları saklıdır.</div>
            <div style={{ fontSize:"11px", color:C.dim }}>Güvenli ödeme: PayTR 256-bit SSL</div>
          </div>
        </div>
      </footer>

      {modal==="kayit" && <KuryeKayit onClose={()=>setModal(null)} onSuccess={u=>{setUser(u);setModal(null)}}/>}
      {modal==="giris" && <KuryeGiris onClose={()=>setModal(null)} onSuccess={u=>{setUser(u);setModal(null)}}/>}
      {modal==="gonder" && <GondericiModal onClose={()=>setModal(null)} onSuccess={(u,acPaket)=>{setUser(u);setModal(null);if(acPaket)setPaketAc(true)}}/>}

      {modal==="kariyer" && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:"16px" }} onClick={()=>setModal(null)}>
          <div onClick={e=>e.stopPropagation()} style={{ background:C.card, border:"1px solid "+C.border, borderRadius:"18px", padding:"28px", width:"100%", maxWidth:"560px", maxHeight:"85vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
              <div style={{ fontSize:"17px", fontWeight:"800" }}>🏅 Kariyer Planı</div>
              <button onClick={()=>setModal(null)} style={{ background:"none", border:"none", color:C.muted, fontSize:"22px", cursor:"pointer" }}>✕</button>
            </div>
            <div style={{ fontSize:"13px", color:C.muted, lineHeight:"2", whiteSpace:"pre-wrap" }}>{kariyerMetin}</div>
            <button onClick={()=>setModal(null)} style={{ ...btnP, width:"100%", marginTop:"20px", boxShadow:"none" }}>Tamam</button>
          </div>
        </div>
      )}

      {["kimiz","iletisim","sikayet","oneri","sss"].includes(modal) && <FooterModal tip={modal} onClose={()=>setModal(null)}/>}
      {["kullanim","kvkk","gizlilik","iade"].includes(modal) && <YasalModal tip={modal} onClose={()=>setModal(null)}/>}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        * { box-sizing: border-box }
        .leaflet-container { z-index: 1 !important }
      `}</style>
    </div>
  )
}
