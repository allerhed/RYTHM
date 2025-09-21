import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return proxyRequest(request, 'GET');
}

export async function POST(request: NextRequest) {
  return proxyRequest(request, 'POST');
}

export async function PUT(request: NextRequest) {
  return proxyRequest(request, 'PUT');
}

export async function DELETE(request: NextRequest) {
  return proxyRequest(request, 'DELETE');
}

async function proxyRequest(request: NextRequest, method: string) {
  try {
    // Use API_URL for server-side requests (container-to-container)
    // Fall back to NEXT_PUBLIC_API_URL for backwards compatibility
    const apiBaseUrl = process.env.API_URL || 
                      process.env.NEXT_PUBLIC_API_URL || 
                      'http://api:3001';
    
    const url = new URL(request.url);
    
    // Handle different types of requests:
    // 1. API endpoints: /api/auth/login -> /api/auth/login (keep /api prefix)
    // 2. Static files: /api/uploads/... -> /uploads/... (remove /api prefix)
    let pathWithQuery: string;
    
    if (url.pathname.startsWith('/api/uploads/')) {
      // For static files, remove the /api prefix
      pathWithQuery = url.pathname.replace('/api', '') + url.search;
    } else {
      // For API endpoints, keep the /api prefix
      pathWithQuery = url.pathname + url.search;
    }
    
    const targetUrl = `${apiBaseUrl}${pathWithQuery}`;

    console.log(`Using apiBaseUrl: ${apiBaseUrl}`);
    console.log(`Proxying ${method} ${url.pathname} -> ${targetUrl}`);

    // Get the request body if it exists
    const body = method !== 'GET' && method !== 'HEAD' 
      ? await request.arrayBuffer() 
      : undefined;

    // Forward the request to the backend API
    const response = await fetch(targetUrl, {
      method,
      headers: {
        // Forward all headers except host
        ...Object.fromEntries(
          Array.from(request.headers.entries()).filter(([key]) => 
            key.toLowerCase() !== 'host'
          )
        ),
      },
      body: body ? new Uint8Array(body) : undefined,
    });

    // Get response body
    const responseBody = await response.arrayBuffer();

    // Create the response with proper CORS headers for static files
    const responseHeaders = new Headers(response.headers);
    
    // For static files (like avatars), ensure proper CORS headers
    if (pathWithQuery.startsWith('/uploads/')) {
      responseHeaders.set('Access-Control-Allow-Origin', '*');
      responseHeaders.set('Cross-Origin-Resource-Policy', 'cross-origin');
    }

    // Create the response with the same status and headers
    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Proxy request failed' },
      { status: 500 }
    );
  }
}