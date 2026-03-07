// Vercel Serverless Function - /api/sms
// Bu dosyayı GitHub'da /api/sms.js olarak yükle

module.exports = async function handler handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { telefon, mesaj } = req.body;
  if (!telefon || !mesaj) return res.status(400).json({ error: 'telefon ve mesaj zorunlu' });

  // Telefonu formatla (başındaki 0'ı kaldır)
  const tel = telefon.replace(/\D/g, '').replace(/^0/, '');

  try {
    const params = new URLSearchParams({
      usercode: '2589110752',
      password: 'Karakoc11.',
      gsmno: tel,
      message: mesaj,
      msgheader: 'cofnaturele',
      dil: 'TR:1',
    });

    const response = await fetch('https://api.netgsm.com.tr/sms/send/get/?' + params.toString());
    const text = await response.text();

    // Netgsm başarı kodları: 00, 01, 02
    const basarili = text.startsWith('00') || text.startsWith('01') || text.startsWith('02');
    
    if (basarili) {
      res.status(200).json({ success: true, kod: text.trim() });
    } else {
      res.status(400).json({ success: false, hata: text.trim() });
    }
  } catch (err) {
    res.status(500).json({ success: false, hata: err.message });
  }
}
