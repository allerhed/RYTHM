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
    // Force Docker service name for container environment
    const apiBaseUrl = 'http://api:3001';
    
    const url = new URL(request.url);
    const pathWithQuery = url.pathname.replace('/api', '/api') + url.search;
    const targetUrl = `${apiBaseUrl}${pathWithQuery}`;

    console.log(`Using apiBaseUrl: ${apiBaseUrl}`);
    console.log(`Proxying ${method} ${pathWithQuery} -> ${targetUrl}`);

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

    // Create the response with the same status and headers
    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Proxy request failed' },
      { status: 500 }
    );
  }
}