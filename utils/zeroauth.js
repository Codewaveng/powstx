const https = require('https');

function httpsRequest(method, hostname, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : '';
    const req = https.request(
      {
        hostname,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'POWtfolio/1.0',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
          ...headers
        },
        timeout: 12000
      },
      (res) => {
        let data = '';
        res.on('data', c => (data += c));
        res.on('end', () => {
          let parsed;
          try { parsed = JSON.parse(data); } catch { parsed = data; }
          resolve({ status: res.statusCode, body: parsed, raw: data });
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out after 12s')); });
    if (payload) req.write(payload);
    req.end();
  });
}

// Normalize the ZeroAuth /api/users/{address}?includeStats=true response
function normalize(address, body) {
  // Primary ZeroAuth API shape: { user: { activityScore, _count, username, bnsName, ... } }
  if (body && typeof body === 'object' && body.user) {
    const u = body.user;
    const count = u._count || {};
    return {
      address,
      score:              u.activityScore           ?? 0,
      badges:             count.receivedEndorsements ?? 0,
      nftCount:           count.portfolio            ?? 0,
      bounties:           count.createdBounties      ?? 0,
      submissions:        count.bountySubmissions    ?? 0,
      gigs:               count.takenGigs            ?? 0,
      displayName:        u.username  || u.bnsName  || '',
      bnsName:            u.bnsName   || '',
      bio:                u.bio       || '',
      profileCompleteness: u.profileCompleteness ?? 0,
      verified: !!(u.isXProfileVerified || u.isDiscordProfileVerified || u.isTelegramProfileVerified)
    };
  }

  // Generic fallback for other possible shapes
  const src = (body && (body.data || body.result)) || body || {};
  return {
    address,
    score:       src.activityScore     ?? src.reputation_score ?? src.score  ?? 0,
    badges:      src.receivedEndorsements ?? src.badge_count   ?? src.badges ?? 0,
    nftCount:    src.portfolio         ?? src.nft_count        ?? src.nfts   ?? 0,
    bounties:    0,
    submissions: 0,
    gigs:        0,
    displayName: src.username ?? src.display_name ?? src.name ?? '',
    bnsName:     src.bnsName  ?? '',
    bio:         src.bio      ?? '',
    profileCompleteness: 0,
    verified:    !!(src.isXProfileVerified ?? src.is_verified ?? src.verified ?? false)
  };
}

async function fetchWalletReputation(stacksAddress) {
  const errors = [];
  const apiKey = process.env.ZEROAUTH_API_KEY;
  const authHeader = apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {};

  // Primary: ZeroAuth REST API — returns full user profile + activity stats
  try {
    const res = await httpsRequest('GET', 'zeroauthoritydao.com',
      `/api/users/${encodeURIComponent(stacksAddress)}?includeStats=true`,
      null, authHeader
    );
    console.log('[ZeroAuth] Primary status:', res.status);
    if (res.status === 200 && typeof res.body === 'object') {
      const result = normalize(stacksAddress, res.body);
      console.log('[ZeroAuth] Resolved:', JSON.stringify(result));
      return result;
    }
    errors.push(`Primary status=${res.status} body=${res.raw.slice(0, 120)}`);
  } catch (e) { errors.push(`Primary err: ${e.message}`); }

  // Fallback: without includeStats
  try {
    const res = await httpsRequest('GET', 'zeroauthoritydao.com',
      `/api/users/${encodeURIComponent(stacksAddress)}`,
      null, authHeader
    );
    console.log('[ZeroAuth] Fallback status:', res.status);
    if (res.status === 200 && typeof res.body === 'object') {
      return normalize(stacksAddress, res.body);
    }
    errors.push(`Fallback status=${res.status} body=${res.raw.slice(0, 120)}`);
  } catch (e) { errors.push(`Fallback err: ${e.message}`); }

  const detail = errors.join(' | ');
  console.error('[ZeroAuth] All attempts failed:', detail);
  throw new Error(detail || 'Could not reach ZeroAuth API');
}

module.exports = { fetchWalletReputation };
