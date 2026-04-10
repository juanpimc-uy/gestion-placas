async function getToken() {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: process.env.ZOHO_CLIENT_ID,
    client_secret: process.env.ZOHO_CLIENT_SECRET,
    refresh_token: process.env.ZOHO_REFRESH_TOKEN
  });
  const r = await fetch('https://accounts.zoho.com/oauth/v2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });
  const d = await r.json();
  if (!d.access_token) throw new Error('No token: ' + JSON.stringify(d));
  return d.access_token;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const { q } = req.query;
  if (!q || q.trim().length < 2) return res.status(400).json({ error: 'Query muy corta.' });
  const org_id = process.env.ZOHO_ORG_ID || '650251363';
  try {
    const token = await getToken();
    const url = `https://www.zohoapis.com/inventory/v1/items?organization_id=${org_id}&search_text=${encodeURIComponent(q.trim())}&per_page=25`;
    const r = await fetch(url, { headers: { Authorization: `Zoho-oauthtoken ${token}` } });
    const data = await r.json();
    const items = (data.items || []).map(i => ({ item_name: i.name, sku: i.sku || '' }));
    res.json({ items });
  } catch (e) {
    res.status(500).json({ error: e.message, stack: e.stack });
  }
};
