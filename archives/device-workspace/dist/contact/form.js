const form=document.querySelector('#contact-form'),status=document.querySelector('#status'),button=form.querySelector('button');
form.addEventListener('submit',async event=>{
 event.preventDefault();if(!form.reportValidity())return;
 button.disabled=true;button.textContent='Sending…';status.textContent='';
 try{const response=await fetch(form.action,{method:'POST',body:new FormData(form),headers:{Accept:'application/json'}});if(!response.ok)throw new Error('Send failed');form.reset();status.textContent='Thanks—your message has been sent.';}
 catch{status.textContent='Your message could not be sent. Please try again, or reach me on Instagram.';}
 finally{button.disabled=false;button.textContent='Send message ↗';}
});
