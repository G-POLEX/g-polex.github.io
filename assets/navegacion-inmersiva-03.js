
(function(){
 'use strict';
 const stage=document.getElementById('osStage');
 const rutaInicialExterior=location.hash;
 const main=document.querySelector('main.exterior');
 const mapa=document.getElementById('mapaGenerador');
 const layout=document.querySelector('.exterior-layout');
 const lista=document.getElementById('osFamilyList');
 const continuar=document.getElementById('osContinue');
 const homeHeader=document.getElementById('osHomeHeader');
 const homeMapa=document.getElementById('osMapaInicio');
 const buscar=document.getElementById('buscarPlantillas');
 const busquedaInicio=document.getElementById('osHomeSearch');
 const formularioBusqueda=document.getElementById('osHomeSearchForm');
 const panelBusqueda=document.getElementById('osHomeSearchResults');
 const listaBusqueda=document.getElementById('osHomeSearchList');
 const estadoBusqueda=document.getElementById('osHomeSearchStatus');
 const verTodos=document.getElementById('osHomeSearchAll');
 const resultadosMapa=document.getElementById('resultadosPlantillas');
 const originalLogo=document.querySelector('main.exterior .exterior-logo');
 if(originalLogo&&!document.getElementById('osStageMark').querySelector('img')){const imagen=originalLogo.cloneNode(true);imagen.alt='EXTERIOR';imagen.removeAttribute('class');document.getElementById('osStageMark').append(imagen)}
 let editorVisitado=false;
 function puedeRetomar(){return editorAbierto&&editorVisitado}
 function sincronizarContinuar(){
  const disponible=puedeRetomar();
  continuar.hidden=!disponible;
   stage.classList.toggle("os-resume-available",disponible);
 }
 function construirFamilias(){
  lista.replaceChildren();
  const accesos=Array.from(document.querySelectorAll('#ramasMapa > button[data-destino]'));
  accesos.forEach((original,i)=>{
   const nombre=original.querySelector('strong')?.textContent.trim()||original.textContent.trim();
   const detalle=original.querySelector('small')?.textContent.trim()||'';
   const boton=document.createElement('button');
   boton.type='button';boton.className='os-stage-family';boton.dataset.osFamily=original.dataset.destino;
   const num=document.createElement('span');num.className='os-stage-number';num.textContent=String(i+1).padStart(2,'0');
   const cuerpo=document.createElement('span');
   const titulo=document.createElement('span');titulo.className='os-stage-family-name';titulo.textContent=nombre;
   const subtitulo=document.createElement('span');subtitulo.className='os-stage-family-info';subtitulo.textContent=detalle;
   cuerpo.append(titulo,subtitulo);
   const flecha=document.createElement('span');flecha.className='os-stage-family-arrow';flecha.textContent='›';flecha.setAttribute('aria-hidden','true');
   boton.append(num,cuerpo,flecha);lista.append(boton);
  });
  document.getElementById('osFamilyCount').textContent=accesos.length+' disponibles';
 }
 function normalizarConsultaInicio(valor){return String(valor||'').trim();}
 function sincronizarBusquedaInicio(){
  const q=normalizarConsultaInicio(busquedaInicio.value);
  if(!q){panelBusqueda.hidden=true;listaBusqueda.replaceChildren();return [];}
  // El mismo índice y la misma función de filtrado del mapa. Única fuente de resultados.
  buscar.value=q;
  buscar.dispatchEvent(new Event('input',{bubbles:true}));
  const originales=Array.from(resultadosMapa.querySelectorAll(':scope > button'));
  listaBusqueda.replaceChildren();
  originales.slice(0,6).forEach(original=>{
   const nombre=original.querySelector('strong')?.textContent.trim()||original.textContent.trim();
   const detalle=original.querySelector('small')?.textContent.trim()||'';
   const boton=document.createElement('button');boton.type='button';boton.className='os-home-search-result';
   const datos=document.createElement('span');const titulo=document.createElement('strong');titulo.textContent=nombre;
   datos.append(titulo);
   if(detalle){const subtitulo=document.createElement('small');subtitulo.textContent=detalle;datos.append(subtitulo)}
   const flecha=document.createElement('span');flecha.textContent='›';flecha.setAttribute('aria-hidden','true');
   boton.append(datos,flecha);
   boton.addEventListener('click',()=>{cerrarInicio();original.click();});
   listaBusqueda.append(boton);
  });
  estadoBusqueda.textContent=originales.length===0?'No se encontraron artes. Probar otra palabra.':originales.length===1?'1 resultado encontrado':originales.length+' resultados encontrados';
  verTodos.hidden=originales.length<=6;
  panelBusqueda.hidden=false;
  return originales;
 }
 function mostrarBusquedaEnMapa(){
  const consulta=normalizarConsultaInicio(busquedaInicio.value);
  abrirMapa();
  buscar.value=consulta;
  buscar.dispatchEvent(new Event('input',{bubbles:true}));
  buscar.focus({preventScroll:true});
 }
 formularioBusqueda.addEventListener('submit',evento=>{
  evento.preventDefault();
  const originales=sincronizarBusquedaInicio();
  if(originales.length===1){cerrarInicio();originales[0].click();return;}
  if(originales.length>0)mostrarBusquedaEnMapa();
 });
 busquedaInicio.addEventListener('input',sincronizarBusquedaInicio);
 busquedaInicio.addEventListener('keydown',evento=>{
  if(evento.key==='Escape'&&busquedaInicio.value){busquedaInicio.value='';sincronizarBusquedaInicio();evento.stopPropagation();}
 });
 verTodos.addEventListener('click',mostrarBusquedaEnMapa);
 function cerrarInicio(){
  if(stage.hidden)return;
  stage.hidden=true;
  main.inert=false;
  document.body.classList.remove('os-home-visible');
  sincronizarContinuar();
 }
 function abrirInicio(inicial=false){
  // Actualizar la URL antes de que una recarga o un evento de historial pueda leer una ruta anterior.
  if(!inicial){try{history.replaceState({...estadoPantalla('inicio'),vistaExterior:'inicio'},'', '#vista=inicio');}catch(_){} }
  sincronizarContinuar();
  stage.hidden=false;
  main.inert=true;
  document.body.classList.add('os-home-visible');
  stage.scrollTop=0;
  if(!document.documentElement.classList.contains('exterior-native')&&matchMedia('(max-width:760px), (hover:none) and (pointer:coarse)').matches){window.scrollTo(0,0);}
  document.getElementById('osStageTitle').focus({preventScroll:true});
 }
 function abrirMapa(){
  cerrarInicio();
  if(mapa.hidden){document.getElementById('abrirMapa').click();}
  else{cerrarSubmenuSede();buscar.value='';filtrarPlantillas();mapa.scrollIntoView({block:'start',behavior:'instant'});}
  document.getElementById('tituloMapa').focus({preventScroll:true});
 }
 function abrirFamilia(id){
  // Reutiliza los accesos originales, incluidos submenús, estado e historial.
  cerrarInicio();
  if(mapa.hidden)document.getElementById('abrirMapa').click();
   else{cerrarSubmenuSede();buscar.value='';filtrarPlantillas();}
   const boton=Array.from(document.querySelectorAll('#ramasMapa > button')).find(b=>b.dataset.destino===id);
  if(!boton){abrirMapa();return;}
  boton.click();
  editorVisitado=editorVisitado||(editorAbierto&&mapa.hidden);
  sincronizarContinuar();
 }
 function retomar(){
  cerrarInicio();
  if(!mapa.hidden){
   const atras=document.getElementById('cerrarMapa');
   if(!atras.hidden)atras.click();
   else abrirMapa();
  }
 }
 stage.addEventListener('click',evento=>{
  const item=evento.target.closest('[data-os-family]');
  if(item){abrirFamilia(item.dataset.osFamily);return;}
  const control=evento.target.closest('[data-os-action]');if(!control)return;
  const accion=control.dataset.osAction;
  if(accion==='map')abrirMapa();
  if(accion==='continue')retomar();
   if(accion==='home'){busquedaInicio.value='';sincronizarBusquedaInicio();abrirInicio();}
 });
 homeHeader?.addEventListener('click',evento=>{evento.preventDefault();abrirInicio();});
 homeMapa?.addEventListener('click',()=>abrirInicio());
 // Mantener el historial original: cuando el usuario vuelve a otra pantalla,
 // el inicio inmersivo no debe taparla.
 // La restauración de rutas se centraliza más abajo; no cerrar el inicio con popstate sin ruta.
 document.addEventListener('keydown',evento=>{
  if(evento.key!=='Escape'||stage.hidden)return;
  evento.preventDefault();abrirMapa();
 });
 const observar=new MutationObserver(()=>{if(editorAbierto&&mapa.hidden)editorVisitado=true;sincronizarContinuar();});
 observar.observe(mapa,{attributes:true,attributeFilter:['hidden']});
 construirFamilias();
 // El catálogo se llena al iniciar el generador; conserva accesos efectivos.
 if(!lista.childElementCount){
  const observer=new MutationObserver(()=>{construirFamilias();if(lista.childElementCount)observer.disconnect()});
  observer.observe(document.getElementById('ramasMapa'),{childList:true});
 }
 abrirInicio(true);
 // Conservar la ruta que existía antes de pintar la pantalla inicial.
 stage.dataset.exteriorRutaInicial=rutaInicialExterior;
 stage.removeAttribute('aria-busy');
 for(const control of [busquedaInicio,formularioBusqueda.querySelector('button[type="submit"]'),stage.querySelector('[data-os-action="map"]')])if(control)control.disabled=false;
})();

