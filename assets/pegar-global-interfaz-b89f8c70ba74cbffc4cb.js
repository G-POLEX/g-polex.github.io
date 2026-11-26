(function(){
'use strict';
const api=window.exteriorRecomendarArte,$=id=>document.getElementById(id);
if(!api||typeof catalogoPlantillas!=='object'||typeof familiasExterior!=='object')return;
const entries=api.entries(catalogoPlantillas);
const stdAD={titulo:'#adf_t0',subtitulo:'#adf_t1',fecha:'#adf_fecha',hora:'#adf_hora',lugar:'#adf_lugar',entrada:'#adf_intro',nota:'#adf_info'};
const maps={
 prensa:{titulo:'#editorial-sede-titulo',cuerpo:'#editorial-sede-cuerpo',fecha:'#editorial-sede-fecha',representacion:'#editorial-sede-repre1'},
 sede:{titulo:'#sede-titulo',subtitulo:'#sede-subtitulo',hora:'#sede-horario',dias:'#sede-dias',nota:'#sede-nota'},
 'atencion-consular':{titulo:'#editorial-ad-titulo',fecha:'#editorial-ad-fecha1',hora:'#editorial-ad-hora',lugar:'#editorial-ad-lugar',
  representacion:'#editorial-ad-repre1',nota:'#editorial-ad-info',modalidad:'#editorial-ad-atencion',whatsapp:'#editorial-ad-whatsapp'},
 efemerides:{titulo:'#d2',subtitulo:'#d3',fecha:'#df',hora:'#dh',lugar:'#du',entrada:'#d1'},
 firma:{nombre:'#editorial-sede-nombre',cargo:'#editorial-sede-cargo',correo:'#editorial-sede-correo',telefono:'#editorial-sede-telefono',
  celular:'#editorial-sede-celular',representacion:'#editorial-sede-sede',lugar:'#editorial-sede-direccion'},
 esquelas:{entrada:'#editorial-ad-texto1',nombre:'#editorial-ad-nombre',nota:'#editorial-ad-texto2',fecha:'#editorial-ad-fecha'},
 'otras-instituciones':{titulo:'#t',subtitulo:'#s',pais:'#p',ciudad:'#dui_city_0',fecha:'#dui_date_0',hora:'#dui_time_0',lugar:'#dui_address_0'}
};
const nombres={
  titulo:'titulo,asunto,encabezado,nombre de la actividad',subtitulo:'subtitulo,segunda linea del titulo,segunda linea',
  fecha:'fecha,fecha 1,fecha de emision,lugar y fecha,fecha de la actividad',hora:'hora,horario,horario 1,horario de atencion,horas de atencion',
  lugar:'direccion,lugar,recinto,recinto y direccion,sede de la actividad,direccion o sitio web',
  representacion:'representacion,sede o representacion,consulado',entrada:'entrada,introduccion,texto introductorio,linea superior',
  cuerpo:'cuerpo,texto,mensaje',nota:'nota,mas informacion,informacion adicional,mensaje complementario,nota del horario',
  correo:'correo,correo electronico,correo institucional,email',telefono:'telefono,telefono institucional',celular:'celular',whatsapp:'whatsapp',
  dias:'dias,dias de atencion',nombre:'nombre,nombre completo,nombre de la persona fallecida',cargo:'cargo',pais:'pais',ciudad:'ciudad',modalidad:'modalidad,modalidad de atencion'
};
const aliases=Object.fromEntries(Object.entries(nombres).flatMap(([k,s])=>s.split(',').map(n=>[n,k])));
const esPrensa=x=>x.ruta==='prensa';
const el=(tag,t,cls)=>{const e=document.createElement(tag);if(t)e.textContent=t;if(cls)e.className=cls;return e;};
const btn=(t,fn,cls='g')=>{const b=el('button',t,cls);b.type='button';b.addEventListener('click',fn);return b;};
const label=(t,n)=>{const a=el('label',t);a.append(n);return a;};
const q=(s)=>document.querySelector('.exterior-layout '+s);
const visibleField=n=>n&&n.isConnected&&!n.disabled&&!n.readOnly&&['text','textarea','email','url','tel','search'].includes(n.type)&&
 !n.closest('[hidden]');
function set(f,value){f.value=value;f.dispatchEvent(new Event('input',{bubbles:true}));}
function textoParaMotor(raw){
 // Conservar el original exacto en memoria; no enviar indicaciones de
 // enrutado como si fueran líneas del arte.
 return api.partes(raw).contenido.join('\n').trim();
}
function completarEtiquetas(entry,body){
 const map=entry.id==='firma'?maps.firma:entry.id==='invitacion-interna'||entry.id==='navidad-2026'?stdAD:maps[entry.ruta];
 if(!map)return 0;
 const p=api.partes(body),lines=p.contenido,fields=new Map(),duplicados=new Set();
 let actual='';
 const add=(k,v)=>{
  if(fields.has(k)){duplicados.add(k);fields.delete(k);return;}
  if(!duplicados.has(k))fields.set(k,v);
 };
 let cuerpo=[];
 let cabeceraPrensa=esPrensa(entry)&&/^(comunicado de prensa|convocatoria (?:de prensa|a medios))$/u.test(api.norm(p.etiquetas[0]?.t));
 for(const [i,raw] of lines.entries()){
  const v=raw.trim(),l=v.replace(/^#{1,6}\s+/,'').replace(/^\s*(?:\*\*|__)(.*)(?:\*\*|__)\s*$/,'$1');
  if(!v){if(actual==='cuerpo'&&!duplicados.has(actual))fields.set(actual,(fields.get(actual)||'')+'\n');else if(esPrensa(entry)&&cuerpo.length)cuerpo.push('');continue;}
  if(cabeceraPrensa&&api.norm(l)===api.norm(p.etiquetas[0]?.t)){cabeceraPrensa=false;continue;}
  const m=/^([^:\n]{2,30}):\s*(.*)$/u.exec(l),n=m&&aliases[api.norm(m[1])];
  const datoEsFecha=/^(?:lunes|martes|miércoles|jueves|viernes|sábado|domingo)\s+\d{1,2}\s+de\s+\p{L}+(?:\s+de\s+\d{4})?$/iu.test(l);
  const datoEsHora=/^(?:De\s+)?\d{1,2}:\d{2}(?:\s*[ap]\.?\s*m\.?)?(?:\s+a\s+\d{1,2}:\d{2}(?:\s*[ap]\.?\s*m\.?)?)?$/iu.test(l);
  if(n&&map[n]){actual=n;add(n,m[2]);continue;}
  if((datoEsFecha||datoEsHora)&&!esPrensa(entry)&&map[datoEsFecha?'fecha':'hora']){
   actual='';add(datoEsFecha?'fecha':'hora',l);continue;
  }
  if((/^#{1,6}\s+/u.test(v)||/^\*\*.+\*\*$/u.test(v))&&map.titulo&&!fields.has('titulo')){
   actual='';add('titulo',l);continue;
  }
  if(actual==='cuerpo'&&fields.has(actual)){fields.set(actual,fields.get(actual)+'\n'+raw);continue;}
  actual='';
  if(esPrensa(entry))cuerpo.push(raw);
 }
 if(esPrensa(entry)&&!fields.has('cuerpo')&&cuerpo.some(s=>s.trim()))add('cuerpo',cuerpo.join('\n').trim());
 let applied=0;
 for(const [k,value] of fields){
  const f=q(map[k]),v=value.trim();
  if(!visibleField(f)||!v||v.length>12000||(f.maxLength>=0&&v.length>f.maxLength)||(f.type!=='textarea'&&/[\n\r]/u.test(v)))continue;
  // Ningún campo previamente editado se reemplaza en esta ruta.
  const regional=entry.ruta==='sede'&&f.id.startsWith('sede-')&&typeof seleccionSede==='function'
   ?seleccionSede()?.plantilla?.campos?.find(([id])=>'sede-'+id===f.id)?.[2]:undefined;
  if(f.value.trim()&&f.value!==f.defaultValue&&f.value!==regional&&f.value!==v)continue;
  if(f.value===v){applied++;continue;}
  const probe=f.cloneNode(false);probe.value=v;if(probe.value!==v)continue;
  set(f,v);applied++;
 }
 return applied;
}
function abrirAncestros(f){for(let d=f?.closest('details');d;d=d.parentElement?.closest('details'))d.open=true;}
function especializado(entry,raw){
 const ids=entry.ruta==='avisos'?['avisoTextoBase']:entry.ruta==='mov'?['mvPegado','mvAplicarPegado']:
 entry.ruta==='atencion-consular'&&entry.id==='mixta'?['sedeTextoCartelera']:entry.id==='el-salvador-mas'?['svpTextoPegado']:
 entry.id==='proyeccion'?['proyRaw','proyImportBtn']:null;
 if(!ids)return false;
 const f=$(ids[0]);if(!f?.isConnected||f.disabled||f.readOnly)return false;
 const b=ids[1]?$(ids[1]):(f.closest('#ag-texto')?.querySelector('.ag-primario')||f.closest('details')?.querySelector('button[type=button]'));
 if(!b?.isConnected)return false;
 abrirAncestros(f);
 const texto=entry.ruta==='mov'?raw.replace(/^(?:#{1,6}\s+)?\s*(?:\*\*)?Programa de Movilidad Laboral(?:\*\*)?[ \t]*\n+\s*/iu,''):raw;
 set(f,texto||raw);
 if(b.disabled)return false;
 b.click();return true;
}
const editor=document.querySelector('.exterior-layout'), header=editor?.querySelector('.exterior-editor-top');
const stage=$('osStage'),actions=stage?.querySelector('.os-stage-actions');
if(!editor||!header||!actions)return;
const dialog=el('dialog','', 'exterior-pegado-global');
dialog.id='exteriorPegarDialogo';dialog.setAttribute('aria-labelledby','exteriorPegarTitulo');
const cab=el('header');const h=el('h2','Pegar texto');h.id='exteriorPegarTitulo';
cab.append(h,btn('Cerrar',()=>dialog.close()));
const nativo=document.documentElement.classList.contains('exterior-native');
const intro=el('p','Pegue el texto tal como lo recibió. Exterior buscará una plantilla en este dispositivo.');
const area=el('textarea');area.rows=6;area.id='exteriorPegarTexto';
area.placeholder='Ej.: Te invitamos a una jornada de salud este sábado en el Centro Cultural.';
const status=el('p','','field-help');status.role='status';
const group=el('section');group.hidden=true;
const opts=el('select');opts.id='exteriorPegarTipo';
const variantes=el('select');variantes.id='exteriorPegarVariante';
const selVar=label('Variante',variantes);
const use=btn('Abrir diseño',abrir,'b');use.disabled=true;
const check=btn('Sugerir plantilla',revisar,'b');
area.addEventListener('keydown',event=>{
 if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)&&!event.isComposing){
  event.preventDefault();check.click();
 }
});
const limpiar=btn('Borrar texto',()=>{
 area.value='';source.value='';sourceStatus.textContent='';sourceBox.hidden=true;
 invalidate();area.focus();
});
const orientacion=el('div','','ext-arte-orientacion');
orientacion.hidden=true;
const seleccion=el('p','','ext-arte-seleccion');
seleccion.hidden=true;
const selectorPlantilla=el('details','','ext-arte-selector');
const selectorRotulo=el('summary','Cambiar plantilla');
selectorPlantilla.append(selectorRotulo,label('Tipo de arte',opts),selVar);
group.append(orientacion,seleccion,use,selectorPlantilla);
dialog.append(cab,intro,label('Texto base',area),check,limpiar,status,group);
document.body.append(dialog);
const ayudaOrtografia=el('small','Toque una palabra subrayada para revisar la sugerencia.','field-help');
montarRevisionOrtografica(dialog,ayudaOrtografia);
dialog.addEventListener('close',()=>{
 const panel=dialog.querySelector('.prensa-sugerencias');
 if(panel?.matches(':popover-open'))panel.hidePopover();
});
area.addEventListener('paste',()=>setTimeout(()=>{if(dialog.open)revisar(false);},0));
area.addEventListener('exterior-correccion-aceptada',()=>{if(dialog.open)revisar(false);});
const open=()=>{if(!dialog.open){dialog.showModal();area.focus();}};
const inicio=btn('Pegar texto',open,'os-stage-action');
inicio.id='exteriorPegarInicio';
inicio.setAttribute('aria-haspopup','dialog');
inicio.setAttribute('aria-controls',dialog.id);
if(nativo){
 // «Comunicados» ya encabeza los accesos rápidos nativos. La acción
 // de componer va aparte y reutiliza el lápiz de Edición.
 inicio.className='and-home-paste';
 const lapiz=document.querySelector('[data-and-nav="editar"] svg')?.cloneNode(true);
 if(lapiz){lapiz.setAttribute('aria-hidden','true');inicio.prepend(lapiz);}
 stage.append(inicio);
 const retroceso=window.exteriorAndroidBack;
 window.exteriorAndroidBack=function(...args){
  if(dialog.open){dialog.close();return;}
  return retroceso?.apply(this,args);
 };
}else{
 inicio.className='os-stage-action web-home-paste';
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
 svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');
 svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');svg.setAttribute('stroke-width','1.75');
 const path=document.createElementNS(svg.namespaceURI,'path');
 path.setAttribute('d','M12 20H4v-8l10-10 8 8-10 10zM12 4l8 8');
 svg.append(path);inicio.prepend(svg);
 const explorar=actions.querySelector('[data-os-action="map"]');
 if(explorar)explorar.after(inicio);
 else actions.append(inicio);
}
// One stationary, local tip on Home. It is not a notification.
const consejosInicio=[
 ['editar','Pegue el texto tal como lo recibió. No necesita escribir «Título:» ni «Fecha:».'],
 ['editar','Si tiene una fecha y un horario en líneas distintas, consérvelos al pegar el texto.'],
 ['lista','Si aparecen varias plantillas sugeridas, elija la que se ajuste a su actividad.'],
 ['lista','Si falta un dato, revise el aviso de la vista previa. Puede descargar un arte que ya se pueda generar.'],
 ['lupa','Amplíe la vista previa para comprobar los números de contacto antes de descargar.'],
 ['lupa','Revise cómo quedó un nombre de lugar si ocupa más de una línea.'],
 ['formato','Si la plantilla ofrece publicación e historia, revise ambos formatos en la vista previa.'],
 ['formato','En una cartelera, revise el orden de las láminas antes de descargar el conjunto.'],
 ['globo','En Avisos, abra «Contactos». En «Consulado Virtual», escriba el país y seleccione el número.'],
 ['globo','En una jornada individual, escriba el país en «Más información» y seleccione el número del Consulado Virtual.'],
 ['globo','Si el Consulado Virtual no figura en el directorio, puede escribir el número a mano.'],
 ['editar','Toque una palabra subrayada para revisar la sugerencia del corrector.'],
 ['editar','El corrector usa el diccionario de español de El Salvador (RLA-ES 2.9). Funciona sin conexión.'],
 ['editar','Si el corrector marca un nombre propio correcto, elija «Omitir en este campo».'],
 ['documento','Para un comunicado de prensa, empiece en «Comunicados y convocatorias».'],
 ['documento','En Avisos, agregue ubicaciones y contactos solo cuando hagan falta.'],
 ['formato','Si un arte tiene varias páginas, revise si necesita descargar una sola o el conjunto.'],
 ['lupa','Compruebe que las fechas del arte coincidan con el aviso o la convocatoria original.'],
 ['paleta','En la vista previa de Oficinas regionales, pulse «Colores aleatorios» para probar otra combinación.','android'],
 ['paleta','En Oficinas regionales, use «Proponer combinación de colores» para explorar la paleta.','web'],
 ['reciente','¿Necesita ubicar un arte que ya descargó? En Inicio, consulte «Más recientes».','android'],
 ['lupa','En Android, «Ver a pantalla completa» le permite revisar detalles de la vista previa.','android'],
 ['documento','En la vista previa, use «Calidad de imagen (PNG)» para elegir el tamaño de descarga.'],
 ['descarga','Si el diseño tiene varias láminas, busque «Descargar archivo ZIP» en la vista previa.'],
 ['editar','Con el teclado, use Alt + flecha abajo sobre una palabra subrayada para ver correcciones.','web'],
 ['lista','En web, prepare el uso sin conexión antes de trabajar en un lugar con poca señal.','web'],
 ['editar','En Android, use «Continuar edición» para retomar un arte que ya está abierto.','android'],
 ['documento','En Android, abra Descargas/Exterior para localizar los artes exportados.','android']
];
const dibujosConsejo={
 editar:'M12 20H4v-8l10-10 8 8-10 10zM12 4l8 8',
 lupa:'M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6',
 documento:'M6 3h8l4 4v14H6zM14 3v5h4M9 12h6m-6 4h6',
 formato:'M4 5h16v14H4zM12 5v14',
 lista:'M5 7h14M5 12h14M5 17h14',
 globo:'M21 12a9 9 0 1 0-18 0 9 9 0 0 0 18 0ZM3 12h18M12 3c5 5 5 13 0 18m0-18c-5 5-5 13 0 18',
 paleta:'M12 3a9 9 0 1 0 0 18h1.2a2 2 0 0 0 1.5-3.3 1.5 1.5 0 0 1 1.1-2.5H18a3 3 0 0 0 3-3A9 9 0 0 0 12 3Z',
 reciente:'M21 12a9 9 0 1 0-18 0 9 9 0 0 0 18 0ZM12 7v5l3 2',
 descarga:'M12 3v12m-5-5 5 5 5-5M4 21h16'
};
const elegiblesConsejo=consejosInicio.filter(x=>!x[2]||x[2]===(nativo?'android':'web'));
const claveConsejo='exterior.consejos.rotacion.v3';
let historialConsejo=[];
try{
 const guardado=JSON.parse(localStorage.getItem(claveConsejo)||'[]');
 if(Array.isArray(guardado))historialConsejo=guardado.filter(t=>elegiblesConsejo.some(x=>x[1]===t));
}catch(_){}
let disponiblesConsejo=elegiblesConsejo.filter(x=>!historialConsejo.includes(x[1]));
if(!disponiblesConsejo.length){
 historialConsejo=historialConsejo.slice(-1);
 disponiblesConsejo=elegiblesConsejo.filter(x=>!historialConsejo.includes(x[1]));
}
const [iconoConsejo,textoConsejo]=disponiblesConsejo[Math.floor(Math.random()*disponiblesConsejo.length)];
try{localStorage.setItem(claveConsejo,JSON.stringify([...historialConsejo,textoConsejo]));}catch(_){}
const anclaConsejo=nativo?stage.querySelector('.and-first-help'):stage.querySelector('.ux-home-guide');
if(anclaConsejo&&!stage.querySelector('.ext-consejo-inicio')){
 const nota=el('p','','ext-consejo-inicio');
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 for(const [nombre,valor] of Object.entries({viewBox:'0 0 24 24','aria-hidden':'true',fill:'none',stroke:'currentColor','stroke-width':'1.7','stroke-linecap':'round','stroke-linejoin':'round'}))svg.setAttribute(nombre,valor);
 const camino=document.createElementNS(svg.namespaceURI,'path');camino.setAttribute('d',dibujosConsejo[iconoConsejo]);svg.append(camino);
 const texto=el('span');texto.append(el('strong','Consejo'),el('span',textoConsejo));
 nota.append(svg,texto);
 anclaConsejo.after(nota);
 if(!nativo){
  const clave='exterior.web.consejos.v1';
  const control=document.createElement('input');control.type='checkbox';control.setAttribute('role','switch');
  control.checked=true;
  try{control.checked=localStorage.getItem(clave)!=='off';}catch(_){}
  nota.hidden=!control.checked;
  const rotulo=el('label','','ext-consejo-preferencia');
  rotulo.append(control,el('span','Mostrar consejos en Inicio'));
  anclaConsejo.append(rotulo);
  control.addEventListener('change',()=>{
   nota.hidden=!control.checked;
   try{localStorage.setItem(clave,control.checked?'on':'off');}catch(_){}
  });
 }
}

const sourceBox=el('details','','exterior-pegado-original');sourceBox.hidden=true;
const resumen=el('summary','Texto original');
const source=el('textarea');source.rows=4;source.readOnly=true;source.setAttribute('aria-label','Texto original conservado');
const sourceStatus=el('p','','field-help');sourceStatus.role='status';
sourceBox.append(resumen,sourceStatus,source,btn('Volver a elegir diseño',open),btn('Borrar texto',()=>limpiar.click()));
header.after(sourceBox);
let result=null;
function invalidate(){result=null;group.hidden=true;status.textContent='';use.disabled=true;}
area.addEventListener('input',invalidate);
opts.addEventListener('change',()=>cargarVariantes(false));
variantes.addEventListener('change',()=>{use.disabled=!puedeAbrir();actualizarSeleccion();});
function refrescarTipos(list){
 opts.replaceChildren(new Option('Elegir un tipo de arte',''));
 const sugeridas=new Set(list.map(x=>x.key));
 if(sugeridas.size>1){
  const o=el('optgroup');o.label='Opciones detectadas';
  for(const x of entries.filter(x=>sugeridas.has(x.key)))o.append(new Option(x.nombre,x.key));
  opts.append(o);
 }
 for(const [ruta,familia] of Object.entries(familiasExterior)){
  const o=el('optgroup');o.label=familia.nombre;
  for(const x of entries.filter(x=>x.ruta===ruta&&(sugeridas.size<2||!sugeridas.has(x.key))))o.append(new Option(x.nombre,x.key));
  if(o.children.length)opts.append(o);
 }
}
function seleccionado(){return entries.find(x=>x.key===opts.value);}
function actual(){const r=$('m')?.value,id=familiasExterior[r]?.selector?$(familiasExterior[r].selector)?.value:'';return {r,id};}
function visibleEditor(){return editor.getClientRects().length>0&&!stage.getClientRects().length;}
function cargarVariantes(proponer){
 const entry=seleccionado(),p=proponer&&result?.opciones.find(x=>x.key===opts.value);
 let vars=entry?.variantes||[];
 // Si hubo una señal inequívoca de comunicado o convocatoria, sugerir las
 // variantes de ese tipo. Cambiar el tipo de arte devuelve la lista íntegra.
 if(p?.grupo)vars=vars.filter(v=>v.id.startsWith('ucom-'+p.grupo)||(p.grupo==='comunicado'&&v.id==='ucom-largo'));
 variantes.replaceChildren(new Option('Elegir una variante',''),...vars.map(v=>new Option(v.nombre,v.id)));
 selVar.hidden=vars.length===0;
 if(p?.variante&&vars.some(v=>v.id===p.variante))variantes.value=p.variante;
 else if(vars.length===1)variantes.value=vars[0].id;
 else if(entry&&actual().r===entry.ruta&&actual().id===entry.id&&visibleEditor()){
  const v=valorVarianteCatalogo(entry.ruta,catalogoPlantillas[entry.ruta][entry.id]);
  if(vars.some(x=>x.id===v))variantes.value=v;
 }
 use.disabled=!puedeAbrir();
 actualizarSeleccion();
}
function actualizarSeleccion(){
 const e=seleccionado(), v=e?.variantes.find(x=>x.id===variantes.value);
 seleccion.hidden=!e;
 seleccion.textContent=e?(v&&v.nombre!==e.nombre?e.nombre+' · '+v.nombre:e.nombre):'';
 selectorRotulo.textContent=e?'Cambiar plantilla':'Ver todas las plantillas';
}
function puedeAbrir(){const entry=seleccionado();return !!(result&&entry&&(!entry.variantes.length||variantes.value));}
function revisar(enfocar=true){
 result=api.revisar(area.value,entries);
 if(result.status==='vacio'||result.status==='limite'){
  group.hidden=true;status.textContent=result.status==='vacio'?'Pegue el texto para buscar una plantilla.':'El texto supera el tamaño permitido. Divida el texto antes de continuar.';return;
 }
 refrescarTipos(result.opciones);
 orientacion.replaceChildren();
 orientacion.hidden=result.status!=='orientacion';
 if(!orientacion.hidden){
  orientacion.append(el('strong','Plantillas para empezar'));
  for(const propuesta of result.opciones){
   const entry=entries.find(x=>x.key===propuesta.key);
   if(!entry)continue;
   orientacion.append(btn(entry.nombre,()=>{
    opts.value=entry.key;
    cargarVariantes(true);
    selectorPlantilla.open=!puedeAbrir();
    (puedeAbrir()?use:variantes).focus();
   },'g'));
  }
 }
 if(result.status==='sugerencia')opts.value=result.opciones[0].key;
 cargarVariantes(true);group.hidden=false;
 selectorPlantilla.open=result.status==='ambigua'||result.status==='manual'||Boolean(seleccionado()&&!puedeAbrir());
 status.textContent=result.status==='sugerencia'?'Revise la plantilla sugerida.':
   result.status==='ambigua'?'Elija una de las plantillas sugeridas.':
   result.status==='orientacion'?(result.motivo==='parecido'?'Revise las opciones que podrían corresponder al texto.':'El texto aporta pocas pistas. Puede empezar por una de estas plantillas o buscar otra.'):
   'Seleccione un tipo de arte para abrir su formulario.';
 if(enfocar&&selectorPlantilla.open)opts.focus();
}
function abrir(){
 if(!puedeAbrir())return;
 const entry=seleccionado(),variante=variantes.value,raw=area.value,parsed=api.partes(raw),body=textoParaMotor(raw);
 const old=actual(),prior=visibleEditor();
 const anterior=prior&&old.r===entry.ruta&&old.id===entry.id?valorVarianteCatalogo(entry.ruta,catalogoPlantillas[entry.ruta][entry.id]):'';
 if(prior&&(old.r!==entry.ruta||old.id!==entry.id||(variante&&anterior!==variante))&&
    !confirm('¿Abrir otro diseño? Revise primero los cambios pendientes del diseño actual.'))return;
 const pasos=variante?varianteCatalogo(entry.ruta,entry.id,variante)?.pasos||[]:[];
 // Las subpantallas Android se coordinan desde el mapa habitual del generador.
 dialog.close();
 if(!stage.hidden){
  const catalogo=stage.querySelector('[data-os-action="map"]');
  const crear=document.querySelector('[data-and-nav="crear"]');
  (crear||catalogo)?.click();
 }
 abrirEntradaCatalogo(entry.ruta,entry.id,pasos);
 source.value=raw;sourceBox.hidden=false;sourceBox.open=false;
 if(!body){sourceStatus.textContent='El texto incluye solo el nombre del diseño. Complete el formulario.';sourceBox.open=true;return;}
 // Solo usa un formato explícito y válido de la Cartelera; nunca lo infiere.
 let formatoAplicado=false;
 if(entry.ruta==='atencion-consular'&&entry.id==='mixta'&&parsed.formatos.length===1){
  const formato=api.norm(parsed.formatos[0]);
  const valor=/^(x|para x|16 9)$/.test(formato)?'x':/^(historia|story|9 16)$/.test(formato)?'historia':
   /^(post|publicacion|facebook|4 5)$/.test(formato)?'post':'';
  const campo=$('sedeFormato');
  if(valor&&campo&&[...campo.options].some(o=>o.value===valor&&!o.disabled&&!o.hidden)){
   campo.value=valor;campo.dispatchEvent(new Event('change',{bubbles:true}));formatoAplicado=true;
  }
 }
 if(especializado(entry,body)){
  sourceStatus.textContent='Se abrió el importador de este arte. Revise el resultado antes de descargar.'+
   (parsed.formatos.length&&!formatoAplicado?' Revise el formato en la vista previa.':'');return;
 }
 if(entry.ruta==='ad'||entry.id==='navidad-2026'||entry.id==='invitacion-interna'){
  const status=el('p');
  if(window.exteriorImportacionActividad?.aplicar?.($('ad'),body,status)){
   sourceStatus.textContent=status.textContent||'Revise los datos incorporados en el formulario.';
   return;
  }
 }
 const n=completarEtiquetas(entry,body);
 sourceStatus.textContent=n?'Se reconocieron '+n+' '+(n===1?'campo':'campos')+'. Revise los datos y complete la información pendiente.':
  'Copie los datos del texto original en los campos correspondientes.';
 if(!n)sourceBox.open=true;
 // No cambiar post/historia por inferencia: los diseños que ofrecen ambos ya
 // los muestran; los demás conservan sus opciones de formato habituales.
 if(parsed.formatos.length)sourceStatus.textContent+=' Revise el formato en la vista previa.';
}
})();
