module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch(e) { body = {}; }
  }
  if (!body) body = {};

  const telefon = body.telefon;
  const mesaj = body.mesaj;

  if (!telefon || !mesaj) {
    return res.status(400).json({ error: 'telefon ve mesaj zorunlu' });
  }

  const tel = String(telefon).replace(/\D/g, '').replace(/^0/, '');

  try {
    // Türkçe karakterleri değiştir
    const temizMesaj = mesaj
      .replace(/ğ/g,'g').replace(/Ğ/g,'G')
      .replace(/ü/g,'u').replace(/Ü/g,'U')
      .replace(/ş/g,'s').replace(/Ş/g,'S')
      .replace(/ı/g,'i').replace(/İ/g,'I')
      .replace(/ö/g,'o').replace(/Ö/g,'O')
      .replace(/ç/g,'c').replace(/Ç/g,'C');

    const url = 'https://api.netgsm.com.tr/sms/send/get/?' + new URLSearchParams({
      usercode: '2589110752',
      password: 'Karakoc11.',
      gsmno: tel,
      message: temizMesaj,
      msgheader: 'cofnaturele',
    }).toString();

    const response = await fetch(url);
    const text = await response.text();
    const basarili = text.trim().startsWith('00') || text.trim().startsWith('01') || text.trim().startsWith('02');

    if (basarili) {
      res.status(200).json({ success: true, kod: text.trim() });
    } else {
      res.status(400).json({ success: false, hata: text.trim() });
    }
  } catch (err) {
    res.status(500).json({ success: false, hata: err.message });
  }
}