/* Completar las miniaturas de comparación con el renderizador original. */
(function(){
 'use strict';
 const varianteOriginal=varianteCatalogo, entradaOriginal=entradaCatalogo;
 const pendientes=new Map();
 varianteCatalogo=function(ruta,id,valor){
  const ficha=varianteOriginal(ruta,id,valor);
  if(ficha&&ruta==='esquelas')ficha.miniatura='esquela-'+valor;
  return ficha;
 };
 function generarMiniatura(clave){
  if(pendientes.has(clave))return pendientes.get(clave);
  const tarea=(async()=>{
   await fuentesEditorial();
   let canvas;
   if(clave.startsWith('esquela-')){
    const formato=clave.slice(8);
    const [arte]=await prepararEsquela({texto1:'Expresamos nuestras condolencias por el fallecimiento de',nombre:'Nombre de la persona',qddg:'Q.D.D.G.',texto2:'Nos unimos al dolor de su familia.',fecha:'Fecha'},formato);
    canvas=arte.dibujar(.12,false);
   }else{
    await document.fonts.ready;
    const foto=document.createElement('canvas');foto.width=612;foto.height=345;
    const g=foto.getContext('2d');g.fillStyle='#d7e2ef';g.fillRect(0,0,612,345);
    g.strokeStyle='#617994';g.lineWidth=5;g.strokeRect(255,94,102,76);
    g.beginPath();g.arc(328,113,8,0,Math.PI*2);g.stroke();
    g.beginPath();g.moveTo(259,161);g.lineTo(287,132);g.lineTo(309,151);g.lineTo(325,139);g.lineTo(354,167);g.stroke();
    g.fillStyle='#405775';g.font='600 21px sans-serif';g.textAlign='center';g.fillText('Fotografía propia',306,207);
    canvas=await drawD(.16,false,{foto,encuadre:50,linea:'Día del',titulo:'Salvadoreño',subtitulo:'en el Exterior',fecha:'Fecha de la actividad',hora:'',lugar:'',tituloLogos:'',logos:[]});
   }
   const uri=canvas.toDataURL('image/webp',.85);
   miniaturasPlantillas[clave]=uri;
   return uri;
  })();
  pendientes.set(clave,tarea);
  tarea.catch(()=>pendientes.delete(clave));
  return tarea;
 }
 entradaCatalogo=function(boton,ficha,supra=''){
  entradaOriginal(boton,ficha,supra);
  const clave=ficha?.miniatura;
  if(!clave||miniaturasPlantillas[clave]||!(/^(esquela-(canciller|vicecanciller|viceministro|otro)|efemerides-imagen-c)$/.test(clave)))return;
  generarMiniatura(clave).then(uri=>{
   if(boton.querySelector('img'))return;
   const img=document.createElement('img');img.src=uri;img.alt='';img.width=52;img.height=64;img.loading='lazy';img.decoding='async';boton.prepend(img);
  }).catch(error=>console.warn('Miniatura no disponible:',clave,error));
 };
})();


