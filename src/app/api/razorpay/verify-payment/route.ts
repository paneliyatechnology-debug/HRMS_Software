import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
  if (!keySecret) {
    return NextResponse.json({ success: false, error: 'Razorpay is not configured.' }, { status: 500 });
  }
  const body = await request.json().catch(() => ({}));
  const orderId = String(body?.razorpay_order_id || body?.razorpayOrderId || '');
  const paymentId = String(body?.razorpay_payment_id || body?.razorpayPaymentId || '');
  const signature = String(body?.razorpay_signature || body?.razorpaySignature || '');
  if (!orderId || !paymentId || !signature) {
    return NextResponse.json({ success: false, error: 'Payment details are required.' }, { status: 400 });
  }
  const expected = createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest('hex');
  const valid = expected.length === signature.length && timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  if (!valid) {
    return NextResponse.json({ success: false, error: 'Payment signature is invalid.' }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
