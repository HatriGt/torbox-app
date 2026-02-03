import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_URL || 'http://torbox-backend:3001';
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

export async function POST(request) {
  try {
    const headersList = await headers();
    const apiKey = headersList.get('x-api-key');

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API key required' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const directUrl = body.direct_url;
    const appUrl = body.app_url || APP_URL;

    if (!directUrl || typeof directUrl !== 'string') {
      return NextResponse.json(
        { success: false, error: 'direct_url is required' },
        { status: 400 },
      );
    }

    const backendUrl = `${BACKEND_URL}/api/dl/register`;
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({ direct_url: directUrl, app_url: appUrl }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(
        '[dl/register] Backend error:',
        response.status,
        data?.error || data,
      );
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[dl/register] Failed to reach backend:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
