// Cloudflare Pages advanced-mode entry. Uses the existing public classroom
// service and database, so accounts and classroom records stay in one place.
const BACKEND = 'https://paw-classroom.justin0231202.chatgpt.site';
const SESSION = '__Host-mori_teacher';
export default {
  async fetch(request) {
    const incoming = new URL(request.url);
    const unsafe = !['GET', 'HEAD'].includes(request.method);
    // Check the visitor's actual origin BEFORE translating to the backend.
    if (unsafe && request.headers.get('Origin') !== incoming.origin) {
      return new Response('請從萌伴教室網站內操作。', { status: 403, headers: {'Cache-Control':'no-store'} });
    }
    if (request.method === 'OPTIONS') return new Response(null,{status:204});
    if (!['GET','HEAD','POST','PUT','DELETE','PATCH'].includes(request.method)) {
      return new Response('Method not allowed', {status:405});
    }
    // Legacy ChatGPT imports should be performed on the original Site where
    // ChatGPT owns and verifies its authentication headers.
    if (['/signin-with-chatgpt','/signout-with-chatgpt','/callback'].includes(incoming.pathname)) {
      const location = new URL(incoming.pathname + incoming.search, BACKEND);
      return Response.redirect(location.href, 302);
    }
    // Assign pathname rather than resolving it: //paths cannot change hosts.
    const target = new URL(BACKEND);
    target.pathname = incoming.pathname;
    target.search = incoming.search;
    const headers = new Headers(request.headers);
    for (const key of [...headers.keys()]) {
      if (/^(host|authorization|oai-sites-authorization|cf-access-jwt-assertion|forwarded)$/i.test(key) || /^(oai-authenticated-|x-forwarded-)/i.test(key)) headers.delete(key);
    }
    // Do not forward Cloudflare, ChatGPT, or unrelated browser cookies.
    const session = (request.headers.get('Cookie') || '').split(';').map(c=>c.trim()).find(c=>new RegExp('^'+SESSION+'=[0-9a-f]{64}$').test(c));
    headers.delete('Cookie');
    if(session) headers.set('Cookie', session);
    if(unsafe) headers.set('Origin', target.origin);
    if(headers.has('Referer')) headers.set('Referer', target.origin + incoming.pathname);
    try {
      const upstream = await fetch(new Request(target.href, {
        method:request.method, headers,
        body:['GET','HEAD'].includes(request.method)?undefined:request.body,
        duplex:'half', redirect:'manual'
      }));
      const outputHeaders = new Headers(upstream.headers);
      const cookies = typeof upstream.headers.getSetCookie==='function' ? upstream.headers.getSetCookie() : [upstream.headers.get('Set-Cookie')].filter(Boolean);
      outputHeaders.delete('Set-Cookie');
      for(const cookie of cookies) if(cookie.startsWith(SESSION+'=')) outputHeaders.append('Set-Cookie',cookie);
      const location=outputHeaders.get('Location');
      if(location){const url=new URL(location,target);if(url.origin===target.origin){url.protocol=incoming.protocol;url.host=incoming.host;outputHeaders.set('Location',url.href)}}
      // Never cache teacher pages, credentials, or classroom records.
      if(incoming.pathname==='/' || incoming.pathname.startsWith('/api/') || session || outputHeaders.has('Set-Cookie')) outputHeaders.set('Cache-Control','private, no-store');
      outputHeaders.delete('Access-Control-Allow-Origin');
      outputHeaders.delete('Access-Control-Allow-Credentials');
      outputHeaders.set('X-Content-Type-Options','nosniff');
      outputHeaders.set('Referrer-Policy','same-origin');
      return new Response(upstream.body,{status:upstream.status,statusText:upstream.statusText,headers:outputHeaders});
    } catch {
      return new Response('教室暫時無法連線，請稍後重新整理。', {status:502, headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
    }
  }
};
