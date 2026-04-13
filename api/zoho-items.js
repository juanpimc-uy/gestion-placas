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

  const { q } = req.query;
  const orgId = process.env.ZOHO_ORG_ID || '650251363';

  if (!q || q.length < 2) {
    return res.status(400).json({ error: 'Query muy corta' });
  }

  try {
    const token = await getToken();
    const url = `https://www.zohoapis.com/books/v3/items?organization_id=${orgId}&search_text=${encodeURIComponent(q)}&per_page=25`;
    const zohoRes = await fetch(url, {
      headers: { Authorization: `Zoho-oauthtoken ${token}` },
    });
    const data = await zohoRes.json();
    const items = (data.items || []).map(i => ({
      item_name: i.name,
      sku:       i.sku || '',
      rate:      i.rate || 0,
    }));
    return res.status(200).json({ items });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
