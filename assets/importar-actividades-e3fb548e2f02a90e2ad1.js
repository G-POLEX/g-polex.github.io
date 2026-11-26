/* Exterior: importación local para las fichas de Actividades del día a día. */
(function(scope){
 'use strict';
 const normalize=s=>String(s??'').normalize('NFC').replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n');
 const fold=s=>String(s).normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().trim().replace(/\s+/g,' ');
 function decorator(line){
  const text=line.trim();
  let m=text.match(/^(\*{1,3}|_{1,3})(?=\S)(.+?)(?<=\S)\1$/u);
  if(m)return {text:m[2].trim(),heading:true};
  m=text.match(/^#{1,6}\s+(.+)$/u);
  if(m)return {text:m[1].trim(),heading:true};
  return {text:text.replace(/^(?:\*\*|__)([^:]{1,48}:)(?:\*\*|__)(?=\s|$)/u,'$1'),heading:false};
 }
 const titleKeys=Object.freeze({
  'titulo':'t0','titulo principal':'t0','encabezado':'t0','subtitulo':'t1','nombre de la campana':'t0',
  'texto introductorio':'intro','linea introductoria':'intro','introduccion':'intro','invita':'intro','invitacion':'intro',
  'fecha de la actividad':'fecha','fecha de la jornada':'fecha','fecha':'fecha','dia':'fecha',
  'horario de la actividad':'hora','horario de la jornada':'hora','horario':'hora','hora':'hora',
  'lugar':'lugar','recinto':'lugar','sede':'lugar','direccion':'lugar','ubicacion':'lugar','recinto y direccion':'lugar',
  'descripcion y fecha':'cuerpo','descripcion':'cuerpo','cuerpo':'cuerpo','texto al pie de la publicacion':'cierre','cierre':'cierre',
  'informacion adicional':'info','indicaciones':'info','observaciones':'info','detalles adicionales':'info'
 });
 const visualLabels=new Set(['variante','diseño','diseno','variante visual','diseno visual','plantilla visual']);
 const fechaPat=/^(?:(?:lunes|martes|miercoles|jueves|viernes|sabado|domingo)\s*,?\s+)?(?:0?[1-9]|[12]\d|3[01])\s+de\s+(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)(?:\s+del?\s+\d{4})?\.?$/u;
 const fechaIso=/^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/u;
 const relog='(?:[01]?\\d|2[0-3]):[0-5]\\d(?:\\s*[ap]\\s*\\.?\\s*m\\s*\\.?)?';
 const horaPat=new RegExp('^'+relog+'(?:\\s*(?:a|hasta|[-–—])\\s*'+relog+')?$','iu');
 const introPat=/(?:\b(?:te|le|les|nos|los|las|lo|la)\s+invita(?:n|mos)?\s+a\b|\b(?:se complace(?:n)? en invitar|tenemos el agrado de invitar|invita(?:n|mos)? a (?:la|el|participar|asistir))\b)/u;
 const contactoPat=/^(?:confirma(?:r)?\s+(?:(?:tu|su)\s+)?asistencia|confirme\s+(?:su\s+)?asistencia|confirmacion de asistencia|rsvp\b|reserva(?:r|cion)?\b|inscripcion(?:es)?\b|cupo(?:s)? limitad[oa]s?\b|entrada (?:libre|gratuita)\b|acceso gratuito\b|para (?:inscribir|confirmar|reservar|mas informacion)|(?:correo(?: electronico)?|telefono|whatsapp|contacto|informes|mas informacion|requisitos?)\s*:)/u;
 const locationPat=/^(?:(?:en (?:el|la) )?(?:auditorio|salon|centro cultural|centro de convenciones|casa de la cultura|biblioteca|parque|recinto)\s+\S|(?:calle|avenida|bulevar|boulevard|carretera|pasaje)\s+\S|(?:av\.|blvd\.|km\s+\d)\s*\S|\d{1,6}\s+[^,]{1,50}\b(?:st\.?|street|ave\.?|avenue|road|rd\.?)\b)/u;
 const activityPat=/^(?:jornada|campana|feria|encuentro|festival|concierto|exposicion|taller|webinar|seminario|charla|celebracion|conmemoracion|desfile|presentacion|brigada|funcion|conversatorio)\s+\S/u;
 const isEmail=s=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(s);
 const isPhone=s=>/^(?:\+\d{1,3}\s+|\(\d{2,4}\)\s*|\d{2,4}[- ]+)\d[\d -]{5,24}\d$/u.test(s)&&s.replace(/\D/g,'').length<=16;
 function label(text){
  const m=text.match(/^([\p{L}\p{N} ()-]{1,55})\s*:\s*(.*)$/u);
  if(!m)return null;
  const nombre=fold(m[1]), value=decorator(m[2]).text;
  if(visualLabels.has(nombre))return {clave:'variante',valor:value};
  const linea=nombre.match(/^(?:titulo(?: \(linea | linea | )|linea(?: de titulo)? )([1-6])\)?$/u);
  if(linea)return {clave:'t'+(Number(linea[1])-1),valor:value};
  if(Object.hasOwn(titleKeys,nombre))return {clave:titleKeys[nombre],valor:value};
  return null;
 }
 function clasificar(raw,variantes=[]){
  const rows=normalize(raw).split('\n');
  const out=[], dudosos=[], elecciones=[];
  let grupo=null;
  const disponibles=variantes.map(({id,nombre})=>({id,claves:[fold(id),fold(nombre)]}));
  rows.forEach((orig,i)=>{
   if(!orig.trim()){grupo=null;return;}
   // Un pin al comienzo de una línea es una señal explícita de dirección.
   const pin=orig.match(/^\s*📍\ufe0f?\s*(\S.{0,239})$/u);
   if(pin){grupo=null;out.push({clave:'lugar',valor:pin[1].trim(),orig,i});return;}
   const prefijo=orig.match(/^\s*[-*•]\s+(.+)$/u);
   const {text,heading}=decorator(prefijo?prefijo[1]:orig);
   const low=fold(text);
   const definido=label(text);
   if(definido?.clave==='variante'){
    grupo=null;
    const opciones=disponibles.filter(x=>x.claves.includes(fold(definido.valor)));
    if(opciones.length===1)elecciones.push({id:opciones[0].id,orig});
    else dudosos.push(orig);
    return;
   }
   if(definido){
    grupo=null;
    if(!definido.valor){dudosos.push(orig);return;}
    const item={...definido,orig,i};
    out.push(item);
    if(['intro','lugar','info','cuerpo','cierre'].includes(item.clave))grupo=item;
    return;
   }
   let clave='';
   if(fechaPat.test(low)||fechaIso.test(low))clave='fecha';
   else if(horaPat.test(low))clave='hora';
   else if(contactoPat.test(low)||isEmail(text)||isPhone(text))clave='info';
   else if(introPat.test(low)&&text.length<=420)clave='intro';
   else if(locationPat.test(low)&&text.length<=240)clave='lugar';
   if(clave){
    grupo=null;
    out.push({clave,valor:clave==='info'&&prefijo?orig.trim():text,orig,i});
   }else if(grupo&&(/^\s+/u.test(orig)||!heading&&['info','cuerpo','cierre'].includes(grupo.clave))){
    grupo.valor+='\n'+orig.trim();grupo.orig+='\n'+orig;
   }else{
    grupo=null;
    out.push({clave:'',valor:text,orig,i,heading});
   }
  });
  const choices=[...new Set(elecciones.map(x=>x.id))];
  if(choices.length>1)dudosos.push(...elecciones.map(x=>x.orig));
  return {out,dudosos,variant:choices.length===1?choices[0]:null};
 }
 function analizar(raw,{campos,variantes}={}){
  if(normalize(raw).length>60000)return {asignados:new Map(), pendientes:['El texto supera los 60 000 caracteres. Divida el texto antes de importarlo.'],variant:null,limite:true};
  const {out,dudosos,variant}=clasificar(raw,variantes);
  const available=new Set(campos||[]);
  const unresolved=out.filter(x=>!x.clave);
  if(!out.some(x=>x.clave==='t0')){
   const marcado=unresolved.filter(x=>x.heading&&x.valor.length<=220);
   const intro=out.find(x=>x.clave==='intro');
   const dato=out.find(x=>['fecha','hora','lugar'].includes(x.clave));
   const claro=unresolved.filter(x=>!x.heading&&x.valor.length<=150&&
    !/[.!?;:]$/u.test(x.valor)&&!/(?:\bsera\b|\bcomienza\b|\btendra lugar\b|\brealizara\b|\bse llevara\b)/u.test(fold(x.valor))&&
    (activityPat.test(fold(x.valor))||(intro&&dato&&x.i>intro.i&&x.i<dato.i)));
   const elegido=marcado.length===1?marcado[0]:!marcado.length&&claro.length===1?claro[0]:null;
   if(elegido)elegido.clave='t0';
  }
  const asignados=new Map();
  const porClave=new Map();
  for(const item of out){
   if(['cuerpo','cierre'].includes(item.clave)&&!available.has(item.clave)&&available.has('info'))item.clave='info';
   if(!item.clave||!available.has(item.clave)){dudosos.push(item.orig);continue;}
   if(!porClave.has(item.clave))porClave.set(item.clave,[]);
   porClave.get(item.clave).push(item);
  }
  for(const [clave,items] of porClave){
   const valores=[...new Set(items.map(x=>x.valor))];
   if(clave==='info')asignados.set(clave,valores.join('\n'));
   else if(valores.length===1)asignados.set(clave,valores[0]);
   else dudosos.push(...items.map(x=>x.orig));
  }
  return {asignados,pendientes:dudosos,variant};
 }
 const drafts=new Map();
 const el=id=>typeof document==='undefined'?null:document.getElementById(id);
 const esRojizo=()=>el('adT')?.value==='cafe'&&el('adV')?.value==='rojizo'&&!!el('editorial-ad-cuerpo');
 function controls(){
  if(esRojizo())return new Map([['intro','entrada'],['t0','titulo'],['cuerpo','cuerpo'],['cierre','cierre']].map(([k,id])=>[k,el('editorial-ad-'+id)]).filter(([,c])=>c&&!c.disabled&&!c.readOnly&&!c.closest('[hidden]')));
  return new Map([...el('adF')?.querySelectorAll('input[id^="adf_"],textarea[id^="adf_"]')||[]]
   .filter(e=>!e.disabled&&!e.readOnly&&!e.closest('[hidden]')).map(e=>[e.id.slice(4),e]));
 }
 function usable(familia){
  return familia?.id==='ad'&&familia.contains(el('adF'))&&controls().size>0&&
   !el('adF')?.querySelector('#svpTextoPegado')&&['ad','efemerides','interno'].includes(el('m')?.value);
 }
 const draftKey=()=>el('adT')?.value;
 function enlazar(familia,input,status){
  if(!usable(familia))return;
  const k=draftKey(), data=drafts.get(k);
  if(data){input.value=data.text;status.textContent=data.message||'';}
  input.addEventListener('input',()=>{drafts.set(k,{text:input.value,message:''});status.textContent='';});
 }
 function fieldSpec(v){
  const values=new Map();
  if(v?.intro)values.set('intro',true);
  for(let i=0;i<(v?.title?.L?.length||0);i++)values.set('t'+i,false);
  for(const it of v?.det?.items||[])if(['fecha','hora','lugar'].includes(it.k))values.set(it.k,it.k==='lugar');
  if(v?.info)values.set('info',true);
  return values;
 }
 function aplicar(familia,raw,status){
  if(!usable(familia))return false;
  const selector=el('adV'), old=controls(), design=draftKey();
  const tell=m=>{status.textContent=m;drafts.set(design,{text:raw,message:m});};
  const current=typeof adCur==='function'?adCur():null;
  const byValue=new Map([...selector.options].filter(x=>!x.disabled&&!x.hidden).map(x=>[x.value,x.textContent.trim()]));
  const variants=current?.d?.id===design?(current.d.v||[]).filter(x=>byValue.has(x.id)).map(x=>({id:x.id,nombre:byValue.get(x.id)})):[];
  const rojizo=esRojizo();
  const primero=analizar(raw,{campos:[...old.keys(),...(rojizo?['fecha','hora','lugar','info']:[])],variantes:rojizo?[]:variants});
  let picked=variants.find(x=>x.id===primero.variant&&x.id!==selector.value);
  let leave='';
  let schema=null;
  if(picked){
   schema=fieldSpec(current.d.v.find(x=>x.id===picked.id));
   if(typeof adForm!=='function'||typeof actualizarConfiguracionAD!=='function'||typeof adActualizarIlustracion!=='function'||
    [...old].some(([k,f])=>f.value!==f.defaultValue&&!schema.has(k))){
    picked=null;schema=null;leave=' La variante actual se conserva para mantener los campos editados.';
   }
  }
  const {asignados,pendientes,limite}=schema?analizar(raw,{campos:[...schema.keys()],variantes:variants}):primero;
  let saltados=pendientes.length;
  if(limite){tell(pendientes[0]);return true;}
  if(rojizo){
   // La pieza rojiza no tiene casillas para fecha, hora o lugar.
   const cuerpo=['cuerpo','fecha','hora','lugar'].map(k=>asignados.get(k)).filter(Boolean).join('\n');
   const cierre=['cierre','info'].map(k=>asignados.get(k)).filter(Boolean).join('\n');
   for(const k of ['fecha','hora','lugar','info'])asignados.delete(k);
   if(cuerpo)asignados.set('cuerpo',cuerpo);
   if(cierre)asignados.set('cierre',cierre);
  }
  const proposed=[];
  for(const [k,value] of asignados){
   const field=old.get(k);
   if(!value||value.length>12000||((schema&&!schema.get(k)||!schema&&field?.tagName==='INPUT')&&/[\n\r]/u.test(value))||
    (field&&field.maxLength>=0&&value.length>field.maxLength)){saltados++;continue;}
   proposed.push([k,value]);
  }
  if(!proposed.length&&!picked){
   tell(raw.trim()?'No se identificaron campos con certeza. El texto original queda aquí.'+leave:'Pegue el texto para completar los campos.');
   return true;
  }
  const reemplaza=proposed.some(([k,value])=>{const f=old.get(k);return f?.value.trim()&&f.value!==f.defaultValue&&f.value!==value;});
  const question=picked?'¿Cambiar a «'+picked.nombre+'»'+(proposed.length?' y completar los campos reconocidos?':'?'):
    reemplaza?'¿Reemplazar los datos de los campos reconocidos?':'';
  if(question&&!confirm(question)){tell('Se conservaron los datos y el diseño actuales.');return true;}
  if(picked){
   // El cambio de variante desde el importador conserva los logotipos y ediciones
   // compatibles; el selector habitual mantiene su comportamiento previo.
   const changed=[...old].filter(([k,f])=>schema.has(k)&&f.value!==f.defaultValue).map(([k,f])=>[k,f.value]);
   selector.value=picked.id;
   adForm();
   for(const [k,v] of changed){const f=el('adf_'+k);if(f)f.value=v;}
   const size=el('adArtworkSize'),offset=el('adArtworkOffset');
   if(size)size.value=size.defaultValue;
   if(offset)offset.value=offset.defaultValue;
   adActualizarIlustracion();
   actualizarConfiguracionAD();
   selector.dispatchEvent(new Event('change',{bubbles:true}));
  }
  const fields=controls();
  let n=0;
  for(const [k,value] of proposed){
   const field=fields.get(k);
   if(!field){saltados++;continue;}
   const probe=field.cloneNode(false);probe.value=value;
   if(probe.value!==value){saltados++;continue;}
   field.value=value;
   field.dispatchEvent(new Event('input',{bubbles:true}));
   n++;
  }
  if(picked&&typeof go==='function')go();
  tell((picked?'Variante: '+picked.nombre+'. ':'')+
   (n?n+(n===1?' campo completado.':' campos completados.')+' Revise los datos antes de descargar.':'Revise los datos antes de descargar.')+
   (saltados?' Parte del texto quedó sin asignar. Se conserva en el cuadro.':'')+leave);
  return true;
 }
 const api={analizar,usable,enlazar,aplicar};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else scope.exteriorImportacionActividad=Object.freeze(api);
})(typeof globalThis==='object'?globalThis:this);
