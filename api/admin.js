const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ysvfwvebxdshwagtlmdc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzdmZ3dmVieGRzaHdhZ3RsbWRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjc3NjM3MCwiZXhwIjoyMDg4MzUyMzcwfQ.ePTRmL7zh4tGNwuRH5chvzsLgkMy1QAJKlj8cX85CNQ',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { islem, user_id, yeni_sifre, tablo, id } = req.body;

  try {
    if (islem === 'sil_kullanici') {
      // Önce tablodan sil
      if (tablo) {
        await supabase.from(tablo).delete().eq('id', id);
      }
      // Auth'dan sil
      if (user_id) {
        const { error } = await supabase.auth.admin.deleteUser(user_id);
        if (error) return res.status(400).json({ error: error.message });
      }
      return res.json({ ok: true });
    }

    if (islem === 'sifre_degistir') {
      if (!user_id || !yeni_sifre) return res.status(400).json({ error: 'Eksik bilgi' });
      if (yeni_sifre.length < 6) return res.status(400).json({ error: 'Şifre en az 6 karakter olmalı' });
      const { error } = await supabase.auth.admin.updateUserById(user_id, { password: yeni_sifre });
      if (error) return res.status(400).json({ error: error.message });
      return res.json({ ok: true });
    }

    return res.status(400).json({ error: 'Geçersiz işlem' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
