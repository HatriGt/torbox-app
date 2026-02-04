import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://torbox-backend:3001';

const EXPIRED_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Download link expired</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #1a1a1a;
      color: #e5e5e5;
      padding: 1rem;
    }
    .card {
      max-width: 28rem;
      padding: 2rem;
      border-radius: 0.75rem;
      background: #262626;
      border: 1px solid #404040;
      text-align: center;
    }
    h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
    p { margin: 0; color: #a3a3a3; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <h1>This download link has expired</h1>
    <p>The link is no longer valid.</p>
  </div>
</body>
</html>`;

const NOT_FOUND_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Link not found</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #1a1a1a;
      color: #e5e5e5;
      padding: 1rem;
    }
    .card {
      max-width: 28rem;
      padding: 2rem;
      border-radius: 0.75rem;
      background: #262626;
      border: 1px solid #404040;
      text-align: center;
    }
    h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
    p { margin: 0; color: #a3a3a3; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Link not found</h1>
    <p>This download link is invalid or has been removed.</p>
  </div>
</body>
</html>`;

function looksLikeFileResponse(headers) {
  const disposition = headers.get('content-disposition');
  const contentType = headers.get('content-type') || '';
  if (disposition && disposition.toLowerCase().includes('attachment')) return true;
  const fileTypes = [
    'application/octet-stream',
    'application/zip',
    'application/x-zip',
    'application/x-rar',
    'video/',
    'audio/',
    'application/x-bittorrent',
  ];
  return fileTypes.some((t) => contentType.toLowerCase().includes(t));
}

export async function GET(request, { params }) {
  const token = params?.token;
  if (!token) {
    return new NextResponse(NOT_FOUND_HTML, {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  let url;
  try {
    const resolveRes = await fetch(
      `${BACKEND_URL}/api/dl/resolve?${new URLSearchParams({ token })}`,
      { method: 'GET' },
    );
    const data = await resolveRes.json();
    if (!resolveRes.ok || !data?.url) {
      return new NextResponse(NOT_FOUND_HTML, {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }
    url = data.url;
  } catch (err) {
    console.error('Shareable dl resolve error:', err);
    return new NextResponse(EXPIRED_HTML, {
      status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  try {
    const headRes = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      headers: { 'User-Agent': 'TorBoxManager-ShareableLink-Check/1.0' },
    });

    const ok =
      headRes.ok &&
      headRes.status === 200 &&
      looksLikeFileResponse(headRes.headers);

    if (ok) {
      return NextResponse.redirect(url, 302);
    }

    return new NextResponse(EXPIRED_HTML, {
      status: 410,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (err) {
    console.error('Shareable dl HEAD check error:', err);
    return new NextResponse(EXPIRED_HTML, {
      status: 410,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}
