import test from 'node:test';
import assert from 'node:assert/strict';
import {validateContact,sendContact,ContactError} from '../frontend/src/lib/contact-service.ts';
const endpoint='https://formspree.io/f/mdaladkg';
const note={name:'  Example Visitor ',email:' visitor@example.com ',message:' A question about working together. '};

test('empty, whitespace-only, malformed and overlong notes never reach the mail service',async()=>{
  let calls=0;const fetcher=async()=>{calls++;throw Error('Should not send')};
  for(const fields of [{},{...note,name:' '},{...note,email:'invalid@'},{...note,message:'   '},{...note,message:'a'.repeat(6001)},{...note,name:'name\nheader'},{...note,_gotcha:'bot'}]){
    await assert.rejects(sendContact(endpoint,fields,{fetcher}),ContactError);
  }
  assert.equal(calls,0);assert.ok(validateContact({...note,email:'bad'}).errors.email);
});

test('a confirmed submission contains the visitor reply address, trimmed message and inbox subject',async()=>{
  let sent;const result=await sendContact(endpoint,note,{fetcher:async(url,options)=>{
    sent={url,options};return Response.json({ok:true});
  }});
  assert.equal(sent.url,endpoint);assert.equal(sent.options.method,'POST');
  assert.equal(sent.options.headers.Accept,'application/json');
  const body=JSON.parse(sent.options.body);
  assert.equal(body.email,'visitor@example.com');assert.equal(body.name,'Example Visitor');
  assert.equal(body.message,'A question about working together.');
  assert.equal(body.subject,'FocusedOnTom contact — Example Visitor');assert.equal(body.source,'focusedontom.com');
  assert.equal(result.email,'visitor@example.com');assert.equal(note.name,'  Example Visitor ');
});

test('HTTP success without provider confirmation never reports that the note was sent',async()=>{
  for(const response of [Response.json({ok:false}),Response.json({}),new Response('<html>Error</html>')]){
    await assert.rejects(sendContact(endpoint,note,{fetcher:async()=>response}),/didn’t send/);
  }
});

test('provider validation and rate limits return useful errors while preserving the draft',async()=>{
  await assert.rejects(sendContact(endpoint,note,{fetcher:async()=>Response.json({errors:[{field:'email',message:'Check this address.'}]},{status:422})}),error=>error.fields.email==='Check this address.');
  await assert.rejects(sendContact(endpoint,note,{fetcher:async()=>new Response('',{status:429})}),/wait a few minutes/);
  assert.equal(note.message,' A question about working together. ');
});

test('network failures and unexpected destinations fail without a successful send',async()=>{
  await assert.rejects(sendContact(endpoint,note,{fetcher:async()=>{throw Error('offline')}}),/check your connection/);
  let calls=0;await assert.rejects(sendContact('https://example.com/contact',note,{fetcher:async()=>{calls++}}),/unavailable/);
  assert.equal(calls,0);
});
