import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '../../../../lib/config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const backendBase = getApiBaseUrl(); // http://192.168.1.104:4000/api

    // Extract access token from cookies or authorization header
    const cookieAccessToken = request.cookies.get('accessToken')?.value;
    const cookieHrmsToken = request.cookies.get('hrms_auth_token')?.value;
    const cookieBearerToken = request.cookies.get('bearerToken')?.value;
    const authHeader = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

    const token = cookieAccessToken || cookieHrmsToken || cookieBearerToken || authHeader || '';
    const refreshToken = request.cookies.get('refreshToken')?.value || '';

    // Build the Cookie header required by the backend
    const cookieParts: string[] = [];
    if (token) cookieParts.push(`accessToken=${token}`);
    if (refreshToken) cookieParts.push(`refreshToken=${refreshToken}`);

    const rawCookieHeader = request.headers.get('cookie');
    const finalCookie = cookieParts.length > 0 ? cookieParts.join('; ') : rawCookieHeader || '';

    const backendRes = await fetch(`${backendBase}/users/profile`, {
      method: 'GET',
      headers: {
        'Cookie': finalCookie,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      cache: 'no-store',
    });

    const data = await backendRes.json();
    return NextResponse.json(data, {
      status: backendRes.status,
    });
  } catch (error: any) {
    console.error('[API_USERS_PROFILE_ERROR]', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch user profile from server.' },
      { status: 500 }
    );
  }
}
