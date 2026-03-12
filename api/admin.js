const SUPABASE_URL = 'https://ysvfwvebxdshwagtlmdc.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzdmZ3dmVieGRzaHdhZ3RsbWRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjc3NjM3MCwiZXhwIjoyMDg4MzUyMzcwfQ.ePTRmL7zh4tGNwuRH5chvzsLgkMy1QAJKlj8cX85CNQ';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { islem, user_id, yeni_sifre, tablo, id } = req.body;

  try {
    if (islem === 'sil_kullanici') {
      if (tablo && id) {
        await fetch(`${SUPABASE_URL}/rest/v1/${tablo}?id=eq.${id}`, {
          method: 'DELETE',
          headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
          }
        });
      }
      if (user_id) {
        const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user_id}`, {
          method: 'DELETE',
          headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
          }
        });
        if (!r.ok) {
          const err = await r.json();
          return res.status(400).json({ error: err.message || 'Silme hatası' });
        }
      }
      return res.json({ ok: true });
    }

    if (islem === 'sifre_degistir') {
      if (!user_id || !yeni_sifre) return res.status(400).json({ error: 'Eksik bilgi' });
      if (yeni_sifre.length < 6) return res.status(400).json({ error: 'Şifre en az 6 karakter olmalı' });
      const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user_id}`, {
        method: 'PUT',
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: yeni_sifre })
      });
      if (!r.ok) {
        const err = await r.json();
        return res.status(400).json({ error: err.message || 'Şifre değiştirme hatası' });
      }
      return res.json({ ok: true });
    }

    return res.status(400).json({ error: 'Geçersiz işlem' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
