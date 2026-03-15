import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const smsSend = async (telefon, mesaj) => {
  try {
    const r = await fetch('/api/sms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ telefon, mesaj }) });
    const d = await r.json();
    return d.success;
  } catch(e) { console.log('SMS hatası:', e); return false; }
};

const SUPA_URL = "https://ysvfwvebxdshwagtlmdc.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzdmZ3dmVieGRzaHdhZ3RsbWRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NzYzNzAsImV4cCI6MjA4ODM1MjM3MH0.bPkuzVTmRI35JarvPxKkeU5ZQMrUwbgAxAk5ui8Mf4Y";
const sb = createClient(SUPA_URL, SUPA_KEY);

const C={
  bg:"#0b0f1e",card:"#111827",card2:"#0f1929",border:"#1e2d45",
  accent:"#e8500a",accentL:"#f26419",accentGlow:"rgba(232,80,10,0.15)",
  navy:"#1e3a5f",text:"#f1f5f9",muted:"#94a3b8",dim:"#475569",
  success:"#22c55e",error:"#ef4444",warn:"#f59e0b",inBg:"#0f1929",inBorder:"#1e3a5f"
};

const btnP={padding:"12px 24px",borderRadius:"10px",border:"none",background:"linear-gradient(135deg,#e8500a,#c44008)",color:"#fff",fontSize:"14px",fontWeight:"700",cursor:"pointer",transition:"all .2s"};
const btnS={padding:"12px 24px",borderRadius:"10px",border:"1px solid "+C.border,background:"transparent",color:C.text,fontSize:"14px",fontWeight:"600",cursor:"pointer"};
const modalStyle={position:"fixed",inset:0,background:"rgba(0,0,0,0.78)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:"16px",backdropFilter:"blur(4px)"};
const mBox={background:C.card,border:"1px solid "+C.border,borderRadius:"20px",padding:"32px",width:"100%",maxWidth:"480px",maxHeight:"92vh",overflowY:"auto",boxShadow:"0 24px 80px rgba(0,0,0,0.6)",position:"relative"};

function Inp({label,placeholder,type="text",value,onChange,optional}){
  const[f,sf]=useState(false);
  return(
    <div>
      <label style={{display:"block",fontSize:"11px",fontWeight:"700",color:C.muted,letterSpacing:"0.5px",textTransform:"uppercase",marginBottom:"5px",marginTop:"14px"}}>
        {label}{optional&&<span style={{color:C.dim,fontWeight:"400",textTransform:"none"}}> (isteğe bağlı)</span>}
      </label>
      <input type={type} placeholder={placeholder} value={value} onChange={onChange}
        onFocus={()=>sf(true)} onBlur={()=>sf(false)}
        style={{width:"100%",padding:"10px 13px",borderRadius:"9px",border:"1px solid "+(f?C.accent:C.inBorder),background:C.inBg,color:C.text,fontSize:"13px",outline:"none",boxSizing:"border-box"}}/>
    </div>
  );
}

function Alert({type,msg}){
  if(!msg)return null;
  const bg=type==="error"?"rgba(239,68,68,0.1)":"rgba(34,197,94,0.1)";
  const border=type==="error"?"rgba(239,68,68,0.3)":"rgba(34,197,94,0.3)";
  const color=type==="error"?C.error:C.success;
  return <div style={{background:bg,border:"1px solid "+border,borderRadius:"10px",padding:"10px 14px",fontSize:"12px",color,marginTop:"14px"}}>{msg}</div>;
}

function PaketGonder({user,onClose}){
  const[step,setStep]=useState(1);
  const[farkliAdres,setFarkliAdres]=useState(false);
  const[form,setForm]=useState({gonAd:user?user.name.split(" ")[0]||"":"",gonSoyad:user?user.name.split(" ")[1]||"":"",gonTel:user?user.tel||"":"",gonAdres:user?user.adres||"":"",alAd:"",alSoyad:"",alTel:"",alAdres:"",agirlik:"",en:"",boy:"",yukseklik:"",aciklama:"",odemeYontemi:"kart",kartNo:"",kartAd:"",sson:"",cvv:""});
  const[err,setErr]=useState({});
  const[done,setDone]=useState(false);
  const[mesafeHesap,setMesafeHesap]=useState({km:0,sure:"",yukleniyor:false,hata:""});
  const set=k=>e=>setForm(f=>({...f,[k]:typeof e==="object"&&e.target?e.target.value:e}));

  const kg=parseFloat(form.agirlik)||0;
  const desi=(parseFloat(form.en)||0)*(parseFloat(form.boy)||0)*(parseFloat(form.yukseklik)||0)/3000;
  const efKg=kg>20&&desi>0?Math.max(kg,desi):kg;
  const mesafe=mesafeHesap.km||0;
  const mesafeM=mesafe*1000;

  const aracTipi=(()=>{if(efKg<=0)return null;if(efKg<=15&&mesafe<=15)return "motorsiklet";if(efKg<=250)return "otomobil";if(efKg<=3000)return "kamyonet";return "kamyon";})();
  const aracLabel=(()=>{if(aracTipi==="motorsiklet")return "🛵 Motorsiklet";if(aracTipi==="otomobil")return "🚗 Otomobil";if(aracTipi==="kamyonet")return "🚐 Kamyonet";if(aracTipi==="kamyon")return "🚛 Kamyon";return "—";})();

  const fiyatHesapla=(tip,km,mM)=>{
    if(!tip||km<=0)return 0;
    if(tip==="motorsiklet"){if(km<1)return 90;return 70+Math.ceil(mM/100)*2;}
    if(tip==="otomobil")return 90+Math.ceil(mM/100)*5;
    if(tip==="kamyonet"){if(km<=10)return 750+Math.ceil(mM/100)*22;return 750+Math.ceil(km)*23;}
    if(tip==="kamyon"){if(km<=10)return 1500+Math.ceil(mM/100)*35;return 1500+Math.ceil(km)*45;}
    return 0;
  };
  const fiyat=efKg>0&&mesafe>0?fiyatHesapla(aracTipi,mesafe,mesafeM):0;
  const komisyon=Math.ceil(fiyat*0.30);

  const mesafeHesapla=()=>{
    const gonAdres=farkliAdres?form.gonAdres:(user&&user.adres?user.adres:form.gonAdres);
    if(!gonAdres||!form.alAdres||form.alAdres.length<5)return;
    setMesafeHesap(m=>({...m,yukleniyor:true,hata:""}));
    const timeout=setTimeout(()=>setMesafeHesap({km:0,sure:"",yukleniyor:false,hata:"Bağlantı zaman aşımı."}),10000);
    try{
      const geocoder=new window.google.maps.Geocoder();
      const geocode=(adres)=>new Promise((res,rej)=>geocoder.geocode({address:adres+", Türkiye"},(r,s)=>{if(s==="OK"&&r[0])res(r[0].geometry.location);else rej(new Error("Adres bulunamadı"));}));
      Promise.all([geocode(gonAdres),geocode(form.alAdres)]).then(([g,a])=>{
        const R=6371,dLat=(a.lat()-g.lat())*Math.PI/180,dLon=(a.lng()-g.lng())*Math.PI/180;
        const aa=Math.sin(dLat/2)**2+Math.cos(g.lat()*Math.PI/180)*Math.cos(a.lat()*Math.PI/180)*Math.sin(dLon/2)**2;
        const ku=R*2*Math.atan2(Math.sqrt(aa),Math.sqrt(1-aa));
        const yol=ku<0.5?0:Math.ceil(ku*1.35);
        const dk=yol>0?Math.ceil(yol*2.5):0;
        clearTimeout(timeout);
        setMesafeHesap({km:yol,sure:dk>=60?Math.floor(dk/60)+"sa "+(dk%60)+"dk":dk>0?dk+" dk":"—",yukleniyor:false,hata:""});
      }).catch(()=>{clearTimeout(timeout);setMesafeHesap({km:0,sure:"",yukleniyor:false,hata:"Adres bulunamadı. Örnek: Kadıköy, İstanbul"});});
    }catch(e){clearTimeout(timeout);setMesafeHesap({km:0,sure:"",yukleniyor:false,hata:"Hata: "+e.message});}
  };

  useEffect(()=>{const t=setTimeout(()=>{const g=farkliAdres?form.gonAdres:(user&&user.adres?user.adres:form.gonAdres);if(g&&form.alAdres&&form.alAdres.length>5)mesafeHesapla();},1000);return()=>clearTimeout(t);},[form.alAdres,form.gonAdres,farkliAdres]);

  const v1=()=>{const e={};if(farkliAdres||!user||!user.adres){if(!form.gonAd)e.gonAd="Zorunlu";if(!form.gonTel)e.gonTel="Zorunlu";if(!form.gonAdres)e.gonAdres="Zorunlu";}if(!form.alAd)e.alAd="Zorunlu";if(!form.alTel)e.alTel="Zorunlu";if(!form.alAdres)e.alAdres="Alıcı adresi zorunludur";if(!form.agirlik)e.agirlik="Ağırlık zorunludur";if(mesafeHesap.yukleniyor)e.mesafe="Mesafe hesaplanıyor";if(form.alAdres&&!mesafeHesap.yukleniyor&&mesafe===0)e.mesafe="Geçerli adres girin";return e;};

  const next=async()=>{
    const e=step===1?v1():{};if(Object.keys(e).length){setErr(e);return;}setErr({});
    if(step===2){
      try{
        const{data:{user:u}}=await sb.auth.getUser();
        const gonAdres=farkliAdres?form.gonAdres:(user&&user.adres?user.adres:form.gonAdres);
        await sb.from("teslimatlar").insert({musteri_id:u?.id||null,gon_ad:(farkliAdres?form.gonAd:(user?user.name.split(" ")[0]:""))+" "+(farkliAdres?form.gonSoyad:(user?user.name.split(" ")[1]||"":"")),gon_tel:farkliAdres?form.gonTel:(user?user.tel:""),gon_adres:gonAdres,al_ad:form.alAd+" "+form.alSoyad,al_tel:form.alTel,al_adres:form.alAdres,agirlik:efKg,mesafe,fiyat,arac_turu:aracTipi||"motorsiklet",durum:"bekliyor"});
      }catch(e){console.log(e);}
      setDone(true);
    }else setStep(2);
  };

  if(done)return(
    <div style={{maxWidth:"500px",margin:"40px auto",padding:"0 20px",textAlign:"center"}} className="fade">
      <div style={{fontSize:"56px",marginBottom:"16px"}}>🎉</div>
      <div style={{fontSize:"20px",fontWeight:"900",marginBottom:"8px"}}>Sipariş Oluşturuldu!</div>
      <div style={{background:C.card,borderRadius:"14px",padding:"20px",border:"1px solid "+C.border,textAlign:"left",marginBottom:"20px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",fontSize:"12px"}}>
          <div style={{color:C.muted}}>Sipariş No:</div><div style={{fontWeight:"700"}}>#MT-{Math.floor(Math.random()*9000+1000)}</div>
          <div style={{color:C.muted}}>Mesafe:</div><div style={{fontWeight:"700"}}>{mesafe} km</div>
          <div style={{color:C.muted}}>Tutar:</div><div style={{fontWeight:"700",color:C.accent}}>₺{fiyat}</div>
          <div style={{color:C.muted}}>Araç:</div><div style={{fontWeight:"700"}}>{aracLabel}</div>
        </div>
      </div>
      <button onClick={onClose} style={{...btnP,width:"100%",boxShadow:"none"}}>Tamam ✓</button>
    </div>
  );

  return(
    <div style={{maxWidth:"600px",margin:"0 auto",padding:"20px"}} className="fade">
      <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"20px"}}>
        <button onClick={step===1?onClose:()=>setStep(1)} style={{...btnS,padding:"8px 14px",fontSize:"12px"}}>← Geri</button>
        <div style={{fontSize:"18px",fontWeight:"800"}}>📦 Paket Gönder</div>
      </div>
      <div style={{display:"flex",gap:"4px",marginBottom:"24px"}}>
        {["Adres & Ağırlık","Ödeme"].map((s,i)=>(<div key={i} style={{flex:1,textAlign:"center"}}><div style={{height:"4px",borderRadius:"2px",marginBottom:"6px",background:step>i+1?C.success:step===i+1?C.accent:C.border}}/><div style={{fontSize:"10px",color:step===i+1?C.accent:C.dim,fontWeight:"700"}}>{s}</div></div>))}
      </div>
      {step===1&&(
        <div className="fade">
          <div style={{background:C.card2,borderRadius:"12px",padding:"16px",marginBottom:"12px",border:"1px solid "+C.border}}>
            <div style={{fontSize:"12px",fontWeight:"700",color:C.accent,marginBottom:"10px"}}>📤 GÖNDERİCİ</div>
            {user&&user.adres?(
              <div>
                <div style={{background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:"10px",padding:"12px 14px",marginBottom:"12px"}}>
                  <div style={{fontSize:"11px",color:C.success,fontWeight:"700",marginBottom:"4px"}}>✓ Kayıtlı Adresiniz</div>
                  <div style={{fontSize:"13px",fontWeight:"600"}}>{user.name}</div>
                  <div style={{fontSize:"12px",color:C.muted}}>{user.tel||"—"} · {user.adres}</div>
                </div>
                <label style={{display:"flex",alignItems:"center",gap:"10px",cursor:"pointer",padding:"10px 14px",borderRadius:"9px",border:"1px dashed "+(farkliAdres?"#e8500a":C.border),background:farkliAdres?"rgba(232,80,10,0.06)":"transparent"}}>
                  <input type="checkbox" checked={farkliAdres} onChange={e=>setFarkliAdres(e.target.checked)} style={{width:"16px",height:"16px",accentColor:"#e8500a",cursor:"pointer",flexShrink:0}}/>
                  <span style={{fontSize:"13px",color:farkliAdres?C.accent:C.muted,fontWeight:farkliAdres?"700":"500"}}>📍 Farklı adresten gönderim</span>
                </label>
                {farkliAdres&&(<div className="fade">
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}><div><Inp label="Ad" placeholder="Ahmet" value={form.gonAd} onChange={set("gonAd")}/>{err.gonAd&&<div style={{color:C.error,fontSize:"10px"}}>{err.gonAd}</div>}</div><Inp label="Soyad" placeholder="Yılmaz" value={form.gonSoyad} onChange={set("gonSoyad")}/></div>
                  <div><Inp label="Telefon" placeholder="0532..." value={form.gonTel} onChange={set("gonTel")}/>{err.gonTel&&<div style={{color:C.error,fontSize:"10px"}}>{err.gonTel}</div>}</div>
                  <div><Inp label="Adres" placeholder="Mahalle, Sokak..." value={form.gonAdres} onChange={set("gonAdres")}/>{err.gonAdres&&<div style={{color:C.error,fontSize:"10px"}}>{err.gonAdres}</div>}</div>
                </div>)}
              </div>
            ):(
              <div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}><div><Inp label="Ad" placeholder="Ahmet" value={form.gonAd} onChange={set("gonAd")}/>{err.gonAd&&<div style={{color:C.error,fontSize:"10px"}}>{err.gonAd}</div>}</div><Inp label="Soyad" placeholder="Yılmaz" value={form.gonSoyad} onChange={set("gonSoyad")}/></div>
                <div><Inp label="Telefon" placeholder="0532..." value={form.gonTel} onChange={set("gonTel")}/>{err.gonTel&&<div style={{color:C.error,fontSize:"10px"}}>{err.gonTel}</div>}</div>
                <div><Inp label="Adres" placeholder="Mahalle, Sokak..." value={form.gonAdres} onChange={set("gonAdres")}/>{err.gonAdres&&<div style={{color:C.error,fontSize:"10px"}}>{err.gonAdres}</div>}</div>
              </div>
            )}
          </div>
          <div style={{background:C.card2,borderRadius:"12px",padding:"16px",marginBottom:"12px",border:"1px solid "+C.border}}>
            <div style={{fontSize:"12px",fontWeight:"700",color:C.success,marginBottom:"10px"}}>📥 ALICI</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}><div><Inp label="Ad" placeholder="Mehmet" value={form.alAd} onChange={set("alAd")}/>{err.alAd&&<div style={{color:C.error,fontSize:"10px"}}>{err.alAd}</div>}</div><Inp label="Soyad" placeholder="Kaya" value={form.alSoyad} onChange={set("alSoyad")}/></div>
            <div><Inp label="Telefon" placeholder="0533..." value={form.alTel} onChange={set("alTel")}/>{err.alTel&&<div style={{color:C.error,fontSize:"10px"}}>{err.alTel}</div>}</div>
            <div><Inp label="Adres" placeholder="Mahalle, Sokak — yazınca fiyat hesaplanır" value={form.alAdres} onChange={set("alAdres")}/>{err.alAdres&&<div style={{color:C.error,fontSize:"10px"}}>{err.alAdres}</div>}</div>
          </div>
          <div style={{background:C.card2,borderRadius:"12px",padding:"16px",marginBottom:"12px",border:"1px solid "+C.border}}>
            <div style={{fontSize:"12px",fontWeight:"700",color:C.muted,marginBottom:"10px"}}>⚖️ PAKET BİLGİSİ</div>
            <div><Inp label="Ağırlık (kg)" placeholder="5" type="number" value={form.agirlik} onChange={set("agirlik")}/>{err.agirlik&&<div style={{color:C.error,fontSize:"10px"}}>{err.agirlik}</div>}</div>
            {kg>20&&(<div className="fade"><div style={{background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.3)",borderRadius:"10px",padding:"10px",fontSize:"12px",color:C.warn,marginTop:"10px"}}>⚠️ 20 kg üzeri için ölçü giriniz.</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px"}}><Inp label="En (cm)" placeholder="40" type="number" value={form.en} onChange={set("en")}/><Inp label="Boy (cm)" placeholder="30" type="number" value={form.boy} onChange={set("boy")}/><Inp label="Yükseklik" placeholder="20" type="number" value={form.yukseklik} onChange={set("yukseklik")}/></div></div>)}
            <Inp label="Açıklama" placeholder="Kırılgan..." value={form.aciklama} onChange={set("aciklama")} optional/>
          </div>
          {mesafeHesap.yukleniyor&&<div style={{background:"rgba(30,58,96,0.3)",border:"1px solid "+C.navy,borderRadius:"10px",padding:"12px",fontSize:"12px",color:C.muted,display:"flex",alignItems:"center",gap:"8px",marginBottom:"12px"}}><span className="spin">⏳</span> Mesafe hesaplanıyor...</div>}
          {mesafeHesap.hata&&<div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:"10px",padding:"10px",fontSize:"12px",color:C.error,marginBottom:"12px"}}>⚠️ {mesafeHesap.hata}</div>}
          {err.mesafe&&<div style={{color:C.error,fontSize:"11px",marginBottom:"8px"}}>⚠️ {err.mesafe}</div>}
          {fiyat>0&&!mesafeHesap.yukleniyor&&(
            <div style={{background:"linear-gradient(135deg,rgba(232,80,10,0.12),rgba(30,58,96,0.25))",border:"1px solid "+C.accent,borderRadius:"14px",padding:"18px",marginBottom:"12px"}} className="fade">
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:"10px"}}><div style={{fontSize:"12px",fontWeight:"700",color:C.accent}}>💰 FİYAT HESAPLAMA</div><div style={{fontSize:"12px",fontWeight:"800",padding:"4px 10px",borderRadius:"8px",background:"rgba(232,80,10,0.15)",color:C.accent}}>{aracLabel}</div></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",fontSize:"12px",marginBottom:"10px"}}>
                <div style={{color:C.muted}}>Mesafe:</div><div style={{fontWeight:"600",color:C.success}}>{mesafe.toFixed(1)} km {mesafeHesap.sure?"(~"+mesafeHesap.sure+")":""}</div>
                <div style={{color:C.muted}}>Komisyon (%30):</div><div style={{fontWeight:"600",color:C.muted}}>₺{komisyon}</div>
                <div style={{color:C.muted}}>Kurye kazancı:</div><div style={{fontWeight:"600",color:C.success}}>₺{fiyat-komisyon}</div>
              </div>
              <div style={{borderTop:"1px solid rgba(255,255,255,0.1)",paddingTop:"10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:"13px",fontWeight:"700"}}>Toplam Ücret</span>
                <span style={{fontSize:"28px",fontWeight:"900",color:C.accent}}>₺{fiyat}</span>
              </div>
            </div>
          )}
        </div>
      )}
      {step===2&&(
        <div className="fade">
          <div style={{background:C.card2,borderRadius:"12px",padding:"14px",border:"1px solid "+C.border,marginBottom:"16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:"12px",color:C.muted}}>Toplam Tutar</div>
            <div style={{fontSize:"24px",fontWeight:"900",color:C.accent}}>₺{fiyat}</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:"10px",marginBottom:"16px"}}>
            {[{v:"kart",icon:"💳",title:"Yeni Kart",sub:"Visa, Mastercard, Troy"},{v:"kayitli",icon:"⚡",title:"Kayıtlı Kart",sub:"•••• 4521"},{v:"cuzdan",icon:"👛",title:"MotoTeslim Cüzdanı",sub:"Bakiye: ₺850"}].map(o=>(
              <div key={o.v} onClick={()=>setForm(f=>({...f,odemeYontemi:o.v}))} style={{padding:"13px 16px",borderRadius:"12px",cursor:"pointer",border:"2px solid "+(form.odemeYontemi===o.v?C.accent:C.border),background:form.odemeYontemi===o.v?C.accentGlow:C.card2,transition:"all .2s"}}>
                <div style={{display:"flex",alignItems:"center",gap:"10px"}}><span style={{fontSize:"20px"}}>{o.icon}</span><div><div style={{fontSize:"13px",fontWeight:"700",color:form.odemeYontemi===o.v?C.accent:C.text}}>{o.title}</div><div style={{fontSize:"11px",color:C.muted}}>{o.sub}</div></div></div>
              </div>
            ))}
          </div>
          {form.odemeYontemi==="kart"&&(
            <div style={{background:C.card2,borderRadius:"12px",padding:"16px",border:"1px solid "+C.border}}>
              <Inp label="Kart Numarası" placeholder="1234 5678 9012 3456" value={form.kartNo} onChange={set("kartNo")}/>
              <Inp label="Kart Sahibi" placeholder="AHMET YILMAZ" value={form.kartAd} onChange={set("kartAd")}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}><Inp label="Son Kullanma" placeholder="MM/YY" value={form.sson} onChange={set("sson")}/><Inp label="CVV" placeholder="123" type="password" value={form.cvv} onChange={set("cvv")}/></div>
            </div>
          )}
          <div style={{display:"flex",alignItems:"center",gap:"8px",marginTop:"14px",padding:"10px 12px",background:"rgba(30,58,96,0.3)",borderRadius:"9px",border:"1px solid "+C.navy}}>
            <span>🔒</span><span style={{fontSize:"11px",color:C.dim}}>Tüm ödemeler <b style={{color:C.muted}}>PayTR</b> ile 256-bit SSL şifreli.</span>
          </div>
        </div>
      )}
      <div style={{display:"flex",gap:"10px",marginTop:"22px"}}>
        {step===2&&<button onClick={()=>setStep(1)} style={{...btnS,flex:"none",padding:"11px 20px",fontSize:"13px"}}>← Geri</button>}
        <button onClick={next} disabled={step===1&&(mesafeHesap.yukleniyor||(kg>0&&mesafe===0&&form.alAdres.length>0&&!mesafeHesap.hata))}
          style={{...btnP,flex:1,boxShadow:"none",padding:"12px",opacity:step===1&&(mesafeHesap.yukleniyor||(kg>0&&mesafe===0&&form.alAdres.length>0&&!mesafeHesap.hata))?0.4:1}}>
          {step===1&&mesafeHesap.yukleniyor?"⏳ Mesafe hesaplanıyor...":step===2?"💳 Ödemeyi Tamamla":"Ödemeye Geç →"}
        </button>
      </div>
    </div>
  );
}

