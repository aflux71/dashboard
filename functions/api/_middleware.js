// JWT helper functions (minimal implementation without external deps)
const PUBLIC_ROUTES = [
  '/api/auth/login',
  '/api/auth/google',
  '/api/auth/google-callback',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/setup',
  '/api/hooks/cliq/command',
  '/api/hooks/cliq/action',
  '/api/company-games/cron',
];

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function base64UrlEncode(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function getJwtSecret(env) {
  // Use a secret from env or a default for local dev
  const secret = env.JWT_SECRET || 'staff-dashboard-dev-secret-change-in-production';
  const encoder = new TextEncoder();
  return await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function createJWT(payload, env) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + 86400, // 24 hours
  };

  const encoder = new TextEncoder();
  const headerB64 = base64UrlEncode(encoder.encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(encoder.encode(JSON.stringify(fullPayload)));
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = await getJwtSecret(env);
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(signingInput)
  );

  return `${signingInput}.${base64UrlEncode(signature)}`;
}

export async function verifyJWT(token, env) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, signatureB64] = parts;
  const encoder = new TextEncoder();
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = await getJwtSecret(env);
  const signatureBytes = base64UrlDecode(signatureB64);

  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    signatureBytes,
    encoder.encode(signingInput)
  );

  if (!valid) return null;

  const payloadBytes = base64UrlDecode(payloadB64);
  const payload = JSON.parse(new TextDecoder().decode(payloadBytes));

  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
}

function getCookie(cookieHeader, name) {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';');
  for (const cookie of cookies) {
    const [key, ...vals] = cookie.trim().split('=');
    if (key === name) return vals.join('=');
  }
  return null;
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // Skip auth for public routes
  if (PUBLIC_ROUTES.some(route => path === route)) {
    return await context.next();
  }

  // Skip auth for non-API routes
  if (!path.startsWith('/api/')) {
    return await context.next();
  }

  // Get JWT from cookie
  const cookieHeader = request.headers.get('Cookie');
  const token = getCookie(cookieHeader, 'auth_token');

  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const payload = await verifyJWT(token, env);
  if (!payload) {
    return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Fetch full user from DB
  const user = await env.DB.prepare(
    'SELECT id, username, email, display_name, role_id, is_admin, is_active FROM users WHERE id = ?'
  ).bind(payload.sub).first();

  if (!user || !user.is_active) {
    return new Response(JSON.stringify({ error: 'Account disabled or not found' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check admin routes
  if (path.startsWith('/api/admin') && !user.is_admin) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Attach user to context
  context.data = context.data || {};
  context.data.user = user;

  return await context.next();
}
