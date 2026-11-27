import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

<<<<<<< HEAD
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
=======
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, planId, companyId, billingCycle } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment amount' },
        { status: 400 }
      );
    }

    const keyId =
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_TfsROdZDlqj6tR';
    const keySecret =
      process.env.RAZORPAY_KEY_SECRET || '1RHfSMil9tM2XfUsN8dNszEw';

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const amountInPaisa = Math.round(Number(amount) * 100);

    // Call official Razorpay Orders API
    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: amountInPaisa,
        currency: 'INR',
        receipt: `rcpt_${Date.now()}`,
        notes: {
          planId: planId || 'Growth',
          companyId: companyId || 'comp-paneliya',
          billingCycle: billingCycle || 'Annual',
          platform: 'Paneliya HRMS SaaS',
        },
      }),
    });

    const orderData = await rzpRes.json();

    if (!rzpRes.ok) {
      console.error('Razorpay Order creation error:', orderData);
      return NextResponse.json(
        {
          success: false,
          error: orderData.error?.description || 'Failed to create Razorpay order',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: orderData.id,
      amount: orderData.amount,
      currency: orderData.currency,
      keyId,
    });
  } catch (err: any) {
    console.error('Razorpay Create Order Exception:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
}
