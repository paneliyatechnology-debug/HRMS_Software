import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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
}