/* Conservar únicamente la ruta de navegación al recargar. */
(function(){
 'use strict';
 const inicio=document.getElementById('osStage');
 const principal=document.querySelector('main.exterior');
 let restaurando=false, enCola=false, zona='', claveEditor='';
 const valido=(ruta,id)=>Object.hasOwn(catalogoPlantillas,ruta)&&Object.hasOwn(catalogoPlantillas[ruta],id);
 function leerRuta(hash=location.hash){
  const p=new URLSearchParams(hash.slice(1)), vista=p.get('vista');
  if(['inicio','plantillas','sede','interno'].includes(vista))return {vista};
  const ruta=p.get('tipo'), id=p.get('arte');
  if(vista==='catalogo'&&Object.hasOwn(catalogoPlantillas,ruta)&&(id===null||valido(ruta,id)))return {vista,ruta,id};
  if(vista==='editor'&&valido(ruta,id)){
   const valor=p.get('variante'), ficha=catalogoPlantillas[ruta][id];
   return {vista,ruta,id,valor:valor!==null&&Object.hasOwn(ficha.variantes||{},valor)?valor:null,
    comparar:p.get('comparar')==='1',zona:p.get('zona')==='previa'?'previa':''};
  }
  return null;
 }
 function escribirRuta(){
  if(restaurando||!historialGeneradorDisponible)return;
  const p=new URLSearchParams();let estado;
  if(!inicio.hidden){p.set('vista','inicio');estado={...estadoPantalla('inicio'),vistaExterior:'inicio'};zona='';claveEditor='';}
  else if(!mapa.hidden){
   const actual=history.state;
   const vista=submenuSedeAbierto&&submenuActual==='catalogo'&&actual?.pantalla==='catalogo'?'catalogo':submenuSedeAbierto&&['sede','interno'].includes(submenuActual)?submenuActual:'plantillas';
   p.set('vista',vista);estado={...estadoPantalla(vista==='plantillas'?'inicio':vista),vistaExterior:vista};
   if(vista==='catalogo'){
    const ruta=actual.ruta,id=actual.id??null;
    if(!Object.hasOwn(catalogoPlantillas,ruta)||(id!==null&&!valido(ruta,id)))return;
    p.set('tipo',ruta);if(id!==null)p.set('arte',id);Object.assign(estado,{ruta,id});
   }
   zona='';claveEditor='';
  }else{
   const ruta=$('m').value, selector=familiasExterior[ruta]?.selector,id=selector?$(selector).value:'';
   if(!valido(ruta,id))return;
   const clave=ruta+'|'+id;if(claveEditor!==clave){claveEditor=clave;zona='';}
   const ficha=catalogoPlantillas[ruta][id],valor=valorVarianteCatalogo(ruta,ficha);
   p.set('vista','editor');p.set('tipo',ruta);p.set('arte',id);
   if(Object.hasOwn(ficha.variantes||{},valor))p.set('variante',valor);
   if(!compararVariantes.hidden&&compararVariantes.open)p.set('comparar','1');
   if(zona==='previa')p.set('zona','previa');
   estado={...estadoPantalla('editor',{ruta,id}),vistaExterior:'editor'};
  }
  const hash='#'+p.toString(), actual=history.state;
  if(location.hash===hash&&actual?.generador===estado.generador&&actual.pantalla===estado.pantalla&&actual.vistaExterior===estado.vistaExterior&&actual.ruta===estado.ruta&&actual.id===estado.id)return;
  try{history.replaceState(actual?.pantalla===estado.pantalla?{...actual,...estado}:estado,'',hash);}catch(error){console.warn('No se pudo conservar la ruta.',error);}
 }
 function programar(){if(restaurando||enCola)return;enCola=true;queueMicrotask(()=>{enCola=false;escribirRuta();});}
 function restaurar(r){
  restaurando=true;
  try{
   zona='';claveEditor='';
   if(r.vista==='inicio'){
    if(inicio.hidden)$('osHomeHeader').click();
    history.replaceState({...estadoPantalla('inicio'),vistaExterior:'inicio'},'','#vista=inicio');
   }else{
    inicio.hidden=true;principal.inert=false;document.body.classList.remove('os-home-visible');
    if(r.vista==='editor'){
     const entrada=r.valor===null?null:varianteCatalogo(r.ruta,r.id,r.valor);
     abrirEntradaCatalogo(r.ruta,r.id,entrada?.pasos||[],false);
     claveEditor=r.ruta+'|'+r.id;zona=r.zona;
     compararVariantes.open=r.comparar&&!compararVariantes.hidden;
     if(compararVariantes.open)mostrarVarianteCatalogo();
     history.replaceState(estadoPantalla('editor',{ruta:r.ruta,id:r.id}),'');
     if(zona==='previa'){
      const ir=()=>{if(!inicio.hidden||!mapa.hidden||zona!=='previa'||claveEditor!==r.ruta+'|'+r.id)return;(M==='proy'?$('proyPreview'):$('resultCard'))?.scrollIntoView({block:'start'});};
      requestAnimationFrame(ir);document.fonts.ready.then(()=>requestAnimationFrame(ir));
     }
    }else{
     mostrarMapa(true);
     if(r.vista==='sede')abrirSubmenuSede(false);
     if(r.vista==='interno')abrirSubmenuInterno(false);
     if(r.vista==='catalogo')abrirCatalogoFamilia(r.ruta,r.id,false);
     history.replaceState(estadoPantalla(r.vista==='plantillas'?'inicio':r.vista,r.vista==='catalogo'?{ruta:r.ruta,id:r.id}:{}),'');
    }
   }
  }catch(error){console.warn('No se pudo restaurar la ruta.',error);}
  finally{restaurando=false;programar();}
 }
 // Android: navegar por la jerarquía visible sin depender del historial nativo
 // del WebView. La vista previa y los desplegables se cierran primero.
 if(document.documentElement.classList.contains('exterior-native')){
  let ultimoAtras=-Infinity;
  window.exteriorAndroidBack=function(){
   const ahora=performance.now();if(ahora-ultimoAtras<280)return;ultimoAtras=ahora;
   const estado=history.state||{};
   if(!inicio.hidden){
    const resultados=$('osHomeSearchResults'),busqueda=$('osHomeSearch');
    if(resultados&&!resultados.hidden&&busqueda?.value){busqueda.value='';busqueda.dispatchEvent(new Event('input',{bubbles:true}));}
    // En el inicio se conserva la aplicación abierta. El botón Inicio de Android
    // permite salir o dejarla en segundo plano sin perder una edición.
    return;
   }
   if(mapa.hidden){
    if(disenosExterior.open){disenosExterior.open=false;return;}
    if(compararVariantes.open){compararVariantes.open=false;return;}
    if(zona==='previa'){
     zona='';const control=$(M==='proy'?'proyBackEdit':'uxEdit')||$('volverEdicion');
     if(control)control.click();
     else $('editorTitulo').scrollIntoView({block:'start'});
     programar();return;
    }
    const ruta=$('m').value,selector=familiasExterior[ruta]?.selector,id=selector?$(selector).value:'';
    const ficha=catalogoPlantillas[ruta]?.[id];
    if(ficha&&Object.keys(ficha.variantes||{}).length){restaurar({vista:'catalogo',ruta,id});return;}
    if(ruta==='mov'||ruta==='sede'||(ruta==='atencion-consular'&&id!=='individual')){restaurar({vista:'sede'});return;}
    if(ruta==='esquelas'||ruta==='interno'){restaurar({vista:'interno'});return;}
    if(Object.keys(catalogoPlantillas[ruta]||{}).length>1){restaurar({vista:'catalogo',ruta,id:null});return;}
    restaurar({vista:'plantillas'});return;
   }
   if(buscarPlantillas.value){buscarPlantillas.value='';filtrarPlantillas();programar();return;}
   if(submenuSedeAbierto){
    if(submenuActual==='catalogo'){
     const ruta=estado.ruta||rutaSubmenuCatalogo,id=estado.id??null;
     if(ruta==='mov'||ruta==='sede'||(ruta==='atencion-consular'&&id!=='individual')){restaurar({vista:'sede'});return;}
     if(ruta==='esquelas'||ruta==='interno'){restaurar({vista:'interno'});return;}
     if(id!==null&&Object.keys(catalogoPlantillas[ruta]||{}).length>1){restaurar({vista:'catalogo',ruta,id:null});return;}
    }
    restaurar({vista:'plantillas'});return;
   }
   restaurar({vista:'inicio'});
  };
 }
 const hashInicial=inicio.dataset.exteriorRutaInicial||'';delete inicio.dataset.exteriorRutaInicial;
 const inicial=leerRuta(hashInicial);
 if(inicial)restaurar(inicial);else restaurar({vista:'inicio'});
 escribirRuta();
 window.addEventListener('popstate',ev=>{
  const r=leerRuta();
  if(r){ev.stopImmediatePropagation();restaurar(r);return;}
  if(ev.state?.generador===marcaNavegacionGenerador&&ev.state.pantalla==='inicio'){
   ev.stopImmediatePropagation();restaurar({vista:ev.state.vistaExterior==='plantillas'?'plantillas':'inicio'});
  }
 },true);
 document.addEventListener('click',ev=>{
  if(ev.target.closest('#uxPreview,#irVistaPrevia,#proyPreviewJump'))zona='previa';
  if(ev.target.closest('#uxEdit,#volverEdicion,#proyBackEdit'))zona='';
  programar();
 });
 for(const evento of ['input','change'])document.addEventListener(evento,programar);
 compararVariantes.addEventListener('toggle',programar);
 const observer=new MutationObserver(programar);
 for(const el of [inicio,mapa])observer.observe(el,{attributes:true,attributeFilter:['hidden']});
  window.addEventListener('pagehide',escribirRuta);
})();


