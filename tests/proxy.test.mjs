import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../public/_worker.js';
const ORIGIN='https://digitalanxing.pages.dev';
const BACKEND='https://paw-classroom.justin0231202.chatgpt.site';
const token='a'.repeat(64);
test('preserves teacher sessions and rejects cross-origin writes', async()=>{
 const originalFetch=globalThis.fetch; let seen;
 try {
 globalThis.fetch=async req=>{seen=req;return new Response('ok',{headers:{'Set-Cookie':'__Host-mori_teacher='+token+'; Path=/; Secure; HttpOnly; SameSite=Lax','Cache-Control':'public, max-age=300'}})};
 const response=await worker.fetch(new Request(ORIGIN+'/api/auth',{method:'POST',headers:{Origin:ORIGIN,Cookie:'unrelated=secret; __Host-mori_teacher='+token,Authorization:'unwanted','oai-authenticated-user-id':'forged'},body:'{}'}));
 assert.equal(response.status,200);assert.equal(seen.url,BACKEND+'/api/auth');assert.equal(seen.headers.get('Origin'),BACKEND);assert.equal(seen.headers.get('Cookie'),'__Host-mori_teacher='+token);assert.equal(seen.headers.get('Authorization'),null);assert.equal(seen.headers.get('oai-authenticated-user-id'),null);assert.match(response.headers.get('Set-Cookie'),/HttpOnly/);assert.match(response.headers.get('Cache-Control'),/no-store/);
 const blocked=await worker.fetch(new Request(ORIGIN+'/api/state',{method:'PUT',headers:{Origin:'https://evil.example'},body:'{}'}));assert.equal(blocked.status,403);
 await worker.fetch(new Request(ORIGIN+'//evil.example/path'));assert.equal(new URL(seen.url).origin,BACKEND);
 } finally {globalThis.fetch=originalFetch}
});
test('keeps same-service redirects on Pages and handles unavailable backend',async()=>{
 const originalFetch=globalThis.fetch;try{
 globalThis.fetch=async()=>new Response(null,{status:302,headers:{Location:BACKEND+'/?welcome=1'}});const redirect=await worker.fetch(new Request(ORIGIN+'/'));assert.equal(redirect.headers.get('Location'),ORIGIN+'/?welcome=1');
 globalThis.fetch=async()=>{throw Error('offline')};const error=await worker.fetch(new Request(ORIGIN+'/'));assert.equal(error.status,502);assert.match(error.headers.get('Cache-Control'),/no-store/);
 } finally {globalThis.fetch=originalFetch}
});
