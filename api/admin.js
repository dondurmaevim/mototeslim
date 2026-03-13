const { createClient } = require("@supabase/supabase-js");
const nodemailer = require("nodemailer");

const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false });

  const { islem, user_id, tablo, id, yeni_sifre, mailler, baslik, mesaj } = req.body || {};

  // Kullanıcı sil
  if (islem === "sil_kullanici") {
    try {
      if (tablo === "kuryeler") {
        await sb.from("teslimatlar").update({ kurye_id: null }).eq("kurye_id", id);
        await sb.from("odemeler").delete().eq("kurye_id", id);
        await sb.from("kuryeler").delete().eq("id", id);
      } else {
        await sb.from("teslimatlar").update({ musteri_id: null }).eq("musteri_id", id);
        await sb.from("musteriler").delete().eq("id", id);
      }
      const { error } = await sb.auth.admin.deleteUser(user_id);
      if (error) return res.json({ ok: false, error: error.message });
      return res.json({ ok: true });
    } catch (e) {
      return res.json({ ok: false, error: e.message });
    }
  }

  // Şifre değiştir
  if (islem === "sifre_degistir") {
    try {
      const { error } = await sb.auth.admin.updateUserById(user_id, { password: yeni_sifre });
      if (error) return res.json({ ok: false, error: error.message });
      return res.json({ ok: true });
    } catch (e) {
      return res.json({ ok: false, error: e.message });
    }
  }

  // Email listesi getir
  if (islem === "emailleri_getir") {
    try {
      const { data, error } = await sb.auth.admin.listUsers({ perPage: 1000 });
      if (error) return res.json({ ok: false, error: error.message });
      const users = (data?.users || []).map(u => ({ id: u.id, email: u.email }));
      return res.json({ ok: true, users });
    } catch (e) {
      return res.json({ ok: false, error: e.message });
    }
  }

  // Toplu mail gönder
  if (islem === "toplu_mail") {
    try {
      if (!mailler || mailler.length === 0)
        return res.json({ ok: false, error: "Mail listesi boş" });

      // Supabase Auth email gönder (her kullanıcıya)
      // NOT: Kendi SMTP kurulumu için SMTP_HOST, SMTP_USER, SMTP_PASS env ekleyin
      const smtpHost = process.env.SMTP_HOST;
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;

      if (smtpHost && smtpUser && smtpPass) {
        const transporter = nodemailer.createTransporter({
          host: smtpHost,
          port: 587,
          secure: false,
          auth: { user: smtpUser, pass: smtpPass },
        });

        let basari = 0;
        for (const mail of mailler) {
          try {
            await transporter.sendMail({
              from: `"MotoTeslim" <${smtpUser}>`,
              to: mail,
              subject: baslik || "MotoTeslim Duyurusu",
              text: mesaj,
              html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
                <div style="background:#e8500a;padding:20px;border-radius:10px 10px 0 0">
                  <h2 style="color:#fff;margin:0">MotoTeslim</h2>
                </div>
                <div style="background:#f8fafc;padding:24px;border-radius:0 0 10px 10px">
                  <p style="color:#1e293b;line-height:1.7">${mesaj.replace(/\n/g, "<br>")}</p>
                  <hr style="border:1px solid #e2e8f0;margin:20px 0"/>
                  <p style="color:#94a3b8;font-size:12px">MotoTeslim - mototeslim.com</p>
                </div>
              </div>`,
            });
            basari++;
          } catch {}
        }
        return res.json({ ok: true, basari });
      } else {
        // SMTP yok — Supabase üzerinden admin email
        // Şimdilik sadece loglayalım
        console.log("Toplu mail istendi:", mailler.length, "adres,", baslik);
        return res.json({ ok: false, error: "SMTP ayarları yapılmamış. Vercel env'e SMTP_HOST, SMTP_USER, SMTP_PASS ekleyin." });
      }
    } catch (e) {
      return res.json({ ok: false, error: e.message });
    }
  }

  return res.status(400).json({ ok: false, error: "Bilinmeyen islem" });
};