function SifreUnuttum(){
  const[acik,setAcik]=useState(false);
  const[email,setEmail]=useState("");
  const[loading,setLoading]=useState(false);
  const[alert,setAlert]=useState({type:"",msg:""});
  const gonder=async()=>{
    if(!email.trim()){setAlert({type:"error",msg:"E-posta zorunludur."});return;}
    setLoading(true);setAlert({type:"",msg:""});
    try{const{error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+"?reset=true"});if(error)throw error;setAlert({type:"success",msg:"✓ Şifre sıfırlama e-postana gönderildi!"});setTimeout(()=>setAcik(false),3000);}catch(e){setAlert({type:"error",msg:"Hata: "+e.message});}
    setLoading(false);
  };
  return(
    <div style={{marginTop:"12px"}}>
      {!acik?<div style={{textAlign:"center"}}><span onClick={()=>setAcik(true)} style={{fontSize:"12px",color:C.muted,cursor:"pointer",textDecoration:"underline"}}>Şifremi unuttum</span></div>:(
        <div style={{background:"rgba(30,58,96,0.3)",border:"1px solid "+C.navy,borderRadius:"12px",padding:"16px",marginTop:"8px"}} className="fade">
          <div style={{fontSize:"13px",fontWeight:"700",marginBottom:"10px"}}>🔑 Şifre Sıfırla</div>
          <input type="email" placeholder="E-posta adresin" value={email} onChange={e=>setEmail(e.target.value)} style={{width:"100%",padding:"10px 13px",borderRadius:"9px",border:"1px solid "+C.inBorder,background:C.inBg,color:C.text,fontSize:"13px",outline:"none",boxSizing:"border-box",marginBottom:"10px"}}/>
          {alert.msg&&<div style={{background:alert.type==="error"?"rgba(239,68,68,0.1)":"rgba(34,197,94,0.1)",border:"1px solid "+(alert.type==="error"?"rgba(239,68,68,0.3)":"rgba(34,197,94,0.3)"),borderRadius:"8px",padding:"8px 12px",fontSize:"11px",color:alert.type==="error"?C.error:C.success,marginBottom:"10px"}}>{alert.msg}</div>}
          <div style={{display:"flex",gap:"8px"}}>
            <button onClick={()=>{setAcik(false);setEmail("");setAlert({type:"",msg:""});}} style={{...btnS,flex:"none",padding:"8px 14px",fontSize:"12px"}}>İptal</button>
            <button onClick={gonder} disabled={loading} style={{...btnP,flex:1,padding:"9px",fontSize:"12px",boxShadow:"none",opacity:loading?0.7:1}}>{loading?<span className="spin">⏳</span>:"Gönder"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

function KuryeGiris({onClose,onSuccess}){
  const[form,setForm]=useState({email:"",sifre:""});
  const[loading,setLoading]=useState(false);
  const[alert,setAlert]=useState({type:"",msg:""});
  const set=k=>e=>setForm(f=>({...f,[k]:e.target.value}));
  const girisYap=async()=>{
    if(!form.email||!form.sifre){setAlert({type:"error",msg:"E-posta ve şifre zorunludur."});return;}
    setLoading(true);setAlert({type:"",msg:""});
    try{const{data,error}=await sb.auth.signInWithPassword({email:form.email,password:form.sifre});if(error)throw error;const meta=data.user.user_metadata;onSuccess({name:(meta.ad||"Kurye")+" "+(meta.soyad||""),type:"kurye",email:form.email});}
    catch(e){setAlert({type:"error",msg:e.message==="Invalid login credentials"?"E-posta veya şifre hatalı.":"Hata: "+e.message});}
    setLoading(false);
  };
  return(
    <div style={modalStyle} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={mBox} className="fade">
        <button style={{position:"absolute",top:"14px",right:"16px",background:"none",border:"none",color:C.muted,fontSize:"22px",cursor:"pointer"}} onClick={onClose}>×</button>
        <div style={{fontSize:"18px",fontWeight:"800",marginBottom:"4px"}}>🏍️ Kurye Girişi</div>
        <div style={{fontSize:"12px",color:C.muted,marginBottom:"16px"}}>Hesabına giriş yap</div>
        <Inp label="E-posta" placeholder="ahmet@email.com" value={form.email} onChange={set("email")}/>
        <Inp label="Şifre" placeholder="••••••••" type="password" value={form.sifre} onChange={set("sifre")}/>
        <Alert type={alert.type} msg={alert.msg}/>
        <button onClick={girisYap} disabled={loading} style={{...btnP,width:"100%",marginTop:"18px",boxShadow:"none",opacity:loading?0.7:1}}>{loading?<span className="spin">⏳</span>:"Giriş Yap"}</button>
        <SifreUnuttum/>
        <div style={{textAlign:"center",marginTop:"14px",fontSize:"12px",color:C.muted}}>Hesabın yok mu? <span onClick={onClose} style={{color:C.accent,cursor:"pointer",fontWeight:"700"}}>Kurye ol →</span></div>
      </div>
    </div>
  );
}

function YasalModal({tip,onClose}){
  const[metin,setMetin]=useState("");
  const[loading,setLoading]=useState(true);
  const basliklar={kullanim:{icon:"📋",baslik:"Kullanım Koşulları & Sözleşme"},kvkk:{icon:"🔒",baslik:"KVKK Aydınlatma Metni"},gizlilik:{icon:"🛡️",baslik:"Gizlilik Politikası"},cerez:{icon:"🍪",baslik:"Çerez Politikası"},iade:{icon:"↩️",baslik:"İade & İptal Politikası"},hakkimizda:{icon:"🏢",baslik:"Hakkımızda"},misyon:{icon:"🎯",baslik:"Misyonumuz"}};
  const info=basliklar[tip]||{icon:"📄",baslik:"Yasal Metin"};
  useEffect(()=>{sb.from("ayarlar").select("deger").eq("id","yasal_"+tip).maybeSingle().then(({data})=>{setMetin(data?.deger||"Bu metin henüz eklenmemiştir.");setLoading(false);});},[tip]);
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#111827",border:"1px solid #1e3a5f",borderRadius:"18px",width:"100%",maxWidth:"680px",maxHeight:"88vh",display:"flex",flexDirection:"column"}} className="fade">
        <div style={{padding:"20px 24px",borderBottom:"1px solid #1e3a5f",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
          <div style={{fontSize:"15px",fontWeight:"800"}}>{info.icon} {info.baslik}</div>
          <button onClick={onClose} style={{background:"none",border:"none",color:"#94a3b8",fontSize:"24px",cursor:"pointer",lineHeight:1}}>×</button>
        </div>
        <div style={{overflowY:"auto",padding:"24px",flex:1}}>{loading?<div style={{textAlign:"center",color:"#475569",padding:"40px"}}>⏳ Yükleniyor...</div>:<div style={{fontSize:"13px",color:"#94a3b8",lineHeight:"1.9",whiteSpace:"pre-wrap"}}>{metin}</div>}</div>
        <div style={{padding:"16px 24px",borderTop:"1px solid #1e3a5f",flexShrink:0,textAlign:"right"}}>
          <button onClick={onClose} style={{padding:"10px 24px",borderRadius:"9px",border:"none",background:"#e8500a",color:"#fff",fontWeight:"700",cursor:"pointer",fontSize:"13px"}}>Kapat</button>
        </div>
      </div>
    </div>
  );
}

function FooterModal({tip,onClose}){
  const[form,setForm]=useState({ad:"",tel:"",mesaj:""});
  const[yukleniyor,setYukleniyor]=useState(false);
  const[msg,setMsg]=useState({type:"",text:""});
  const basliklar={kimiz:{icon:"🏢",baslik:"Biz Kimiz"},iletisim:{icon:"📞",baslik:"İletişim"},sikayet:{icon:"⚠️",baslik:"Şikayet"},oneri:{icon:"💡",baslik:"Öneri & İstek"},sss:{icon:"❓",baslik:"Sık Sorulan Sorular"}};
  const sssListesi=[{s:"Nasıl kurye olabilirim?",c:"Anasayfadan 'Kurye Ol' butonuna tıklayarak ücretsiz kayıt olabilirsiniz."},{s:"Ödeme ne zaman yapılır?",c:"Tamamlanan teslimatların ödemeleri ayın ilk iş günü hesabınıza aktarılır."},{s:"Hangi araçlarla çalışabilirim?",c:"Motorsiklet, otomobil, kamyonet ve kamyon/tır ile çalışabilirsiniz."},{s:"Referans sistemi nasıl çalışır?",c:"Davet kodunuzla kayıt olan kişilerin işlemlerinden %1-%5 prim kazanırsınız."},{s:"Teslimat bölgesi var mı?",c:"Şu an tüm Türkiye genelinde hizmet vermekteyiz."}];
  const gonder=async()=>{if(!form.ad||!form.mesaj){setMsg({type:"error",text:"Ad ve mesaj zorunlu!"});return;}setYukleniyor(true);await sb.from("talepler").insert({tip,ad:form.ad,tel:form.tel,mesaj:form.mesaj,okundu:false,created_at:new Date().toISOString()});setMsg({type:"success",text:"✅ Talebiniz alındı!"});setYukleniyor(false);setTimeout(onClose,2500);};
  const h=basliklar[tip]||{icon:"📋",baslik:"Bilgi"};
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#111827",border:"1px solid #1e2d45",borderRadius:"18px",padding:"28px",width:"100%",maxWidth:"480px",maxHeight:"85vh",overflowY:"auto"}} className="fade">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"}}>
          <div style={{fontSize:"17px",fontWeight:"800"}}>{h.icon} {h.baslik}</div>
          <button onClick={onClose} style={{background:"none",border:"none",color:"#94a3b8",fontSize:"22px",cursor:"pointer"}}>×</button>
        </div>
        {tip==="kimiz"&&<div style={{fontSize:"13px",color:"#94a3b8",lineHeight:"2"}}><p><b style={{color:"#f1f5f9"}}>MotoTeslim</b>, Türkiye genelinde hızlı ve güvenilir teslimat hizmeti sunan yerli bir platformdur.</p><p style={{color:"#e8500a",fontWeight:"700",marginTop:"10px"}}>📧 info@mototeslim.com</p></div>}
        {tip==="sss"&&<div>{sssListesi.map((x,i)=><div key={i} style={{borderBottom:"1px solid #1e2d45",paddingBottom:"14px",marginBottom:"14px"}}><div style={{fontSize:"13px",fontWeight:"700",marginBottom:"6px"}}>❓ {x.s}</div><div style={{fontSize:"12px",color:"#94a3b8",lineHeight:"1.7"}}>{x.c}</div></div>)}</div>}
        {["iletisim","sikayet","oneri"].includes(tip)&&(
          <div>
            {[{l:"Adınız Soyadınız *",k:"ad",ph:"Adınız"},{l:"Telefon",k:"tel",ph:"05xx xxx xx xx"},{l:"Mesajınız *",k:"mesaj",ph:"Mesajınızı yazın...",multi:true}].map(f=>(
              <div key={f.k} style={{marginBottom:"14px"}}>
                <div style={{fontSize:"11px",color:"#94a3b8",fontWeight:"600",marginBottom:"5px"}}>{f.l}</div>
                {f.multi?<textarea value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))} placeholder={f.ph} rows={4} style={{width:"100%",padding:"10px 12px",borderRadius:"10px",border:"1px solid #1e3a5f",background:"#0f1929",color:"#f1f5f9",fontSize:"13px",outline:"none",resize:"vertical",boxSizing:"border-box",fontFamily:"inherit"}}/>:<input value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))} placeholder={f.ph} style={{width:"100%",padding:"10px 12px",borderRadius:"10px",border:"1px solid #1e3a5f",background:"#0f1929",color:"#f1f5f9",fontSize:"13px",outline:"none",boxSizing:"border-box"}}/>}
              </div>
            ))}
            {msg.text&&<div style={{padding:"10px 12px",borderRadius:"8px",marginBottom:"12px",fontSize:"12px",fontWeight:"600",background:msg.type==="success"?"rgba(34,197,94,0.15)":"rgba(239,68,68,0.15)",color:msg.type==="success"?"#22c55e":"#ef4444"}}>{msg.text}</div>}
            <button onClick={gonder} disabled={yukleniyor} style={{width:"100%",padding:"13px",borderRadius:"12px",border:"none",background:"linear-gradient(135deg,#e8500a,#c44008)",color:"#fff",fontWeight:"800",fontSize:"14px",cursor:"pointer",opacity:yukleniyor?0.7:1}}>{yukleniyor?"⏳ Gönderiliyor...":"📨 Gönder"}</button>
          </div>
        )}
      </div>
    </div>
  );
}

