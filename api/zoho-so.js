async function getToken() {
  const params = new URLSearchParams({
    client_id:     process.env.ZOHO_CLIENT_ID,
    client_secret: process.env.ZOHO_CLIENT_SECRET,
    refresh_token: process.env.ZOHO_REFRESH_TOKEN,
    grant_type:    'refresh_token',
  });
  const res = await fetch('https://accounts.zoho.com/oauth/v2/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    params.toString(),
  });
  const data = await res.json();
  if (data.error) throw new Error(`Token error: ${data.error}`);
  return data.access_token;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  const { numero } = req.query;
  const orgId = process.env.ZOHO_ORG_ID || '650251363';
  try {
    const token = await getToken();
    let url = `https://www.zohoapis.com/books/v3/salesorders?organization_id=${orgId}&sort_column=date&sort_order=D`;
    if (numero) url += `&salesorder_number=${encodeURIComponent(numero)}`;
    const zohoRes = await fetch(url, {
      headers: { Authorization: `Zoho-oauthtoken ${token}` },
    });
    const data = await zohoRes.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
