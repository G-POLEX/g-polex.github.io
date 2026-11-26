/* Exterior: flujo compartido de Avisos. Reutiliza datos, importación y exportación del motor. */
(() => {
 'use strict';
 const find=id=>document.getElementById(id);
 const root=document.documentElement, native=root.classList.contains('exterior-native');
 const panel=find('adF'), salida=find('out'), vista=find('resultCard'), formato=find('adV'), layout=document.querySelector('.exterior-layout');
 const original=window.montarAviso;
 if(typeof original!=='function'||!panel||!salida||!vista||!formato||!layout)return;
 const make=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text)el.textContent=text;return el;};
 const button=(text,cls='g')=>{const el=make('button',cls,text);el.type='button';return el;};
 const activo=()=>find('m')?.value==='avisos'&&find('adT')?.value==='aviso'&&!find('ad')?.hidden;
 const mobile=matchMedia('(max-width:760px), (hover:none) and (pointer:coarse)');
 const prefs=new WeakMap();
 const ejemplo=`Informamos que nuestras oficinas de atención al público, ubicadas en las siguientes sedes:

* Centro de Gobierno, San Salvador
* Oficina de Muestra, Ciudad de Ejemplo

Permanecerán cerradas el [día y fecha].

Reanudaremos la atención al público el [día y fecha], en horario normal.`;
 function mostrarPrevia(){
  requestAnimationFrame(()=>{
   if(!activo()||layout.hidden)return;
   if(native){
    find('resultCard')?.closest('.exterior-layout')?.querySelector('[data-and-step="preview"]')?.click();
   }else if(mobile.matches){
    find('uxPreview')?.click();
   }else{
    vista.focus({preventScroll:true});
    vista.scrollIntoView({block:'nearest'});
   }
  });
 }
 function mostrarEdicion(){
  if(native)layout.querySelector('[data-and-step="form"]')?.click();
  else if(mobile.matches)find('uxEdit')?.click();
  requestAnimationFrame(()=>{
   if(activo()&&!layout.hidden)panel.querySelector('.ag-metodos button:last-child')?.click();
  });
 }
 function decorar(destino,datos){
  if(destino.querySelector('.ag-flujo'))return;
  const importer=destino.querySelector('.sede-importar-cartelera'), area=importer?.querySelector('textarea');
  const importar=importer?.querySelector('button'), mensaje=find('editorial-ad-mensaje');
  const opc=destino.querySelector('.aviso-opciones'), identidad=destino.querySelector('.aviso-identidad');
  const sedes=find('aviso-bloque-sedes'), pie=find('aviso-bloque-pie'), contactos=find('aviso-bloque-contactos');
  if(!importar||!area||!mensaje||!opc||!sedes||!pie||!contactos||!identidad)return;
  const ficha=window.fichaAviso(datos);
  const fl=make('div','ag-flujo'), tabs=make('div','ag-metodos');
  tabs.setAttribute('role','group');tabs.setAttribute('aria-label','Cómo completar el aviso');
  const porTexto=button('Pegar texto','g ag-metodo'), manual=button(ficha.avisoImportacion?'Editar el aviso':'Completar a mano','g ag-metodo');
  porTexto.setAttribute('aria-controls','ag-texto');manual.setAttribute('aria-controls','ag-campos');
  tabs.append(porTexto,manual);
  const paste=make('section','ag-seccion ag-pegado');paste.id='ag-texto';paste.setAttribute('aria-labelledby','ag-texto-titulo');
  const pasteTitle=make('label','ag-titulo','Texto del aviso');pasteTitle.id='ag-texto-titulo';pasteTitle.htmlFor=area.id;
  const nota=make('p','field-help ag-nota','Pegá el texto completo. Si hay varias ubicaciones, poné una por línea.');
  nota.id='ag-texto-ayuda';
  area.rows=5;area.placeholder='Informamos que nuestras oficinas…';area.removeAttribute('aria-label');area.setAttribute('aria-describedby',nota.id);
  importar.textContent='Generar vista previa';importar.classList.add('ag-primario');
  const avisoImport=importer.querySelector('[role="status"]');
  const ayuda=make('details','ag-ejemplo'), ejemploTexto=make('p','ag-ejemplo-texto',ejemplo), usar=button('Usar este ejemplo');
  ayuda.append(make('summary','','Ver ejemplo'),ejemploTexto,usar);
  usar.addEventListener('click',()=>{
   if(area.value.trim()&&area.value!==ejemplo&&!confirm('¿Reemplazar el texto pegado por el ejemplo?'))return;
   area.value=ejemplo;area.dispatchEvent(new Event('input',{bubbles:true}));area.focus();
  });
  paste.append(pasteTitle,nota,area,importar);
  if(avisoImport)paste.append(avisoImport);
  paste.append(ayuda);
  const datosEditor=make('section','ag-seccion ag-campos');datosEditor.id='ag-campos';datosEditor.setAttribute('aria-label','Campos del aviso');
  const notasCampos=make('p','field-help ag-nota','Escribí el mensaje. Agregá ubicaciones o contactos solo si el aviso los necesita.');
  const etiquetaMensaje=mensaje.labels[0];if(etiquetaMensaje)etiquetaMensaje.textContent='Mensaje principal';
  mensaje.placeholder='Ej.: Informamos que nuestras oficinas estarán cerradas…';
  datosEditor.append(notasCampos,mensaje.parentElement);
  const opciones=make('div','ag-opciones');
  for(const [clave,titulo,grupo] of [['sedes','Ubicaciones',sedes],['pie','Cierre y reapertura',pie],['contactos','Contactos',contactos]]){
   const marcar=find('aviso-incluir-'+clave), etiqueta=marcar?.closest('label');
   if(!marcar||!etiqueta)continue;
   const cont=make('div','ag-opcion'), rotulo=make('span','',titulo);
   etiqueta.replaceChildren(marcar,rotulo);
   grupo.querySelector('legend')?.classList.add('ag-leyenda');
   if(clave==='sedes'){
    const tip=make('p','field-help','Escribí cada sede o lugar. Podés combinar oficinas del país y del exterior.');
    grupo.querySelector('legend')?.after(tip);
    marcar.addEventListener('change',()=>{
     if(!marcar.checked||ficha.sedesInicializadas)return;
     ficha.sedesInicializadas=true;
     ficha.sedes.splice(0,ficha.sedes.length,'');
     window.montarSedesAviso(grupo,ficha);
     requestAnimationFrame(()=>grupo.querySelector('textarea,input:not([type=hidden])')?.focus());
    },true);
   }
   if(clave==='pie'){
    const txt=find('editorial-ad-pie');
    if(txt){const label=txt.labels[0];if(label)label.textContent='Texto final';txt.placeholder='Ej.: Permanecerán cerradas el jueves 3 de diciembre.';}
   }
   cont.append(etiqueta,grupo);opciones.append(cont);
  }
  datosEditor.append(opciones);
  const ver=button('Revisar arte','g ag-primario');ver.onclick=mostrarPrevia;datosEditor.append(ver);
  const opcionesTitulo=identidad.querySelector('summary');if(opcionesTitulo)opcionesTitulo.textContent='Más opciones: diseño y membrete';
  const estado=make('p','ag-importado field-help');estado.setAttribute('role','status');estado.hidden=true;
  function cambiar(modo,focus=false){
   prefs.set(ficha,modo);
   paste.hidden=modo!=='texto';datosEditor.hidden=modo!=='manual';
   porTexto.setAttribute('aria-pressed',String(modo==='texto'));manual.setAttribute('aria-pressed',String(modo==='manual'));
   estado.hidden=modo!=='revisar';
   if(modo==='revisar')estado.textContent=ficha.avisoImportacion;
   if(focus)requestAnimationFrame(()=>{if(destino.contains(fl)&&activo())(modo==='texto'?area:mensaje).focus();});
  }
  porTexto.onclick=()=>cambiar('texto',true);
  manual.onclick=()=>cambiar('manual',true);
  importar.addEventListener('click',event=>{
   if(!area.value.includes('[día y fecha]'))return;
   event.stopImmediatePropagation();
   if(avisoImport)avisoImport.textContent='Completá las fechas del ejemplo antes de generar el aviso.';
   area.focus();
  },true);
  importar.addEventListener('click',()=>{if(!importar.isConnected)mostrarPrevia();});
  fl.append(tabs,estado,paste,datosEditor,identidad);
  // Los controles existentes conservan sus listeners. Se desecha solo el envoltorio anterior.
  destino.replaceChildren(fl);
  if(ficha.avisoImportacion&&!prefs.has(ficha))prefs.set(ficha,'revisar');
  cambiar(prefs.get(ficha)||'texto');
 }
 window.montarAviso=function(destino,datos){
  original(destino,datos);
  // Al reconstruirse después de una importación, se empieza por la revisión.
  const ficha=window.fichaAviso(datos);
  if(ficha.avisoImportacion&&prefs.get(ficha)==='texto')prefs.set(ficha,'revisar');
  decorar(destino,datos);
 };
 if(activo()&&panel.querySelector('.aviso-opciones'))decorar(panel,window.datosEditoriales('aviso'));

 const barra=make('div','ag-vista'), formatos=make('div','ag-formatos');
 formatos.setAttribute('role','group');formatos.setAttribute('aria-label','Formato del aviso');
 barra.hidden=true;
 for(const [value,text] of [['post','Publicación'],['historia','Historia']]){
  const el=button(text,'g');el.dataset.formatoAviso=value;el.setAttribute('aria-controls','out');
  el.onclick=()=>{
   if(formato.value!==value){
    formato.value=value;formato.dispatchEvent(new Event('input',{bubbles:true}));
   }
   sync();
  };
  formatos.append(el);
 }
 const guardar=button('Descargar PNG','g ag-primario'), editar=button('Editar aviso','g ag-regresar');
 editar.onclick=mostrarEdicion;
 function descargaOriginal(){
  const paginas=[...salida.querySelectorAll('figure')];
  if(!paginas.length)return;
  const n=Number.parseInt(find('previewPagina')?.textContent,10)||1;
  return paginas[Math.max(0,Math.min(paginas.length-1,n-1))]?.querySelector('button');
 }
 guardar.onclick=()=>{const b=descargaOriginal();if(b&&!b.disabled&&salida.getAttribute('aria-busy')!=='true')b.click();};
 barra.append(formatos,guardar,editar);
 vista.querySelector('.exterior-preview-bar')?.after(barra);
 function sync(){
  const habilitada=activo()&&!layout.hidden&&!!panel.querySelector('.ag-flujo');
  root.classList.toggle('aviso-guiado',habilitada);
  barra.hidden=!habilitada;
  if(!habilitada)return;
  for(const el of formatos.children)el.setAttribute('aria-pressed',String(formato.value===el.dataset.formatoAviso));
  const b=descargaOriginal();
  guardar.disabled=!b||b.disabled||salida.getAttribute('aria-busy')==='true';
  const t=salida.querySelectorAll('figure').length>1?'Descargar página':'Descargar PNG';
  if(guardar.textContent!==t)guardar.textContent=t;
 }
 const obs=new MutationObserver(sync);
 obs.observe(salida,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-busy','disabled']});
 obs.observe(panel,{childList:true});obs.observe(layout,{attributes:true,attributeFilter:['hidden']});
 if(find('previewPagina'))obs.observe(find('previewPagina'),{childList:true});
 for(const tipo of ['input','change'])document.addEventListener(tipo,event=>{if(['m','adT','adV'].includes(event.target.id))sync();});
 sync();
})();