function GondericiModal({onClose,onSuccess}){
  const[tab,setTab]=useState("giris");
  const[loading,setLoading]=useState(false);
  const[alert,setAlert]=useState({type:"",msg:""});
  const[form,setForm]=useState({ad:"",soyad:"",email:"",tel:"",tc:"",adres:"",sifre:"",refKod:""});
  const[err,setErr]=useState({});
  const[sozlesmeOnay,setSozlesmeOnay]=useState(false);
  const[kvkkOnay,setKvkkOnay]=useState(false);
  const[yasal,setYasal]=useState(null);
  const set=k=>e=>setForm(f=>({...f,[k]:e.target.value}));

  const giris=async()=>{
    if(!form.email||!form.sifre){setAlert({type:"error",msg:"E-posta ve şifre zorunludur."});return;}
    setLoading(true);setAlert({type:"",msg:""});
    try{const{data,error}=await sb.auth.signInWithPassword({email:form.email,password:form.sifre});if(error)throw error;const meta=data.user.user_metadata;const{data:md}=await sb.from("musteriler").select("*").eq("user_id",data.user.id).maybeSingle();onSuccess({name:(meta.ad||"Kullanıcı")+" "+(meta.soyad||""),type:"uye",adres:(md?.adres)||meta.adres||"",tel:(md?.tel)||meta.tel||""},true);}
    catch(e){setAlert({type:"error",msg:e.message==="Invalid login credentials"?"E-posta veya şifre hatalı.":"Hata: "+e.message});}
    setLoading(false);
  };

  const kayit=async()=>{
    const e={};if(!form.ad.trim())e.ad="Zorunlu";if(!form.soyad.trim())e.soyad="Zorunlu";if(!form.email.trim())e.email="Zorunlu";if(!form.tel.trim())e.tel="Zorunlu";if(form.sifre.length<6)e.sifre="En az 6 karakter";
    if(Object.keys(e).length){setErr(e);return;}
    setLoading(true);setAlert({type:"",msg:""});
    try{const{data,error}=await sb.auth.signUp({email:form.email,password:form.sifre,options:{data:{ad:form.ad,soyad:form.soyad,tel:form.tel,tc:form.tc,adres:form.adres,rol:"musteri"}}});if(error)throw error;await sb.from("musteriler").insert({user_id:data.user.id,ad:form.ad,soyad:form.soyad,tel:form.tel,tc:form.tc,adres:form.adres,ref_kod:form.tel.replace(/[^0-9]/g,"").replace(/^0/,""),davetci_kod:form.refKod.trim()||null,bakiye:0});setAlert({type:"success",msg:"✓ Kayıt başarılı! E-postanı doğrula."});setTimeout(()=>onSuccess({name:form.ad+" "+form.soyad,type:"uye"}),2000);}
    catch(e){setAlert({type:"error",msg:e.message==="User already registered"?"Bu e-posta zaten kayıtlı.":"Hata: "+e.message});}
    setLoading(false);
  };

  const misafir=()=>{
    const e={};if(!form.ad.trim())e.ad="Zorunlu";if(!form.soyad.trim())e.soyad="Zorunlu";if(!form.tel.trim())e.tel="Zorunlu";if(!form.adres.trim())e.adres="Zorunlu";
    if(Object.keys(e).length){setErr(e);return;}
    onSuccess({name:form.ad+" "+form.soyad,type:"misafir",tel:form.tel,adres:form.adres});
  };

  const onaylar=(fn1,fn2,s1,s2)=>(
    <div style={{display:"flex",flexDirection:"column",gap:"8px",marginTop:"10px"}}>
      {[{s:s1,fn:fn1,tip:"kullanim",label:"Kullanım Koşulları ve Mesafeli Satış Sözleşmesini"},{s:s2,fn:fn2,tip:"kvkk",label:"KVKK Aydınlatma Metnini"}].map(x=>(
        <label key={x.tip} style={{display:"flex",alignItems:"flex-start",gap:"10px",cursor:"pointer",padding:"9px 12px",borderRadius:"9px",border:"1px solid "+(x.s?"rgba(34,197,94,0.4)":"rgba(239,68,68,0.2)"),background:x.s?"rgba(34,197,94,0.05)":"rgba(239,68,68,0.03)"}}>
          <input type="checkbox" checked={x.s} onChange={e=>x.fn(e.target.checked)} style={{width:"15px",height:"15px",accentColor:"#22c55e",cursor:"pointer",flexShrink:0,marginTop:"2px"}}/>
          <span style={{fontSize:"12px",color:"#94a3b8"}}><span onClick={e=>{e.preventDefault();setYasal(x.tip);}} style={{color:"#60a5fa",textDecoration:"underline",cursor:"pointer"}}>{x.label}</span> okudum ve kabul ediyorum. *</span>
        </label>
      ))}
    </div>
  );

  return(<>
    <div style={modalStyle} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={mBox} className="fade">
        <button style={{position:"absolute",top:"14px",right:"16px",background:"none",border:"none",color:C.muted,fontSize:"22px",cursor:"pointer"}} onClick={onClose}>×</button>
        <div style={{fontSize:"18px",fontWeight:"800",marginBottom:"4px"}}>📦 Paket Gönder</div>
        <div style={{fontSize:"12px",color:C.muted,marginBottom:"16px"}}>Giriş yap veya misafir olarak devam et</div>
        <div style={{display:"flex",gap:"6px",marginBottom:"20px",background:C.inBg,borderRadius:"10px",padding:"4px"}}>
          {[["giris","Giriş Yap"],["kayit","Kayıt Ol"],["misafir","Misafir"]].map(([v,l])=>(
            <button key={v} onClick={()=>{setTab(v);setErr({});setAlert({type:"",msg:""}); }} style={{flex:1,padding:"8px",borderRadius:"7px",border:"none",background:tab===v?C.accent:"transparent",color:tab===v?"#fff":C.muted,fontSize:"12px",fontWeight:"700",cursor:"pointer"}}>{l}</button>
          ))}
        </div>
        {tab==="giris"&&(<>
          <Inp label="E-posta" placeholder="ahmet@email.com" value={form.email} onChange={set("email")}/>
          <Inp label="Şifre" placeholder="••••••••" type="password" value={form.sifre} onChange={set("sifre")}/>
          <Alert type={alert.type} msg={alert.msg}/>
          <button onClick={giris} disabled={loading} style={{...btnP,width:"100%",marginTop:"16px",boxShadow:"none",opacity:loading?0.7:1}}>{loading?<span className="spin">⏳</span>:"Giriş Yap"}</button>
        </>)}
        {tab==="kayit"&&(<>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
            <div><Inp label="Ad" placeholder="Ahmet" value={form.ad} onChange={set("ad")}/>{err.ad&&<div style={{color:C.error,fontSize:"10px"}}>{err.ad}</div>}</div>
            <div><Inp label="Soyad" placeholder="Yılmaz" value={form.soyad} onChange={set("soyad")}/>{err.soyad&&<div style={{color:C.error,fontSize:"10px"}}>{err.soyad}</div>}</div>
          </div>
          <div><Inp label="Telefon" placeholder="0532 123 4567" value={form.tel} onChange={set("tel")}/>{err.tel&&<div style={{color:C.error,fontSize:"10px"}}>{err.tel}</div>}</div>
          <div><Inp label="E-posta" placeholder="ahmet@email.com" type="email" value={form.email} onChange={set("email")}/>{err.email&&<div style={{color:C.error,fontSize:"10px"}}>{err.email}</div>}</div>
          <Inp label="Adres" placeholder="Mahalle, Sokak, No..." value={form.adres} onChange={set("adres")} optional/>
          <div><Inp label="Şifre" placeholder="En az 6 karakter" type="password" value={form.sifre} onChange={set("sifre")}/>{err.sifre&&<div style={{color:C.error,fontSize:"10px"}}>{err.sifre}</div>}</div>
          {onaylar(setSozlesmeOnay,setKvkkOnay,sozlesmeOnay,kvkkOnay)}
          <Alert type={alert.type} msg={alert.msg}/>
          <button onClick={kayit} disabled={loading||!sozlesmeOnay||!kvkkOnay} style={{...btnP,width:"100%",marginTop:"16px",boxShadow:"none",opacity:(loading||!sozlesmeOnay||!kvkkOnay)?0.5:1}}>{loading?<span className="spin">⏳</span>:"Kayıt Ol"}</button>
        </>)}
        {tab==="misafir"&&(<>
          <div style={{background:C.accentGlow,border:"1px solid rgba(232,80,10,0.3)",borderRadius:"10px",padding:"10px 13px",fontSize:"12px",color:C.accentL,marginBottom:"14px"}}>👤 Hesap açmadan da gönderi yapabilirsin.</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
            <div><Inp label="Ad" placeholder="Ahmet" value={form.ad} onChange={set("ad")}/>{err.ad&&<div style={{color:C.error,fontSize:"10px"}}>{err.ad}</div>}</div>
            <div><Inp label="Soyad" placeholder="Yılmaz" value={form.soyad} onChange={set("soyad")}/>{err.soyad&&<div style={{color:C.error,fontSize:"10px"}}>{err.soyad}</div>}</div>
          </div>
          <div><Inp label="Telefon" placeholder="0532 123 4567" value={form.tel} onChange={set("tel")}/>{err.tel&&<div style={{color:C.error,fontSize:"10px"}}>{err.tel}</div>}</div>
          <div><Inp label="Adres" placeholder="Tam adresiniz" value={form.adres} onChange={set("adres")}/>{err.adres&&<div style={{color:C.error,fontSize:"10px"}}>{err.adres}</div>}</div>
          {onaylar(setSozlesmeOnay,setKvkkOnay,sozlesmeOnay,kvkkOnay)}
          <button onClick={misafir} disabled={!sozlesmeOnay||!kvkkOnay} style={{...btnP,width:"100%",marginTop:"16px",boxShadow:"none",opacity:(!sozlesmeOnay||!kvkkOnay)?0.5:1}}>Misafir Olarak Devam →</button>
        </>)}
      </div>
    </div>
    {yasal&&<YasalModal tip={yasal} onClose={()=>setYasal(null)}/>}
  </>);
}

