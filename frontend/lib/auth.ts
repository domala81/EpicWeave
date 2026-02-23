const COGNITO_CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!;
const COGNITO_REGION = process.env.NEXT_PUBLIC_COGNITO_REGION || 'us-east-1';
const COGNITO_ENDPOINT = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/`;

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

export async function signIn(email: string, password: string): Promise<{ idToken: string; accessToken: string }> {
  const data = await cognitoRequest('InitiateAuth', {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: COGNITO_CLIENT_ID,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  });
  const result = data.AuthenticationResult;
  if (!result?.IdToken) throw new Error('No token returned from Cognito');
  return { idToken: result.IdToken, accessToken: result.AccessToken };
}

export async function signUp(email: string, password: string): Promise<void> {
  await cognitoRequest('SignUp', {
    ClientId: COGNITO_CLIENT_ID,
    Username: email,
    Password: password,
    UserAttributes: [{ Name: 'email', Value: email }],
  });
}

export async function confirmSignUp(email: string, code: string): Promise<void> {
  await cognitoRequest('ConfirmSignUp', {
    ClientId: COGNITO_CLIENT_ID,
    Username: email,
    ConfirmationCode: code,
  });
}

export async function resendConfirmationCode(email: string): Promise<void> {
  await cognitoRequest('ResendConfirmationCode', {
    ClientId: COGNITO_CLIENT_ID,
    Username: email,
  });
}

export function saveTokens(idToken: string, accessToken: string) {
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
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function signOut() {
  localStorage.removeItem('idToken');
  localStorage.removeItem('accessToken');
}

export function getUserEmail(): string | null {
  const token = getIdToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.email || null;
  } catch {
    return null;
  }
}
