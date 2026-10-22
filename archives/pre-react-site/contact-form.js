export class ContactError extends Error {
  constructor(message,fields={}){super(message);this.name='ContactError';this.fields=fields;}
}

export function validateContact(values){
  const data={name:String(values.name||'').trim(),email:String(values.email||'').trim(),message:String(values.message||'').trim(),_gotcha:String(values._gotcha||'').trim()};
  const errors={};
  if(!data.name)errors.name='Please enter your name.';
  else if(data.name.length>100||/[\r\n]/.test(data.name))errors.name='Please use a name under 100 characters.';
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)||data.email.length>254)errors.email='Please enter a valid email address.';
  if(data.message.length<5)errors.message='Tell me a little more—at least 5 characters.';
  else if(data.message.length>6000)errors.message='Please keep your note under 6,000 characters.';
  if(data._gotcha)errors._gotcha='Please leave this field empty.';
  return {data,errors};
}

export async function sendContact(endpoint,values,{fetcher=fetch,signal=AbortSignal.timeout(20000)}={}){
  const {data,errors}=validateContact(values);
  if(Object.keys(errors).length)throw new ContactError('Please check your note before sending.',errors);
  let url;try{url=new URL(endpoint)}catch{throw new ContactError('The message service is unavailable. Your note is still here.')}
  if(url.origin!=='https://formspree.io'||!/^\/f\/[a-z0-9]+$/i.test(url.pathname))throw new ContactError('The message service is unavailable. Your note is still here.');
  let response;
  try{
    response=await fetcher(url.href,{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify({...data,subject:`FocusedOnTom contact — ${data.name}`,source:'focusedontom.com'}),signal});
  }catch{
    throw new ContactError('Couldn’t reach the message service. Your note is still here—check your connection and try again.');
  }
  let result;try{result=await response.json()}catch{}
  if(response.ok&&result?.ok===true)return data;
  if(response.status===429)throw new ContactError('Too many messages just now. Your note is still here—please wait a few minutes and try again.');
  const fields={};
  for(const error of Array.isArray(result?.errors)?result.errors:[])if(['name','email','message'].includes(error.field)&&typeof error.message==='string')fields[error.field]=error.message;
  throw new ContactError('Your message didn’t send. Your note is still here—please try again in a moment.',fields);
}

export function connectContactForm(form,{onResize=()=>{}}={}){
  const card=form.closest('#contact-card'),compose=form.closest('#contact-compose'),editor=document.querySelector('#contact-editor'),success=document.querySelector('#contact-success');
  const status=form.querySelector('#form-status'),submit=form.querySelector('[type="submit"]'),back=document.querySelector('#close-contact');
  let sending=false;
  form.noValidate=true;
  function setButton(text){submit.replaceChildren(document.createTextNode(text+' '),Object.assign(document.createElement('span'),{textContent:'↗'}));}
  function clearErrors(){
    for(const name of ['name','email','message']){form.elements[name].removeAttribute('aria-invalid');document.querySelector(`#contact-${name}-error`).textContent='';}
    status.textContent='';card.dataset.formState='editing';
  }
  function showErrors(error){
    for(const [name,message] of Object.entries(error.fields||{})){
      const field=form.elements[name],hint=document.querySelector(`#contact-${name}-error`);if(!field||!hint)continue;
      field.setAttribute('aria-invalid','true');hint.textContent=message;
    }
    card.dataset.formState='error';status.textContent=error.message;
    form.querySelector('[aria-invalid="true"]')?.focus({preventScroll:true});
  }
  function reset(animate=true){
    const height=card.offsetHeight;clearErrors();editor.hidden=false;success.hidden=true;
    compose.setAttribute('aria-labelledby','contact-form-title');setButton('Send message');if(animate)onResize(height);
  }
  form.addEventListener('input',event=>{
    const name=event.target.name;if(!['name','email','message'].includes(name))return;
    event.target.removeAttribute('aria-invalid');document.querySelector(`#contact-${name}-error`).textContent='';
    status.textContent='';
  });
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(sending)return;clearErrors();
    const values=Object.fromEntries(new FormData(form)),validation=validateContact(values);
    if(Object.keys(validation.errors).length){showErrors(new ContactError('A few details need checking.',validation.errors));return;}
    sending=true;card.dataset.formState='sending';form.setAttribute('aria-busy','true');submit.disabled=true;back.disabled=true;submit.textContent='Sending your note…';
    for(const name of ['name','email','message'])form.elements[name].readOnly=true;
    try{
      const sent=await sendContact(form.action,values),height=card.offsetHeight;
      document.querySelector('#contact-reply-email').textContent=sent.email;
      form.reset();editor.hidden=true;success.hidden=false;card.dataset.formState='sent';compose.setAttribute('aria-labelledby','contact-success-title');
      onResize(height);success.focus({preventScroll:true});
    }catch(error){showErrors(error);setButton('Try again');}
    finally{
      sending=false;form.removeAttribute('aria-busy');submit.disabled=false;back.disabled=false;
      for(const name of ['name','email','message'])form.elements[name].readOnly=false;
    }
  });
  document.querySelector('#contact-write-another').addEventListener('click',()=>{reset();form.elements.name.focus({preventScroll:true})});
  return {reset:()=>reset(false),isSending:()=>sending};
}
