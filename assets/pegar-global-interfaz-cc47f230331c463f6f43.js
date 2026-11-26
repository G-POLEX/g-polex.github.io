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
const intro=el('p','Pegá el texto base y elegí el arte. El texto se procesa en este dispositivo.');
const area=el('textarea');area.rows=6;area.id='exteriorPegarTexto';
area.placeholder='Ej.: Jornada de salud\nFecha: sábado 12 de diciembre de 2026\nLugar: Centro Cultural';
const status=el('p','','field-help');status.role='status';
const group=el('section');group.hidden=true;
const opts=el('select');opts.id='exteriorPegarTipo';
const variantes=el('select');variantes.id='exteriorPegarVariante';
const selVar=label('Variante',variantes);
const use=btn('Abrir diseño',abrir,'b');use.disabled=true;
const check=btn('Buscar diseño',revisar,'b');
const limpiar=btn('Borrar texto',()=>{
 area.value='';source.value='';sourceStatus.textContent='';sourceBox.hidden=true;
 invalidate();area.focus();
});
group.append(label('Tipo de arte',opts),selVar,use);
dialog.append(cab,intro,label('Texto base',area),check,limpiar,status,group);
document.body.append(dialog);
const open=()=>{if(!dialog.open){dialog.showModal();area.focus();}};
const inicio=btn('Pegar texto',open,'os-stage-action');
inicio.id='exteriorPegarInicio';
const grid=stage.querySelector('.and-quick-grid');
if(grid){inicio.className='and-quick-paste';grid.prepend(inicio);}else actions.prepend(inicio);
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
variantes.addEventListener('change',()=>use.disabled=!puedeAbrir());
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
}
function puedeAbrir(){const entry=seleccionado();return !!(result&&entry&&(!entry.variantes.length||variantes.value));}
function revisar(){
 result=api.revisar(area.value,entries);
 if(result.status==='vacio'||result.status==='limite'){
  group.hidden=true;status.textContent=result.status==='vacio'?'Pegá el texto base para buscar un arte.':'El texto supera el tamaño permitido. Dividilo antes de continuar.';return;
 }
 refrescarTipos(result.opciones);
 if(result.status==='sugerencia')opts.value=result.opciones[0].key;
 cargarVariantes(true);group.hidden=false;
 status.textContent=result.status==='sugerencia'?'Revisá el tipo de arte sugerido y su variante.':
   result.status==='ambigua'?'Hay más de un arte posible. Elegí el que corresponda.':'Elegí el tipo de arte para abrir su formulario.';
 opts.focus();
}
function abrir(){
 if(!puedeAbrir())return;
 const entry=seleccionado(),variante=variantes.value,raw=area.value,parsed=api.partes(raw),body=textoParaMotor(raw);
 const old=actual(),prior=visibleEditor();
 const anterior=prior&&old.r===entry.ruta&&old.id===entry.id?valorVarianteCatalogo(entry.ruta,catalogoPlantillas[entry.ruta][entry.id]):'';
 if(prior&&(old.r!==entry.ruta||old.id!==entry.id||(variante&&anterior!==variante))&&
    !confirm('¿Abrir otro diseño? Revisá primero los cambios pendientes del diseño actual.'))return;
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
 if(!body){sourceStatus.textContent='El texto incluye solo el nombre del diseño. Completá el formulario.';sourceBox.open=true;return;}
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
  sourceStatus.textContent='Se abrió el importador de este arte. Revisá el resultado antes de descargar.'+
   (parsed.formatos.length&&!formatoAplicado?' Revisá el formato en la vista previa.':'');return;
 }
 if(entry.ruta==='ad'||entry.id==='navidad-2026'||entry.id==='invitacion-interna'){
  const status=el('p');
  if(window.exteriorImportacionActividad?.aplicar?.($('ad'),body,status)){
   sourceStatus.textContent=status.textContent||'Revisá los datos incorporados en el formulario.';
   return;
  }
 }
 const n=completarEtiquetas(entry,body);
 sourceStatus.textContent=n?'Se reconocieron '+n+' '+(n===1?'campo':'campos')+'. Revisá el formulario y completá la información que falte.':
  'Abrimos el diseño. Copiá los datos del texto original en los campos que correspondan.';
 if(!n)sourceBox.open=true;
 // No cambiar post/historia por inferencia: los diseños que ofrecen ambos ya
 // los muestran; los demás conservan sus opciones de formato habituales.
 if(parsed.formatos.length)sourceStatus.textContent+=' Revisá el formato en la vista previa.';
}
})();
