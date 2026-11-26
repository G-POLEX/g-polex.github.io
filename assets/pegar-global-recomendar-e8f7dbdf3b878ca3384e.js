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
// Orientación conservadora. Solo se usa cuando las reglas textuales anteriores no identifican un diseño.
const pistasFijas=[
 ['prensa|','comunicado|comunicado de prensa|convocatoria a medios|convocatoria de prensa|rueda de prensa'],
 ['sede|oficinas','horarios y ubicaciones|oficinas regionales|directorio regional|horario de oficinas regionales'],
 ['ad|cafe','expo cafe|feria de cafe|exposicion de cafe|cafe salvadoreno'],
 ['ad|cancer-de-mama','cancer de mama|prevencion del cancer de mama|deteccion temprana del cancer de mama'],
 ['ad|dia-del-nino','dia del nino'],
 ['ad|musica','concierto|recital|actividad musical|presentacion musical'],
 ['ad|opus','concierto opus|presentacion del grupo opus'],
 ['ad|ferias','feria gastronomica|feria de emprendimiento|feria de emprendedores'],
 ['ad|leyendas','leyendas salvadorenas|las aventuras del cipitio'],
 ['ad|encuentros','encuentro con la diaspora|encuentro comunitario'],
 ['ad|jornadas-de-salud','jornada de salud|jornada medica|jornada odontologica|jornada dental|atencion medica'],
 ['ad|jornadas-informativas','jornada informativa|orientacion sobre tramites consulares|charla informativa|sesion informativa'],
 ['ad|webinars','webinar|seminario web|videoconferencia'],
 ['ad|el-salvador-mas','el salvador mas'],
 ['ad|flores-y-palmas','flores y palmas|festival de flores y palmas'],
 ['ad|desfiles','desfile'],
 ['ad|farolitos','farolitos|festival de los farolitos'],
 ['efemerides|','dia del salvadoreno en el exterior'],
 ['efemerides|navidad-2026','navidad con nuestra diaspora'],
 ['mov|','movilidad laboral|programa de movilidad laboral|convocatoria de empleo en el exterior'],
 ['atencion-consular|mixta','cartelera consular|cartelera de jornadas|jornadas extraordinarias|consulados moviles'],
 ['atencion-consular|individual','jornada extraordinaria|jornada de atencion consular|consulado movil|atencion consular'],
 ['avisos|','aviso de cierre|cierre temporal|cierre de atencion|cambio de horario|suspension de atencion|asueto'],
 ['interno|invitacion-interna','invitacion de uso interno|invitacion institucional interna'],
 ['interno|firma','firma de correo'],
 ['interno|proyeccion','proyeccion semanal de temas|proyeccion de temas'],
 ['esquelas|','esquela|nota de duelo|mensaje de condolencias|fallecimiento|condolencias'],
 ['otras-instituciones|','jornada de identificacion|jornada de dui|tramite de dui|dui'],
];
const guiasGenerales=['avisos|','atencion-consular|individual','prensa|','ad|ferias'];
const palabrasConectoras=new Set(['a','al','de','del','en','y','el','la','las','los','un','una','o','por','para','con','su','nuestra','nuestro']);
const mesODia=/^(?:lunes|martes|miercoles|jueves|viernes|sabado|domingo|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/u;
const normalizarPista=txt=>norm(txt).replace(/^(?:el |la |los |las |una |un )/u,'');
function tituloBreve(t){
 if(typeof t!=='string'||t.length>140||/(?:https?:\/\/|www\.|@)/iu.test(t))return '';
 const limpio=normalizarPista(t);
 if(!limpio||mesODia.test(limpio)||/^(?:informamos|se informa|buenos dias|buenas tardes|estimad[oa]s?|saludos|por medio|gracias|cordialmente|fecha|lugar|hora|referencia|nota|atentamente|cuerpo|mensaje|favor|hola|[0-9]+)\b/u.test(limpio))return '';
 return limpio.split(' ').slice(0,10).join(' ');
}
function unCambio(a,b){
 if(Math.abs(a.length-b.length)>1)return false;
 if(a.length>b.length)[a,b]=[b,a];
 let i=0;
 while(i<a.length&&a[i]===b[i])i++;
 if(a.length!==b.length)return a.slice(i)===b.slice(i+1);
 if(i===a.length)return false;
 return a.slice(i+1)===b.slice(i+1)||
  (i+1<a.length&&a[i]===b[i+1]&&a[i+1]===b[i]&&a.slice(i+2)===b.slice(i+2));
}
function medirPista(query,frase){
 const q=query.split(' '), f=frase.split(' ');
 let fuertes=0,parecidos=0,corte=false,edicion=false;
 const n=Math.min(q.length,f.length);
 for(let j=0;j<n;j++){
  const a=q[j],b=f[j];
  if(a===b){if(!palabrasConectoras.has(a)&&a.length>=3)fuertes++;continue;}
  if(j===q.length-1&&a.length>=5&&a.length/b.length>=(fuertes?.45:.55)&&b.startsWith(a)){corte=true;parecidos++;continue;}
  if(!edicion&&a.length>=4&&b.length>=5&&!palabrasConectoras.has(a)&&!palabrasConectoras.has(b)&&unCambio(a,b)){
   edicion=true;parecidos++;continue;
  }
  return 0;
 }
 // Una palabra corta o genérica no orienta. Una palabra abreviada con un error tampoco.
 if(!fuertes&&!(q.length===1&&parecidos===1&&q[0].length>=5&&(f.length===1||corte)))return 0;
 // Una continuación escrita después de una etiqueta completa no rebaja la coincidencia.
 return fuertes*5+parecidos*3+(q.length>=f.length?2:0)-(edicion?1:0);
}
function orientar(p,items){
 const candidatas=new Map(items.map(item=>[item.key,item]));
 const soloMetas=p.metas.length>0;
 const posibles=soloMetas?p.metas.slice(0,4):
  [...p.etiquetas.slice(0,5).map(({t,k,v})=>/^(?:titulo|encabezado|asunto|tema|actividad)$/.test(k)?v:t),
   tituloDeInvitacion(norm(p.etiquetas[0]?.t),norm(p.etiquetas[1]?.t))];
 const titulos=[...new Set(posibles.map(tituloBreve).filter(Boolean))].slice(0,5);
 const index=new Map(pistasFijas.map(([id,v])=>[id,v.split('|')]));
 const ponderadas=[];
 for(const [id,item] of candidatas){
  const nombres=[...(index.get(id)||[]), normalizarPista(item.nombre),...item.variantes.slice(0,20).flatMap(v=>[normalizarPista(v.nombre),normalizarPista(v.alias)])].filter(Boolean);
  let puntaje=0;
  for(const [orden,titulo] of titulos.entries())for(const frase of nombres){
   if(id==='interno|invitacion-interna'&&/^invitacion(?: de| institucional)?$/u.test(titulo))continue;
   const puntos=medirPista(titulo,frase);
   if(puntos)puntaje=Math.max(puntaje,puntos*10-orden);
  }
  if(puntaje)ponderadas.push({key:id,variante:'',puntaje});
 }
 ponderadas.sort((a,b)=>b.puntaje-a.puntaje||a.key.localeCompare(b.key,'es'));
 const mejor=ponderadas[0]?.puntaje||0;
 if(mejor) return {status:'orientacion',motivo:'parecido',
  opciones:ponderadas.filter(x=>mejor-x.puntaje<=55).slice(0,4).map(({key,variante})=>({key,variante}))};
 const opciones=guiasGenerales.filter(id=>candidatas.has(id)).map(key=>({key,variante:''}));
 return opciones.length?{status:'orientacion',motivo:'sin-pistas',opciones}:{status:'manual',opciones:[]};
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
 return sugerencias.size?{status:'ambigua',opciones:[...sugerencias.values()]}:orientar(p,items);
}
global.exteriorRecomendarArte={norm,partes,entries,revisar,cap};
})(typeof window==='undefined'?globalThis:window);