/* Exterior: navegación, avisos de procesamiento e instalación web. */
(function(){
 'use strict';
 const $el=id=>document.getElementById(id);
 const stage=$el('osStage'), main=document.querySelector('main.exterior'), mapaUX=$el('mapaGenerador');
 const statusPNG=$el('estadoPng'), out=$el('out'), statusPDF=$el('proyStatus'), botonPDF=$el('proyDownload');
 const enlace=(rel,href,type,sizes)=>{
  const el=document.createElement('link');el.rel=rel;el.href=href;if(type)el.type=type;if(sizes)el.sizes.value=sizes;document.head.append(el);
 };
 // Los iconos y el color del navegador se declaran en la cabecera durante la preparación.
 const style=document.createElement('style');
 style.textContent='.exterior-ux-ruta{display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;padding:12px clamp(14px,3vw,32px);font-size:13px;line-height:1.35;color:#182658;background:#eef1f8;border-bottom:1px solid #c7cfdf}.exterior-ux-ruta[hidden],.exterior-ux-progreso[hidden],.exterior-ux-avisos[hidden],.exterior-ux-instalar[hidden],.exterior-ux-version[hidden]{display:none!important}.exterior-ux-ruta button{border:0;background:transparent;color:#182658;padding:6px 3px;min-height:32px;font:inherit;text-decoration:underline;text-underline-offset:3px;cursor:pointer;width:auto}.exterior-ux-ruta [aria-current]{font-weight:700}.exterior-ux-ruta .sep{color:#727c96}.exterior-ux-progreso,.exterior-ux-avisos,.exterior-ux-version{position:fixed;z-index:12000;right:16px;bottom:16px;width:min(360px,calc(100vw - 32px));box-sizing:border-box;padding:14px 16px;border:1px solid #c7cfdf;border-left:4px solid #b68a62;border-radius:12px;background:#fff;color:#171f56;box-shadow:0 8px 24px #111f6026;font:inherit;font-size:14px;line-height:1.4}.exterior-ux-progreso progress{width:100%;height:7px;display:block;margin-top:10px;accent-color:#111f60}.exterior-ux-avisos{bottom:100px}.exterior-ux-avisos button,.exterior-ux-version button{font:inherit;cursor:pointer;color:#111f60;background:#edf1f9;border:1px solid #c7cfdf;padding:7px 12px;border-radius:6px}.exterior-ux-avisos button{float:right;margin-left:8px}.exterior-ux-version{top:16px;bottom:auto}.exterior-ux-version p{margin:0 0 8px}.exterior-ux-version button+button{margin-left:6px}.exterior-ux-instalar{font:inherit;min-height:42px;padding:10px 16px;border:1px solid #b5bdd6;border-radius:8px;background:#eef1f8;color:#111f60;cursor:pointer}.exterior-ux-instalar:focus-visible,.exterior-ux-ruta button:focus-visible{outline:3px solid #b68a62;outline-offset:2px}@media(max-width:760px){.exterior-ux-progreso{bottom:calc(88px + env(safe-area-inset-bottom,0px))}.exterior-ux-avisos{bottom:calc(166px + env(safe-area-inset-bottom,0px))}}';
 document.head.append(style);
 const rutaNav=document.createElement('nav');rutaNav.className='exterior-ux-ruta';rutaNav.setAttribute('aria-label','Ruta de navegación');main.querySelector('header.exterior-cabecera').after(rutaNav);
 function abrirPlantillas(){if(mapaUX.hidden){$el('abrirMapa').click();}else{guardarPantallaActual();registrarPantalla('inicio');mostrarMapa(true);$el('tituloMapa').focus({preventScroll:true});}}
 function familia(ruta){if(mapaUX.hidden)abrirPlantillas();abrirFamiliaCatalogo(ruta);}
 function variantes(ruta,id){if(mapaUX.hidden)abrirPlantillas();abrirCatalogoFamilia(ruta,id);}
 function padre(ruta,id){return ruta==='esquelas'||ruta==='interno'?'interno':ruta==='sede'||ruta==='mov'||(ruta==='atencion-consular'&&id!=='individual')?'sede':null;}
 let firmaRuta='';
 function dibujarRuta(){
  rutaNav.hidden=!stage.hidden||document.documentElement.classList.contains('exterior-native')||matchMedia('(max-width:760px), (hover:none) and (pointer:coarse)').matches;if(rutaNav.hidden)return;
  const items=[['Inicio',()=>$el('osHomeHeader').click()],['Plantillas',mapaUX.hidden||submenuSedeAbierto?abrirPlantillas:null]];
  const estado=history.state||{};
  if(mapaUX.hidden){
   const ruta=$el('m').value, conf=familiasExterior[ruta];if(!conf)return;
   const id=conf.selector?$el(conf.selector).value:'',ficha=catalogoPlantillas[ruta]?.[id];
   const grupo=padre(ruta,id);
   if(grupo)items.push([familiasExterior[grupo].nombre,()=>familia(grupo)]);
   else if(conf.nombre!==$el('editorTitulo').textContent)items.push([conf.nombre,()=>familia(ruta)]);
   const valor=ficha?valorVarianteCatalogo(ruta,ficha):null;
   const variante=valor==null?null:ficha?.variantes?.[valor];
   items.push([$el('editorTitulo').textContent,variante?()=>variantes(ruta,id):null]);
   if(variante)items.push([variante[0],null]);
  }else if(submenuSedeAbierto){
   const ruta=estado.ruta||rutaSubmenuCatalogo,id=estado.id??null;
   if(submenuActual==='catalogo'&&ruta&&familiasExterior[ruta]){
    const grupo=padre(ruta,id);
    if(grupo)items.push([familiasExterior[grupo].nombre,()=>familia(grupo)]);
    if(id!==null&&Object.keys(catalogoPlantillas[ruta]||{}).length>1&&ruta!==grupo)items.push([familiasExterior[ruta].nombre,()=>variantes(ruta,null)]);
    items.push([$el('tituloMapa').textContent,null]);
   }else if(['sede','interno'].includes(submenuActual))items.push([familiasExterior[submenuActual].nombre,null]);
  }
  const clave=JSON.stringify(items.map(([t,a])=>[t,!!a]))+':'+$el('m').value+':'+(familiasExterior[$el('m').value]?.selector?$el(familiasExterior[$el('m').value].selector).value:'')+':'+(estado.ruta||'')+':'+(estado.id??'');
  if(clave===firmaRuta)return;firmaRuta=clave;
  rutaNav.replaceChildren();
  items.forEach(([titulo,accion],i)=>{
   if(i){const sep=document.createElement('span');sep.className='sep';sep.textContent='›';sep.setAttribute('aria-hidden','true');rutaNav.append(sep);}
   const nodo=document.createElement(accion?'button':'span');nodo.textContent=titulo;
   if(accion){nodo.type='button';nodo.addEventListener('click',accion);}
   else if(i===items.length-1)nodo.setAttribute('aria-current','page');
   rutaNav.append(nodo);
  });
 }
 const obsRuta=new MutationObserver(dibujarRuta);
 for(const el of [stage,mapaUX])obsRuta.observe(el,{attributes:true,attributeFilter:['hidden']});
 for(const el of [$el('editorTitulo'),$el('editorFicha'),$el('tituloMapa')])obsRuta.observe(el,{childList:true,subtree:true,characterData:true});
 document.addEventListener('change',()=>queueMicrotask(dibujarRuta));
 document.addEventListener('click',()=>queueMicrotask(dibujarRuta));
 window.addEventListener('popstate',()=>queueMicrotask(dibujarRuta),true);
 const mediaRuta=matchMedia('(max-width:760px), (hover:none) and (pointer:coarse)');
 mediaRuta.addEventListener('change',()=>{firmaRuta='';dibujarRuta();});
 dibujarRuta();

 const panel=document.createElement('div');panel.className='exterior-ux-progreso';panel.hidden=true;panel.setAttribute('aria-live','polite');
 const rotulo=document.createElement('span');rotulo.setAttribute('role','status');const barra=document.createElement('progress');barra.setAttribute('aria-label','Progreso de la operación');panel.append(rotulo,barra);document.body.append(panel);
 const aviso=document.createElement('div');aviso.className='exterior-ux-avisos';aviso.hidden=true;const cerrar=document.createElement('button');cerrar.type='button';cerrar.textContent='Cerrar';const avisoTexto=document.createElement('span');avisoTexto.setAttribute('role','status');aviso.append(cerrar,avisoTexto);document.body.append(aviso);
 let relojAviso,relojProgreso,ultimoPDF='',pendientesUX=0;
 cerrar.onclick=()=>{aviso.hidden=true;clearTimeout(relojAviso);};
 function notificar(mensaje){avisoTexto.textContent=mensaje;aviso.hidden=false;clearTimeout(relojAviso);relojAviso=setTimeout(()=>{aviso.hidden=true;},4200);}
 function operacion(){
  if(!statusPNG.hidden)return statusPNG.textContent||'Preparando PNG…';
  if(botonPDF?.disabled&&/^Preparando PDF/.test(statusPDF.textContent))return statusPDF.textContent;
  if(pendientesUX>0)return 'Procesando imagen…';
  if(!stage.hidden||!mapaUX.hidden||M==='proy')return '';
  if(out.getAttribute('aria-busy')==='true'||!I)return 'Actualizando vista previa…';
  return '';
 }
 function mostrarProgreso(){
  const mensaje=operacion();clearTimeout(relojProgreso);
  if(!mensaje){panel.hidden=true;return;}
  const pintar=()=>{const actual=operacion();if(!actual){panel.hidden=true;return;}rotulo.textContent=actual;
   const lote=actual.match(/(?:PNG |página )(\d+) de (\d+)/i);
   if(lote&&Number(lote[2])>1){barra.max=Number(lote[2]);barra.value=Math.max(0,Number(lote[1])-1);}
   else barra.removeAttribute('value');
   panel.hidden=false;};
  if(panel.hidden)relojProgreso=setTimeout(pintar,300);else pintar();
 }
 const obsEstado=new MutationObserver(()=>{
  mostrarProgreso();
  if(statusPDF){const mensaje=statusPDF.textContent;if(mensaje!==ultimoPDF){ultimoPDF=mensaje;/* Se omite el aviso emergente de descarga; el estado del editor permanece disponible. */}}
 });
 obsEstado.observe(statusPNG,{attributes:true,childList:true,subtree:true,characterData:true});
 obsEstado.observe(out,{attributes:true,attributeFilter:['aria-busy']});
 obsEstado.observe(stage,{attributes:true,attributeFilter:['hidden']});
 obsEstado.observe(mapaUX,{attributes:true,attributeFilter:['hidden']});
 if(statusPDF)obsEstado.observe(statusPDF,{childList:true,subtree:true,characterData:true});
 if(botonPDF)obsEstado.observe(botonPDF,{attributes:true,attributeFilter:['disabled']});
 const registrarOriginal=registrarCarga;
 registrarCarga=function(tarea,campo){
  const archivo=campo?.files?.[0];pendientesUX++;mostrarProgreso();
  const observada=Promise.resolve(tarea).then(resultado=>{if(archivo&&campo.isConnected&&campo.files?.[0]===archivo)notificar('Imagen incorporada.');return resultado;}).finally(()=>{pendientesUX--;mostrarProgreso();});
  return registrarOriginal(observada,campo);
 };
 // Mantener el mecanismo de descarga y las alertas de validación originales.
 mostrarProgreso();

 // Los recursos mantienen su resolución original. Se difiere la decodificación
 // visual de las miniaturas existentes; las imágenes del lienzo no se sustituyen.
 function optimizarMiniaturas(raiz){for(const img of raiz.querySelectorAll('#subcategoriasSede img,#resultadosPlantillas img,#compararVariantes img')){img.loading='lazy';img.decoding='async';}}
 for(const raiz of [$el('subcategoriasSede'),$el('resultadosPlantillas'),$el('compararVariantes')]){
  if(!raiz)continue;
  const obs=new MutationObserver(()=>{for(const img of raiz.querySelectorAll('img')){if(img.loading!=='lazy')img.loading='lazy';if(img.decoding!=='async')img.decoding='async';}});obs.observe(raiz,{childList:true,subtree:true});
 }
 optimizarMiniaturas(document);

})();


/* El acceso APK se inicia desde la cabecera y se sitúa al final del inicio. */
