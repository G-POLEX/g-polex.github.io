(function(){
 'use strict';
 if(!('serviceWorker' in navigator)||!window.isSecureContext||window.Capacitor?.isNativePlatform?.()||['localhost','127.0.0.1'].includes(location.hostname)&&window.Capacitor)return;
 const pie=document.querySelector('#osStage .os-stage-footer');
 if(!pie)return;
 const caja=document.createElement('div');
 caja.style.cssText='display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:12px 0';
 const boton=document.createElement('button');boton.type='button';boton.className='exterior-ux-instalar';
 const estado=document.createElement('span');estado.setAttribute('role','status');estado.style.cssText='font-size:13px;line-height:1.4';
 caja.append(boton,estado);pie.prepend(caja);
 let reg=null,preparando=false,listo=false,ultima=0;
 const normal=()=>{boton.disabled=false;boton.textContent='Preparar uso sin conexión';estado.textContent='Descarga inicial de aproximadamente 40 MB. Utilizar Wi-Fi.'};
 const disponible=()=>{listo=true;preparando=false;boton.hidden=true;estado.textContent='Disponible sin conexión en este dispositivo.'};
 const error=()=>{preparando=false;boton.hidden=false;boton.disabled=false;boton.textContent='Volver a intentar';estado.textContent='No se completó la descarga. Conectar a internet e intentar de nuevo.'};
 function pedirEstado(){if(reg?.active)reg.active.postMessage({tipo:'EXTERIOR_ESTADO'});}
 function observar(worker){
  if(!worker)return;
  worker.addEventListener('statechange',()=>{
   // La actualización queda preparada y se aplica al cerrar las pestañas activas.
   if(worker.state==='activated')pedirEstado();
   if(worker.state==='redundant'&&!listo&&preparando)error();
  });
 }
 function registrar(r){
  reg=r;reg.addEventListener('updatefound',()=>observar(reg.installing));
  observar(reg.installing);if(reg.active)pedirEstado();
 }
 navigator.serviceWorker.addEventListener('message',evento=>{
  const d=evento.data||{};
  if(d.tipo==='EXTERIOR_OFFLINE_PROGRESO'&&preparando){estado.textContent='Preparando recursos ('+d.hechos+' de '+d.total+')…';}
  if(d.tipo==='EXTERIOR_OFFLINE_ERROR'&&preparando)error();
  if(d.tipo==='EXTERIOR_OFFLINE_ESTADO'){
   if(d.listo)disponible();
   else {listo=false;preparando=false;boton.hidden=false;boton.disabled=false;boton.textContent='Reparar descarga sin conexión';estado.textContent='Faltan recursos guardados. Conectar a internet.';}
  }
 });
 navigator.serviceWorker.addEventListener('controllerchange',pedirEstado);
 boton.addEventListener('click',async()=>{
  if(preparando||!navigator.onLine)return;
  if(reg?.active&&!listo){
   // Una caché borrada por el dispositivo requiere una instalación nueva.
   if(!confirm('Volver a descargar los recursos y recargar la aplicación?'))return;
   await reg.unregister();for(const k of await caches.keys())if(k.startsWith('exterior-estatico-'))await caches.delete(k);
   location.reload();return;
  }
  preparando=true;boton.disabled=true;estado.textContent='Preparando recursos para uso sin conexión…';
  try{registrar(await navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'}));}
  catch(e){error();}
 });
 function comprobar(){if(!reg||!navigator.onLine||document.hidden||Date.now()-ultima<300000)return;ultima=Date.now();reg.update().catch(()=>{});}
 normal();
 navigator.serviceWorker.getRegistration('/').then(r=>{if(r){registrar(r);if(r.installing&&!r.active){preparando=true;boton.disabled=true;estado.textContent='Preparando recursos…';}comprobar();}}).catch(()=>{});
 window.addEventListener('focus',comprobar);window.addEventListener('online',comprobar);document.addEventListener('visibilitychange',comprobar);
})();
