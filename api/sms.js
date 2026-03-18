export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { telefon, mesaj } = req.body || {}
  if (!telefon || !mesaj) return res.status(400).json({ error: 'telefon ve mesaj zorunlu' })

  const tel = String(telefon).replace(/\D/g, '').replace(/^90/, '').replace(/^0/, '')

  const temizMesaj = mesaj
    .replace(/ğ/g,'g').replace(/Ğ/g,'G')
    .replace(/ü/g,'u').replace(/Ü/g,'U')
    .replace(/ş/g,'s').replace(/Ş/g,'S')
    .replace(/ı/g,'i').replace(/İ/g,'I')
    .replace(/ö/g,'o').replace(/Ö/g,'O')
    .replace(/ç/g,'c').replace(/Ç/g,'C')

  try {
    const url = `https://api.netgsm.com.tr/sms/send/get/?usercode=2589110752&password=Karakoc72.&gsmno=${tel}&message=${encodeURIComponent(temizMesaj)}&msgheader=dondurmaevi`
    const response = await fetch(url)
    const text = await response.text()
    const kod = text.trim().split(' ')[0]
    const basarili = ['00','01','02'].includes(kod)
    if (basarili) return res.status(200).json({ success: true })
    return res.status(400).json({ success: false, hata: text.trim() })
  } catch (err) {
    return res.status(500).json({ success: false, hata: err.message })
  }
}