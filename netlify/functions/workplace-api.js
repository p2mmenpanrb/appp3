exports.handler = async function(event) {
  const APPS_SCRIPT_URL =
    process.env.APPS_SCRIPT_URL ||
    process.env.appscript ||
    '';

  if (!APPS_SCRIPT_URL) {
    return jsonResponse(500, {
      success: false,
      error:
        'APPS_SCRIPT_URL belum diatur di Netlify Environment Variables.'
    });
  }

  try {
    if (event.httpMethod === 'GET') {
      const params =
        new URLSearchParams(
          event.queryStringParameters || {}
        );

      const target =
        APPS_SCRIPT_URL +
        '?' +
        params.toString();

      const upstream =
        await fetch(target, {
          method: 'GET',
          redirect: 'follow',
          headers: {
            'Accept': 'application/json'
          }
        });

      const text =
        await upstream.text();

      return normalizeUpstream(
        upstream.status,
        text
      );
    }

    if (event.httpMethod === 'POST') {
      let body = {};

      try {
        body =
          JSON.parse(event.body || '{}');
      } catch (_) {
        return jsonResponse(400, {
          success: false,
          error: 'Body JSON tidak valid.'
        });
      }

      const upstream =
        await fetch(
          APPS_SCRIPT_URL,
          {
            method: 'POST',
            redirect: 'follow',
            headers: {
              'Content-Type':
                'text/plain;charset=utf-8',
              'Accept':
                'application/json'
            },
            body: JSON.stringify({
              action:
                body.action || '',
              payload:
                body.payload || {},
              token:
                process.env.APP_API_TOKEN ||
                ''
            })
          }
        );

      const text =
        await upstream.text();

      return normalizeUpstream(
        upstream.status,
        text
      );
    }

    return jsonResponse(405, {
      success: false,
      error: 'Method not allowed.'
    });
  } catch (error) {
    return jsonResponse(500, {
      success: false,
      error:
        error.message ||
        String(error)
    });
  }
};

function normalizeUpstream(status, text) {
  try {
    const parsed =
      JSON.parse(text);

    return jsonResponse(
      200,
      parsed
    );
  } catch (_) {
    return jsonResponse(502, {
      success: false,
      error:
        'Apps Script tidak mengembalikan JSON. ' +
        'Pastikan APPS_SCRIPT_URL memakai deployment /exec yang benar.',
      upstreamStatus:
        status
    });
  }
}

function jsonResponse(statusCode, data) {
  return {
    statusCode,
    headers: {
      'content-type':
        'application/json; charset=utf-8',
      'cache-control':
        'no-store'
    },
    body:
      JSON.stringify(data)
  };
}