function KuryeKayit({onClose,onSuccess}){
  const[step,setStep]=useState(1);
  const[loading,setLoading]=useState(false);
  const[alert,setAlert]=useState({type:"",msg:""});
  const[sozlesmeOnay,setSozlesmeOnay]=useState(false);
  const[kvkkOnay,setKvkkOnay]=useState(false);
  const[yasal,setYasal]=useState(null);
  const[form,setForm]=useState({ad:"",soyad:"",tc:"",tel:"",email:"",sifre:"",arac:"motorsiklet",marka:"",model:"",plaka:"",vergiNo:"",vergiD:"",iban:"",ibanAd:"",refKod:""});
  const[err,setErr]=useState({});
  const set=k=>e=>setForm(f=>({...f,[k]:e.target.value}));
  const v1=()=>{const e={};if(!form.ad.trim())e.ad="Zorunlu";if(!form.soyad.trim())e.soyad="Zorunlu";if(!form.tel.trim())e.tel="Zorunlu";if(!form.email.trim())e.email="Zorunlu";if(form.sifre.length<6)e.sifre="En az 6 karakter";return e;};
  const v2=()=>{const e={};if(!form.plaka.trim())e.plaka="Zorunlu";return e;};
  const v3=()=>{const e={};if(!form.iban)e.iban="IBAN zorunludur";return e;};
  const next=()=>{const e=step===1?v1():step===2?v2():v3();if(Object.keys(e).length){setErr(e);return;}setErr({});if(step<3)setStep(step+1);};
  const kayitOl=async()=>{
    setLoading(true);setAlert({type:"",msg:""});
    try{const{data,error}=await sb.auth.signUp({email:form.email,password:form.sifre,options:{data:{ad:form.ad,soyad:form.soyad,tel:form.tel,tc:form.tc,rol:"kurye"}}});if(error)throw error;await sb.from("kuryeler").insert({user_id:data.user.id,ad:form.ad,soyad:form.soyad,tel:form.tel,tc:form.tc,arac_turu:form.arac,arac_marka:form.marka,arac_model:form.model,plaka:form.plaka,vergi_no:form.vergiNo,vergi_dairesi:form.vergiD,iban:form.iban,iban_ad:form.ibanAd||(form.ad+" "+form.soyad),durum:"beklemede",ref_kod:form.tel.replace(/\D/g,"").replace(/^0/,""),davetci_kod:form.refKod.trim()||null});setAlert({type:"success",msg:"✓ Kayıt başarılı! E-postanı doğrula."});setTimeout(()=>onSuccess({name:form.ad+" "+form.soyad,type:"kurye"}),2000);}
    catch(e){setAlert({type:"error",msg:"Hata: "+(e.message==="User already registered"?"Bu e-posta zaten kayıtlı.":e.message)});}
    setLoading(false);
  };
  return(
    <div style={modalStyle} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={mBox} className="fade">
        <button style={{position:"absolute",top:"14px",right:"16px",background:"none",border:"none",color:C.muted,fontSize:"22px",cursor:"pointer"}} onClick={onClose}>×</button>
        <div style={{display:"flex",gap:"6px",marginBottom:"22px"}}>
          {["Kişisel","Araç","Vergi"].map((s,i)=>(<div key={i} style={{flex:1,textAlign:"center"}}><div style={{width:"24px",height:"24px",borderRadius:"50%",margin:"0 auto 4px",background:step>i+1?C.success:step===i+1?C.accent:C.inBg,border:"2px solid "+(step>=i+1?(step>i+1?C.success:C.accent):C.border),display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:"700",color:step>=i+1?"#fff":C.dim}}>{step>i+1?"✓":i+1}</div><div style={{fontSize:"9px",color:step===i+1?C.accent:C.dim,fontWeight:"600"}}>{s}</div></div>))}
        </div>
        {step===1&&(<>
          <div style={{fontSize:"18px",fontWeight:"800",marginBottom:"4px"}}>🏍️ Kurye Ol</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
            <div><Inp label="Ad" placeholder="Ahmet" value={form.ad} onChange={set("ad")}/>{err.ad&&<div style={{color:C.error,fontSize:"10px"}}>{err.ad}</div>}</div>
            <div><Inp label="Soyad" placeholder="Yılmaz" value={form.soyad} onChange={set("soyad")}/>{err.soyad&&<div style={{color:C.error,fontSize:"10px"}}>{err.soyad}</div>}</div>
          </div>
          <Inp label="TC" placeholder="12345678901" value={form.tc} onChange={set("tc")} optional/>
          <div><Inp label="Telefon" placeholder="0532 123 4567" value={form.tel} onChange={set("tel")}/>{err.tel&&<div style={{color:C.error,fontSize:"10px"}}>{err.tel}</div>}</div>
          <div><Inp label="E-posta" placeholder="ahmet@email.com" type="email" value={form.email} onChange={set("email")}/>{err.email&&<div style={{color:C.error,fontSize:"10px"}}>{err.email}</div>}</div>
          <div><Inp label="Şifre" placeholder="En az 6 karakter" type="password" value={form.sifre} onChange={set("sifre")}/>{err.sifre&&<div style={{color:C.error,fontSize:"10px"}}>{err.sifre}</div>}</div>
          <Inp label="Referans Kodu" placeholder="Sizi davet edenin tel no" value={form.refKod} onChange={set("refKod")} optional/>
        </>)}
        {step===2&&(<>
          <div style={{fontSize:"18px",fontWeight:"800",marginBottom:"12px"}}>🚗 Araç Bilgileri</div>
          <div style={{display:"flex",gap:"8px",marginBottom:"12px"}}>
            {[{v:"motorsiklet",e:"🏍️",l:"Motorsiklet"},{v:"otomobil",e:"🚗",l:"Otomobil"},{v:"kamyonet",e:"🚐",l:"Kamyonet"}].map(a=>(
              <div key={a.v} onClick={()=>setForm(f=>({...f,arac:a.v}))} style={{flex:1,padding:"10px 6px",borderRadius:"10px",textAlign:"center",cursor:"pointer",border:"2px solid "+(form.arac===a.v?C.accent:C.border),background:form.arac===a.v?C.accentGlow:C.inBg,fontSize:"11px",fontWeight:"700",color:form.arac===a.v?C.accent:C.muted}}>
                <div style={{fontSize:"18px",marginBottom:"3px"}}>{a.e}</div><div>{a.l}</div>
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}><Inp label="Araç Markası" placeholder="Honda" value={form.marka} onChange={set("marka")} optional/><Inp label="Araç Modeli" placeholder="PCX 125" value={form.model} onChange={set("model")} optional/></div>
          <div><Inp label="Plaka" placeholder="34 ABC 123" value={form.plaka} onChange={set("plaka")}/>{err.plaka&&<div style={{color:C.error,fontSize:"10px"}}>{err.plaka}</div>}</div>
        </>)}
        {step===3&&(<>
          <div style={{fontSize:"18px",fontWeight:"800",marginBottom:"12px"}}>📋 Vergi & IBAN</div>
          <Inp label="Vergi No" placeholder="1234567890" value={form.vergiNo} onChange={set("vergiNo")} optional/>
          <Inp label="Vergi Dairesi" placeholder="Kadıköy Vergi Dairesi" value={form.vergiD} onChange={set("vergiD")} optional/>
          <div><Inp label="IBAN" placeholder="TR00 0000 0000 0000 0000 0000 00" value={form.iban} onChange={set("iban")}/>{err.iban&&<div style={{color:C.error,fontSize:"10px"}}>{err.iban}</div>}</div>
          <div style={{marginTop:"14px",display:"flex",flexDirection:"column",gap:"10px"}}>
            {[{s:sozlesmeOnay,fn:setSozlesmeOnay,tip:"kullanim",label:"Kullanım Koşulları ve Sözleşmesini"},{s:kvkkOnay,fn:setKvkkOnay,tip:"kvkk",label:"KVKK Aydınlatma Metnini"}].map(x=>(
              <label key={x.tip} style={{display:"flex",alignItems:"flex-start",gap:"10px",cursor:"pointer",padding:"9px 12px",borderRadius:"9px",border:"1px solid "+(x.s?"rgba(34,197,94,0.4)":"rgba(239,68,68,0.2)"),background:x.s?"rgba(34,197,94,0.05)":"rgba(239,68,68,0.03)"}}>
                <input type="checkbox" checked={x.s} onChange={e=>x.fn(e.target.checked)} style={{width:"15px",height:"15px",accentColor:"#22c55e",cursor:"pointer",flexShrink:0,marginTop:"2px"}}/>
                <span style={{fontSize:"12px",color:"#94a3b8"}}><span onClick={e=>{e.preventDefault();setYasal(x.tip);}} style={{color:"#60a5fa",textDecoration:"underline",cursor:"pointer"}}>{x.label}</span> okudum ve kabul ediyorum. *</span>
              </label>
            ))}
          </div>
        </>)}
        <Alert type={alert.type} msg={alert.msg}/>
        <div style={{display:"flex",gap:"10px",marginTop:"20px"}}>
          {step>1&&<button onClick={()=>setStep(step-1)} style={{...btnS,flex:"none",padding:"10px 18px",fontSize:"13px"}}>← Geri</button>}
          {step<3?<button onClick={next} style={{...btnP,flex:1,padding:"11px",boxShadow:"none"}}>Devam →</button>:<button onClick={kayitOl} disabled={loading||!sozlesmeOnay||!kvkkOnay} style={{...btnP,flex:1,padding:"11px",boxShadow:"none",opacity:(loading||!sozlesmeOnay||!kvkkOnay)?0.5:1}}>{loading?<span className="spin">⏳</span>:"✓ Kayıt Ol"}</button>}
        </div>
      </div>
      {yasal&&<YasalModal tip={yasal} onClose={()=>setYasal(null)}/>}
    </div>
  );
}

function GecmisTeslimatlar(){
  const[liste,setListe]=useState([]);
  const[loading,setLoading]=useState(true);
  useEffect(()=>{(async()=>{const{data:{user:u}}=await sb.auth.getUser();const{data}=await sb.from("teslimatlar").select("*").eq("kurye_id",u.id).eq("durum","tamamlandi").order("created_at",{ascending:false}).limit(20);setListe(data||[]);setLoading(false);})();},[]);
  const netKazanc=(fiyat)=>Math.ceil((fiyat||0)*0.70);
  if(loading)return <div style={{textAlign:"center",color:C.muted,padding:"30px",fontSize:"13px"}}>⏳ Yükleniyor...</div>;
  if(!liste.length)return <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:"13px",padding:"40px",textAlign:"center",color:C.muted,fontSize:"13px"}}>Henüz tamamlanan teslimat yok.</div>;
  return(<div>{liste.map(s=>(<div key={s.id} style={{background:C.card,border:"1px solid "+C.border,borderRadius:"12px",padding:"14px",marginBottom:"10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:"12px",fontWeight:"600"}}>{s.gon_adres}</div><div style={{fontSize:"11px",color:C.muted,marginTop:"2px"}}>→ {s.al_adres}</div><div style={{fontSize:"10px",color:C.dim,marginTop:"3px"}}>{new Date(s.created_at).toLocaleDateString("tr-TR")}</div></div><div style={{textAlign:"right"}}><div style={{fontSize:"15px",fontWeight:"800",color:C.success}}>₺{netKazanc(s.fiyat)}</div><div style={{fontSize:"10px",color:C.dim,marginTop:"2px"}}>{s.agirlik} kg · {s.mesafe||"—"} km</div></div></div>))}</div>);
}

function KuryeDash({user,onLogout}){
  const[tab,setTab]=useState("bekleyen");
  const[siparisler,setSiparisler]=useState([]);
  const[aktifSiparis,setAktifSiparis]=useState(null);
  const[loading,setLoading]=useState(true);
  const[teslimKoduInput,setTeslimKoduInput]=useState("");
  const[teslimHata,setTeslimHata]=useState("");
  const[stats,setStats]=useState({toplamTeslimat:0,buAyKazanc:0,toplamKazanc:0,puan:0});
  const netKazanc=(fiyat)=>Math.ceil((fiyat||0)*0.70);
  const adGizle=(tamAd)=>{if(!tamAd)return "—";return tamAd.trim().split(" ").map(p=>{if(p.length<=2)return p;return p.slice(0,2)+"*".repeat(p.length-2);}).join(" ");};

  const yukle=async()=>{
    try{
      const{data:bek}=await sb.from("teslimatlar").select("*").eq("durum","bekliyor").order("created_at",{ascending:false});
      const{data:{user:u}}=await sb.auth.getUser();
      const{data:akt}=await sb.from("teslimatlar").select("*").eq("kurye_id",u.id).in("durum",["kabul_edildi","yolda"]).maybeSingle();
      const{data:tam}=await sb.from("teslimatlar").select("*").eq("kurye_id",u.id).eq("durum","tamamlandi");
      setSiparisler(bek||[]);setAktifSiparis(akt||null);
      const toplamT=tam?.length||0;
      const buAy=tam?.filter(t=>{const d=new Date(t.created_at),n=new Date();return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear();})||[];
      const odul=Math.floor(toplamT/50)*50;
      setStats({toplamTeslimat:toplamT,buAyKazanc:Math.ceil(buAy.reduce((s,t)=>s+(t.fiyat*0.70),0)),toplamKazanc:Math.ceil((tam?.reduce((s,t)=>s+(t.fiyat*0.70),0)||0)+odul),puan:4.8});
    }catch(e){console.log(e);}
    setLoading(false);
  };

  useEffect(()=>{yukle();const i=setInterval(yukle,15000);return()=>clearInterval(i);},[]);

  const kabul=async(siparis)=>{
    const{data:{user:u}}=await sb.auth.getUser();
    await sb.from("teslimatlar").update({kurye_id:u.id,durum:"kabul_edildi",kabul_zamani:new Date().toISOString()}).eq("id",siparis.id);
    setAktifSiparis({...siparis,kurye_id:u.id,durum:"kabul_edildi"});setSiparisler(s=>s.filter(x=>x.id!==siparis.id));setTab("aktif");
    window.open("https://www.google.com/maps/dir/?api=1&destination="+encodeURIComponent(siparis.gon_adres+", Türkiye")+"&travelmode=driving","_blank");
  };

  const paketiAldim=async()=>{
    const kod=Math.floor(1000+Math.random()*9000).toString();
    await sb.from("teslimatlar").update({durum:"yolda",teslim_kodu:kod}).eq("id",aktifSiparis.id);
    setAktifSiparis({...aktifSiparis,durum:"yolda",teslim_kodu:kod});
    window.open("https://www.google.com/maps/dir/?api=1&destination="+encodeURIComponent(aktifSiparis.al_adres+", Türkiye")+"&travelmode=driving","_blank");
    const smsOk=await smsSend(aktifSiparis.al_tel,"MotoTeslim teslimat kodunuz: "+kod+" - Kuryeye bu kodu veriniz.");
    alert(smsOk?"✓ Teslim kodu SMS ile gönderildi!":"✓ Teslimat başladı! Kod: "+kod);
  };

  const teslimEt=async()=>{
    if(teslimKoduInput!==aktifSiparis.teslim_kodu){setTeslimHata("Kod hatalı!");return;}
    await sb.from("teslimatlar").update({durum:"tamamlandi",tamamlanma_zamani:new Date().toISOString()}).eq("id",aktifSiparis.id);
    const fiyat=aktifSiparis.fiyat||0,yeniToplam=stats.toplamTeslimat+1;
    const{data:k}=await sb.from("kuryeler").select("bakiye").eq("user_id",user.id).maybeSingle();
    const kazanc=Math.ceil(fiyat*0.70),odulKazandi=yeniToplam%50===0,final=kazanc+(odulKazandi?50:0);
    await sb.from("kuryeler").update({bakiye:(parseFloat(k?.bakiye||0))+final}).eq("user_id",user.id);
    setAktifSiparis(null);setTeslimKoduInput("");setTeslimHata("");setTab("bekleyen");yukle();
    alert(odulKazandi?"🎉 50 teslimat ödülü dahil ₺"+final+" eklendi!":"✓ Tamamlandı! ₺"+kazanc+" eklendi!");
  };

  const odul=Math.floor(stats.toplamTeslimat/50)*50;
  const sonrakiOdul=50-(stats.toplamTeslimat%50);

  return(
    <div style={{maxWidth:"880px",margin:"0 auto",padding:"24px 20px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"24px"}}>
        <div><div style={{fontSize:"20px",fontWeight:"800"}}>Merhaba, {user.name.split(" ")[0]} 👋</div><div style={{fontSize:"12px",color:C.muted,marginTop:"3px"}}>Kurye Paneli</div></div>
        <button onClick={onLogout} style={{...btnS,fontSize:"12px",padding:"7px 14px"}}>Çıkış</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:"12px",marginBottom:"20px"}}>
        {[{l:"Bu Ay Kazanç",v:"₺"+stats.buAyKazanc,s:"Net kazanç"},{l:"Toplam Kazanç",v:"₺"+stats.toplamKazanc,s:odul>0?"₺"+odul+" ödül dahil":"Tüm zamanlar"},{l:"Teslimat",v:stats.toplamTeslimat,s:"Tamamlanan"},{l:"Puan",v:stats.toplamTeslimat>0?stats.puan+" ⭐":"—",s:"Değerlendirme"}].map(x=>(<div key={x.l} style={{background:C.card,border:"1px solid "+C.border,borderRadius:"13px",padding:"16px"}}><div style={{fontSize:"11px",color:C.muted,fontWeight:"600",marginBottom:"5px"}}>{x.l}</div><div style={{fontSize:"22px",fontWeight:"800"}}>{x.v}</div><div style={{fontSize:"11px",color:C.muted,marginTop:"3px"}}>{x.s}</div></div>))}
      </div>
      <div style={{background:"linear-gradient(135deg,rgba(232,80,10,0.1),rgba(30,58,96,0.2))",border:"1px solid "+C.accent,borderRadius:"14px",padding:"16px",marginBottom:"20px"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:"10px"}}><div style={{fontSize:"13px",fontWeight:"700"}}>🏆 Sadakat Ödülü</div><div style={{fontSize:"12px",color:C.accent,fontWeight:"700"}}>Her 50 = ₺50</div></div>
        <div style={{background:"rgba(0,0,0,0.2)",borderRadius:"20px",height:"8px",marginBottom:"8px"}}><div style={{background:"linear-gradient(90deg,"+C.accent+",#f26419)",borderRadius:"20px",height:"8px",width:((stats.toplamTeslimat%50)/50*100)+"%"}}/></div>
        <div style={{fontSize:"11px",color:C.muted}}>{stats.toplamTeslimat%50===0&&stats.toplamTeslimat>0?"🎉 Ödül kazandın!":"Sonraki ödüle "+sonrakiOdul+" teslimat kaldı"}</div>
      </div>
      {aktifSiparis&&(
        <div style={{background:"rgba(34,197,94,0.08)",border:"2px solid "+C.success,borderRadius:"14px",padding:"20px",marginBottom:"20px"}} className="fade">
          <div style={{fontSize:"14px",fontWeight:"800",color:C.success,marginBottom:"14px"}}>{aktifSiparis.durum==="kabul_edildi"?"🏍️ Gönderici Adresine Git":"📦 Alıcıya Teslim Et"}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"16px",fontSize:"12px"}}>
            <div style={{background:"rgba(232,80,10,0.1)",borderRadius:"10px",padding:"12px"}}><div style={{color:C.accent,fontWeight:"700",marginBottom:"4px"}}>📤 GÖNDERİCİ</div><div style={{fontWeight:"600"}}>{aktifSiparis.gon_ad}</div><div style={{color:C.muted}}>{aktifSiparis.gon_tel}</div><div style={{color:C.muted}}>{aktifSiparis.gon_adres}</div></div>
            <div style={{background:"rgba(34,197,94,0.08)",borderRadius:"10px",padding:"12px"}}><div style={{color:C.success,fontWeight:"700",marginBottom:"4px"}}>📥 ALICI</div><div style={{fontWeight:"600"}}>{adGizle(aktifSiparis.al_ad)}</div><div style={{color:C.muted}}>{aktifSiparis.al_tel}</div><div style={{color:C.muted}}>{aktifSiparis.al_adres}</div></div>
          </div>
          {aktifSiparis.durum==="kabul_edildi"&&(<div style={{display:"flex",gap:"10px"}}><button onClick={()=>window.open("https://www.google.com/maps/dir/?api=1&destination="+encodeURIComponent(aktifSiparis.gon_adres+", Türkiye")+"&travelmode=driving","_blank")} style={{...btnS,flex:1,fontSize:"13px",padding:"10px"}}>🗺️ Haritayı Aç</button><button onClick={paketiAldim} style={{...btnP,flex:1,fontSize:"13px",padding:"10px",boxShadow:"none"}}>📦 Paketi Aldım</button></div>)}
          {aktifSiparis.durum==="yolda"&&(
            <div>
              <div style={{background:"rgba(34,197,94,0.05)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:"10px",padding:"12px",marginBottom:"12px",fontSize:"12px",color:C.success}}>📱 Teslim kodu müşteriye gönderildi. Müşteriden kodu alın.</div>
              <div style={{display:"flex",gap:"10px",alignItems:"center",marginBottom:"10px"}}>
                <input value={teslimKoduInput} onChange={e=>setTeslimKoduInput(e.target.value)} placeholder="4 haneli kod" maxLength={4} style={{flex:1,padding:"12px",borderRadius:"9px",border:"1px solid "+C.inBorder,background:C.inBg,color:C.text,fontSize:"18px",fontWeight:"800",textAlign:"center",letterSpacing:"8px",outline:"none"}}/>
                <button onClick={()=>window.open("https://www.google.com/maps/dir/?api=1&destination="+encodeURIComponent(aktifSiparis.al_adres+", Türkiye")+"&travelmode=driving","_blank")} style={{...btnS,fontSize:"12px",padding:"12px 14px"}}>🗺️</button>
              </div>
              {teslimHata&&<div style={{color:C.error,fontSize:"11px",marginBottom:"8px"}}>⚠️ {teslimHata}</div>}
              <button onClick={teslimEt} style={{...btnP,width:"100%",boxShadow:"none"}}>✓ Teslim Ettim</button>
            </div>
          )}
        </div>
      )}
      <div style={{display:"flex",gap:"6px",marginBottom:"16px",background:C.inBg,borderRadius:"10px",padding:"4px"}}>
        {[["bekleyen","Bekleyen Siparişler"],["gecmis","Geçmiş"]].map(([v,l])=>(<button key={v} onClick={()=>setTab(v)} style={{flex:1,padding:"8px",borderRadius:"7px",border:"none",background:tab===v?C.accent:"transparent",color:tab===v?"#fff":C.muted,fontSize:"12px",fontWeight:"700",cursor:"pointer"}}>{l}</button>))}
      </div>
      {tab==="bekleyen"&&(
        <div>
          {loading&&<div style={{textAlign:"center",color:C.muted,padding:"40px"}}>⏳ Yükleniyor...</div>}
          {!loading&&!siparisler.length&&!aktifSiparis&&<div style={{background:C.card,border:"1px solid "+C.border,borderRadius:"13px",padding:"50px",textAlign:"center",color:C.muted,fontSize:"13px"}}>🏍️ Şu an bekleyen sipariş yok.</div>}
          {siparisler.map(s=>(
            <div key={s.id} style={{background:C.card,border:"1px solid "+C.border,borderRadius:"13px",padding:"16px",marginBottom:"12px"}} className="fade">
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:"10px"}}><div style={{fontSize:"11px",color:C.dim}}>#{s.id.slice(-6).toUpperCase()}</div><div style={{fontSize:"13px",fontWeight:"800",color:C.success}}>₺{netKazanc(s.fiyat)} net</div></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",fontSize:"12px",marginBottom:"10px"}}>
                <div><div style={{color:C.accent,fontWeight:"700",fontSize:"10px",marginBottom:"2px"}}>📤 GÖNDERİCİ</div><div style={{fontWeight:"600"}}>{s.gon_ad}</div><div style={{color:C.muted,fontSize:"11px"}}>{s.gon_adres}</div></div>
                <div><div style={{color:C.success,fontWeight:"700",fontSize:"10px",marginBottom:"2px"}}>📥 ALICI</div><div style={{fontWeight:"600"}}>{adGizle(s.al_ad)}</div><div style={{color:C.muted,fontSize:"11px"}}>{s.al_adres}</div></div>
              </div>
              <button onClick={()=>kabul(s)} disabled={!!aktifSiparis} style={{...btnP,width:"100%",boxShadow:"none",fontSize:"13px",padding:"10px",opacity:aktifSiparis?0.4:1,cursor:aktifSiparis?"not-allowed":"pointer"}}>{aktifSiparis?"Önce aktif teslimatı tamamla":"✓ Kabul Et"}</button>
            </div>
          ))}
        </div>
      )}
      {tab==="gecmis"&&<GecmisTeslimatlar/>}
    </div>
  );
}

function SifreDegistir(){
  const[sifre,setSifre]=useState(""),sifre2State=useState(""),loading=useState(false),alertState=useState({type:"",msg:""});
  const[s2,setS2]=sifre2State,[load,setLoad]=loading,[al,setAl]=alertState;
  const kaydet=async()=>{if(!sifre||sifre.length<6){setAl({type:"error",msg:"Şifre en az 6 karakter."});return;}if(sifre!==s2){setAl({type:"error",msg:"Şifreler eşleşmiyor."});return;}setLoad(true);const{error}=await sb.auth.updateUser({password:sifre});if(error)setAl({type:"error",msg:"Hata: "+error.message});else{setAl({type:"success",msg:"✓ Güncellendi!"});setTimeout(()=>{window.location.href=window.location.origin;},2500);}setLoad(false);};
  return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
      <div style={{width:"100%",maxWidth:"400px",background:C.card,border:"1px solid "+C.border,borderRadius:"18px",padding:"32px"}} className="fade">
        <div style={{textAlign:"center",marginBottom:"24px"}}><div style={{fontSize:"36px",marginBottom:"8px"}}>🔑</div><div style={{fontSize:"20px",fontWeight:"800"}}>Yeni Şifre Belirle</div></div>
        <Inp label="Yeni Şifre" type="password" placeholder="En az 6 karakter" value={sifre} onChange={e=>setSifre(e.target.value)}/>
        <Inp label="Şifre Tekrar" type="password" placeholder="Şifreni tekrar gir" value={s2} onChange={e=>setS2(e.target.value)}/>
        {al.msg&&<div style={{background:al.type==="error"?"rgba(239,68,68,0.1)":"rgba(34,197,94,0.1)",border:"1px solid "+(al.type==="error"?"rgba(239,68,68,0.3)":"rgba(34,197,94,0.3)"),borderRadius:"8px",padding:"10px 12px",fontSize:"12px",color:al.type==="error"?C.error:C.success,margin:"12px 0"}}>{al.msg}</div>}
        <button onClick={kaydet} disabled={load} style={{...btnP,width:"100%",boxShadow:"none",marginTop:"8px",opacity:load?0.7:1}}>{load?<span className="spin">⏳</span>:"Şifremi Güncelle"}</button>
      </div>
    </div>
  );
}

export default function App(){
  const[modal,setModal]=useState(null);
  const[user,setUser]=useState(null);
  const[ok,setOk]=useState(false);
  const[paketAc,setPaketAc]=useState(false);
  const[authChecked,setAuthChecked]=useState(false);
  const[sifreSifirla,setSifreSifirla]=useState(false);
  const[kariyerMetin,setKariyerMetin]=useState("");

  useEffect(()=>{
    sb.auth.onAuthStateChange((event)=>{if(event==="PASSWORD_RECOVERY")setSifreSifirla(true);});
    sb.from("ayarlar").select("deger").eq("id","kariyer_metin").maybeSingle().then(({data})=>setKariyerMetin(data?.deger||"MotoTeslim ile hem çalış hem kazan!\n\nSen de kurye olarak sisteme katıl, teslimat yap ve referanslarınla ekstra gelir elde et."));
    sb.auth.getSession().then(async({data:{session}})=>{
      if(session){const meta=session.user.user_metadata;const rol=meta.rol==="kurye"?"kurye":"uye";let adres="",tel="";if(rol==="uye"){const{data:md}=await sb.from("musteriler").select("*").eq("user_id",session.user.id).maybeSingle();adres=md?.adres||meta.adres||"";tel=md?.tel||meta.tel||"";}setUser({name:(meta.ad||"Kullanıcı")+" "+(meta.soyad||""),type:rol,adres,tel});}
      setAuthChecked(true);
    });
    const{data:{subscription}}=sb.auth.onAuthStateChange((_,session)=>{if(!session)setUser(null);});
    return()=>subscription.unsubscribe();
  },[]);

  const logout=async()=>{await sb.auth.signOut();setUser(null);setOk(false);};

  if(sifreSifirla)return <SifreDegistir/>;
  if(!authChecked)return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center"}}>
        <div style={{width:"48px",height:"48px",border:"3px solid #1e2d45",borderTop:"3px solid #e8500a",borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto 16px"}}></div>
        <div style={{color:C.muted,fontSize:"13px"}}>Yükleniyor...</div>
      </div>
    </div>
  );

  if(user?.type==="kurye")return(
    <div style={{minHeight:"100vh",background:C.bg}}>
      <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 32px",borderBottom:"1px solid "+C.border,background:"rgba(10,14,26,0.95)",backdropFilter:"blur(12px)",position:"sticky",top:0,zIndex:100}}>
        <div style={{fontSize:"20px",fontWeight:"900",color:C.accent}}>🏍️ MotoTeslim</div>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <div style={{width:"30px",height:"30px",borderRadius:"50%",background:C.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",fontWeight:"800"}}>{user.name[0]}</div>
          <span style={{fontSize:"13px",fontWeight:"600"}}>{user.name}</span>
          <button onClick={logout} style={{...btnS,fontSize:"12px",padding:"6px 12px"}}>Çıkış</button>
        </div>
      </nav>
      {ok&&<div style={{background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.3)",borderRadius:"10px",padding:"12px 18px",margin:"18px 32px 0",color:C.success,fontSize:"13px",fontWeight:"600"}}>✓ Kayıt başarılı! E-postanı doğruladıktan sonra tüm özelliklere erişebilirsin.</div>}
      <KuryeDash user={user} onLogout={logout}/>
    </div>
  );

  if(user&&(user.type==="uye"||user.type==="misafir"))return(
    <div style={{minHeight:"100vh",background:C.bg}}>
      <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 32px",borderBottom:"1px solid "+C.border,background:"rgba(10,14,26,0.95)",backdropFilter:"blur(12px)",position:"sticky",top:0,zIndex:100}}>
        <div style={{fontSize:"20px",fontWeight:"900",color:C.accent}}>🏍️ MotoTeslim</div>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}><span style={{fontSize:"13px",color:C.muted}}>👋 {user.name}</span><button onClick={logout} style={{...btnS,fontSize:"12px",padding:"6px 12px"}}>Çıkış</button></div>
      </nav>
      {paketAc?<PaketGonder user={user} onClose={()=>setPaketAc(false)}/>:(
        <div style={{maxWidth:"500px",margin:"60px auto",padding:"0 20px",textAlign:"center"}}>
          <div style={{fontSize:"44px",marginBottom:"14px"}}>📦</div>
          <div style={{fontSize:"20px",fontWeight:"800",marginBottom:"6px"}}>Merhaba, {user.name}!</div>
          <div style={{color:C.muted,marginBottom:"28px"}}>{user.type==="misafir"?"Misafir olarak giriş yaptınız":"Hesabınıza giriş yaptınız"}</div>
          <button onClick={()=>setPaketAc(true)} style={{...btnP,width:"100%",marginBottom:"12px"}}>📦 Paket Gönder</button>
          <button onClick={logout} style={{...btnS,width:"100%"}}>← Ana Sayfaya Dön</button>
        </div>
      )}
    </div>
  );

  return(
    <div style={{minHeight:"100vh",background:C.bg,backgroundImage:"radial-gradient(ellipse at 20% 50%,rgba(232,80,10,0.05) 0%,transparent 60%),radial-gradient(ellipse at 80% 20%,rgba(30,58,96,0.3) 0%,transparent 50%)"}}>
      <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 32px",borderBottom:"1px solid "+C.border,background:"rgba(10,14,26,0.95)",backdropFilter:"blur(12px)",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:"16px"}}>
          <div style={{fontSize:"20px",fontWeight:"900",color:C.accent}}>🏍️ MotoTeslim</div>
          <button onClick={()=>setModal("kariyer")} style={{padding:"6px 14px",borderRadius:"20px",border:"1px solid rgba(232,80,10,0.4)",background:"rgba(232,80,10,0.08)",color:C.accent,fontSize:"12px",fontWeight:"700",cursor:"pointer",whiteSpace:"nowrap"}}>🏆 Kariyer Planı</button>
        </div>
        <div>
          <button style={{padding:"8px 16px",borderRadius:"8px",cursor:"pointer",fontSize:"13px",fontWeight:"700",border:"1px solid "+C.border,background:"transparent",color:C.muted,marginLeft:"8px"}} onClick={()=>setModal("giris")}>Kurye Girişi</button>
          <button style={{padding:"8px 16px",borderRadius:"8px",cursor:"pointer",fontSize:"13px",fontWeight:"700",border:"1px solid "+C.accent,background:C.accentGlow,color:C.accent,marginLeft:"8px"}} onClick={()=>setModal("kayit")}>Kurye Ol</button>
        </div>
      </nav>

      <div style={{textAlign:"center",padding:"60px 20px 50px"}}>
        <div style={{fontSize:"80px",marginBottom:"20px"}}>🏍️</div>
        <div style={{display:"inline-block",padding:"5px 14px",borderRadius:"20px",border:"1px solid "+C.accent,color:C.accent,fontSize:"11px",fontWeight:"700",letterSpacing:"1px",textTransform:"uppercase",marginBottom:"20px"}}>⚡ mototeslim.com — Hızlı Teslimat</div>
        <h1 style={{fontSize:"clamp(28px,5vw,52px)",fontWeight:"900",lineHeight:"1.1",marginBottom:"16px",letterSpacing:"-1px",color:C.text}}>Paketini Gönder,<br/><span style={{color:C.accent}}>MotoTeslim Halleder</span></h1>
        <p style={{fontSize:"15px",color:C.muted,maxWidth:"460px",margin:"0 auto 36px",lineHeight:"1.7"}}>Yakınındaki kuryelere anında bildirim. Ağırlığa göre uygun araç, şeffaf fiyat, güvenli ödeme.</p>
        <div style={{display:"flex",gap:"12px",justifyContent:"center",flexWrap:"wrap"}}>
          <button style={{...btnP}} onClick={()=>setModal("gonder")}>📦 Paket Gönder</button>
          <button style={{...btnS}} onClick={()=>setModal("kayit")}>🏍️ Kurye Ol</button>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:"18px",padding:"0 32px 70px",maxWidth:"1100px",margin:"0 auto"}}>
        {[{i:"⚖️",t:"Akıllı Fiyatlandırma",d:"Ağırlık ve mesafeye göre otomatik hesaplama."},{i:"📍",t:"En Yakın Kurye",d:"Önce yakındaki kuryeler bildirim alır."},{i:"🔒",t:"Güvenli Teslimat",d:"4 haneli teslim kodu ile güvenli el değiştirme."},{i:"💳",t:"PayTR ile Ödeme",d:"Kart ile güvenli ödeme. Kurye ücreti otomatik transfer."}].map(f=>(
          <div key={f.t} style={{background:C.card,border:"1px solid "+C.border,borderRadius:"16px",padding:"26px"}}>
            <div style={{fontSize:"26px",marginBottom:"12px"}}>{f.i}</div>
            <div style={{fontSize:"14px",fontWeight:"700",marginBottom:"6px",color:C.text}}>{f.t}</div>
            <div style={{fontSize:"12px",color:C.muted,lineHeight:"1.6"}}>{f.d}</div>
          </div>
        ))}
      </div>

      <footer style={{borderTop:"1px solid "+C.border,background:"rgba(10,14,26,0.95)",padding:"40px 32px 24px"}}>
        <div style={{maxWidth:"1000px",margin:"0 auto"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:"32px",marginBottom:"32px"}}>
            <div><div style={{fontSize:"20px",fontWeight:"900",color:C.accent,marginBottom:"12px"}}>🏍️ MotoTeslim</div><div style={{fontSize:"12px",color:C.dim,lineHeight:"1.7"}}>Hızlı, güvenli ve şeffaf teslimat platformu.</div></div>
            {[{baslik:"Destek",linkler:[{l:"İletişim",m:"iletisim"},{l:"Şikayet",m:"sikayet"},{l:"Öneri",m:"oneri"},{l:"SSS",m:"sss"}]},{baslik:"Yasal",linkler:[{l:"Kullanım Koşulları",m:"kullanim"},{l:"KVKK",m:"kvkk"},{l:"Gizlilik",m:"gizlilik"},{l:"İade & İptal",m:"iade"}]}].map(g=>(
              <div key={g.baslik}>
                <div style={{fontSize:"12px",fontWeight:"800",color:C.text,marginBottom:"12px"}}>{g.baslik}</div>
                {g.linkler.map(l=>(<div key={l.l} onClick={()=>setModal(l.m)} style={{fontSize:"12px",color:C.muted,marginBottom:"8px",cursor:"pointer"}} onMouseEnter={e=>e.target.style.color=C.accent} onMouseLeave={e=>e.target.style.color=C.muted}>{l.l}</div>))}
              </div>
            ))}
          </div>
          <div style={{borderTop:"1px solid "+C.border,paddingTop:"20px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"10px"}}>
            <div style={{fontSize:"11px",color:C.dim}}>© 2025 MotoTeslim. Tüm hakları saklıdır.</div>
            <div style={{fontSize:"11px",color:C.dim}}>Güvenli ödeme: PayTR 256-bit SSL</div>
          </div>
        </div>
      </footer>

      {modal==="kayit"&&<KuryeKayit onClose={()=>setModal(null)} onSuccess={u=>{setUser(u);setModal(null);setOk(true);}}/>}
      {modal==="giris"&&<KuryeGiris onClose={()=>setModal(null)} onSuccess={u=>{setUser(u);setModal(null);}}/>}
      {modal==="gonder"&&<GondericiModal onClose={()=>setModal(null)} onSuccess={(u,acPaket)=>{setUser(u);setModal(null);if(acPaket)setPaketAc(true);}}/>}

      {modal==="kariyer"&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}} onClick={()=>setModal(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:C.card,border:"1px solid "+C.border,borderRadius:"18px",padding:"28px",width:"100%",maxWidth:"560px",maxHeight:"85vh",overflowY:"auto"}} className="fade">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"}}><div style={{fontSize:"17px",fontWeight:"800"}}>🏆 Kariyer Planı</div><button onClick={()=>setModal(null)} style={{background:"none",border:"none",color:C.muted,fontSize:"22px",cursor:"pointer"}}>×</button></div>
            <div style={{fontSize:"13px",color:"#94a3b8",lineHeight:"2",whiteSpace:"pre-wrap"}}>{kariyerMetin}</div>
            <button onClick={()=>setModal(null)} style={{...btnP,width:"100%",marginTop:"20px",boxShadow:"none"}}>Tamam</button>
          </div>
        </div>
      )}

      {["kimiz","iletisim","sikayet","oneri","sss"].includes(modal)&&<FooterModal tip={modal} onClose={()=>setModal(null)}/>}
      {["kullanim","kvkk","gizlilik","cerez","iade","hakkimizda","misyon"].includes(modal)&&<YasalModal tip={modal} onClose={()=>setModal(null)}/>}
    </div>
  );
}
