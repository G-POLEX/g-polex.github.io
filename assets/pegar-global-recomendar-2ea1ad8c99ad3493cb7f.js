/* Pegar texto: selección de familia/arte en el dispositivo, a partir del
   catálogo real. No cambia de editor ni interpreta archivos hasta confirmar. */
(function(global){
'use strict';
const norm=s=>String(s||'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().replace(/\+/g,' mas ').replace(/[^a-z0-9]+/g,' ').trim();
const cap=250000;
function partes(raw){
 const lines=String(raw??'').replace(/^\uFEFF/,'').replace(/\r\n?|[\u000b\u2028\u2029]/g,'\n').split('\n');
 const metas=[],disenos=[],formatos=[],contenido=[],etiquetas=[];
 for(const [i,line] of lines.entries()){
  const t=line.trim().replace(/^#{1,6}\s+/,'').replace(/\*{1,3}|_{1,3}/gu,'').trim();
  const par=/^([^:]{2,34}):\s*(.+)$/u.exec(t),k=norm(par?.[1]),v=par?.[2];
  if(k==='plantilla'||k==='tipo de arte'||k==='arte'){metas.push(v);continue;}
  if(k==='variante'||k==='diseno'){disenos.push(v);continue;}
  if(k==='formato'&&/^(publicacion|post|facebook|4 5|historia|story|9 16|x|para x|16 9|ambos|post e historia)$/u.test(norm(v))){formatos.push(v);continue;}
  contenido.push(line);
  if(t)etiquetas.push({i,t,k,v});
 }
 return {metas,disenos,formatos,contenido,etiquetas};
}
const reglas=[
 ['prensa','',/^(comunicado de prensa|convocatoria (?:a medios|de prensa))(?:\b|$)/u],
 ['sede','oficinas',/^(?:horarios? y ubicaciones|oficinas regionales|directorio de oficinas regionales|horario de (?:nuestras |las )?oficinas regionales)\b/u],
 ['ad','cafe',/^(?:(?:expo ?cafe|exposicion (?:del? )?cafe|feria de cafe|actividades? de (?:promocion (?:del? )?)?cafe))\b/u],
 ['ad','cancer-de-mama',/^(?:jornada de (?:prevencion|deteccion) (?:del? )?cancer de mama|prevencion (?:del? )?cancer de mama|deteccion temprana del cancer de mama)\b/u],
 ['ad','dia-del-nino',/^(?:celebracion (?:del? )?)?dia del nino\b/u],
 ['ad','musica',/^(?:actividad musical|concierto|recital|presentacion musical)\b/u],
 ['ad','opus',/^(?:concierto|recital|presentacion)(?: de(?:l grupo)?)? opus\b/u],
 ['ad','ferias',/^feria (?:gastronomica|de emprendimiento|de emprendedores)\b/u],
 ['ad','leyendas',/^(?:leyendas salvadorenas|las aventuras del cipitio)\b/u],
 ['ad','encuentros',/^encuentro (?:con la diaspora|de la comunidad salvadorena)\b/u],
 ['ad','jornadas-de-salud',/^jornada(?:s)? (?:de (?:salud|odontologia)|medica|odontologica|dental)\b/u],
 ['ad','jornadas-informativas',/^jornada(?:s)? informativa(?:s)?\b/u],
 ['ad','webinars',/^(?:seminario web|webinar)\b/u],
 ['ad','el-salvador-mas',/^(?:programa de servicios )?el salvador mas(?:\s|$)/u],
 ['ad','flores-y-palmas',/^(?:festival de )?flores y palmas\b/u],
 ['ad','desfiles',/^desfile\b/u],
 ['ad','farolitos',/^(?:celebracion de los |festival de los )?farolitos\b/u],
 ['efemerides','',/^(?:conmemoracion del )?dia del salvadoreno en el exterior\b/u],
 ['efemerides','navidad-2026',/^(?:una )?navidad con nuestra diaspora\b/u],
 ['mov','',/^(?:programa de movilidad laboral|convocatoria de empleo en el exterior)\b/u],
 ['atencion-consular','mixta',/^(?:cartelera .*(?:jornadas|consulados)|jornadas extraordinarias|consulados moviles)\b/u],
 ['atencion-consular','individual',/^(?:jornada extraordinaria|jornada de atencion consular|consulado movil)\b/u],
 ['avisos','',/^(?:aviso\b|(?:cierre|suspension|cambio de horario) (?:temporal )?(?:de|en) (?:atencion|nuestra|nuestros|oficina|consulado))/u],
 ['interno','invitacion-interna',/^invitacion (?:de uso interno|institucional interna)\b/u],
 ['interno','firma',/^firma (?:de correo|institucional para correo)\b/u],
 ['interno','proyeccion',/^proyeccion (?:semanal de temas|de temas)\b/u],
 ['esquelas','',/^(?:esquela|nota de duelo|mensaje (?:institucional )?de condolencias)\b/u],
 ['otras-instituciones','',/^(?:jornadas? (?:de identificacion|de dui|de emision de dui)|rnpn dia)\b/u],
];
const key=(r,id)=>r+'|'+id;
// El texto que llega por correo o WhatsApp puede empezar por la invitación,
// con el nombre de la actividad en la misma línea o en la siguiente.
function tituloDeInvitacion(t,n){
 const intro=/^(?:(?:la |el )?(?:embajada|consulado|ministerio|direccion|equipo) .{1,128} )?(?:(?:(?:te|les?|los|las|nos) )?invita(?:mos|n)?)(?: a (?:nuestra comunidad(?: salvadorena)?|las familias|los connacionales))? (?:a|al)\b *(?:(?:participar|asistir) (?:en|a|al) +)?(?:(?:la|el|una|un)\b *)?(.*)$/u.exec(t);
 return intro ? (intro[1]||n||'') : '';
}
function entries(catalog){
 return Object.entries(catalog).flatMap(([ruta,fs])=>Object.entries(fs).flatMap(([id,f])=>{
  if(ruta==='ad'&&(id==='invitacion-interna'||id==='independencia'))return [];
  return [{key:key(ruta,id),ruta,id,nombre:f.nombre,variantes:Object.entries(f.variantes||{}).map(([id,[nombre,,alias]])=>({id,nombre,alias:alias||''}))}];
 }));
}
function revisar(raw,items=[]){
 if(typeof raw!=='string'||!raw.trim())return {status:'vacio',opciones:[]};
 if(raw.length>cap)return {status:'limite',opciones:[]};
 const p=partes(raw),primera=p.etiquetas[0]?.t||'';
 const buscarTitulo=/^(?:titulo|encabezado|asunto)$/.test(p.etiquetas[0]?.k||'')?p.etiquetas[0].v:primera;
 const texto=norm(buscarTitulo);
 const tituloSegmento=/^arte +[0-9]+$/u.test(texto)?norm(p.etiquetas[1]?.t):'';
 const siguientes=p.etiquetas.slice(1,6).filter(x=>/^(?:titulo|encabezado|programa|tipo|seccion)$/.test(x.k)).map(x=>norm(x.v));
 const sugerencias=new Map();
 const agregar=(r,i)=>{if(items.some(x=>x.key===key(r,i)))sugerencias.set(key(r,i),{key:key(r,i),variante:''});};
 const matchVar=(x,v)=>x.variantes.filter(y=>[y.nombre,y.alias].some(n=>n&&norm(n)===v));
 if(p.metas.length){
  for(const n of p.metas.map(norm)){
   for(const x of items){
    if(norm(x.nombre)===n)agregar(x.ruta,x.id);
    const vs=matchVar(x,n);
    if(vs.length===1){agregar(x.ruta,x.id);sugerencias.get(x.key).variante=vs[0].id;}
   }
   for(const [r,i,re] of reglas)if(re.test(n))agregar(r,i);
  }
 }else{
  const invitacion=tituloDeInvitacion(texto,norm(p.etiquetas[1]?.t));
  for(const [r,i,re] of reglas)if([texto,...siguientes,...(r==='ad'&&i==='el-salvador-mas'?[tituloSegmento]:[]),...(r==='ad'||r==='atencion-consular'?[invitacion]:[])].some(t=>re.test(t)))agregar(r,i);
  // Nombre exacto y único de una variante: jamás usar coincidencias parciales.
  const exactas=items.flatMap(x=>matchVar(x,texto).map(v=>[x,v]));
  if(exactas.length===1){
   const [x,v]=exactas[0];agregar(x.ruta,x.id);sugerencias.get(x.key).variante=v.id;
  }
  // Evitar confundir una invitación firmada por una oficina con un aviso de esa oficina.
  const arr=p.etiquetas.map(x=>norm(x.t));
  if(sugerencias.size===0&&/^(informamos|se informa) (?:que )?(?:nuestr|las ofic|los consul)/.test(texto)&&
     arr.some(t=>/\b(?:permaneceran? cerrad|estaran? cerrad|suspension de atencion|cambio de horario)/.test(t)))agregar('avisos','');
  if(sugerencias.has('ad|opus')&&/\bopus\b/u.test(texto))sugerencias.delete('ad|musica');
 }
 const variantesPedido=[...new Set(p.disenos.map(norm))];
 if(variantesPedido.length===1&&sugerencias.size===0){
  const candidatas=items.flatMap(x=>matchVar(x,variantesPedido[0]).map(v=>[x,v]));
  if(candidatas.length===1){
   const [x,v]=candidatas[0];agregar(x.ruta,x.id);sugerencias.get(x.key).variante=v.id;
  }
 }
 if(sugerencias.size===1){
  const res=[...sugerencias.values()][0], item=items.find(x=>x.key===res.key);
  if(variantesPedido.length){
   const vs=variantesPedido.length===1?matchVar(item,variantesPedido[0]):[];
   res.variante=vs.length===1?vs[0].id:'';
  }
  // El tipo de prensa es textual. La extensión sigue pendiente si no se indica.
  const t=[...p.metas.map(norm),texto].join(' ');
  if(item.ruta==='prensa'&&!res.variante)res.grupo=/convocatoria (?:a medios|de prensa)/.test(t)?'convocatoria':/comunicado de prensa/.test(t)?'comunicado':'';
  if(item.ruta==='esquelas'&&!res.variante&&/^esquela /.test(t)){
   const a=/^esquela (?:de (?:la |el )?)?(viceministr[oa]|vicecanciller|canciller)\b/.exec(t);
   if(a)res.variante=a[1].startsWith('viceministr')?'viceministro':a[1];
  }
  return {status:'sugerencia',opciones:[res]};
 }
 return {status:sugerencias.size?'ambigua':'manual',opciones:[...sugerencias.values()]};
}
global.exteriorRecomendarArte={norm,partes,entries,revisar,cap};
})(typeof window==='undefined'?globalThis:window);
