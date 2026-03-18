// Vercel Serverless Function - /api/sms.js
// Netgsm SMS gönderimi - GET API

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

  // Telefonu formatla
  const tel = String(telefon).replace(/\D/g, '').replace(/^90/, '').replace(/^0/, '');

  // Türkçe karakterleri temizle
  const temizMesaj = mesaj
    .replace(/ğ/g,'g').replace(/Ğ/g,'G')
    .replace(/ü/g,'u').replace(/Ü/g,'U')
    .replace(/ş/g,'s').replace(/Ş/g,'S')
    .replace(/ı/g,'i').replace(/İ/g,'I')
    .replace(/ö/g,'o').replace(/Ö/g,'O')
    .replace(/ç/g,'c').replace(/Ç/g,'C');

  const USERCODE  = '2589110752';
  const PASSWORD  = 'Karakoc72.';
  const MSGHEADER = 'dondurmaevi';

  try {
    const url = `https://api.netgsm.com.tr/sms/send/get/?usercode=${USERCODE}&password=${PASSWORD}&gsmno=${tel}&message=${encodeURIComponent(temizMesaj)}&msgheader=${MSGHEADER}`;

    console.log('Istek URL:', url);

    const response = await fetch(url);
    const text = await response.text();

    console.log('Netgsm yanit:', text);
    console.log('Tel:', tel);
    console.log('Mesaj:', temizMesaj);

    const kod = text.trim().split(' ')[0];
    const basarili = kod === '00' || kod === '01' || kod === '02';

    if (basarili) {
      res.status(200).json({ success: true, kod: text.trim() });
    } else {
      const hatalar = {
        '20': 'Mesaj metni bos',
        '30': 'Gecersiz kullanici adi veya sifre',
        '40': 'Mesaj basligi tanimli degil',
        '50': 'Yetersiz bakiye',
        '51': 'Kontor yetersiz',
        '70': 'Hatali sorgulama - eksik parametre',
        '80': 'Limit asildi',
        '85': 'Operator hatasi',
      };
      const aciklama = hatalar[kod] || `Bilinmeyen hata: ${kod}`;
      res.status(400).json({ success: false, hata: text.trim(), aciklama });
    }
  } catch (err) {
    console.error('SMS hata:', err);
    res.status(500).json({ success: false, hata: err.message });
  }
};
