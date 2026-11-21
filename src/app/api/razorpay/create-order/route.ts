import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  return NextResponse.json(
    { success: false, error: 'Payment API is not connected yet.' },
    { status: 501 },
  );
}
