import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      fullName,
      workEmail,
      phoneNumber,
      companyName,
      companySize,
      preferredDate,
      preferredTimeSlot,
      interestedModules,
      notes,
    } = body;

    // Strict Server-Side Validation
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Full name must be at least 2 characters.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!workEmail || !emailRegex.test(workEmail.trim())) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid official work email address.' },
        { status: 400 }
      );
    }

    const digitsOnly = (phoneNumber || '').replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid 10-digit mobile/WhatsApp number.' },
        { status: 400 }
      );
    }

    if (!companyName || typeof companyName !== 'string' || companyName.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Company or organization name is required.' },
        { status: 400 }
      );
    }

    if (!preferredDate) {
      return NextResponse.json(
        { success: false, error: 'Please select a preferred date for the demo.' },
        { status: 400 }
      );
    }

    if (!preferredTimeSlot) {
      return NextResponse.json(
        { success: false, error: 'Please select a preferred time slot.' },
        { status: 400 }
      );
    }

    const bookingId = `DEMO-${Date.now().toString(36).toUpperCase()}`;

    // Structured logging for business lead registration
    console.log('[BOOK_DEMO_REQUEST]', {
      bookingId,
      fullName: fullName.trim(),
      workEmail: workEmail.trim().toLowerCase(),
      phoneNumber: digitsOnly,
      companyName: companyName.trim(),
      companySize: companySize || '1-15 Employees',
      preferredDate,
      preferredTimeSlot,
      interestedModules: Array.isArray(interestedModules) ? interestedModules : [],
      notes: (notes || '').trim(),
      receivedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      bookingId,
      message: 'Demo slot reserved successfully! Our HR Solutions Specialist will connect with you.',
      details: {
        bookingId,
        fullName: fullName.trim(),
        workEmail: workEmail.trim().toLowerCase(),
        companyName: companyName.trim(),
        preferredDate,
        preferredTimeSlot,
      },
    });
  } catch (error: any) {
    console.error('[BOOK_DEMO_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred while booking the demo. Please try again.' },
      { status: 500 }
    );
  }
}
