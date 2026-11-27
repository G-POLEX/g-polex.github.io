/* Pegar texto: selección de familia/arte en el dispositivo, a partir del
   catálogo real. Clasificación y extracción local sin acceso a la red. */
(function(global){
'use strict';
const norm=s=>String(s||'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().replace(/\+/g,' mas ').replace(/[^a-z0-9]+/g,' ').trim();
const cap=250000;
function partes(raw){
 const lines=String(raw??'').replace(/^\uFEFF/,'').replace(/\r\n?|[\u000b\u2028\u2029]/g,'\n').split('\n');
 const metas=[],disenos=[],formatos=[],contenido=[],etiquetas=[];
 for(const [i,line] of lines.entries()){
  const t=line.trim().replace(/^#{1,6}\s+/,'').replace(/^(\*{1,3}|_{1,3})(.+)\1$/u,'$2').trim();
  const par=/^([^:]{2,34}):\s*(.+)$/u.exec(t),k=norm(par?.[1]),v=par?.[2];
  if(k==='plantilla'||k==='tipo de arte'||k==='arte'){metas.push(v);continue;}
  if(k==='variante'||k==='diseno'){disenos.push(v);continue;}
  if(k==='formato'&&/^(publicacion|post|facebook|4 5|historia|story|9 16|x|para x|16 9|ambos|post e historia)$/u.test(norm(v))){formatos.push(v);continue;}
  contenido.push(line);
  if(t)etiquetas.push({i:contenido.length-1,t,k,v,original:line});
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
  return [{key:key(ruta,id),ruta,id,nombre:f.nombre,detalle:f.detalle,variantes:Object.entries(f.variantes||{}).map(([id,[nombre,detalle,alias]])=>({id,nombre,detalle,alias:alias||''}))}];
 }));
}
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
const palabrasConectoras=new Set(['a','al','de','del','en','y','el','la','las','los','un','una','o','por','para','con','su','nuestra','nuestro']);
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

const nombresCampo = {
 titulo:'titulo|encabezado|asunto|nombre de la actividad',subtitulo:'subtitulo|segunda linea del titulo|segunda linea',
 fecha:'fecha|fecha de emision|fecha de la actividad|lugar y fecha',hora:'hora|horario|horario de atencion|horas de atencion',
 lugar:'direccion|ubicacion|lugar|recinto|recinto y direccion|sede de la actividad|direccion o sitio web',
 representacion:'representacion|sede o representacion|sede|consulado',entrada:'entrada|introduccion|texto introductorio|linea superior',
 cuerpo:'cuerpo|texto|mensaje|mensaje principal',nota:'nota|mas informacion|informacion adicional|mensaje complementario|nota del horario',
 correo:'correo|correo electronico|correo institucional|email',telefono:'telefono|telefono institucional|tel|celular',
 whatsapp:'whatsapp',virtual:'consulado virtual',dias:'dias|dias de atencion',nombre:'nombre|nombre completo|nombre de la persona fallecida',
 cargo:'cargo|puesto',pais:'pais',ciudad:'ciudad',modalidad:'modalidad|modalidad de atencion'
};
const campoPorNombre = new Map(Object.entries(nombresCampo).flatMap(([id,nombres])=>nombres.split('|').map(n=>[n,id])));
const dia = '(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)';
const mes = '(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|se[p]?tiembre|octubre|noviembre|diciembre)';
const numDia = '(?:0?[1-9]|[12]\\d|3[01])';
const fechaLiteral = new RegExp('^(?:'+dia+'\\s*,?\\s+)?(?:'+numDia+'\\s+de\\s+'+mes+'(?:\\s+del?\\s+\\d{4})?|\\d{4}-\\d{2}-\\d{2}|'+numDia+'[/.\\-](?:0?[1-9]|1[0-2])(?:[/.\\-](?:\\d{4}|\\d{2}))?)(?=$|[\\s,;.·–—])','iu');
const reloj = '(?:[01]?\\d|2[0-3])(?::[0-5]\\d(?:\\s*(?:[ap]\\s*\\.?\\s*m\\.?|m\\.|h(?:oras?)?\\.?))?|\\s*[ap]\\s*\\.?\\s*m\\.?)';
const fechaEnAviso = new RegExp('\\b(?:el|para el)\\s+((?:'+dia+'\\s*,?\\s+)?'+numDia+'\\s+de\\s+'+mes+'(?:\\s+del?\\s+\\d{4})?)(?!\\p{L})','giu');
const horarioSemanal = /\bde (lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo) a (lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo),?\s+(.+)$/iu;
const excepcionHorario = /\b(?:este )?horario (?:no (?:aplica|rige|se aplicara)|excepto)|\b(?:excepto|salvo) (?:el|los dias?)\b/u;
const horaLiteral = new RegExp('^'+reloj+'(?:\\s*(?:a|hasta|[-–—])\\s*'+reloj+')?$','iu');
const correoLiteral = /[\p{L}\d.!#$%&'*+/=?^_\x60{|}~-]+@[\p{L}\d-]+(?:\.[\p{L}\d-]+)+/u;
const telefonoLiteral = /(?:\+?\d{1,3}[ .-]+)?(?:\(\d{2,5}\)|\d{2,5})(?:[ .-]+\d{2,5}){1,4}|\+\d{8,15}|\b\d{8,12}\b/u;
const cierreCorreo = /^(?:-{2,}|atentamente|cordialmente|saludos(?: cordiales)?|muchas gracias|enviado desde mi|este (?:mensaje|correo)(?: electronico)? (?:y|es|contiene))(?:[ ,.!:]|$)/u;
const saludo = /^(?:buen(?:os dias|as tardes|as noches)|hola|estimad[oa]s?)(?:[ ,.!:]|$)/u;
const dir = /^(?:(?:en (?:el|la) )?(?:auditorio|salon|centro (?:cultural|comunitario|de convenciones)|casa (?:comunal|de la cultura)|biblioteca|parque|teatro|recinto|mercado|sala|campus)\b|(?:calle|avenida|av|bulevar|blvd|boulevard|carretera|pasaje|km|edificio|colonia|distrito|suite|planta|piso|local|sector|codigo postal)\b|\d{1,6}\s+.{1,65}\b(?:st|street|ave|avenue|road|rd|drive|blvd)\b)/u;
const contacto = /^(?:consultas|informes|contacto|inscripciones?|registro|reservas?|confirm[ae](?:r|cion)?|rsvp|para (?:mas informacion|consultas|confirmar|inscribirse)|cupo|entrada (?:libre|gratuita))\b/u;
const comunicado = /^(?:comunicado(?: de prensa)?|convocatoria (?:de prensa|a (?:los )?medios(?: de comunicacion)?))$/u;
const cuerpoInicial = /^(?:(?:(?:el )?ministerio (?:de relaciones exteriores )?|(?:el )?gobierno(?: de el salvador)?|la embajada|el consulado).{0,100} )?(?:informa(?:mos)?|se informa|comunica(?:mos)?|se comunica|se convoca|convoca(?:mos)?|les? invitamos|te invitamos|invitamos|por (?:motivo|mantenimiento|este medio)|(?:nuestras?|sus) oficinas)\b/u;
function filas(p, firma){
 const salida=[];
 for(const x of p.etiquetas){
  const t=x.t.replace(/^(?:[-*•]\s+|[📅📆🗓📍⏰🕐-🕧🕰📞📧\uFE0F]+\s*)/u,'');
  const n=norm(t);
  if((cierreCorreo.test(n)||/^--$/u.test(x.original.trim()))&&!firma)break;
  if(saludo.test(n)||/^arte \d+$/.test(n))continue;
  const match=/^([^:]{2,44})\s*:\s*(.*)$/u.exec(t);
  const k=norm(match?.[1]), numbered=/^(fecha|horario|hora|lugar|direccion) ([1-9]\d?)$/.exec(k);
  salida.push({...x,t,n,k,valor:match?.[2]?.trim(),clave:campoPorNombre.get(numbered?.[1]||k),numero:numbered?Number(numbered[2]):null});
 }
 return salida;
}
function valorHora(t){
 const v=t.replace(/^(?:de|desde|a las|alas)\s+/iu,'').trim();
 if(horaLiteral.test(v))return v;
 const s=v.replace(/[.;]$/u,'');
 return s!==v&&horaLiteral.test(s)?s:'';
}
function datosFecha(t){
 const fecha=t.match(fechaLiteral)?.[0];
 if(!fecha)return null;
 const resto=t.slice(fecha.length).replace(/^[,;·–—\s]+/u,'').trim();
 const hora=valorHora(resto);
 return !resto||resto==='.'||hora?{fecha,hora}:null;
}
function contactoEn(t,n,clave){
 const correo=t.match(correoLiteral)?.[0];
 if(correo&&(clave==='correo'||correo===t||contacto.test(n)))return {clave:'correo',valor:correo};
 const numero=t.match(telefonoLiteral)?.[0];
 if(!numero||numero.replace(/\D/g,'').length<7||numero.replace(/\D/g,'').length>15)return null;
 if(!['telefono','whatsapp','virtual'].includes(clave)&&!contacto.test(n)&&numero!==t)return null;
 return {clave:clave||(n.includes('whatsapp')?'whatsapp':'telefono'),valor:numero};
}
function tituloProbable(row){
 return row.t.length<=150&&!/[.!?;:]$/u.test(row.t)&&!/^(\d|https?:|www\.)/iu.test(row.t)&&
  !correoLiteral.test(row.t)&&!cuerpoInicial.test(row.n)&&!/\b(?: invita(?:n)? a| se complace en invitar)\b/u.test(row.n)&&!contacto.test(row.n);
}
function extraer(raw, item, variante){
 const p=partes(raw);
 const firma=item?.id==='firma'||p.metas.some(x=>norm(x)==='firma de correo')||/^firma (?:de correo|institucional)\b/u.test(norm(p.etiquetas[0]?.t));
 const rows=filas(p,firma);
 const datos={texto:p.contenido.join('\n'),fechas:[],lineasCuerpo:[]};
 const fechas=datos.fechas, horariosSinFecha=[], candidatos=[], usados=new Set(), ubicaciones=[];
 let actual=null,continuacion=null, cuerpoExplicito=false;
 const menciones=[];
 const colocar=(key,valor,row)=>{if(valor&&!datos[key])datos[key]={valor,i:row.i};};
 const nuevaFecha=(row)=>({fecha:'',hora:'',i:row.i,numero:row.numero});
 for(const x of rows){
  const {t,n,clave,valor}=x;
  let fecha=clave==='fecha'?(datosFecha(valor)||{fecha:valor,hora:''}):(!clave?datosFecha(t):null);
  let hora=clave==='hora'?valorHora(valor)||valor:!clave?valorHora(t):'';
  const esCabecera=comunicado.test(n)||n==='aviso'||n==='firma de correo';
  if(!clave&&/\b(?:consulado|oficinas?|ventanillas?)\b/u.test(n)&&
     /\b(?:cerrad[oa]s?|suspendid[oa]s?|no (?:habra|atendera))\b/u.test(n)){
   for(const m of t.matchAll(fechaEnAviso))menciones.push({valor:m[1],i:x.i,enTexto:true});
  }
  const semanal=t.match(horarioSemanal);
  if(semanal&&valorHora(semanal[3]))datos.horarioSemanal={dias:'de '+semanal[1]+' a '+semanal[2],hora:valorHora(semanal[3]),i:x.i};
  if(excepcionHorario.test(n))colocar('excepcionHorario',t,x);
  if(!clave&&!/^\s*📍/u.test(x.original)&&!cuerpoInicial.test(n)&&/^(?:consulado (?:general|de el salvador)|embajada de el salvador)\b/u.test(n)){
   colocar('representacion',t,x);
   usados.add(x.i);continuacion=null;continue;
  }
  if(fecha?.fecha){
   if(x.numero)actual=fechas.find(d=>d.numero===x.numero);
   else actual=null;
   if(!actual){actual=nuevaFecha(x);fechas.push(actual);}
   actual.fecha=fecha.fecha;
   if(fecha.hora)actual.hora=fecha.hora;
   usados.add(x.i);continuacion=null;continue;
  }
  if(hora){
   const previsto=x.numero?fechas.find(d=>d.numero===x.numero):actual;
   if(x.numero&&!previsto){const d=nuevaFecha(x);d.hora=hora;fechas.push(d);}
   else if(previsto&&!previsto.hora)previsto.hora=hora;
   else horariosSinFecha.push({valor:hora,i:x.i});
   usados.add(x.i);continuacion=null;continue;
  }
  const info=contactoEn(clave?valor:t,n,clave);
  if(clave==='lugar'||(!clave&&(/^📍/u.test(x.original.trim())||dir.test(n)))){
   const linea=clave?valor:t;
   if(linea){
    if(continuacion?.tipo==='lugar'&&x.i===continuacion.ultima+1&&!clave){
     continuacion.item.valor+='\n'+linea;
    }else{
     const lugar={valor:linea,i:x.i,numero:x.numero};
     ubicaciones.push(lugar);
     continuacion={tipo:'lugar',item:lugar,ultima:x.i,explicita:!!clave||/^📍/u.test(x.original.trim())};
    }
    continuacion.ultima=x.i;
    usados.add(x.i);
    continue;
   }
  }
  if(clave||info||esCabecera){
   continuacion=null;
   if(info)colocar(info.clave,info.valor,x);
   else if(clave)colocar(clave,valor,x);
   if(clave==='cuerpo'){cuerpoExplicito=true;continuacion={tipo:'cuerpo',ultima:x.i};}
   usados.add(x.i);
   continue;
  }
  if(continuacion?.tipo==='lugar'&&x.i===continuacion.ultima+1&&
     !contacto.test(n)&&!cuerpoInicial.test(n)&&(/^[\p{L} .'-]{2,45},\s*[\p{L} .'-]{2,45}\s+\d{4,6}(?:-\d{4})?$/u.test(t)||
    (continuacion.explicita&&/^(?:[\d#]|[\p{L} .'-]{2,40},[\p{L} .'-]{2,40}$)/u.test(t)))){
   continuacion.item.valor+='\n'+t;continuacion.ultima=x.i;usados.add(x.i);continue;
  }
  if(continuacion?.tipo==='cuerpo'){
   datos.cuerpo||={valor:'',i:x.i};
   datos.cuerpo.valor+=(datos.cuerpo.valor?'\n'.repeat(Math.min(2,x.i-continuacion.ultima)):'')+x.original.trimEnd();
   continuacion.ultima=x.i;usados.add(x.i);continue;
  }
  continuacion=null;
  if(tituloProbable(x))candidatos.push(x);
  if(contacto.test(n))colocar('nota',t,x);
 }
 if(fechas.some(x=>x.numero))fechas.sort((a,b)=>(a.numero??Infinity)-(b.numero??Infinity)||a.i-b.i);
 if(fechas.length===1&&horariosSinFecha.length===1&&!fechas[0].hora)fechas[0].hora=horariosSinFecha[0].valor;
 if(fechas[0]?.fecha)datos.fecha={valor:fechas[0].fecha,i:fechas[0].i};
 if(fechas[0]?.hora)datos.hora={valor:fechas[0].hora,i:fechas[0].i};
 if(!fechas.length&&horariosSinFecha.length===1)datos.hora=horariosSinFecha[0];
 if(!datos.fecha&&menciones.length===1)datos.fecha=menciones[0];
 if(ubicaciones.length===1)datos.lugar=ubicaciones[0];
 if(firma){
  const [nombre,cargo]=candidatos;
  if(nombre)colocar('nombre',nombre.t,nombre);
  if(cargo)colocar('cargo',cargo.t,cargo);
 }else if(!datos.titulo&&candidatos.length){
  const titulo=candidatos.find(x=>/^\s*#{1,6}\s|^\s*\*\*[^*]+\*\*\s*$/u.test(x.original))||candidatos[0];
  colocar('titulo',titulo.t,titulo);
 }
 if(datos.titulo)usados.add(datos.titulo.i);
 if(!cuerpoExplicito){
  const cuerpo=rows.filter(x=>!usados.has(x.i));
  datos.lineasCuerpo=cuerpo.map(x=>x.t);
  if(cuerpo.length){
   const valores=cuerpo.map((x,i)=>i&&x.i-cuerpo[i-1].i>1?'\n'+x.original.trimEnd():x.original.trimEnd());
   colocar('cuerpo',valores.join('\n').trim(),cuerpo[0]);
  }
 }
 datos.prensa=Boolean(datos.titulo&&rows.some(x=>x.i!==datos.titulo.i&&
  /^(?:el )?(?:ministerio de relaciones exteriores|gobierno de el salvador)\b/u.test(x.n)&&cuerpoInicial.test(x.n)));
 datos.fechas=fechas.map(({fecha,hora})=>({fecha,hora}));
 return datos;
}

function contenidoPara(raw,item){
 const p=partes(raw),opciones=new Set((item?.variantes||[]).flatMap(v=>[v.nombre,v.alias]).filter(Boolean).map(norm));
 const ignorar=new Set(p.etiquetas.filter(({t})=>{
  const m=/^(?:estilo|version|diseno|variante|ilustracion|composicion)\s+(?:de |del |con )?(.+)$/u.exec(norm(t));
  return m&&opciones.has(m[1]);
 }).map(x=>x.i));
 return p.contenido.filter((_,i)=>!ignorar.has(i)).join('\n').trim();
}

const señalesNaturales = [
 ['prensa|',/^(?:comunicado|comunicacion oficial|se convoca a (?:los )?medios|convocamos a (?:los )?medios)\b/u,86],
 ['avisos|',/^(?:(?:nuevo )?horario de (?:atencion|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)|horario (?:habitual|especial|consular))\b/u,87],
 ['avisos|',/^(?:atencion consular suspendida|interrupcion (?:de|del) servicio|suspension (?:del? servicio|temporal)|aviso consular)\b/u,87],
 ['avisos|',/\b(?:ventanilla|oficina|consulado|atencion consular).{0,100}\b(?:cerrad[oa]s?|suspendid[oa]s?|no (?:habra|atendera))\b/u,89],
 ['atencion-consular|individual',/\b(?:consulado movil|jornada extraordinaria|jornada de atencion consular)\b/u,85],
 ['atencion-consular|mixta',/^(?:programacion de (?:jornadas|consulados)|cartelera consular)\b/u,90],
 ['prensa|',/\b(?:se convoca|convocamos|invitamos) a (?:los )?medios(?: de comunicacion)?\b/u,92],
 ['ad|jornadas-de-salud',/\b(?:jornada de (?:salud|odontologia|bienestar)|brigada medica|jornada (?:odontologica|dental|medica))\b/u,83],
 ['ad|ferias',/\bferia (?:gastronomica|de emprendimiento|de emprendedores)\b/u,83],
 ['ad|cafe',/\b(?:expo cafe|feria (?:del? )?cafe|cafe salvadoreno)\b/u,82],
 ['ad|opus',/\b(?:grupo opus|concierto opus)\b/u,90],
 ['otras-instituciones|',/\b(?:jornada de (?:dui|identificacion)|emision de dui)\b/u,84]
];
const usaMeta = new WeakMap();
function indice(items){
 if(!usaMeta.has(items)){
  const fijas=new Map(pistasFijas.map(([id,v])=>[id,v.split('|')]));
  usaMeta.set(items,items.map(item=>({
   item,nombre:norm(item.nombre),pistas:[...(fijas.get(item.key)||[]),norm(item.nombre)].filter(Boolean),
   variantes:item.variantes.map(v=>({v,nombres:[v.nombre,v.alias,v.id].filter(Boolean).map(norm)}))
  })));
 }
 return usaMeta.get(items);
}
const conservarAlias = (names,v)=>names.some(name=>name===v);
function elegirTipo(p,datos,items){
 const catalogo=indice(items), puntos=new Map();
 const sumar=(id,puntaje)=>puntos.set(id,Math.max(puntaje,puntos.get(id)||0));
 const metas=p.metas.map(norm), disenos=p.disenos.map(norm);
 const rows=filas(p,false).slice(0,15);
 const posibles=rows.slice(0,8).filter(x=>!x.clave||x.clave==='titulo').map(x=>norm(x.clave?x.valor:x.t)).filter(Boolean);
 const titulo=norm(datos.titulo?.valor);
 const invitacion=tituloDeInvitacion(posibles[0]||'',posibles[1]||'');
 const candidatos=metas.length?metas:[...new Set([titulo,...posibles.slice(0,4),invitacion].filter(Boolean))];
 for(const entry of catalogo){
  const {item,nombre,pistas,variantes}=entry;
  if(metas.includes(nombre)){sumar(item.key,120);continue;}
  if(metas.length){
   if(variantes.some(({nombres})=>metas.some(m=>conservarAlias(nombres,m))))sumar(item.key,110);
   else if(metas.some(m=>pistas.includes(m)))sumar(item.key,112);
  }else if(disenos.some(d=>variantes.some(({nombres,v})=>nombres.includes(d)&&norm(v.id)!==d)))sumar(item.key,104);
  for(const [i,line] of candidatos.entries()){
   if(line===nombre)sumar(item.key,95-Math.min(i,3));
   if(variantes.some(({nombres,v})=>nombres.includes(line)&&norm(v.id)!==line))sumar(item.key,88-Math.min(i,3));
   if(line.length>150)continue;
   for(const pista of pistas){
    if(line===pista||line.startsWith(pista+' ')){sumar(item.key,91-Math.min(i,4));continue;}
    const match=medirPista(line,pista);
    if(match>=4&&(!palabrasConectoras.has(line)))sumar(item.key,72+Math.min(9,match)-Math.min(i,4));
   }
  }
 }
 for(const [ruta,id,test] of reglas){
  const pos=candidatos.findIndex(x=>test.test(x));
  if(pos>=0)sumar(key(ruta,id),87-Math.min(pos,4));
 }
 if(!metas.length){
  for(const [id,test,fuerza] of señalesNaturales)if(rows.some(x=>!x.clave&&test.test(x.n)))sumar(id,fuerza);
  if(datos.prensa)sumar('prensa|',93);
  if(datos.horarioSemanal&&rows.some(x=>/\bconsulad[oa]s?\b/u.test(x.n)))sumar('avisos|',96);
  if(datos.correo&&datos.telefono&&rows.length>=3&&rows.length<=6&&!datos.fecha&&!datos.lugar&&
     rows.filter(tituloProbable).length>=2&&!rows.some(x=>cuerpoInicial.test(x.n)))sumar('interno|firma',89);
 }
 if(!metas.length&&(puntos.get('avisos|')||0)>=87&&rows.some(x=>
  /\b(?:cerrad[oa]s?|suspendid[oa]s?|suspension|no (?:habra|atendera))\b/u.test(x.n))&&
  !rows.some(x=>/\b(?:te invitamos|les invitamos|se realizara|ofrecera servicios)\b/u.test(x.n)))sumar('avisos|',100);
 if((puntos.get('ad|opus')||0)>=(puntos.get('ad|musica')||Infinity))puntos.delete('ad|musica');
 if((puntos.get('atencion-consular|mixta')||0)>=90&&(puntos.get('atencion-consular|individual')||0)<100&&
    rows.some(x=>/^cartelera\b/u.test(x.n)))puntos.delete('atencion-consular|individual');
 const posiblesTipos=catalogo.filter(x=>puntos.has(x.item.key)).map(x=>({...x,puntaje:puntos.get(x.item.key)}));
 posiblesTipos.sort((a,b)=>b.puntaje-a.puntaje);
 const mejor=posiblesTipos[0]?.puntaje||0;
 return posiblesTipos.filter(x=>x.puntaje>=75&&mejor-x.puntaje<=4).slice(0,2);
}
const mejorPorDefecto={
 'avisos|':'normal',
 'esquelas|':'otro'
};
function elegirVariante(entry,p,datos,raw){
 const {item,variantes}=entry;
 if(variantes.length<2)return [variantes[0]?.v.id||''];
 const pedido=[...p.disenos,...p.metas].map(norm);
 const elegidas=variantes.filter(({nombres})=>pedido.some(nombre=>nombres.includes(nombre))).map(({v})=>v.id);
 if(elegidas.length)return elegidas.slice(0,2);
 const lineas=filas(p,false).slice(0,8).map(({t})=>norm(t));
 const literales=variantes.filter(({v,nombres})=>lineas.some(line=>
  nombres.some(n=>n!==norm(v.id)&&(line===n||line.replace(/^(?:estilo|version|diseno|variante|ilustracion|composicion) (?:de |del |con )?/u,'')===n))));
 if(literales.length)return literales.slice(0,2).map(x=>x.v.id);
 const contexto=[...p.metas.map(norm),...lineas].join(' ');
 if(item.ruta==='prensa'){
  const convocatoria=/\b(?:convocatoria (?:a (?:los )?medios|de prensa)|(?:convoca(?:mos)?|invitamos) a (?:los )?medios|rueda de prensa)\b/u.test(contexto);
  const texto=datos.cuerpo?.valor||raw;
  const extensa=texto.length>1250||/\b(?:texto extenso|formato largo|version larga)\b/u.test(contexto);
  return [convocatoria?(extensa?'ucom-convocatoria-larga':'ucom-convocatoria'):(extensa?'ucom-largo':'ucom-comunicado')];
 }
 if(item.key==='ad|ferias'&&/\bferia gastronomica\b/u.test(contexto))return ['v2'];
 if(item.key==='ad|ferias'&&/\bferia de emprendi/u.test(contexto))return ['v1'];
 if(item.ruta==='esquelas'){
  const autoridad=/\besquela (?:de (?:la |el )?)?(viceministr[oa]|vicecanciller|canciller)\b/u.exec(contexto)?.[1];
  if(autoridad)return [autoridad.startsWith('viceministr')?'viceministro':autoridad];
 }
 return [mejorPorDefecto[item.key]||variantes[0].v.id];
}
function proponer(raw,items){
 const p=partes(raw);
 const datos=extraer(raw);
 const tipos=elegirTipo(p,datos,items);
 const opciones=[];
 for(const tipo of tipos){
  // Con dos tipos plausibles se muestra un diseño de cada uno.
  const ids=elegirVariante(tipo,p,datos,raw).slice(0,tipos.length===2?1:2);
  for(const variante of ids){
   const v=tipo.item.variantes.find(x=>x.id===variante);
   opciones.push({key:tipo.item.key,variante,diferencia:v?.detalle||tipo.item.detalle});
  }
 }
 return {status:opciones.length===0?'manual':opciones.length===1?'sugerencia':'ambigua',opciones,datos:tipos[0]?.item.id==='firma'?extraer(raw,tipos[0].item):datos,raw};
}
const separadorPieza=/^\s*(?:={3,}|\*{3,}|-{3,}|_{3,})\s*$/u;
const marcaPieza=/^\s*(?:#{1,6}\s*)?(?:arte|pieza)\s+(?:n[.º°]?\s*)?\d+(?:\s*[:.)–—-]\s*(.*))?\s*$/iu;
function separarPiezas(raw){
 const lineas=raw.split(/\r\n?|\n/u);
 const piezas=[];
 let actual=[];
 const agregar=()=>{
  const texto=actual.join('\n').trim();
  if(texto)piezas.push(texto);
  actual=[];
 };
 for(const linea of lineas){
  const marca=linea.match(marcaPieza);
  if(marca){agregar();if(marca[1])actual.push(marca[1]);continue;}
  if(separadorPieza.test(linea)){agregar();continue;}
  // Dos etiquetas de plantilla delimitan piezas incluso sin separador.
  if(/^\s*(?:plantilla|tipo de arte|arte)\s*:/iu.test(linea)&&
     actual.some(x=>/^\s*(?:plantilla|tipo de arte|arte)\s*:/iu.test(x)))agregar();
  actual.push(linea);
 }
 agregar();
 return piezas;
}
function analizar(raw,items=[]){
 if(typeof raw!=='string'||!raw.trim())return {status:'vacio',piezas:[]};
 if(raw.length>cap)return {status:'limite',piezas:[]};
 const partidas=separarPiezas(raw);
 const piezas=(partidas.length>1?partidas:[raw]).map(texto=>proponer(texto,items));
 return {status:'listo',piezas,raw};
}
function revisar(raw,items=[]){
 const r=analizar(raw,items);
 return r.piezas[0]||{status:r.status,opciones:[]};
}
global.exteriorRecomendarArte={norm,partes,entries,revisar,analizar,extraer,contenidoPara,cap};
})(typeof window==='undefined'?globalThis:window);
