
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
   if(clave.startsWith('navidad-')){
    const v=AD.find(d=>d.id==='navidad-2026').v.find(v=>v.id===clave.slice(8));
    const campos={intro:v.intro?.v||'',fecha:'Fecha de la actividad',hora:'6:00 p. m.',lugar:'Lugar del encuentro',info:''};
    v.title.L.forEach((l,i)=>campos['t'+i]=l.v);
    canvas=await drawAD(.30,null,{v,campos,logos:[],logoLabel:''});
   }else if(clave.startsWith('esquela-')){
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
  if(!clave||miniaturasPlantillas[clave]||!(/^(esquela-(canciller|vicecanciller|viceministro|otro)|efemerides-imagen-c|navidad-v[1-4])$/.test(clave)))return;
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


/* Exterior 1.0.50: vistas representativas de categorías, compartidas por web y Android.
   Se dibujan con los renderizadores originales, con datos de muestra independientes
   del formulario activo. 540 px de ancho, sin reescalar las miniaturas antiguas. */
(function(){
 'use strict';
 const ancho=540;
 const claves={
  prensa:'prensa-ucom-comunicado',sede:'sede-v1-post',ad:'ad-opus-v1',
  efemerides:'efemerides-imagen-0','atencion-consular':'consular-individual-post',
  avisos:'avisos-normal-post',interno:'interno-esquela-original','otras-instituciones':'dui-cl-1350'
 };
 const cache=new Map();
 let cola=Promise.resolve();
 const ceder=()=>new Promise(resolve=>setTimeout(resolve,0));
 function original(familia){return miniaturasPlantillas[claves[familia]]||'';}
 async function recursosListos(){
  const inicio=Date.now();
  while(!I){
   if(Date.now()-inicio>30000)throw Error('Los recursos de dibujo no están disponibles.');
   await new Promise(resolve=>setTimeout(resolve,80));
  }
  await document.fonts.ready;
  await fuentesEditorial();
 }
 async function generar(familia){
  await recursosListos();
  let c,arte;
  switch(familia){
   case 'prensa': {
    await prensaCargarRecursos();
    [arte]=documentoDePrensaEnUnaPagina({
     repre1:nombreOficialMinisterio,repre2:'',titulo:'Título del comunicado',
     cuerpo:'Información de interés institucional que se comparte con la ciudadanía a través de los canales oficiales.',
     fecha:'San Salvador, fecha de publicación'
    },false,false,false);
    break;
   }
   case 'sede': {
    const plantilla=disenosSede.oficinas.v1;
    const texto=Object.fromEntries(plantilla.campos.map(([id,,valor])=>[id,valor]));
    const color={...plantilla.colores};color.logo=logoRegionalSede(color,'v1');
    arte=await prepararArteSede({diseno:'oficinas',version:'v1',plantilla,
     estado:{texto,color,foto:null,encuadre:{x:50,y:50}},formato:'post',alto:1350});
    break;
   }
   case 'ad': {
    const v=AD.find(d=>d.id==='opus').v[0];
    c=await drawAD(ancho/(v.W*72),false,{v,campos:{
     intro:'Presentación musical',t0:'Concierto de Opus',fecha:'Fecha de la actividad',
     hora:'6:00 p. m.',lugar:'Lugar del encuentro'
    },logos:[],logoLabel:''});
    break;
   }
   case 'efemerides':
    c=await drawD(ancho/612,false,{
     foto:I.ph0,encuadre:50,linea:'Día del',titulo:'Salvadoreño',subtitulo:'en el Exterior',
     fecha:'Fecha de la actividad',hora:'',lugar:'',tituloLogos:'',logos:[]
    });
    break;
   case 'atencion-consular':
    [arte]=await prepararArteConsularIndividual({
     repre1:'Consulado de El Salvador',repre2:'',titulo:'Consulado móvil',
     numeroFechas:1,fecha1:'Fecha de la jornada',hora:'De 9:00 a. m. a 3:00 p. m.',
     lugar:'Lugar de atención',atencion:'Servicios consulares',info:'',whatsapp:'',
     colaboracion:{titulo:'',logos:[]}
    },'post');
    break;
   case 'avisos':
    [arte]=prepararAvisos({
     repre1:nombreOficialMinisterio,repre2:'',aviso:{incluye:{pie:false,sedes:false,contactos:false},
      comunicado:false,mensaje:'Por motivos de asueto, no se brindará atención al público.',pie:'',sedes:[]}
    },'post');
    break;
   case 'interno':
    [arte]=await prepararEsquela({
     texto1:'Expresamos nuestras condolencias por el fallecimiento de',
     nombre:'Nombre de la persona',qddg:'Q.D.D.G.',
     texto2:'Nos unimos al dolor de su familia.',fecha:'Fecha'
    },'canciller');
    break;
   case 'otras-instituciones': {
    const H=1350,datos={titulo:'Jornada de identificación',subtitulo:'Enrolamiento de DUI',
     pais:'País',fechaComun:'',cuadricula:false,encabezado:true,logos:true};
    const g=document.createElement('canvas').getContext('2d');
    const plan=planDuiClasico(g,H,[{c:'Ciudad',f:'Fecha de la jornada',
     h:'De 9:00 a. m. a 3:00 p. m.',d:'Dirección de la sede'}],datos,encabezadoDui(0,datos));
    c=await dibujarDui(H,datos,plan,ancho/1080,false);
    break;
   }
   default:throw Error('Categoría sin muestra.');
  }
  if(!c&&arte)c=await arte.dibujar(ancho/arte.ancho,false);
  if(!c||c.width<ancho-1||!c.height)throw Error('No se obtuvo una miniatura nítida.');
  try{return c.toDataURL('image/webp',.92);}
  finally{c.width=c.height=0;}
 }
 window.exteriorMiniaturaCategoriaOriginal=original;
 window.exteriorMiniaturaCategoria=function(familia){
  if(!Object.hasOwn(claves,familia))return Promise.reject(Error('Categoría no reconocida.'));
  if(!cache.has(familia)){
   const tarea=cola.then(ceder).then(()=>generar(familia));
   cola=tarea.catch(()=>{});
   cache.set(familia,tarea);
   tarea.catch(()=>{cache.delete(familia);});
  }
  return cache.get(familia);
 };
 window.exteriorAsignarMiniaturaCategoria=function(imagen,familia){
  imagen.dataset.miniaturaCategoria=familia;
  const uri=original(familia);
  if(uri&&!imagen.getAttribute('src'))imagen.src=uri;
  window.exteriorMiniaturaCategoria(familia).then(uri=>{
   if(!imagen.isConnected)return;
   imagen.src=uri;
   imagen.dataset.miniaturaCalidad='nitida';
  }).catch(error=>{
   console.warn('No se pudo regenerar la miniatura:',familia,error);
  });
 };
 // La portada web conserva su directorio numerado original.
 // Las miniaturas se mantienen en el catálogo interior y en Android.
 if(!document.documentElement.classList.contains('exterior-native')){
  function actualizar(){
   for(const boton of document.querySelectorAll('#ramasMapa > button[data-destino]')){
    const familia=boton.dataset.destino;
    if(!Object.hasOwn(claves,familia)||boton.querySelector('.os-category-preview'))continue;
    const imagen=document.createElement('img');
    imagen.className='os-category-preview';imagen.alt='';imagen.decoding='async';
    imagen.loading='lazy';imagen.width=80;imagen.height=100;
    boton.prepend(imagen);boton.classList.add('os-category-with-preview');
    window.exteriorAsignarMiniaturaCategoria(imagen,familia);
   }
  }
  actualizar();
  const ramas=document.getElementById('ramasMapa');
  if(ramas)new MutationObserver(actualizar).observe(ramas,{childList:true});
 }
})();


/* 1.0.50 — Navidad: la presencia de colaboradores determina la firma.
   Mantener ilustraciones, orden editorial, estilos y fondos de las cuatro
   referencias. El resto de Actividades del día a día conserva su motor. */
(function(){
 'use strict';
 const dibujarActividad=drawAD;
 async function dibujarNavidad(K,banda,{v,campos,logos,logoLabel}){
  const p=72,W=v.W,H=v.H,original=AD.find(d=>d.id==='navidad-2026').v.find(d=>d.id===v.id);
  const {c,g}=lienzoArte(W*p,H*p,K,banda);
  const [ilustracion]=await Promise.all([adImg(original.k),adFonts()]);
  const colaboradores=logos.slice(0,4),conApoyo=colaboradores.length>0;
  const rotulo=conApoyo&&String(logoLabel||'').trim();
  // Plantilla navidad, diapositivas 1–2: logo x=34.85%, y=8.40%, ancho=30.31%.
  // Conservar sus proporciones al adaptar 4:5 y 9:16; la firma inferior sigue a la derecha.
  const anchoFirma=W*.3031,altoFirma=anchoFirma*1.36/3.10;
  const firma={x:conApoyo?W-anchoFirma-.55:(W-anchoFirma)/2,y:conApoyo?H-altoFirma-.48:H*.084,w:anchoFirma,h:altoFirma};
  const zona={x:.60,y:firma.y+(rotulo?.16:0),w:W-4.65,h:rotulo?1.13:1.36,al:'l'};
  const etiqueta={x:zona.x,y:firma.y-.40,w:zona.w,h:.38};
  const tituloPrimero=original.art[0][0]>=original.title.box.y;
  const inicio=conApoyo?.50:Math.max(firma.y+firma.h+.22,tituloPrimero?H*.2071:firma.y+firma.h+.36);
  const fin=conApoyo?Math.min(firma.y,rotulo?etiqueta.y:firma.y)-.36:H-.55;
  const alto=fin-inicio;
  const medidas=adArtworkBounds(original.imageTransforms);
  const ajustable=adEsIlustracionRegulable(original);
  const escalaUsuario=ajustable?Math.max(.75,Math.min(1.15,Number($('adArtworkSize')?.value||100)/100)):1;
  const desplazamientoUsuario=ajustable?Number($('adArtworkOffset')?.value||0)/p:0;
  const parrafo=(st,t,al,ls)=>String(t||'').split('\n').map(t=>({al,ls,runs:t?[{...st,t}]:[],blank:st}));
  const P={};
  if(original.intro)P.intro=parrafo(original.intro.st,campos.intro,original.intro.al,original.intro.ls);
  P.title=original.title.L.flatMap((l,i)=>{
   const texto=String(campos['t'+i]||'');
   // La referencia usa Montserrat 700 a 27.744 pt en un lienzo de 612 pt.
   const st={...l.st,s:27.7442*W*72/612};
   const lineas=tituloPrimero&&texto.trim()==='Una Navidad con Nuestra Diáspora'?['Una Navidad con Nuestra','Diáspora']:texto.split('\n');
   return lineas.map(t=>({al:l.al,ls:l.ls,runs:t?[{...st,t}]:[],blank:st}));
  });
  P.det=original.det.items.filter(it=>it.k!=='sp'&&String(campos[it.k]||'').trim()).flatMap(it=>
   String(campos[it.k]).split('\n').map((t,i)=>({al:it.al,ls:it.ls,blank:it.st,runs:t?
    (i===0&&it.lab?[{...it.lab.st,t:it.lab.t},{...it.st,t}]:[{...it.st,t}]):[]})));
  if(original.info)P.info=parrafo(original.info.st,campos.info,original.info.al,original.info.ls);
  const orden=original.art[0][0]<original.title.box.y?
   ['art',...original.ord]:['title','art',...original.ord.filter(n=>n!=='title')];
  const baseArt=Math.min(escalaUsuario*(v.historia?1.12:1),W*p*.85/medidas.width);
  function planificar(tam,escalaArte,separacion){
   const items=[];
   for(const n of orden){
    if(n==='art'){items.push({n,h:medidas.height*escalaArte/p});continue;}
    if(!adHas(P[n]))continue;
    const b={...original[n].box,an:'t'};
    // Ancho de la caja del título en las cuatro diapositivas: 68.79% del lienzo.
    if(n==='title'){b.w=W*.6879;b.x=(W-b.w)/2;b.lf=1.10;}
    const r=adLay(g,b,P[n],p,tam);
    items.push({n,b,r,h:r.H/p+b.in[1]+b.in[3]});
   }
   return {items,tam,escalaArte,separacion,total:items.reduce((a,o)=>a+o.h,0)+Math.max(0,items.length-1)*separacion};
  }
  let plan=planificar(v.historia?1.08:1,baseArt,v.historia?.55:.36);
  // Antes de reducir la tipografía, compactar los espacios y ajustar la
  // ilustración sin deformarla. Conservar la jerarquía de cada plantilla.
  if(plan.total>alto)plan=planificar(plan.tam,plan.escalaArte,.24);
  if(plan.total>alto){
   const exceso=plan.total-alto;
   const escala=Math.max(baseArt*.68,plan.escalaArte-exceso*p/medidas.height);
   plan=planificar(plan.tam,escala,.24);
  }
  while(plan.total>alto+.001&&plan.tam>.78)
   plan=planificar(Math.max(.78,plan.tam-.04),plan.escalaArte,.22);
  c.desbordeEditorial=plan.total>alto+.001;
  const extra=Math.max(0,alto-plan.total);
  const hueco=plan.separacion+Math.min(v.historia?.70:.24,extra/Math.max(1,plan.items.length-1));
  const total=plan.total+(hueco-plan.separacion)*Math.max(0,plan.items.length-1);
  // Fijar el encabezado al margen de referencia. Los datos opcionales no deben
  // empujar el título hacia abajo ni separar la firma del contenido.
  let y=conApoyo?inicio+Math.max(0,(alto-total)/2):inicio,artBounds=null;
  const blocks=[];
  g.fillStyle=original.bgc;g.fillRect(0,0,W*p,H*p);
  g.save();g.beginPath();g.rect(0,inicio*p,W*p,alto*p);g.clip();
  for(let i=0;i<plan.items.length;i++){
   const o=plan.items[i];
   if(o.n==='art'){
    // El desplazamiento manual queda limitado al espacio libre inmediato.
    const offset=Math.max(-hueco*.32,Math.min(hueco*.32,desplazamientoUsuario));
    const centro=(y+o.h/2+offset)*p;
    const dx=W*p/2-medidas.cx,dy=centro-medidas.cy;
    adPaintArtwork(g,ilustracion,original.imageTransforms,dy,dx,plan.escalaArte);
    artBounds={minY:centro/p-o.h/2,maxY:centro/p+o.h/2};
   }else{
    const b={...o.b,y,h:o.h};
    adDraw(g,b,o.r,p,0);
    blocks.push({n:o.n,y0:y,y1:y+o.h,x:o.b.x,w:o.b.w,lineas:o.r.out.length});
    const siguiente=plan.items[i+1];
    const sep=original.seps.find(s=>s.after===o.n);
    if(sep&&siguiente&&siguiente.n!=='art'){
     g.strokeStyle=sep.c;g.lineWidth=sep.w;g.beginPath();
     g.moveTo(sep.x1*p,(y+o.h+hueco/2)*p);
     g.lineTo(sep.x2*p,(y+o.h+hueco/2)*p);g.stroke();
    }
   }
   y+=o.h+hueco;
  }
  g.restore();
  dibujarLogoInstitucional(g,logosInstitucionales[original.lg.s],firma.x*p,firma.y*p,firma.w*p,firma.h*p);
  const rects=conApoyo?navidadDistribuirLogos(colaboradores,zona):[];
  if(rotulo)rotuloColaboracionAdaptable(g,rotulo,{x:etiqueta.x*p,y:etiqueta.y*p,
   ancho:etiqueta.w*p,alto:etiqueta.h*p,tamano:original.lab.st.s,
   familia:'"AD Montserrat","Montserrat",sans-serif',peso:400,color:original.lab.st.c,alineacion:'left'});
  rects.forEach(o=>g.drawImage(colaboradores[o.i],o.x*p,o.y*p,o.w*p,o.h*p));
  window.__adDbg={D:0,top:!conApoyo,art:artBounds?[[artBounds.minY,artBounds.maxY]]:[],
   mre:firma,lab:rotulo?{y0:etiqueta.y,y1:etiqueta.y+etiqueta.h}:null,zone:conApoyo?zona:null,
   logoRects:rects,globalShiftY:0,logoShiftY:0,artBounds,blocks,artScale:plan.escalaArte,
   contenido:{inicio,fin},zs:[]};
  return c;
 }
 drawAD=function(K,banda,datos){
  return datos.v.navidad?dibujarNavidad(K,banda,datos):dibujarActividad(K,banda,datos);
 };
})();


/* Exterior 1.0.51 — experiencia web. La APK conserva su interfaz nativa. */
(function(){
 'use strict';
 const root=document.documentElement;
 if(root.classList.contains('exterior-native')||window.Capacitor?.isNativePlatform?.())return;
 const el=id=>document.getElementById(id);
 const stage=el('osStage'),map=el('mapaGenerador'),layout=document.querySelector('.exterior-layout'),
  editor=document.querySelector('.exterior-editor'),out=el('out'),familyList=el('osFamilyList'),
  homeInput=el('osHomeSearch'),homeForm=el('osHomeSearchForm');
 if(!stage||!map||!layout||!editor||!out||!familyList||!homeInput||!homeForm)return;
 root.classList.add('exterior-web51');
 const mobile=matchMedia('(max-width:760px), (hover:none) and (pointer:coarse)');
 const make=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;};
 const button=(label,fn,cls)=>{const n=make('button',cls,label);n.type='button';n.addEventListener('click',fn);return n;};
 const visible=n=>!!n&&n.getClientRects().length>0;
 const inEditor=()=>stage.hidden&&map.hidden&&!layout.hidden;
 const fold=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es');
 const paths={inicio:'M3 11 12 3l9 8v10h-6v-7H9v7H3Z',buscar:'M21 21l-6-6M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z',crear:'M12 5v14M5 12h14',editar:'m4 16 12-12 4 4L8 20H4Zm10-10 4 4',ajustes:'M4 7h16M4 12h16M4 17h16M8 5v4m8 1v4m-6 1v4',aviso:'M3 10v4h4l10 5V5L7 10Zm4 4 2 6',sede:'M3 21h18M5 21V8l7-4 7 4v13M10 21v-5h4v5M8 10h2m4 0h2',consular:'M4 5h16v14H4Zm5 7h6m-3-3v6',documento:'M6 3h9l3 3v15H6Zm3 8h6m-6 4h6'};
 function icon(key){const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),p=document.createElementNS(ns,'path');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');p.setAttribute('d',paths[key]||paths.documento);p.setAttribute('fill','none');p.setAttribute('stroke','currentColor');p.setAttribute('stroke-width','1.7');p.setAttribute('stroke-linejoin','round');p.setAttribute('stroke-linecap','round');svg.append(p);return svg;}
 const clickFamily=id=>familyList.querySelector('[data-os-family="'+id+'"]')?.click();
 const goCatalog=()=>stage.querySelector('[data-os-action="map"]').click();
 const guide=stage.querySelector('.ux-home-guide');
 const prefKey='exterior.web.preferences.v1',historyKey='exterior.web.recent-searches.v1';
 const prefs={history:true,motion:!matchMedia('(prefers-reduced-motion:reduce)').matches,guide:true};
 const tidy=s=>String(s||'').trim().replace(/\s+/g,' ').slice(0,120);
 let recent=[];
 try{const p=JSON.parse(localStorage.getItem(prefKey)||'{}');for(const k of Object.keys(prefs))if(typeof p[k]==='boolean')prefs[k]=p[k];const r=JSON.parse(localStorage.getItem(historyKey)||'[]');if(Array.isArray(r))recent=r.filter(s=>typeof s==='string'&&tidy(s)).map(tidy).filter((s,i,a)=>a.findIndex(x=>fold(x)===fold(s))===i).slice(0,20);}catch(_){}
 if(!prefs.history)recent=[];
 function persist(){try{localStorage.setItem(prefKey,JSON.stringify(prefs));if(prefs.history)localStorage.setItem(historyKey,JSON.stringify(recent));else localStorage.removeItem(historyKey);}catch(_){}}
 function applyPrefs(){root.classList.toggle('web51-reduced-motion',!prefs.motion);if(guide)guide.hidden=!prefs.guide;}
 const recentPanel=make('section','web51-recent');recentPanel.hidden=true;recentPanel.setAttribute('aria-label','Búsquedas recientes');
 homeForm.after(recentPanel);
 function renderRecent(){
  recentPanel.replaceChildren();recentPanel.hidden=!prefs.history||!recent.length||!!homeInput.value.trim()||stage.hidden||document.activeElement!==homeInput&&!recentPanel.contains(document.activeElement);
  if(recentPanel.hidden)return;
  recentPanel.append(make('h3','','Búsquedas recientes'));
  for(const q of recent.slice(0,6)){
   const row=make('div','web51-recent-row');
   const search=button(q,()=>{homeInput.value=q;homeInput.dispatchEvent(new Event('input',{bubbles:true}));homeInput.focus();});
   const del=button('×',()=>{recent=recent.filter(x=>fold(x)!==fold(q));persist();renderRecent();});
   del.setAttribute('aria-label','Eliminar búsqueda '+q);row.append(search,del);recentPanel.append(row);
  }
 }
 function remember(){const q=tidy(homeInput.value);if(!q||!prefs.history)return;recent=[q,...recent.filter(x=>fold(x)!==fold(q))].slice(0,20);persist();}
 homeForm.addEventListener('submit',remember,true);
 el('osHomeSearchResults')?.addEventListener('click',e=>{if(e.target.closest('button'))remember();},true);
 homeInput.addEventListener('input',renderRecent);
 homeInput.addEventListener('focus',renderRecent);
 homeInput.addEventListener('blur',()=>setTimeout(renderRecent,160));
 const quick=make('section','web51-quick');quick.append(make('h2','','Accesos rápidos'));
 const quickGrid=make('div','web51-quick-grid');
 for(const [id,label,key] of [['avisos','Avisos','aviso'],['sede','Artes para sede','sede'],['atencion-consular','Atención consular','consular'],['prensa','Comunicados','documento']]){
  const b=button(label,()=>clickFamily(id),'web51-quick-button');b.dataset.webQuick=id;b.prepend(icon(key));quickGrid.append(b);
 }
 quick.append(quickGrid);stage.querySelector('.os-stage-hero').append(quick);
 // En móvil mostrar un único catálogo visual en Inicio, sin duplicar sus accesos.
 const directory=stage.querySelector('.os-stage-directory');
 // Conservar el rótulo original «Tipos de arte».
 // Reutilizar los datos existentes de navegación; no guardar contenido de formularios.
 let saved=null,homeScroll=0;
 function rememberEditor(){if(inEditor())saved={top:window.scrollY,left:window.scrollX};}
 function home(){if(stage.hidden){rememberEditor();el('osHomeHeader')?.click();requestAnimationFrame(()=>{if(mobile.matches)window.scrollTo(0,homeScroll);else stage.scrollTop=homeScroll;});}}
 function search(){home();requestAnimationFrame(()=>homeInput.focus());}
 function resume(){
  if(!stage.hidden&&el('osContinue')&&!el('osContinue').hidden)el('osContinue').click();
  else if(!map.hidden&&!el('cerrarMapa')?.hidden)el('cerrarMapa').click();
  if(saved&&inEditor()){const pos=saved;saved=null;requestAnimationFrame(()=>window.scrollTo({top:pos.top,left:pos.left,behavior:'instant'}));}
  else if(inEditor())el('uxEdit')?.click();
 }
 const settings=make('dialog','web51-dialog web51-settings');
 settings.setAttribute('aria-label','Ajustes de Exterior');
 const sh=make('header','web51-dialog-head');sh.append(make('h2','','Ajustes'),button('Cerrar',()=>settings.close()));
 settings.append(sh);
 const prefsBody=make('div','web51-settings-body');
 for(const [key,label,desc] of [['motion','Animaciones de navegación','Activar transiciones de la interfaz.'],['guide','Guía en Inicio','Mostrar la guía de uso.'],['history','Guardar búsquedas recientes','Conservar consultas en este navegador. Desactivar elimina el historial.']]){
  const lab=make('label','web51-pref'),words=make('span');words.append(make('strong','',label),make('small','',desc));
  const check=make('input');check.type='checkbox';check.checked=prefs[key];check.dataset.webPref=key;
  check.addEventListener('change',()=>{prefs[key]=check.checked;if(key==='history'&&!check.checked)recent=[];persist();applyPrefs();renderRecent();});
  lab.append(words,check);prefsBody.append(lab);
 }
 prefsBody.append(button('Borrar historial de búsqueda',()=>{recent=[];persist();renderRecent();status.textContent='Historial eliminado.';}));
 const status=make('p','web51-status');status.setAttribute('role','status');prefsBody.append(status);
 const about=make('section','web51-about');about.append(make('h3','','Acerca de Exterior'),make('p','','Versión web 1.0.51'),make('p','','Ministerio de Relaciones Exteriores'),make('h3','','Novedades'),make('p','','Accesos rápidos, buscador con historial opcional, herramientas por apartados y vista previa ampliada.'));
 prefsBody.append(about);settings.append(prefsBody);document.body.append(settings);
 function openSettings(){if(!settings.open)settings.showModal();}
 const nav=make('nav','web51-nav');nav.setAttribute('aria-label','Navegación principal');
 for(const [key,label,action] of [['inicio','Inicio',home],['buscar','Buscar',search],['crear','Crear',()=>{rememberEditor();goCatalog();}],['editar','Editar',resume],['ajustes','Ajustes',openSettings]]){
  const b=button(label,action);b.dataset.webNav=key;b.prepend(icon(key));nav.append(b);
 }
 document.body.append(nav);
 const desktopSettings=button('Ajustes',openSettings,'web51-desktop-settings');stage.querySelector('.os-stage-toolbar').append(desktopSettings);
 const workSettings=button('Ajustes',openSettings,'web51-desktop-settings');document.querySelector('.exterior-cabecera')?.append(workSettings);
 stage.addEventListener('click',()=>{if(!stage.hidden)homeScroll=mobile.matches?window.scrollY:stage.scrollTop;},true);
 el('osHomeHeader')?.addEventListener('click',rememberEditor,true);
 el('osContinue')?.addEventListener('click',()=>{if(saved){const pos=saved;saved=null;requestAnimationFrame(()=>{if(inEditor())window.scrollTo({top:pos.top,left:pos.left,behavior:'instant'});});}},true);
 // Herramientas contextuales: anclar a los controles reales; permitir volver
 // a todas las opciones, sin mover inputs, formularios, eventos ni lienzos.
 const tools=make('section','web51-tools');tools.hidden=true;tools.setAttribute('aria-label','Herramientas de edición');
 tools.append(make('h3','','Herramientas de edición'));
 const toolGrid=make('div','web51-tools-grid');tools.append(toolGrid);
 const all=button('Todas las opciones',()=>{selection='';applyToolFilter();},'web51-all-tools');tools.append(all);
 editor.querySelector('.exterior-editor-top')?.after(tools);
 const labels={info:'Información',representation:'Representación',time:'Fecha y horario',photo:'Fotografía e ilustración',directory:'Directorio y contactos',logos:'Logotipos',appearance:'Formato',import:'Importar contenido',activities:'Actividades',extra:'Más opciones'};
 function classify(s){
  s=fold(s);
  if(/pegar desde|importar|importacion/.test(s))return 'import';
  if(/representacion|membrete/.test(s))return 'representation';
  if(/logo|colaborador|entidad.*apoyo/.test(s))return 'logos';
  if(/fotograf|encuadre|ilustracion|imagen|portada/.test(s))return 'photo';
  if(/directorio|ubicacion|direccion|lugar|contact|oficina|sedes/.test(s))return 'directory';
  if(/fecha|horario|\bhora\b|dias de atencion/.test(s))return 'time';
  if(/formato|color|paleta|variante|calidad|diseno|selector/.test(s))return 'appearance';
  if(/actividad|agenda|eventos/.test(s))return 'activities';
  if(/titulo|contenido|texto|informacion|introduccion|convocatoria|subtitulo/.test(s))return 'info';
  return '';
 }
 function regionalPalette(){return el('m').value==='sede'&&el('sedeDiseno')?.value==='oficinas'&&!el('sedePanelColores')?.hidden;}
 let groups=new Map(),blocks=[],selection='',context='',signature='';
 const originalVisible=n=>{for(let p=n;p&&p!==editor;p=p.parentElement)if(p.hidden||p.style.display==='none')return false;return true;};
 function applyToolFilter(){
  for(const b of blocks)b.classList.toggle('web51-tool-filtered',mobile.matches&&!!selection&&!groups.get(selection)?.blocks.has(b));
  for(const b of toolGrid.children)b.setAttribute('aria-pressed',String(b.dataset.webTool===selection));
  all.hidden=!selection;
 }
 function selectTool(key){
  const item=groups.get(key);if(!item)return;selection=key;applyToolFilter();
  const target=item.target;
  if(target.matches('details'))target.open=true;
  for(let d=target.closest('details');d;d=d.parentElement?.closest('details'))d.open=true;
  requestAnimationFrame(()=>{if(visible(target))target.scrollIntoView({block:'center',behavior:'instant'});});
 }
 function syncTools(){
  const family=inEditor()?['dui','dse','ad','mov','sede','proy'].map(el).find(n=>n&&originalVisible(n)):null;
  const newContext=family?el('m').value+'|'+(el('sedeDiseno')?.value||'')+'|'+(el('adT')?.value||''):'';
  if(context!==newContext){selection='';context=newContext;}
  for(const b of blocks)b.classList.remove('web51-tool-filtered');
  groups=new Map();blocks=[];
  if(!family){tools.hidden=true;signature='';return;}
  const parent=family.id==='mov'&&el('movf')?el('movf'):family.id==='proy'?family.querySelector('.proy-editor-col'):family;
  if(!parent){tools.hidden=true;return;}
  blocks=[...parent.children].filter(n=>!n.matches('input,select,script,style')&&originalVisible(n)&&(n.matches('button,details')||n.querySelector('input:not([type=hidden]),select,textarea,button,details')||n.id==='locs'));
  const add=(key,block,target)=>{if(!groups.has(key))groups.set(key,{blocks:new Set(),target});groups.get(key).blocks.add(block);};
  for(const b of blocks){
   const key=b.id==='sedeSelector'||b.id==='adConfiguracion'?'appearance':b.id==='locs'?'directory':classify((b.querySelector('h3,summary,b,strong')?.textContent||'')+' '+b.id)||classify(b.querySelector('label')?.textContent)||'info';
   add(key,b,b);
   for(const n of b.querySelectorAll('label,summary,legend')){if(!originalVisible(n))continue;const k=classify(n.textContent);if(k)add(k,b,n);}
  }
  if(selection&&!groups.has(selection))selection='';
  const keys=Object.keys(labels).filter(k=>groups.has(k));const next=keys.join(',')+'|'+regionalPalette();
  if(next!==signature){signature=next;toolGrid.replaceChildren();for(const k of keys){const b=button(k==='appearance'&&regionalPalette()?'Formato y colores':labels[k],()=>selectTool(k));b.dataset.webTool=k;toolGrid.append(b);}}
  tools.hidden=!keys.length;applyToolFilter();
 }
 // Vista previa de las imágenes existentes. No redibujar ni duplicar el motor.
 const preview=make('section','web51-preview-tools');preview.hidden=true;
 const viewer=make('dialog','web51-dialog web51-viewer');viewer.setAttribute('aria-label','Vista previa ampliada');
 const vh=make('header','web51-dialog-head'),count=make('span');vh.append(make('h2','','Vista previa'),count,button('Cerrar',()=>viewer.close()));
 const image=make('img');image.alt='';const canvas=make('div','web51-viewer-stage');canvas.append(image);
 const vf=make('footer','web51-viewer-actions');
 let arts=[],index=0,touch=null;
 const prev=button('Anterior',()=>show(index-1)),next=button('Siguiente',()=>show(index+1));
 vf.append(prev,button('Editar',()=>{viewer.close();el('uxEdit')?.click();}),next);viewer.append(vh,canvas,vf);document.body.append(viewer);
 function available(){return [...out.querySelectorAll('figure img')].filter(n=>n.complete&&n.naturalWidth>0);}
 function show(i){if(i<0||i>=arts.length)return;index=i;image.src=arts[i].currentSrc||arts[i].src;image.alt=arts[i].alt||'Arte '+(i+1);count.textContent=(i+1)+' / '+arts.length;prev.disabled=i===0;next.disabled=i===arts.length-1;}
 const expand=button('Ver a pantalla completa',()=>{arts=available();if(!arts.length||viewer.open)return;show(0);viewer.showModal();});
 viewer.addEventListener('close',()=>{image.removeAttribute('src');arts=[];touch=null;});
 viewer.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();show(index+(e.key==='ArrowLeft'?-1:1));}});
 canvas.addEventListener('touchstart',e=>{touch=e.touches.length===1?{x:e.touches[0].clientX,y:e.touches[0].clientY}:null;},{passive:true});
 canvas.addEventListener('touchend',e=>{if(!touch||e.changedTouches.length!==1){touch=null;return;}const dx=e.changedTouches[0].clientX-touch.x,dy=e.changedTouches[0].clientY-touch.y;touch=null;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.5)show(index+(dx<0?1:-1));},{passive:true});
 const randomOriginal=el('sedePaletaAleatoria'),undoOriginal=el('sedePaletaDeshacer');
 const palette=make('div','web51-palette');
 let stopScroll=null;
 function paletteAction(target){
  if(!target||target.disabled)return;
  stopScroll?.();
  const scroll=document.scrollingElement,top=scroll.scrollTop,left=scroll.scrollLeft;
  const previous=out.style.minHeight;out.style.minHeight=Math.ceil(out.getBoundingClientRect().height)+'px';
  let frame=0,start=performance.now(),closed=false;
  function cleanup(){if(closed)return;closed=true;cancelAnimationFrame(frame);out.style.minHeight=previous;for(const ev of ['wheel','touchstart','pointerdown','keydown'])document.removeEventListener(ev,interrupt,true);stopScroll=null;}
  function interrupt(e){if(palette.contains(e.target))return;cleanup();}
  function tick(now){if(closed)return;scroll.scrollTo({top,left,behavior:'instant'});if(!inEditor()||now-start>15000||(now-start>600&&out.getAttribute('aria-busy')!=='true'&&available().length)){cleanup();return;}frame=requestAnimationFrame(tick);}
  stopScroll=cleanup;for(const ev of ['wheel','touchstart','pointerdown','keydown'])document.addEventListener(ev,interrupt,{capture:true,passive:true});
  try{target.click();frame=requestAnimationFrame(tick);}catch(e){cleanup();throw e;}
 }
 const random=button('Colores aleatorios',()=>paletteAction(randomOriginal)),undo=button('Deshacer',()=>paletteAction(undoOriginal));
 palette.append(random,undo);preview.append(expand,palette);out.before(preview);
 function syncPreview(){
  const has=inEditor()&&el('m').value!=='proy'&&available().length>0;
  preview.hidden=!has;expand.disabled=!has||out.getAttribute('aria-busy')==='true';
  const can=has&&regionalPalette()&&!randomOriginal?.hidden;
  palette.hidden=!can;random.disabled=!can||randomOriginal?.disabled||out.getAttribute('aria-busy')==='true';undo.disabled=!can||undoOriginal?.hidden||undoOriginal?.disabled||out.getAttribute('aria-busy')==='true';
 }
 function syncNav(){
  const active=!stage.hidden?'inicio':!map.hidden?'crear':'editar';
  for(const b of nav.children){if(b.dataset.webNav===active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');b.disabled=b.dataset.webNav==='editar'&&(!inEditor()&&(el('osContinue')?.hidden??true)&&(!stage.hidden||el('cerrarMapa')?.hidden));}
  root.classList.toggle('web51-editing',inEditor());root.classList.toggle('web51-home',!stage.hidden);renderRecent();
 }
 let scheduled=0;
 function schedule(){if(scheduled)return;scheduled=requestAnimationFrame(()=>{scheduled=0;syncNav();syncTools();syncPreview();});}
 const observer=new MutationObserver(schedule);
 for(const n of [stage,map,layout,el('osContinue'),el('cerrarMapa'),randomOriginal,undoOriginal,el('sedePanelColores')])if(n)observer.observe(n,{attributes:true,attributeFilter:['hidden','disabled']});
 for(const id of ['dui','dse','ad','mov','sede','proy']){const n=el(id);if(n)observer.observe(n,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});}
 new MutationObserver(syncPreview).observe(out,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-busy','src']});
 out.addEventListener('load',syncPreview,true);
 document.addEventListener('change',schedule);mobile.addEventListener('change',()=>{selection='';schedule();});
 root.classList.toggle('web51-home',!stage.hidden);
 applyPrefs();schedule();
})();
