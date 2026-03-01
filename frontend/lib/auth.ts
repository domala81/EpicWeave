// ── Mode detection ────────────────────────────────────────────────────────────
const LOCAL_MODE = process.env.NEXT_PUBLIC_LOCAL_MODE === 'true';
const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT || 'http://localhost:3001';

// In local mode, clear any stale Cognito JWTs from a previous AWS session
if (LOCAL_MODE && typeof window !== 'undefined') {
  const stored = localStorage.getItem('idToken');
  if (stored && stored.split('.').length === 3) {
    // It's a JWT (Cognito token), not a local token — remove it
    localStorage.removeItem('idToken');
    localStorage.removeItem('accessToken');
  }
}

// ── Cognito config (only used when LOCAL_MODE=false) ──────────────────────────
const COGNITO_CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ?? '';
const COGNITO_REGION = process.env.NEXT_PUBLIC_COGNITO_REGION || 'us-east-1';
const COGNITO_ENDPOINT = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/`;

// ── Local token helpers ───────────────────────────────────────────────────────
// Local token format: base64("local:<userId>:<email>") — issued by local/server.ts

function parseLocalToken(token: string): { userId: string; email: string } | null {
  try {
    const decoded = atob(token);
    const [prefix, userId, email] = decoded.split(':');
    if (prefix !== 'local' || !userId || !email) return null;
    return { userId, email };
  } catch {
    return null;
  }
}

// ── Cognito helpers ───────────────────────────────────────────────────────────

async function cognitoRequest(target: string, body: object) {
  const res = await fetch(COGNITO_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': `AWSCognitoIdentityProviderService.${target}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.__type ? `${data.__type}: ${data.message || data.Message || 'Unknown error'}` : 'Cognito request failed');
  }
  return data;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function signIn(email: string, password: string): Promise<{ idToken: string; accessToken: string }> {
  if (LOCAL_MODE) {
    const res = await fetch(`${API_ENDPOINT}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return { idToken: data.token, accessToken: data.token };
  }

  const data = await cognitoRequest('InitiateAuth', {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: COGNITO_CLIENT_ID,
    AuthParameters: { USERNAME: email, PASSWORD: password },
  });
  const result = data.AuthenticationResult;
  if (!result?.IdToken) throw new Error('No token returned from Cognito');
  return { idToken: result.IdToken, accessToken: result.AccessToken };
}

export async function signUp(email: string, password: string): Promise<void> {
  if (LOCAL_MODE) {
    const res = await fetch(`${API_ENDPOINT}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    // Auto-save token so user is immediately logged in (no email confirm step locally)
    saveTokens(data.token, data.token);
    return;
  }

  await cognitoRequest('SignUp', {
    ClientId: COGNITO_CLIENT_ID,
    Username: email,
    Password: password,
    UserAttributes: [{ Name: 'email', Value: email }],
  });
}

export async function confirmSignUp(email: string, code: string): Promise<void> {
  if (LOCAL_MODE) {
    // No email confirmation needed in local mode
    return;
  }
  await cognitoRequest('ConfirmSignUp', {
    ClientId: COGNITO_CLIENT_ID,
    Username: email,
    ConfirmationCode: code,
  });
}

export async function resendConfirmationCode(email: string): Promise<void> {
  if (LOCAL_MODE) return;
  await cognitoRequest('ResendConfirmationCode', {
    ClientId: COGNITO_CLIENT_ID,
    Username: email,
  });
}

export function saveTokens(idToken: string, accessToken: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('idToken', idToken);
  localStorage.setItem('accessToken', accessToken);
}

export function getIdToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('idToken');
}

export function isAuthenticated(): boolean {
  const token = getIdToken();
  if (!token) return false;

  if (LOCAL_MODE) {
    // Local tokens are valid as long as they parse correctly
    return parseLocalToken(token) !== null;
  }

  // Cognito JWT — check exp claim
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function signOut() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('idToken');
  localStorage.removeItem('accessToken');
}

export function getUserEmail(): string | null {
  const token = getIdToken();
  if (!token) return null;

  if (LOCAL_MODE) {
    return parseLocalToken(token)?.email ?? null;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.email || null;
  } catch {
    return null;
  }
}
