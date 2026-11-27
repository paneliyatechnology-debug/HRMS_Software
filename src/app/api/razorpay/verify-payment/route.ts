import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

<<<<<<< HEAD
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
=======
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: 'Missing signature parameters' },
        { status: 400 }
      );
    }

    const keySecret =
      process.env.RAZORPAY_KEY_SECRET || '1RHfSMil9tM2XfUsN8dNszEw';

    // Verify HMAC SHA-256 signature
    const hmac = crypto.createHmac('sha256', keySecret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest('hex');

    const isSignatureValid = generatedSignature === razorpay_signature;

    if (!isSignatureValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
    });
  } catch (err: any) {
    console.error('Razorpay verification error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Signature verification failed' },
      { status: 500 }
    );
  }
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
}
