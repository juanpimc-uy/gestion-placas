const ORG_ID = '650251363';

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
  let { num } = req.query;
  if (!num) return res.status(400).json({ error: 'Falta número de OC.' });
  // Accept bare number or full OC-XXXXX
  num = num.trim();
  const ocNum = num.startsWith('OC-') ? num : `OC-${num}`;
  try {
    const token = await getToken();
    const url = `https://books.zoho.com/api/v3/purchaseorders?organization_id=${ORG_ID}&purchaseorder_number=${encodeURIComponent(ocNum)}`;
    const r = await fetch(url, { headers: { Authorization: `Zoho-oauthtoken ${token}` } });
    const data = await r.json();
    const orders = data.purchaseorders || [];
    if (!orders.length) return res.status(404).json({ error: `No se encontró ${ocNum}` });
    // Fetch full detail
    const detailUrl = `https://books.zoho.com/api/v3/purchaseorders/${orders[0].purchaseorder_id}?organization_id=${ORG_ID}`;
    const dr = await fetch(detailUrl, { headers: { Authorization: `Zoho-oauthtoken ${token}` } });
    const detail = await dr.json();
    const po = detail.purchaseorder || {};
    const line_items = (po.line_items || []).map(li => ({
      item_name: li.name || li.item_name || '',
      sku: li.sku || '',
      quantity: parseFloat(li.quantity) || 0
    }));
    res.json({ oc_number: ocNum, line_items });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
