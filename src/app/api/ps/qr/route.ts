
import { NextRequest, NextResponse } from 'next/server';
import { BRAND_DOMAIN } from '@/lib/brand';

// Strict token validation: only alphanumeric chars, hyphens, and underscores, 4–128 chars
const TOKEN_REGEX = /^[A-Za-z0-9_-]{4,128}$/;
const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? BRAND_DOMAIN;

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    // SEC-C05: Validate token format before using it in any URL
    if (!token || !TOKEN_REGEX.test(token)) {
        return new NextResponse('Invalid or missing token format', { status: 400 });
    }

    // Build registration URL from a controlled base + validated token only
    const registrationUrl = `${APP_BASE_URL}/register/school?token=${encodeURIComponent(token)}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(registrationUrl)}`;

    try {
        const response = await fetch(qrUrl, {
            signal: AbortSignal.timeout(5000), // 5s timeout — prevent hanging
        });

        if (!response.ok) {
            throw new Error(`QR service returned ${response.status}`);
        }

        const buffer = await response.arrayBuffer();

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'image/png',
                'Cache-Control': 'public, max-age=86400',
                'X-Content-Type-Options': 'nosniff',
            },
        });
    } catch (error) {
        console.error('[QR API] Failed to generate QR code:', error);
        return new NextResponse('Failed to generate QR code', { status: 502 });
    }
}
