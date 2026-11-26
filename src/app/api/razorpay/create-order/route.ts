import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
  if (!keyId || !keySecret) {
    return NextResponse.json({ success: false, error: 'Razorpay is not configured.' }, { status: 500 });
  }
  const body = await request.json().catch(() => ({}));
  const rupees = Number(body?.amount);
  const amount = Math.round(rupees * 100);
  if (!Number.isFinite(amount) || amount < 100) {
    return NextResponse.json({ success: false, error: 'amount must be at least 1 rupee.' }, { status: 400 });
  }
  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      currency: 'INR',
      receipt: `hrms_${Date.now()}`,
      notes: {
        planId: String(body?.planId || ''),
        companyId: String(body?.companyId || ''),
      },
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.id) {
    return NextResponse.json(
      { success: false, error: payload?.error?.description || 'Razorpay order could not be created.' },
      { status: 502 },
    );
  }
  return NextResponse.json({ success: true, orderId: payload.id, keyId, amount, currency: 'INR' });
}
