import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('=== Gmail Callback Debug ===');
    console.log('Request URL:', request.url);
    console.log('Base URL env var:', process.env.NEXT_PUBLIC_BASE_URL);
    
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    console.log('Callback params:', { 
      code: code ? `present (${code.substring(0, 10)}...)` : 'missing', 
      error 
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    console.log('Using base URL:', baseUrl);

    if (error) {
      console.log('OAuth error received:', error);
      const errorHtml = `
        <html>
          <body>
            <script>
              console.log('Sending error message to parent window');
              try {
                window.opener.postMessage({ 
                  type: 'GMAIL_AUTH_ERROR', 
                  error: ${JSON.stringify(error)}
                }, ${JSON.stringify(baseUrl)});
              } catch (e) {
                console.error('Failed to send error message:', e);
              }
              window.close();
            </script>
          </body>
        </html>
      `;
      
      return new NextResponse(errorHtml, {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    if (code) {
      console.log('Authorization code received, sending to parent window');
      const successHtml = `
        <html>
          <head>
            <title>Gmail Auth Success</title>
          </head>
          <body>
            <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h2>Authorization Successful</h2>
              <p>You can close this window.</p>
            </div>
            <script>
              console.log('Gmail auth callback script executing...');
              console.log('Code received:', '${code.substring(0, 10)}...');
              console.log('Base URL:', ${JSON.stringify(baseUrl)});
              console.log('Window opener exists:', !!window.opener);
              
              if (window.opener) {
                console.log('Sending success message to parent window');
                try {
                  window.opener.postMessage({ 
                    type: 'GMAIL_AUTH_SUCCESS', 
                    code: ${JSON.stringify(code)}
                  }, ${JSON.stringify(baseUrl)});
                  console.log('Message sent successfully');
                  
                  // Close window after a short delay to ensure message is sent
                  setTimeout(() => {
                    console.log('Closing popup window...');
                    window.close();
                  }, 500);
                } catch (e) {
                  console.error('Failed to send success message:', e);
                  alert('Success but failed to communicate with parent window. Please close this window manually.');
                }
              } else {
                console.error('No window.opener found');
                alert('Authorization successful but cannot communicate with parent window. Please close this window manually.');
              }
            </script>
          </body>
        </html>
      `;
      
      return new NextResponse(successHtml, {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    console.log('No code or error received');
    return NextResponse.json({ error: 'No authorization code received' }, { status: 400 });
  } catch (error) {
    console.error('=== Gmail Callback Error ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Full error object:', error);
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
