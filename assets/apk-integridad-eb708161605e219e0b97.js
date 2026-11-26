(function(){
 'use strict';
 // La descarga del APK se ofrece únicamente en teléfonos Android.
 if(!/Android/i.test(navigator.userAgent)||document.documentElement.classList.contains('exterior-native')||window.Capacitor?.isNativePlatform?.())return;
 const stage=document.getElementById('osStage');
 const footer=stage?.querySelector('.os-stage-footer');
 if(!stage||!footer||stage.querySelector('.os-apk-install-card'))return;
 const card=document.createElement('section');
 card.className='os-apk-install-card';
 card.setAttribute('aria-label','Instalación de Exterior para Android');
 card.style.cssText='display:grid;gap:9px;width:min(100%,625px);margin:0;padding:16px 17px;border:1px solid rgba(223,181,142,.8);border-left:5px solid #dfb58e;border-radius:14px;background:linear-gradient(135deg,#1b2a67 0%,#111f60 100%);color:#fff;box-shadow:0 9px 22px rgba(10,20,60,.18)';
 const eyebrow=document.createElement('span');
 eyebrow.textContent='APLICACIÓN PARA ANDROID';
 eyebrow.style.cssText='font-size:11px;letter-spacing:.09em;font-weight:800;color:#dfb58e';
 const title=document.createElement('strong');
 title.textContent='Instalar Exterior en Android';
 title.style.cssText='font-size:18px;line-height:1.25';
 const desc=document.createElement('span');
 desc.textContent='Versión para teléfonos Android.';
 desc.style.cssText='font-size:14px;line-height:1.45;color:#e2e7f4';
 const button=document.createElement('button');
 button.type='button';
 button.textContent='Descargar APK';
 button.disabled=true;
 button.setAttribute('aria-describedby','osApkInstallStatus');
 button.style.cssText='display:flex;align-items:center;justify-content:center;width:100%;min-height:48px;padding:11px 16px;border:1px solid #dfb58e;border-radius:10px;background:#dfb58e;color:#17245e;font-family:inherit;font-size:15px;font-weight:800;line-height:1.2;cursor:not-allowed;opacity:.72';
 const status=document.createElement('small');
 status.id='osApkInstallStatus';
 status.setAttribute('role','status');
 status.setAttribute('aria-live','polite');
 status.textContent='Comprobando la disponibilidad del instalador…';
 status.style.cssText='font-size:12px;line-height:1.4;color:#d5dced';
 card.append(eyebrow,title,desc,button,status);
 const guide=document.getElementById('exterior-apk-guide-template');
 const help=footer.querySelector('.ux-home-guide');
 if(help&&guide instanceof HTMLTemplateElement)help.append(guide.content.cloneNode(true));
 // La guía de uso cierra el inicio.
 footer.insertBefore(card,footer.querySelector('.ux-home-guide'));
 let apkUrl='';
 const valid=(target,version)=>target.origin===location.origin&&!target.username&&!target.password&&!target.search&&!target.hash&&target.pathname==='/downloads/Exterior-'+version+'.apk';
 button.addEventListener('click',()=>{
  if(!apkUrl)return;
  const target=new URL(apkUrl);
  const link=document.createElement('a');link.href=target.href;link.download=target.pathname.split('/').pop();document.body.append(link);link.click();link.remove();
 });
 fetch('/android-release.json?check='+Date.now(),{cache:'no-store',credentials:'same-origin',redirect:'error'})
  .then(response=>{if(!response.ok)throw Error('No disponible');return response.json();})
  .then(data=>{
   const version=Number.isSafeInteger(data.versionCode)&&data.versionCode>0&&data.versionName==='1.0.'+data.versionCode?data.versionName:'';
   const notes=typeof data.releaseNotes==='string'?data.releaseNotes.trim():'';
   if(version)desc.textContent='Versión Android '+version+'. '+(notes||'Consulta aquí la disponibilidad del instalador oficial.');
   if(data.status==='security-review'){status.textContent='Descarga temporalmente suspendida por revisión de seguridad.';return;}
   const target=new URL(String(data.apkUrl||''),location.origin);
   const fingerprint=value=>typeof value==='string'&&/^[a-f0-9]{64}$/i.test(value);
   if((data.status===undefined||data.status==='available')&&data.available===true&&data.signed===true&&version&&fingerprint(data.sha256)&&typeof data.signerSha256==='string'&&data.signerSha256.toLowerCase()==='12200a2967e66dd6cc8cc74b97493f42f606513f5fb252208b9ac4df04f8d3f2'&&valid(target,version)){
    apkUrl=target.href;
    button.disabled=false;
    button.style.opacity='1';
    button.style.cursor='pointer';
    button.textContent='Descargar APK';
    status.textContent='Versión '+version+' disponible. SHA-256: '+data.sha256.toLowerCase();
    status.style.overflowWrap='anywhere';
   }else{status.textContent='El instalador no está disponible en este momento.';}
  }).catch(()=>{status.textContent='No se pudo comprobar la disponibilidad del instalador. Volver a cargar cuando haya conexión.';});
})();
