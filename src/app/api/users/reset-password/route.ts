import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '../../../../lib/config';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  // Redirect browser seamlessly to the frontend themed reset password page
  const redirectUrl = new URL('/set-password', request.url);
  if (token) redirectUrl.searchParams.set('token', token);
  if (email) redirectUrl.searchParams.set('email', email);

  return NextResponse.redirect(redirectUrl);
}

export async function POST(request: NextRequest) {
  try {
    const backendBase = getApiBaseUrl(); // http://192.168.1.103:4000/api
    const formData = await request.formData();

    // Proxy the POST request directly to the backend endpoint
    const backendRes = await fetch(`${backendBase}/users/reset-password`, {
      method: 'POST',
      body: formData,
    });

    const data = await backendRes.text();
    return new NextResponse(data, {
      status: backendRes.status,
      headers: {
        'Content-Type': backendRes.headers.get('Content-Type') || 'text/html',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to communicate with backend server' },
      { status: 500 }
    );
  }
}
