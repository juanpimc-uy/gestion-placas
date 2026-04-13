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

    // 1) Buscar por número para obtener el ID
    const listUrl = `https://www.zohoapis.com/books/v3/purchaseorders?organization_id=${orgId}&purchaseorder_number=${encodeURIComponent(numero)}`;
    const listRes = await fetch(listUrl, {
      headers: { Authorization: `Zoho-oauthtoken ${token}` },
    });
    const listData = await listRes.json();

    if (!listData.purchaseorders || !listData.purchaseorders.length) {
      return res.status(404).json({ error: `OC ${numero} no encontrada` });
    }

    const poId = listData.purchaseorders[0].purchaseorder_id;
    const poNumber = listData.purchaseorders[0].purchaseorder_number;

    // 2) Traer el PO completo con line_items
    const detailUrl = `https://www.zohoapis.com/books/v3/purchaseorders/${poId}?organization_id=${orgId}`;
    const detailRes = await fetch(detailUrl, {
      headers: { Authorization: `Zoho-oauthtoken ${token}` },
    });
    const detailData = await detailRes.json();
    const po = detailData.purchaseorder;

    return res.status(200).json({
      oc_number: poNumber,
      line_items: (po.line_items || []).map(li => ({
        item_name: li.name || li.item_name || '',
        sku:       li.sku  || '',
        quantity:  li.quantity || 0,
      })),
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
