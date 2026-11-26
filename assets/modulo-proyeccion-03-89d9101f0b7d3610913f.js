/* Proyecto 03 — Proyección semanal. Módulo local e independiente de PNG. */
(function(){
'use strict';
const root=document.getElementById('proy');
if(!root)return;
const E=id=>document.getElementById(id);
const F='"AD Montserrat",Montserrat,system-ui,sans-serif', L=F;
const portadaFuente='"Noto Sans",system-ui,sans-serif';
const muestraTexto='Proyección de temas · miércoles · Día del Salvadoreño en el Exterior';
let fuentesListas;
function prepararFuentesProyeccion(){
 if(!fuentesListas&&document.fonts?.load)fuentesListas=Promise.all(
  [400,500,700].map(peso=>document.fonts.load(peso+' 18px '+F,muestraTexto))
 ).catch(()=>{});
 return fuentesListas||Promise.resolve();
}
function promptProyeccion(meta={}){
 const desde=dateValid(meta.semana_inicio)?meta.semana_inicio:'[AAAA-MM-DD]';
 const hasta=dateValid(meta.semana_fin)?meta.semana_fin:'[AAAA-MM-DD]';
 const corte=dateValid(meta.fecha_corte)?meta.fecha_corte:'[AAAA-MM-DD]';
 const elab=dateValid(meta.fecha_elaboracion)?meta.fecha_elaboracion:'[AAAA-MM-DD]';
 return `Prepará la proyección semanal de temas de la Dirección de Comunicaciones usando únicamente la matriz maestra que adjunto. Período inclusivo: ${desde} a ${hasta}. Fecha de corte: ${corte}. Fecha de elaboración: ${elab}. Si dejé el período sin completar, pedímelo antes de generar la agenda. Dejá sin completar una fecha de corte o elaboración que no te haya indicado.

Revisá las pestañas Sede y Exterior. Tomá el ID de la columna A, el asunto de D, la fecha o próximo hito de L y el estado de M. Consultá el contexto y seguimiento interno solo para interpretar alcance, participación y confirmación. Incluí únicamente hitos o plazos de la semana seleccionada. Para una actividad con varios hitos, conservá el mismo ID y separá cada fecha relevante; para un solo evento continuo, usá su fecha final en «Fecha fin». Si empezó antes de la semana y continúa en ella, ubicá el hito en el primer día pertinente de la semana y aclaralo en el título sin cambiar la fecha real. Omití actividades ya cerradas, suspendidas o canceladas y las que no tengan fecha verificable dentro del período. No confundás una anotación de agenda con ejecución o confirmación. No inventés fechas, horas, autoridades ni cobertura. Diferenciá coordinación propia de solo seguimiento cuando conste.
 
Usá «Tipo: POTENCIAL_PRESIDENCIAL» solo para un hito con sustento explícito en la matriz. Si hubiera varios, marcá únicamente el mejor sustentado y dejá los demás en la agenda. No deduzcás participación presidencial por la importancia del evento o por la presencia de otra autoridad. Si no hay sustento, omití la etiqueta: Exterior mostrará «Sin temas identificados para esta semana».

Separá Sede y Exterior, y ordená cada sección por fecha. Creá «Grupo: [nombre exacto]» solo para una efeméride, campaña o agenda transversal real con actividades de esa semana; cuando no aplique usá «Grupo:» sin valor para limpiar la agrupación previa. Usá «Subgrupo: [región o eje]» solo si hay varios bloques de un mismo día; reinicialo con «Subgrupo:» cuando termine. El Día del Salvadoreño en el Exterior es un grupo opcional, no lo agregués por defecto. Conservá los ID exactamente, incluidos decimales. Redactá un título breve por actividad, directo y en español institucional; agregá lugar, hora o estado únicamente si constan y aportan. No incluyás datos personales, enlaces internos, instrucciones de la matriz, explicaciones, Markdown ni JSON.

Devolvé solo texto plano en este formato. Reemplazá lo que está entre corchetes, omití líneas opcionales sin datos y repetí los bloques necesarios. No copiés los ejemplos ni inventés actividades para llenar secciones.

Proyección de temas
Semana: ${desde} a ${hasta}
Fecha de corte: ${corte}
Fecha de elaboración: ${elab}
Fuente general: Matriz maestra

SEDE
[AAAA-MM-DD]
ID [ID exacto] | [Título breve de actividad]
Tipo: POTENCIAL_PRESIDENCIAL
Representación: [Unidad que coordina, solo si consta]
Horario: [Hora local, si consta]
Confirmación: [Estado, si consta]
Fecha fin: [AAAA-MM-DD, solo si aplica]

EXTERIOR
Grupo: [Efeméride opcional]
[AAAA-MM-DD]
Subgrupo: [Región o eje opcional]
ID [ID exacto] | [Título breve de actividad]
Ciudad: [Ciudad, si consta]
País: [País, si aporta contexto]
Representación: [Embajada, consulado o misión, solo si consta]
Confirmación: [Estado, si consta]`;
}
const escP=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const metakeys=[['titulo','Título del documento'],['semana_inicio','Inicio de la semana (AAAA-MM-DD)'],['semana_fin','Fin de la semana (AAAA-MM-DD)'],['fecha_elaboracion','Fecha de elaboración (AAAA-MM-DD)'],['fecha_corte','Fecha de corte (AAAA-MM-DD)'],['unidad','Unidad responsable'],['gabinete','Gabinete'],['institucion','Institución'],['fuente_general','Fuente general']];
const fields=[['id','ID'],['seccion','Ámbito'],['fecha_inicio','Fecha inicial (AAAA-MM-DD)'],['fecha_fin','Fecha final (opcional)'],['titulo','Actividad'],['titulo_ejecutivo','Título ejecutivo (opcional)'],['pais','País'],['ciudad','Ciudad'],['representacion','Representación'],['horario','Horario'],['grupo','Agrupación temática'],['subgrupo','Subgrupo'],['tipo','Tipo de actividad'],['confirmacion','Confirmación'],['fuente','Fuente'],['observaciones','Observaciones']];
const defaultMeta=()=>({titulo:'Proyección de temas',unidad:'Dirección de Comunicaciones',institucion:'Ministerio de Relaciones Exteriores',gabinete:'Gabinete de Política Exterior',semana_inicio:'',semana_fin:'',fecha_corte:'',fecha_elaboracion:'',fuente_general:''});
const nuevo=seccion=>({id:'',seccion,fecha_inicio:'',fecha_fin:'',pais:'',ciudad:'',representacion:'',titulo:'',titulo_ejecutivo:'',horario:'',grupo:'',subgrupo:'',tipo:'ACTIVIDAD',confirmacion:'NO_CONSTA',fuente:'',observaciones:'',excluido:false});
let state={metadatos:defaultMeta(),eventos:[],advertencias:[],estado_extraccion:'',original:'',texto_sin_clasificar:[],filter:'TODOS'};
let pages=[],actual=0,timer=0,busy=false,uid=0;
const letters=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
const months=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const colors={navy:'#111e60',dark:'#151d44',royal:'#111e60',gold:'#edc84d',sand:'#c9a892',pale:'#f5f7fc',white:'#ffffff',ink:'#152456',muted:'#68748d',line:'#dce4f1',cardDark:'#24346e'};
function dateValid(v){if(!/^\d{4}-\d\d-\d\d$/.test(v))return false;const d=new Date(v+'T12:00:00Z');return !isNaN(d)&&d.toISOString().slice(0,10)===v;}
function dateInfo(iso){if(!dateValid(iso))return null;const d=new Date(iso+'T12:00:00Z');return {date:d,day:d.getUTCDate(),month:d.getUTCMonth(),year:d.getUTCFullYear(),weekday:letters[d.getUTCDay()]};}
function formatDate(iso,full=false){const d=dateInfo(iso);return d?d.weekday+' '+d.day+(full?' de '+months[d.month]+' de '+d.year:''):(iso||'Fecha pendiente');}
function weekText(a,b){const i=dateInfo(a),f=dateInfo(b);if(!i||!f)return [a,b].filter(Boolean).join(' al ')||'Período sin indicar';return i.month===f.month&&i.year===f.year?`Del ${i.day} al ${f.day} de ${months[f.month]} de ${f.year}`:`Del ${i.day} de ${months[i.month]} al ${f.day} de ${months[f.month]} de ${f.year}`;}
function dateShort(iso){const d=dateInfo(iso);return d?`${String(d.day).padStart(2,'0')}/${String(d.month+1).padStart(2,'0')}/${d.year}`:(iso||'Sin indicar');}
function copyEvt(src){const e=nuevo(src?.seccion||'');if(src)for(const [k] of fields)e[k]=Object.hasOwn(src,k)?String(src[k]??''):'';e.excluido=Boolean(src?.excluido);e._uid=++uid;if(src?._originalExtra)e._originalExtra=src._originalExtra;return e;}
function warningsFor(s){const w=[];if(s.metadatos.semana_inicio&&!dateValid(s.metadatos.semana_inicio))w.push('La fecha de inicio de semana requiere AAAA-MM-DD válido.');if(s.metadatos.semana_fin&&!dateValid(s.metadatos.semana_fin))w.push('La fecha final de semana requiere AAAA-MM-DD válido.');if(dateValid(s.metadatos.semana_inicio)&&dateValid(s.metadatos.semana_fin)&&s.metadatos.semana_fin<s.metadatos.semana_inicio)w.push('La semana termina antes de comenzar.');s.eventos.forEach((e,i)=>{if(!['SEDE','EXTERIOR'].includes(e.seccion))w.push(`Registro ${i+1}: seleccionar Sede o Exterior antes de exportar.`);if(!e.titulo.trim())w.push(`Registro ${i+1}: falta el título.`);if(e.fecha_inicio&&!dateValid(e.fecha_inicio))w.push(`Registro ${i+1}: fecha inicial no válida («${e.fecha_inicio}»).`);if(e.fecha_fin&&!dateValid(e.fecha_fin))w.push(`Registro ${i+1}: fecha final no válida («${e.fecha_fin}»).`);if(dateValid(e.fecha_inicio)&&dateValid(e.fecha_fin)&&e.fecha_fin<e.fecha_inicio)w.push(`Registro ${i+1}: la fecha final es anterior a la inicial.`);});return w;}
function normalizarJson(obj){
 const pendientes=[[obj,0]];let nodos=0;
 while(pendientes.length){const [v,prof]=pendientes.pop();if(++nodos>60000||prof>25)throw Error('El JSON es demasiado complejo. Dividir el archivo.');
  if(typeof v==='string'&&v.length>30000)throw Error('Un campo del JSON supera el tamaño permitido.');
  if(v&&typeof v==='object'){for(const k of Object.keys(v)){if(['__proto__','constructor','prototype'].includes(k))throw Error('El JSON contiene campos no permitidos.');pendientes.push([v[k],prof+1]);}}}

 // Compatible con PROYECCION_TEMAS_V1 y listados JSON habituales de proyección.
 // Un documento sin colección de actividades se rechaza sin tocar el formulario.
 const esLista=Array.isArray(obj);
 if(!obj||typeof obj!=='object')throw Error('El archivo debe contener un JSON de actividades de proyección.');
 if(!esLista&&obj.formato&&obj.formato!=='PROYECCION_TEMAS_V1')
  throw Error('Formato JSON no reconocido («'+obj.formato+'»). Se espera PROYECCION_TEMAS_V1.');
 const registros=esLista?obj:(obj.eventos??obj.actividades??obj.registros??obj.items);
 if(Array.isArray(registros)&&registros.length>500)throw Error('Cargar hasta 500 actividades por archivo.');
 if(!Array.isArray(registros))throw Error('El JSON debe contener un listado «eventos», «actividades» o «registros».');
 const w=[], m={...defaultMeta()}, fuente=esLista?{}:(obj.metadatos||obj.metadata||{});
 const metaAlias={semana_inicio:['semana_inicio','inicio','fecha_inicio'],semana_fin:['semana_fin','fin','fecha_fin'],
  fecha_elaboracion:['fecha_elaboracion','elaborado'],fecha_corte:['fecha_corte','corte'],
  fuente_general:['fuente_general','fuente'],titulo:['titulo','nombre'],unidad:['unidad','responsable'],
  gabinete:['gabinete'],institucion:['institucion']};
 for(const [k,lista] of Object.entries(metaAlias)){
  const v=lista.map(n=>fuente[n]??(!esLista?obj[n]:null)).find(v=>v!=null&&String(v).trim());
  if(v!=null)m[k]=String(v).trim();
 }
 const alias={id:['id','ID','numero','número'],seccion:['seccion','ámbito','ambito','scope'],
  titulo:['titulo','actividad','nombre','evento','title'],titulo_ejecutivo:['titulo_ejecutivo','resumen','titulo_corto'],
  fecha_inicio:['fecha_inicio','fecha','inicio','dia'],fecha_fin:['fecha_fin','hasta','fin'],
  ciudad:['ciudad','municipio'],pais:['pais','país'],representacion:['representacion','representación','oficina'],
  horario:['horario','hora'],grupo:['grupo','agrupacion','agrupación','categoria','categoría'],
  subgrupo:['subgrupo','subcategoria','subcategoría'],tipo:['tipo','clasificacion','clasificación'],
  confirmacion:['confirmacion','confirmación'],fuente:['fuente','fuentes'],observaciones:['observaciones','notas']};
 const normalFecha=v=>{const val=String(v??'').trim();if(!val)return '';
  if(dateValid(val))return val;
  const match=/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/.exec(val);
  if(match){const iso=`${match[3]}-${match[2].padStart(2,'0')}-${match[1].padStart(2,'0')}`;if(dateValid(iso))return iso;}
  return val;
 };
 const eventos=registros.map((r,i)=>{
  if(!r||typeof r!=='object'||Array.isArray(r)){
   w.push(`Registro ${i+1}: estructura no reconocida; se conserva para revisión.`);
   return copyEvt({seccion:'',titulo:'',observaciones:JSON.stringify(r)});
  }
  const limpio={};const usadas=new Set();
  for(const [clave,variantes] of Object.entries(alias)){
   const k=variantes.find(key=>Object.hasOwn(r,key)&&r[key]!=null);
   if(k!==undefined){limpio[clave]=r[k];usadas.add(k);}
  }
  limpio.excluido=Boolean(r.excluido);if(Object.hasOwn(r,'excluido'))usadas.add('excluido');
  const e=copyEvt(limpio);
  e.fecha_inicio=normalFecha(e.fecha_inicio);e.fecha_fin=normalFecha(e.fecha_fin);
  const valor=String(e.seccion||'').trim().toLocaleUpperCase('es');
  if(/^(SEDE|CANCILLER[IÍ]A|CENTRAL)$/.test(valor))e.seccion='SEDE';
  else if(/^(EXTERIOR|SERVICIO EXTERIOR|RED CONSULAR|RDC)$/.test(valor))e.seccion='EXTERIOR';
  else{w.push(`Registro ${i+1}: ámbito sin identificar («${e.seccion||'vacío'}»).`);e._originalSeccion=e.seccion;e.seccion='';}
  if(!e.id)w.push(`Registro ${i+1}: ID vacío; se conserva el registro.`);
  if(!e.titulo)w.push(`Registro ${i+1}: actividad sin título; revisar antes de exportar.`);
  const extras=Object.keys(r).filter(k=>!usadas.has(k));
  if(extras.length){e._originalExtra=Object.fromEntries(extras.map(k=>[k,r[k]]));
   w.push(`Registro ${i+1}: campos adicionales conservados (${extras.join(', ')}).`);}
  if(e._originalSeccion)e._originalExtra={...(e._originalExtra||{}),seccion_original:e._originalSeccion};
  return e;
 });
 const advertencias=!esLista&&Array.isArray(obj.advertencias)
  ?obj.advertencias.map(a=>typeof a==='string'?a:JSON.stringify(a)):[];
 return {metadatos:m,eventos,advertencias:[...advertencias,...w],
  estado_extraccion:String(esLista?'':obj.estado_extraccion||''),texto_sin_clasificar:[]};
}
function isoFromParts(d,m,y){const mm=months.findIndex(x=>x.startsWith(String(m||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')));if(mm<0)return '';const str=`${y}-${String(mm+1).padStart(2,'0')}-${String(+d).padStart(2,'0')}`;return dateValid(str)?str:'';}
function interpretarFecha(linea,meta){let m=linea.match(/\b(\d{4}-\d\d-\d\d)\b/);if(m)return m[1];m=linea.match(/\b(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})\b/);if(m){const t=`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;return dateValid(t)?t:'';}m=linea.match(/\b(\d{1,2})\s+de\s+([a-záéíóúñ]+)(?:\s+de\s+(\d{4}))?/i);if(m)return isoFromParts(m[1],m[2],m[3]||(meta.semana_inicio||'').slice(0,4)||(meta.semana_fin||'').slice(0,4)||'');return '';}
function normalizarTexto(texto){const lines=String(texto).replace(/\r\n?/g,'\n').split('\n');const meta=defaultMeta();const w=[],ev=[],sin=[];let sec='',fecha='',grupo='',subgrupo='',current=null;const encabezadoSemana=texto.match(/\bdel\s+(\d{1,2})\s+al\s+(\d{1,2})\s+de\s+([a-záéíóú]+)\s+de\s+(\d{4})/i);if(encabezadoSemana){meta.semana_inicio=isoFromParts(encabezadoSemana[1],encabezadoSemana[3],encabezadoSemana[4]);meta.semana_fin=isoFromParts(encabezadoSemana[2],encabezadoSemana[3],encabezadoSemana[4]);}
 for(let n=0;n<lines.length;n++){
  const l=lines[n].trim().replace(/^\*\*(.+)\*\*$/,'$1');if(!l)continue;
  const semana=l.match(/^Semana\s*:\s*(\d{4}-\d{2}-\d{2})\s+(?:a|al)\s+(\d{4}-\d{2}-\d{2})$/i);
  if(semana){if(!dateValid(semana[1])||!dateValid(semana[2])||semana[2]<semana[1])throw Error('Revisar las fechas del período en «Semana».');[meta.semana_inicio,meta.semana_fin]=semana.slice(1);continue;}
  const fuenteGeneral=l.match(/^Fuente general\s*:\s*(.+)$/i);
  if(fuenteGeneral){meta.fuente_general=fuenteGeneral[1].trim();continue;}
  if(/^proyecci[oó]n\s+de\s+temas\s*$/i.test(l)){meta.titulo=l;continue;}
  if(/^\s*(?:#{1,3}\s*)?(?:agenda\s+de\s+)?sede(?:\s*[·–-].*)?\s*:?[\s#]*$/i.test(l)){sec='SEDE';fecha='';grupo='';subgrupo='';current=null;continue;}
  if(/^\s*(?:#{1,3}\s*)?(?:servicio\s+)?exterior(?:\s*[·–-].*)?\s*:?[\s#]*$/i.test(l)){sec='EXTERIOR';fecha='';grupo='';subgrupo='';current=null;continue;}
  const scope=l.match(/^(?:ámbito|secci[oó]n)\s*:\s*(sede|exterior)/i);if(scope){sec=scope[1].toUpperCase();fecha=grupo=subgrupo='';current=null;continue;}
  const corte=l.match(/(?:fecha\s+de\s+corte|corte)\s*:\s*(.+)$/i);if(corte){meta.fecha_corte=interpretarFecha(corte[1],meta)||corte[1].trim();continue;}
  const elab=l.match(/(?:fecha\s+de\s+elaboraci[oó]n|elaborado\s+el)\s*:?\s*(.+)$/i);if(elab){meta.fecha_elaboracion=interpretarFecha(elab[1],meta)||elab[1].trim();continue;}
  const gr=l.match(/^(?:grupo|agenda|agrupaci[oó]n)(?:\s+tem[aá]tica)?\s*:\s*(.*)$/i);if(gr){grupo=gr[1].trim();subgrupo='';current=null;continue;}
  const sub=l.match(/^subgrupo\s*:\s*(.+)$/i);if(sub){subgrupo=sub[1].trim();continue;}
  // Encabezados abreviados del tipo «SÁBADO 28 · CULTURA».
  const diaBreve=l.match(/^(?:#{1,5}\s*)?(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\s+(\d{1,2})(?:\s*[·–|]\s*(.+))?\s*$/i);
  if(diaBreve&&sec){
   const base=dateInfo(meta.semana_inicio)||dateInfo(meta.semana_fin);
   if(base){const valor=`${base.year}-${String(base.month+1).padStart(2,'0')}-${diaBreve[2].padStart(2,'0')}`;
    if(dateValid(valor)){fecha=valor;subgrupo=diaBreve[3]?.trim()||'';current=null;continue;}}
   w.push(`Línea ${n+1}: fecha abreviada sin mes o año verificable; revisar «${l}».`);
  }
  const datehead=/^(?:(?:#{1,5}|[-*])\s*)?(?:(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\s*,?\s+)?(\d{1,2})\s+(?:de\s+)?([a-záéíóúñ]+)(?:\s+de\s+\d{4})?\s*:?[\s#]*$/i;
  const dh=l.match(datehead);if(dh&&sec){const d=interpretarFecha(l,meta);if(d){fecha=d;current=null;continue;}}
  if(/^\d{4}-\d\d-\d\d\s*$/.test(l)&&sec){if(!dateValid(l))throw Error('Fecha no válida en la línea '+(n+1)+'.');fecha=l;subgrupo='';current=null;continue;}
  const field=l.match(/^(id|pa[ií]s|ciudad|representaci[oó]n|t[ií]tulo|horario|tipo|confirmaci[oó]n|observaciones?|fuente|fecha\s+inicio|fecha\s+fin)\s*:\s*(.*)$/i);
  if(field&&current){const key=field[1].normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();const map={'pais':'pais','ciudad':'ciudad','representacion':'representacion','titulo':'titulo','horario':'horario','tipo':'tipo','confirmacion':'confirmacion','fuente':'fuente','observacion':'observaciones','observaciones':'observaciones','id':'id','fecha inicio':'fecha_inicio','fecha fin':'fecha_fin'};const k=map[key];if(k){current[k]=field[2].trim();continue;}}
  const item=l.match(/^(?:[-*•]\s*)?(?:ID\s*[:#]?\s*)?(\d+(?:\.\d+)?)\s*(?:[\-–—:|·.)]\s*|\s+)(.+)$/i);
  if(item&&sec){current=copyEvt({id:item[1],seccion:sec,fecha_inicio:fecha,titulo:item[2].trim(),grupo,subgrupo});ev.push(current);if(!fecha)w.push(`Línea ${n+1}: registro sin fecha, revisar manualmente.`);continue;}
  const activity=l.match(/^[-*•]\s+(.+)$/);
  if(activity&&sec){current=copyEvt({seccion:sec,fecha_inicio:fecha,grupo,subgrupo,titulo:activity[1]});ev.push(current);w.push(`Línea ${n+1}: actividad sin ID; se conservó para edición.`);continue;}
  if(sec&&current){current.observaciones=[current.observaciones,l].filter(Boolean).join('\n');continue;}
  if(sec){current=copyEvt({seccion:sec,fecha_inicio:fecha,grupo,subgrupo,titulo:l});ev.push(current);w.push(`Línea ${n+1}: texto conservado como actividad para revisar.`);continue;}
  sin.push(l);
 }
 if(!ev.length)throw Error('No se reconocieron actividades. Separar el texto con encabezados «Sede» y «Exterior», fechas y actividades.');
 if(sin.length)w.push(`${sin.length} líneas sin clasificar permanecen en «Notas de importación».`);
 return {metadatos:meta,eventos:ev,advertencias:w,texto_sin_clasificar:sin,estado_extraccion:'REVISAR'};
}
function parseInput(text){if(String(text||'').length>2*1024*1024)throw Error('El texto supera 2 MB. Dividirlo antes de importarlo.');const t=String(text||'').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim();if(!t)throw Error('Pegar el JSON o el texto de la proyección.');if(t[0]==='{ '||t[0]==='{'||t[0]==='['){let obj;try{obj=JSON.parse(t);}catch(err){throw Error('JSON inválido: '+err.message+'. Corregir el texto y volver a intentarlo.');}return normalizarJson(obj);}return normalizarTexto(t);}
function metaForm(){E('proyMeta').innerHTML=metakeys.map(([key,label])=>`<label class="proy-label">${label}<input data-proy-meta="${key}" type="text" value="${escP(state.metadatos[key]??'')}" ${key.includes('fecha')||key.startsWith('semana')?'placeholder="AAAA-MM-DD"':''} autocomplete="off"></label>`).join('');}
function updateCount(){const visible=state.eventos.filter(e=>e.seccion===state.filter||state.filter==='TODOS').length;E('proyRegistroCount').textContent=`${visible} de ${state.eventos.length} actividades`;E('proyNotice').textContent=warningsFor(state).length?`${warningsFor(state).length} datos necesitan revisión.`:'';}
function inputField(e,key,index){const label=fields.find(f=>f[0]===key)?.[1]||key;let input;if(key==='seccion')input=`<select data-proy-index="${index}" data-proy-field="seccion"><option value="" ${!e.seccion?'selected':''}>Seleccionar ámbito</option><option value="SEDE" ${e.seccion==='SEDE'?'selected':''}>Sede</option><option value="EXTERIOR" ${e.seccion==='EXTERIOR'?'selected':''}>Exterior</option></select>`;else if(key==='confirmacion')input=`<select data-proy-index="${index}" data-proy-field="confirmacion">${['NO_CONSTA','CONFIRMADA','POR_CONFIRMAR','TENTATIVA','CANCELADA'].map(v=>`<option value="${v}" ${e.confirmacion===v?'selected':''}>${v.replaceAll('_',' ')}</option>`).join('')}${!['NO_CONSTA','CONFIRMADA','POR_CONFIRMAR','TENTATIVA','CANCELADA'].includes(e.confirmacion)?`<option selected value="${escP(e.confirmacion)}">${escP(e.confirmacion)}</option>`:''}</select>`;else if(key==='observaciones'||key==='titulo')input=`<textarea rows="${key==='observaciones'?2:2}" data-proy-index="${index}" data-proy-field="${key}">${escP(e[key])}</textarea>`;else input=`<input type="text" data-proy-index="${index}" data-proy-field="${key}" value="${escP(e[key])}" autocomplete="off">`;return `<label class="proy-label">${label}${input}</label>`;}
function eventList(){const cont=E('proyEventos');const arr=state.eventos.map((e,i)=>({e,i})).filter(({e})=>state.filter==='TODOS'||e.seccion===state.filter);cont.innerHTML=arr.length?arr.map(({e,i})=>{
 const main=['id','seccion','fecha_inicio','fecha_fin','titulo','horario','grupo','subgrupo'];const ext=['pais','ciudad','representacion'];const rest=['tipo','confirmacion','fuente','observaciones'];return `<details class="proy-item"><summary><span class="proy-index">${i+1}</span><strong>${escP(e.id?'ID '+e.id+' · ':'')}${escP((e.titulo||'Actividad sin título').slice(0,100))}</strong><small>${escP(e.seccion||'Ámbito pendiente')} · ${escP(e.fecha_inicio||'Sin fecha')}${e.excluido?' · Excluida':''}</small></summary><div class="proy-item-content"><div class="proy-fields">${main.map(k=>inputField(e,k,i)).join('')}${(e.seccion!=='SEDE'?ext:[]).map(k=>inputField(e,k,i)).join('')}${rest.map(k=>inputField(e,k,i)).join('')}</div>${e._originalExtra?`<p class="proy-extra">Datos adicionales originales: ${escP(JSON.stringify(e._originalExtra))}</p>`:''}<div class="proy-tools"><label class="proy-exclude"><input type="checkbox" data-proy-index="${i}" data-proy-field="excluido" ${e.excluido?'checked':''}> Excluir del PDF</label>${[['up','↑ Subir'],['down','↓ Bajar'],['duplicate','Duplicar'],['remove','Eliminar']].map(([a,t])=>`<button type="button" class="g" data-proy-action="${a}" data-proy-index="${i}">${t}</button>`).join('')}</div></div></details>`;
 }).join(''):'<p class="field-help">Todavía no hay actividades en esta vista.</p>';updateCount();groupList();}
function groupList(){const groups=[...new Set(state.eventos.map(e=>e.grupo.trim()).filter(Boolean))];E('proyGrupos').innerHTML=groups.length?groups.map((v,i)=>`<div class="proy-group"><span>${escP(v)} <small>(${state.eventos.filter(e=>e.grupo.trim()===v).length})</small></span><button type="button" class="g" data-proy-delgroup="${i}">Quitar agrupación</button></div>`).join(''):'<p class="field-help">Las agrupaciones aparecerán cuando se indiquen en alguna actividad.</p>';}
function showWarnings(){const warnings=[...(state.estado_extraccion&&state.estado_extraccion!=='COMPLETA'?['Estado de extracción: '+state.estado_extraccion+'. Revisar los datos importados.']:[]),...state.advertencias,...warningsFor(state)];E('proyWarnings').hidden=!warnings.length;E('proyWarningsList').replaceChildren(...warnings.slice(0,100).map(msg=>{const li=document.createElement('li');li.textContent=msg;return li;}));const more=warnings.length>100;if(more){const li=document.createElement('li');li.textContent=`… y ${warnings.length-100} advertencias más.`;E('proyWarningsList').append(li);}E('proyNotas').value=state.texto_sin_clasificar.join('\n');}
function mount(){metaForm();eventList();showWarnings();E('proyRaw').value=state.original;E('proyFilter').value=state.filter;schedule();}
function schedule(){clearTimeout(timer);timer=setTimeout(()=>{try{renderPreview();}catch(err){E('proyStatus').textContent='No se pudo actualizar la vista previa: '+err.message;console.error(err);}},190);}
function wrap(g,text,maxWidth){const out=[];for(const paragraph of String(text||'').split('\n')){const words=paragraph.trim().split(/\s+/).filter(Boolean);if(!words.length){out.push('');continue;}let line='';for(let word of words){if(g.measureText(word).width>maxWidth){const parts=[];let piece='';for(const c of word){if(piece&&g.measureText(piece+c).width>maxWidth){parts.push(piece);piece=c;}else piece+=c;}if(piece)parts.push(piece);for(const w of parts){if(line){out.push(line);line='';}out.push(w);}continue;}if(line&&g.measureText(line+' '+word).width>maxWidth){out.push(line);line=word;}else line=line?line+' '+word:word;}if(line)out.push(line);}return out.length?out:[''];}
function itemParts(g,e,usable,maxHeight){
 // Síntesis para publicación: ID en su propio recuadro, texto ejecutivo y datos
 // necesarios, sin reproducir observaciones, fuentes, confirmaciones o historiales.
 let shown=String(e.titulo_ejecutivo||e.titulo||'(Título pendiente)').trim();
 const horario=String(e.horario||'').trim();
 if(horario&&!shown.toLocaleLowerCase('es').includes(horario.toLocaleLowerCase('es')))shown+=' · '+horario;
 if(e.fecha_fin&&e.fecha_fin!==e.fecha_inicio){
  const a=dateInfo(e.fecha_inicio),b=dateInfo(e.fecha_fin);
  if(a&&b)shown+=a.month===b.month&&a.year===b.year?` · ${a.day}–${b.day} ${months[b.month].slice(0,3)}.`:` · hasta ${b.day} ${months[b.month].slice(0,3)}.`;
 }
 if(e.seccion==='EXTERIOR'){
  const lower=shown.toLocaleLowerCase('es');
  const lugar=[e.ciudad,e.pais].map(t=>String(t||'').trim()).find(t=>t&&!lower.includes(t.toLocaleLowerCase('es')));
  if(lugar)shown+=' · '+lugar;
 }
 let tSize=13,sSize=11,tLh=17,sLh=14;
 const medir=()=>{
  g.font='500 '+tSize+'px '+L;
  const title=wrap(g,shown,Math.max(60,usable));
  const estado=String(e.confirmacion||'').trim();
  let sub=[];
  if(/por confirmar|sin confirmar|pendient|tentativ|sujeto/i.test(estado)&&!shown.toLocaleLowerCase('es').includes(estado.toLocaleLowerCase('es'))){
   g.font='400 '+sSize+'px '+L;sub=wrap(g,estado,Math.max(60,usable));
  }
  return {title,sub,height:Math.max(34,title.length*tLh+sub.length*sLh+10),tSize,sSize,tLh,sLh};
 };
 let out=medir();
 if(maxHeight)while(out.height>maxHeight&&tSize>11){tSize--;tLh=tSize+4;out=medir();}
 return out;
}
function cardHeading(g,b,w){
 const base=b.date==='Fecha pendiente'?'FECHA PENDIENTE':formatDate(b.date).toLocaleUpperCase('es');
 const theme=[b.tema,b.subgroup].filter(Boolean).join(' · ');
 const heading=base+(theme?' · '+theme.toLocaleUpperCase('es'):'')+(b.part?' · CONT.':'');
 let size=w<300?14:17,lines=[];
 do{g.font='700 '+size+'px '+F;lines=wrap(g,heading,Math.max(80,w-30));if(lines.length<=2||size<=11)break;size--;}
 while(true);
 // La altura del encabezado participa en el cálculo de la capacidad de las tarjetas.
 return {lines,size,bodyY:52+Math.max(0,lines.length-1)*17};
}
function cardRowsHeight(g,list,width){return list.reduce((acc,e)=>acc+itemParts(g,e,Math.max(60,width-(width>=800?58:45)-52)).height+3,0);}
function sectionPageGroups(sec,source){
  // Las agendas especiales comparten páginas con la agenda general cuando hay espacio.
  // El nombre del grupo se conserva en el encabezado de su tarjeta.
  return source.length?[{sec,group:'',events:source}]:[];
}
function separarTextoLargo(texto,maximo){
 let restante=String(texto||'').trim();if(!restante)return [];
 const partes=[];
 while(restante.length>maximo){
  let corte=restante.lastIndexOf(' ',maximo);
  if(corte<maximo/2)corte=maximo;
  partes.push(restante.slice(0,corte).trim());
  restante=restante.slice(corte).trim();
 }
 if(restante)partes.push(restante);
 return partes;
}
function splitExtreme(e,g){
 // Fragmentar solo títulos verdaderamente excepcionales. No publicar observaciones.
 const title=String(e.titulo_ejecutivo||e.titulo||'');
 if(title.length<=310)return [e];
 const parts=separarTextoLargo(title,250);
 return parts.map((fragment,i)=>({...e,titulo:fragment,titulo_ejecutivo:'',
  id:i?'':e.id,representacion:i?'':e.representacion,ciudad:i?'':e.ciudad,pais:i?'':e.pais,
  horario:i?'':e.horario,fecha_fin:i?'':e.fecha_fin,_fragment:i}));
}
const cardTop=(sede,destacado,franja)=>sede?(destacado?228:166):franja?199:155;
const finTarjetas=462;
function packGroup(g,sec,group,events,featured=null,relacionado=null){
 // Una tarjeta por columna. El recorrido izquierda→derecha coincide siempre con
 // el orden de las fechas: una continuación nunca aparece antes del bloque origen.
 const bucketMap=new Map();
 for(const e of events){
  const date=dateValid(e.fecha_inicio)?e.fecha_inicio:'Fecha pendiente';
  const originalGrupo=String(e.grupo||'').trim();
  const tema=originalGrupo===group?'':originalGrupo;
  const subgroup=String(e.subgrupo||'').trim();
  const key=[date,tema,subgroup].join('\x1f');
  if(!bucketMap.has(key))bucketMap.set(key,{date,tema,subgroup,events:[]});
  bucketMap.get(key).events.push(...splitExtreme(e,g));
 }
 const buckets=[...bucketMap.values()].sort((a,b)=>a.date.localeCompare(b.date)
  ||a.tema.localeCompare(b.tema,'es')||a.subgroup.localeCompare(b.subgroup,'es'));
 const thematic=!!group&&sec==='EXTERIOR';
 const isDSE=/d[ií]a del salvadore[nñ]o en el exterior|\bDSE\b/i.test(group);
 const pages=[];
 let i=0,j=0;
 if(!buckets.length&&featured){pages.push({kind:'agenda',section:sec,group,featured,themeBanner:null,columns:[],overflow:false,strip:null});return pages;}
 for(let iter=0;i<buckets.length&&iter<1000;iter++){
  const featuredPage=featured&&pages.length===0?featured:null;
  const fechasGrupo=new Set(buckets.map(b=>b.date)).size;
  const themeBanner=thematic?{name:group,isDSE,ids:[...new Set(events.map(e=>e.id).filter(Boolean))].slice(0,3),mostrar:fechasGrupo>=3}:null;
  const vinculo=relacionado&&pages.length===0&&fechasGrupo>=3?relacionado:null;
  const top=cardTop(sec==='SEDE',!!featuredPage,!!(vinculo||themeBanner?.mostrar));
  const test=(n,reserve=0)=>{
   const gap=n===3?18:n===2?17:0,width=(856-gap*(n-1))/n;
   const usable=Math.max(60,width-(width>=800?58:45)-52);
   const availableMax=finTarjetas-top-reserve;
   const columns=[];let idx=i,off=j,invalid=false,sourceCount=0;
   for(let c=0;c<n&&idx<buckets.length;c++){
    const bucket=buckets[idx];
    const header=cardHeading(g,{...bucket,part:off>0?1:0},width);
    const available=availableMax-header.bodyY-12;
    if(available<=30){invalid=true;break;}
    let count=0,total=0;
    while(off+count<bucket.events.length){
     const row=bucket.events[off+count];const size=itemParts(g,row,usable,available).height+3;
     if(total+size>available+0.001)break;
     total+=size;count++;
    }
    if(!count){invalid=true;break;}
    columns.push([{date:bucket.date,tema:bucket.tema,subgroup:bucket.subgroup,
     events:bucket.events.slice(off,off+count),part:off>0?1:0,
     height:availableMax,available,overflow:false}]);
    sourceCount+=count;off+=count;
    if(off>=bucket.events.length){idx++;off=0;}
   }
   const distinct=new Set(columns.flat().map(b=>b.date)).size;
   // En igualdad de registros, dos columnas son más legibles que tres;
   // tres ganan cuando permiten mostrar una fecha adicional.
   const score=sourceCount+distinct*0.78+(n===2?.16:n===3?.06:0)
    -(invalid?0.12:0)-(columns.length<n?.08:0);
   return {columns,index:idx,offset:off,count:sourceCount,distinct,invalid,score};
  };
  // Evitar grandes columnas únicas salvo que un texto especialmente largo las exija.
  const options=[2,3,1].map(n=>test(n)).filter(o=>o.count>0);
  if(!options.length)throw Error('Un título excede la capacidad mínima de una tarjeta. Ajustar su título ejecutivo.');
  options.sort((a,b)=>b.score-a.score||b.distinct-a.distinct);
  let result=options[0],strip=null;
  // Una fecha final muy corta puede ir en la tira inferior del mismo lienzo,
  // como en la Agenda de Sede del PowerPoint de referencia. Nunca se superpone
  // a las tarjetas: se recalcula su capacidad restando el alto de la tira.
  if(thematic&&j===0&&buckets.length-i===3&&buckets[i].date===buckets[i+1].date&&buckets[i+2].date!==buckets[i].date){
   const ultimo=buckets[i+2];
   if(ultimo.events.length<=2&&!ultimo.tema&&!ultimo.subgroup){
    const texts=ultimo.events.map(e=>(e.id?'ID '+e.id+' · ':'')+String(e.titulo_ejecutivo||e.titulo||'').trim());
    g.font='400 11px '+F;
    const lineas=texts.flatMap(t=>wrap(g,t,380));
    const height=36+lineas.length*13;
    if(lineas.length<=3){
     const alt=test(2,height+12);
     if(alt.index===i+2&&alt.offset===0){result=alt;strip={date:ultimo.date,texts:lineas,height,events:ultimo.events.slice(),izquierda:true};}
    }
   }
  }
  if(!strip&&!thematic&&result.index===buckets.length-1&&result.offset===0){
   const ultimo=buckets.at(-1);
   if(ultimo&&ultimo.events.length<=2&&!ultimo.tema&&!ultimo.subgroup){
    const texts=ultimo.events.map(e=>(e.id?'ID '+e.id+' · ':'')+String(e.titulo_ejecutivo||e.titulo||'').trim());
    g.font='400 12px '+L;
    const lineCount=texts.reduce((n,t)=>n+wrap(g,t,680).length,0);
    if(lineCount<=2){
     const height=16+lineCount*15,reserve=height+12;
     const alt=test(result.columns.length,reserve);
     if(alt.index===result.index&&alt.offset===result.offset&&alt.count===result.count){
      result=alt;strip={date:ultimo.date,texts,height,events:ultimo.events.slice()};
     }
    }
   }
  }
  pages.push({kind:'agenda',section:sec,group,featured:featuredPage,themeBanner,
   columns:result.columns,overflow:false,strip,vinculo});
  if(result.index===i&&result.offset===j)throw Error('Paginación detenida: un evento no pudo avanzar.');
  i=result.index;j=result.offset;
  if(strip){i=buckets.length;j=0;}
 }
 if(i<buckets.length)throw Error('Demasiadas páginas para distribuir la agenda completa.');
 return pages;
}
function planPages(){
 const g=document.createElement('canvas').getContext('2d');
 const included=state.eventos.map((e,i)=>({...e,_originalIndex:i}))
  .filter(e=>!e.excluido&&['SEDE','EXTERIOR'].includes(e.seccion));
 included.sort((a,b)=>(a.fecha_inicio||'~~~~').localeCompare(b.fecha_inicio||'~~~~')||a._originalIndex-b._originalIndex);
 const out=[{kind:'cover'}];
 const featured=included.find(e=>/^(?:POTENCIAL[ _-]PRESIDENCIAL|PRESIDENCIAL[ _-]POTENCIAL)$/i.test((e.tipo||'').trim()));
 const sede=included.filter(e=>e.seccion==='SEDE'&&e!==featured);
 if(included.length)out.push(...packGroup(g,'SEDE','',sede,featured||{sinPotencial:true}));
 const exterior=included.filter(e=>e.seccion==='EXTERIOR'&&e!==featured);
 const getTheme=e=>{
  const g=String(e.grupo||'').trim();if(g)return g;
  const tipo=String(e.tipo||'').trim();
  return /^(?:DSE|D[IÍ]A DEL SALVADORE[NÑ]O EN EL EXTERIOR|CONMEMORACI[OÓ]N DSE)$/i.test(tipo)
   ?'Día del Salvadoreño en el Exterior':'';
 };
 const themes=[...new Set(exterior.map(getTheme).filter(Boolean))];
 if(!themes.length){if(exterior.length)out.push(...packGroup(g,'EXTERIOR','',exterior));}
 else{
  // La maqueta editable alterna páginas generales y páginas conmemorativas de
  // períodos próximos (23–25, 26–27, 28–29). Solo se aplica si los datos traen
  // grupos especiales. Fuera de la semana no se suprime ningún registro.
  const ini=dateInfo(state.metadatos.semana_inicio),fin=dateInfo(state.metadatos.semana_fin);
  const fechas=[...new Set(exterior.map(e=>e.fecha_inicio).filter(dateValid))].sort();
  const ventanas=[];
  if(ini&&fin&&ini.date<=fin.date){
   let d=new Date(ini.date),n=0;
   while(d<=fin.date&&n<100){
    const len=n===0?3:2;const desde=d.toISOString().slice(0,10);
    d.setUTCDate(d.getUTCDate()+len-1);
    const hasta=new Date(Math.min(d.getTime(),fin.date.getTime())).toISOString().slice(0,10);
    ventanas.push([desde,hasta]);d.setUTCDate(d.getUTCDate()+1);n++;
   }
  }else fechas.forEach(f=>ventanas.push([f,f]));
  const usados=new Set();
  const emitir=seleccion=>{
   const generales=seleccion.filter(e=>!getTheme(e));
   if(generales.length){
    const temaActivo=themes.find(grupo=>seleccion.some(e=>getTheme(e)===grupo));
    const vinculo=temaActivo?{name:temaActivo,ids:[...new Set(seleccion.filter(e=>getTheme(e)===temaActivo).map(e=>e.id).filter(Boolean))].slice(0,3)}:null;
    out.push(...packGroup(g,'EXTERIOR','',generales,null,vinculo));
   }
   for(const grupo of themes){const es=seleccion.filter(e=>getTheme(e)===grupo);
    if(es.length)out.push(...packGroup(g,'EXTERIOR',grupo,es));}
  };
  const primera=ventanas[0]?.[0]||'',ultima=ventanas.at(-1)?.[1]||'';
  const anteriores=exterior.filter(e=>dateValid(e.fecha_inicio)&&primera&&e.fecha_inicio<primera);
  if(anteriores.length){emitir(anteriores);anteriores.forEach(e=>usados.add(e._originalIndex));}
  for(const [a,b] of ventanas){const es=exterior.filter(e=>e.fecha_inicio>=a&&e.fecha_inicio<=b);
   if(es.length){emitir(es);es.forEach(e=>usados.add(e._originalIndex));}}
  const posteriores=exterior.filter(e=>dateValid(e.fecha_inicio)&&ultima&&e.fecha_inicio>ultima);
  if(posteriores.length){emitir(posteriores);posteriores.forEach(e=>usados.add(e._originalIndex));}
  // Sin fecha: se conserva como fecha pendiente, al final, sin inventar una fecha.
  const faltantes=exterior.filter(e=>!usados.has(e._originalIndex));
  if(faltantes.length)emitir(faltantes);
 }
 out.forEach((p,i)=>p.page=i+1);
 return out;
}
function round(g,x,y,w,h,r){g.beginPath();g.roundRect(x,y,w,h,r);}
function fill(g,color,x,y,w,h){g.fillStyle=color;g.fillRect(x,y,w,h);}
function text(g,t,x,y,size,color,weight=400,font=F,maxWidth){g.font=`${weight} ${size}px ${font}`;g.fillStyle=color;g.textAlign='left';g.textBaseline='top';if(maxWidth)g.fillText(t,x,y,maxWidth);else g.fillText(t,x,y);}
function box(g,x,y,w,h,bg,border,r=16){round(g,x,y,w,h,r);g.fillStyle=bg;g.fill();if(border){g.strokeStyle=border;g.lineWidth=1;g.stroke();}}
function drawCover(g){
 fill(g,colors.dark,0,0,560,540);
 fill(g,colors.royal,560,0,400,540);
 const m=state.metadatos,title=m.titulo||'Proyección de temas';
 text(g,m.unidad||'',57,61,16,colors.sand,700,portadaFuente,473);
 g.font='700 40px '+portadaFuente;
 const lines=wrap(g,title,485).slice(0,3), shift=Math.max(0,lines.length-1)*24;
 lines.forEach((line,i)=>text(g,line,56,170+i*44,40,'#fff',700,portadaFuente,485));
 g.font='italic 700 23px '+portadaFuente;g.fillStyle='#fff';g.textAlign='left';g.textBaseline='top';
 g.fillText(weekText(m.semana_inicio,m.semana_fin),57,254+shift,483);
 fill(g,colors.sand,57,306+shift,70,2);
 text(g,m.gabinete||'',57,343+shift,19,'#fff',700,portadaFuente,476);
 text(g,m.institucion||'',57,371+shift,17,'#cdd0df',400,portadaFuente,476);
 if(m.fecha_elaboracion)text(g,'Elaborado el '+formatDate(m.fecha_elaboracion,true),57,479,14,'#cdd0df',400,portadaFuente,473);
 const logo=document.querySelector('.exterior-logo');
 if(logo&&logo.complete&&logo.naturalWidth){
  const sc=Math.min(324/logo.naturalWidth,126/logo.naturalHeight),w=logo.naturalWidth*sc,h=logo.naturalHeight*sc;
  g.drawImage(logo,760-w/2,270-h/2,w,h);
 }else text(g,'EXTERIOR',598,236,54,'#fff',900,portadaFuente,324);
}
let proyPDFVectorFirma=false;
function drawFooter(g,p,light=true){
 const ink=light?colors.muted:'#cbd5f0',bar=light?colors.line:'#42538f';
 // Banda exclusiva de pie (y 470–540). Las tarjetas terminan en y=468, de modo que
 // la firma vectorial queda debajo de ellas, con margen inferior y lateral de seguridad.
 // La regla termina 24 pt antes del borde izquierdo de la firma y nunca la atraviesa.
 fill(g,bar,53,477,856,1);
 const fuente=String(state.metadatos.fuente_general||'').trim();
 const corte=String(state.metadatos.fecha_corte||'').trim();
 // Sin fecha de corte verificable no se imprime ningún valor ficticio.
 const credit=(fuente?fuente+' · ':'')+'Proyección '+weekCompact()+(corte&&dateValid(corte)?' · Corte '+dateShort(corte):'');
 text(g,credit,53,493,9,ink,400,L,690);
 // Recurso vectorial oficial ya incrustado (trazados «LOGO RREE 3lineas 2020.pdf»),
 // sin rasterizar ni superponer: 128 pt de ancho ≈ 55 pt de alto, y 474–529.
 if(!proyPDFVectorFirma)
  sedeFirma(g,758,487,114,light?colors.navy:'#ffffff',false);
}
function pageBlocks(p){const blocks=p.columns?p.columns.flat():(p.blocks||[]);return p.strip?blocks.concat([{date:p.strip.date,events:p.strip.events||[],part:0}]):blocks;}
// Rango de la semana para el cintillo: «9–15 NOVIEMBRE 2026».
function weekKick(){const a=dateInfo(state.metadatos.semana_inicio),b=dateInfo(state.metadatos.semana_fin);if(!a||!b)return (dateShort(state.metadatos.semana_inicio)+'–'+dateShort(state.metadatos.semana_fin)).toUpperCase();const M=m=>months[m].toLocaleUpperCase('es');return a.month===b.month&&a.year===b.year?`${a.day}–${b.day} ${M(b.month)} ${b.year}`:`${a.day} ${M(a.month)}–${b.day} ${M(b.month)} ${b.year}`;}
// Frase de subtítulo: «del 9 al 15 de noviembre».
function weekPhrase(){const a=dateInfo(state.metadatos.semana_inicio),b=dateInfo(state.metadatos.semana_fin);if(!a||!b)return 'durante la semana';return a.month===b.month&&a.year===b.year?`del ${a.day} al ${b.day} de ${months[b.month]}`:`del ${a.day} de ${months[a.month]} al ${b.day} de ${months[b.month]}`;}
// Rango compacto para el crédito del pie: «9–15/11/2026».
function weekCompact(){const a=dateInfo(state.metadatos.semana_inicio),b=dateInfo(state.metadatos.semana_fin);if(!a||!b)return dateShort(state.metadatos.semana_inicio)+'–'+dateShort(state.metadatos.semana_fin);const p=n=>String(n).padStart(2,'0');return a.month===b.month&&a.year===b.year?`${a.day}–${b.day}/${p(b.month+1)}/${b.year}`:`${a.day}/${p(a.month+1)}–${b.day}/${p(b.month+1)}/${b.year}`;}
function displayRange(p){const dates=[...new Set(pageBlocks(p).map(b=>b.date).filter(dateValid))].sort();if(!dates.length)return 'Actividades sin fecha';const from=dateInfo(dates[0]),to=dateInfo(dates.at(-1));if(dates.length===1)return `${from.weekday} ${from.day} de ${months[from.month]}`;
 // Dos días consecutivos se unen con «y»; tres o más con guion, como en el modelo editorial.
 const sep=dates.length===2?' y ':'–';return `${from.day}${from.month===to.month?'':' de '+months[from.month]}${sep}${to.day} de ${months[to.month]}`;}
function drawCard(g,b,x,y,w,h,dark){
 const ink=dark?'#ffffff':colors.ink;
 box(g,x,y,w,h,dark?colors.cardDark:'#ffffff',dark?'#40538a':colors.line,28);
 if(dark)fill(g,colors.gold,x+9,y+12,4,26);
 else fill(g,colors.gold,x,y,5,h);
 const header=cardHeading(g,b,w);
 header.lines.forEach((line,i)=>text(g,line,x+(dark?23:15),y+15+i*17,header.size,ink,700,F,w-30));
 const lineY=y+header.bodyY-21;
 fill(g,dark?'#51639e':'#d7dce8',x+16,lineY,w-32,1);
 // Se mide primero el bloque completo para centrarlo ópticamente dentro del
 // cuerpo de la tarjeta (sin dejar todo el contenido pegado al encabezado).
 const items=b.events.map(e=>{
  const bw=w>=800?58:45,x2=x+17,tx=x+21+bw+8,aw=w-bw-52;
  return {e,bw,x2,tx,aw,item:itemParts(g,e,aw,b.available)};
 });
 const contentH=items.reduce((s,r)=>s+r.item.height+3,0);
 const inner=Math.max(0,h-header.bodyY-12);
 const offset=Math.max(0,(inner-contentH)*.36);
 let pos=y+header.bodyY+offset;
 // Recorte de seguridad: ningún registro puede imprimirse fuera de su tarjeta.
 g.save();g.beginPath();g.rect(x+2,y+2,w-4,h-4);g.clip();
 for(const {e,bw,x2,tx,aw,item} of items){
  const pri=dark&&/PRESIDENCIAL|PRIORITARI|ALTO_NIVEL|PLAZO|HITO/i.test(e.tipo||'');
  if(pri)box(g,x+8,pos-3,w-16,item.height,'#3b4f82',null,7);
  if(e.id){box(g,x2,pos+1,bw-4,25,dark?'#ffffff':'#eff1fa',null,3);
   text(g,e.id,x2+5,pos+7,Math.min(13,12+Math.max(0,3-e.id.length)),colors.ink,700,F,bw-12);}
  else text(g,'—',x2+10,pos+7,13,dark?'#fff':colors.muted,700);
  let yy=pos+1;
  for(const t of item.title){text(g,t,tx,yy,item.tSize,ink,500,L,aw);yy+=item.tLh;}
  for(const t of item.sub){text(g,t,tx,yy,item.sSize,dark?'#d7ddf0':colors.muted,400,L,aw);yy+=item.sLh;}
  pos+=item.height+3;
 }
 g.restore();
}
function drawAgenda(g,p){
 const dark=p.section==='SEDE';fill(g,dark?colors.royal:colors.pale,0,0,960,540);
 const ink=dark?'#fff':colors.ink,minor=dark?'#cfd6ea':colors.muted;
 fill(g,dark?colors.gold:colors.ink,dark?40:49,35,5,29);
 // Cintillo editorial como en el modelo: PLANIFICACIÓN (Sede) / PROYECCIÓN SEMANAL
 // (Exterior) / nombre de la agrupación, con el rango de la semana en mayúsculas.
 const kick=p.themeBanner?.isDSE?'CONMEMORACIONES':p.group?p.group.toLocaleUpperCase('es'):(dark?'PLANIFICACIÓN':'PROYECCIÓN SEMANAL');
 text(g,`${kick}${dark?'  /  ':' / '}${weekKick()}`,dark?56:62,31,11,dark?colors.gold:colors.ink,700,F,828);
 const titulo=dark?'Agenda de Sede':p.themeBanner?.isDSE?'Día del Salvadoreño en el Exterior':p.group?`${p.group} · ${displayRange(p)}`:'Servicio Exterior · '+displayRange(p);
 let titleSize=dark?34:31,tlines=[];
 do{g.font='700 '+titleSize+'px '+F;tlines=wrap(g,titulo,848);if(tlines.length<=2||titleSize<=20)break;titleSize-=2;}while(true);
 tlines.forEach((v,i)=>text(g,v,52,(dark?73:65)+i*34,titleSize,ink,700,F,852));
 const ysub=(dark?117:108)+(tlines.length-1)*34;
 const subtitulo=dark?`Actividades previstas ${weekPhrase()}.`:p.themeBanner?.isDSE?'Actividades del Día del Salvadoreño en el Exterior (DSE).':(p.group?`Actividades de ${p.group}.`:'Actividades de cada día, según la representación.');
 text(g,subtitulo,54,ysub+5,13,minor,400,L,850);
 const special=dark&&p.featured;
 if(special){
  // Bloque destacado de dos zonas: rótulo a la izquierda y título + coordinación a la derecha.
  box(g,54,157,852,53,'#293873',null,6);
  fill(g,colors.gold,55,158,5,51);
  text(g,'POTENCIAL PRESIDENCIAL',75,180,11,colors.gold,700,F,220);
  if(special.sinPotencial){text(g,'Sin temas identificados para esta semana.',309,177,15,'#ffffff',500,F,565);}
  else{
  g.font='700 15px '+F;
  let fTitle=String(special.titulo_ejecutivo||special.titulo||'').trim();
  const fa=dateInfo(special.fecha_inicio),fb=dateInfo(special.fecha_fin);
  if(fa&&fb&&special.fecha_fin!==special.fecha_inicio)fTitle+=fa.month===fb.month&&fa.year===fb.year?` · ${fa.day}–${fb.day} ${months[fb.month].slice(0,3)}.`:` · hasta ${fb.day} ${months[fb.month].slice(0,3)}.`;
  const tl=wrap(g,fTitle,560).slice(0,2);
  const ty=158+(56-(tl.length*17+14))/2;
  tl.forEach((v,i)=>text(g,v,310,ty+i*17,15,'#ffffff',700,F,580));
  let coord='ID '+(special.id||'—')+(special.representacion?' · '+special.representacion:'');
  if(!/\.$/.test(coord))coord+='.';
  text(g,coord,310,ty+tl.length*17+2,10,'#cdd6ee',400,L,580);
  }
 }
 if(p.themeBanner?.mostrar||p.vinculo){
  const t=p.vinculo||p.themeBanner;
  box(g,53,145,856,38,colors.royal,null,5);

  const titulo=t.isDSE?'DÍA DEL SALVADOREÑO EN EL EXTERIOR':String(t.name).toLocaleUpperCase('es');
  const ids=t.ids.length?'ID '+t.ids.join(' / ')+' · ':'';
  text(g,ids+titulo,69,155,13,'#ffffff',700,F,p.vinculo?575:795);
  if(p.vinculo)text(g,'Agenda especial: ver el detalle en las páginas siguientes.',655,157,9,'#ffffff',400,F,240);
 }
 const cols=p.columns||[p.blocks||[]],n=cols.length,top=cardTop(dark,!!special,!!(p.vinculo||p.themeBanner?.mostrar)),full=856;
 const gap=n===3?18:n===2?17:0,w=n?(full-gap*(n-1))/n:full;
 const COL_GAP=16,CARD_BOTTOM=finTarjetas-(p.strip?p.strip.height+12:0);
 // Altura uniforme para todas las tarjetas de la página: las columnas quedan
 // alineadas y el contenido se centra ópticamente dentro de cada tarjeta.
 const blocks=cols.flat();
 const maxBlocks=Math.max(1,...cols.map(c=>c.length));
 const maxH=blocks.length?Math.max(...blocks.map(b=>b.height)):0;
 const uniformH=blocks.length?Math.max(60,(CARD_BOTTOM-top-(maxBlocks-1)*COL_GAP)/maxBlocks):0;
 for(let i=0;i<n;i++){
  const col=cols[i];if(!col||!col.length)continue;
  let y=top;
  for(const b of col){const alto=uniformH+(p.strip?.izquierda&&i===1?p.strip.height+12:0);drawCard(g,b,53+i*(w+gap),y,w,alto,dark);y+=alto+COL_GAP;}
 }
 if(dark&&!n)text(g,'Sin actividades de Sede registradas para esta semana.',54,241,14,minor,400,F,852);
 if(p.strip){
  const s=p.strip,sy=finTarjetas-s.height;
  if(s.izquierda){
   box(g,53,sy,w,s.height,'#e8ecf8',null,8);
   const label=formatDate(s.date).toLocaleUpperCase('es');
   text(g,label,66,sy+9,12,colors.ink,700,F,w-30);
   s.texts.forEach((line,i)=>text(g,line,66,sy+27+i*13,11,colors.ink,400,F,w-30));
  }else{
  box(g,54,sy,852,s.height,dark?'#243b76':'#ffffff',dark?'#40538a':colors.line,6);
  fill(g,colors.gold,50,sy,5,s.height);
  const label=s.date==='Fecha pendiente'?'FECHA PENDIENTE':formatDate(s.date).toLocaleUpperCase('es');
  text(g,label,70,sy+(s.height-12)/2,12,dark?colors.gold:colors.ink,700,F,110);
  let ty=sy+(s.height-s.texts.length*15)/2;
  for(const t of s.texts){text(g,t,190,ty,12,dark?'#ffffff':colors.ink,400,L,700);ty+=15;}
  }
 }
 drawFooter(g,p,!dark);
}
function paintPage(page,scale){const canvas=document.createElement('canvas');canvas.width=Math.round(960*scale);canvas.height=Math.round(540*scale);const g=canvas.getContext('2d',{alpha:false});g.scale(scale,scale);if(page.kind==='cover')drawCover(g);else drawAgenda(g,page);return canvas;}
function renderPreview(){pages=planPages();actual=Math.max(0,Math.min(actual,pages.length-1));const page=pages[actual];const canvas=paintPage(page,Math.min(1.5,window.devicePixelRatio||1.4));const host=E('proyCanvasHost');host.replaceChildren(canvas);E('proyPageCount').textContent=`Página ${actual+1} de ${pages.length}`;E('proyPageTitle').textContent=page.kind==='cover'?'Portada':(page.section==='SEDE'?'Sede':'Exterior')+(page.group?' · '+page.group:'');E('proyPrev').disabled=actual===0;E('proyNext').disabled=actual>=pages.length-1;E('proyStatus').textContent=`${state.eventos.filter(e=>!e.excluido).length} registros seleccionados · ${pages.length} páginas.`+(pages.some(p=>p.overflow)?' Atención: algún registro excede su tarjeta; revisar títulos muy extensos.':'');updateCount();}
function toBytes(v){return new TextEncoder().encode(v);}
function b64ToBytes(b64){const raw=atob(b64);const a=new Uint8Array(raw.length);for(let j=0;j<raw.length;j++)a[j]=raw.charCodeAt(j);return a;}
function pngChunks(bytes){const out=[];let p=8;while(p+8<=bytes.length){const len=((bytes[p]<<24)|(bytes[p+1]<<16)|(bytes[p+2]<<8)|bytes[p+3])>>>0;const type=String.fromCharCode(bytes[p+4],bytes[p+5],bytes[p+6],bytes[p+7]);out.push({type,data:bytes.subarray(p+8,p+8+len)});p+=12+len;if(type==='IEND')break;}return out;}
async function inflateBytes(bytes){const ds=new DecompressionStream('deflate');const stream=new Blob([bytes]).stream().pipeThrough(ds);return new Uint8Array(await new Response(stream).arrayBuffer());}
async function deflateBytes(bytes){const cs=new CompressionStream('deflate');const stream=new Blob([bytes]).stream().pipeThrough(cs);return new Uint8Array(await new Response(stream).arrayBuffer());}
function pngUnfilter(raw,w,h,channels){const stride=w*channels;const out=new Uint8Array(h*stride);let pos=0;for(let y=0;y<h;y++){const f=raw[pos++];const row=y*stride,prev=row-stride;for(let x=0;x<stride;x++){const a=x>=channels?out[row+x-channels]:0;const b=y>0?out[prev+x]:0;const c=(x>=channels&&y>0)?out[prev+x-channels]:0;let v=raw[pos+x];if(f===1)v=(v+a)&255;else if(f===2)v=(v+b)&255;else if(f===3)v=(v+((a+b)>>1))&255;else if(f===4){const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);v=(v+(pa<=pb&&pa<=pc?a:pb<=pc?b:c))&255;}out[row+x]=v;}pos+=stride;}return out;}
// Imagen de página sin pérdida (PNG/Flate con predictores PNG) para que el logotipo
// vectorial y los textos conserven nitidez. El PDF de proyecciones no tiene límite
// de 20 MB; solo se vuelve a JPEG si el navegador entregara un PNG no compatible.
async function canvasToPdfImage(c){
 try{
  const png=b64ToBytes(c.toDataURL('image/png').split(',')[1]);
  const chunks=pngChunks(png);const ihdr=chunks.find(ch=>ch.type==='IHDR');
  if(ihdr){const d=ihdr.data;const w=((d[0]<<24)|(d[1]<<16)|(d[2]<<8)|d[3])>>>0,h=((d[4]<<24)|(d[5]<<16)|(d[6]<<8)|d[7])>>>0;const depth=d[8],color=d[9],interlace=d[12];
   if(depth===8&&interlace===0&&(color===2||color===6)){
    const idat=chunks.filter(ch=>ch.type==='IDAT');let total=0;for(const ch of idat)total+=ch.data.length;const z=new Uint8Array(total);let o=0;for(const ch of idat){z.set(ch.data,o);o+=ch.data.length;}
    if(color===2)return {width:w,height:h,png:z,colors:3};
    const px=pngUnfilter(await inflateBytes(z),w,h,4);
    const rgb=new Uint8Array(h*(1+w*3)),al=new Uint8Array(h*(1+w));
    for(let y=0;y<h;y++){const dr=y*(1+w*3),ar=y*(1+w);rgb[dr]=0;al[ar]=0;for(let x=0;x<w;x++){const s=y*w*4+x*4;rgb[dr+1+x*3]=px[s];rgb[dr+2+x*3]=px[s+1];rgb[dr+3+x*3]=px[s+2];al[ar+1+x]=px[s+3];}}
    return {width:w,height:h,png:await deflateBytes(rgb),colors:3,smask:await deflateBytes(al)};
   }}
 }catch(err){console.warn('PNG sin pérdida no disponible; se usa JPEG de alta calidad.',err);}
 return {width:c.width,height:c.height,jpeg:b64ToBytes(c.toDataURL('image/jpeg',.98).split(',')[1])};
}

// Logo oficial del pie de Proyección incrustado como curvas PDF reales.
// La vista previa usa Canvas; en el archivo PDF se superpone un trazado nativo.
function proyPdfColorRGB(hex){const c=String(hex||'#000000').replace('#','');return [0,2,4].map(i=>(parseInt(c.slice(i,i+2),16)/255).toFixed(5)).join(' ');}
function proyPdfRuta(d){
 const ts=String(d).match(/[MLCZ]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g)||[];
 let i=0,op='',x,y;
 while(i<ts.length){const t=ts[i++];
  if(t==='Z'){op+='h\n';continue;}
  if(t==='M'||t==='L'){x=Number(ts[i++]);y=Number(ts[i++]);op+=`${x} ${y} ${t==='M'?'m':'l'}\n`;continue;}
  if(t==='C'){const n=ts.slice(i,i+6).map(Number);i+=6;op+=n.join(' ')+' c\n';continue;}
  throw Error('Trazado de logotipo no admitido');
 }
 return op+'f\n';
}
function proyPdfCurvas(clave){return trazadosSedeTexto[clave].map(proyPdfRuta).join('');}
function proyPdfFirmaVector(dark){
 const color=proyPdfColorRGB(dark?'#ffffff':colors.navy);
 const logo=firmaSedeEscudo,s=(114/logo.w).toFixed(9);
 const partes=['q\n','1 0 0 -1 0 540 cm\n',`${color} rg\n`,
  `1 0 0 1 758 487 cm\n`,`${s} 0 0 ${s} 0 0 cm\n`,
  'q\n.314 0 0 .314 0 106 cm\n',proyPdfCurvas('escudo'),'Q\n',
  '410.5 0 2.75 505 re f\n',
  'q\n.691 0 0 .691 484 123 cm\n',proyPdfCurvas('ministerio'),'Q\n','Q\n'];
 return partes.join('');
}

function pdfFromCanvasPages(list){const pieces=[],offsets=[0];let total=0;const add=p=>{const v=typeof p==='string'?toBytes(p):p;pieces.push(v);total+=v.length;};const obj=(id,parts)=>{offsets[id]=total;add(`${id} 0 obj\n`);for(const p of parts)add(p);add('\nendobj\n');};add('%PDF-1.4\n%Generador institucional\n');let nextId=1;const catalog=nextId++,pagesId=nextId++;const defs=[];for(const entry of list){const pageId=nextId++,contentId=nextId++,imgId=nextId++;const smaskId=entry.smask?nextId++:0;defs.push({pageId,contentId,imgId,smaskId,entry});}obj(catalog,['<< /Type /Catalog /Pages '+pagesId+' 0 R >>']);obj(pagesId,[`<< /Type /Pages /Count ${list.length} /Kids [${defs.map(d=>d.pageId+' 0 R').join(' ')}] >>`]);for(const d of defs){const bytes=d.entry;const xres='/Im0 '+d.imgId+' 0 R'+(d.smaskId?' /Sm0 '+d.smaskId+' 0 R':'');obj(d.pageId,[`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 960 540] /Resources << /XObject << ${xres} >> >> /Contents ${d.contentId} 0 R >>`]);const commands='q\n960 0 0 540 0 0 cm\n/Im0 Do\nQ\n'+(bytes.logoVector?proyPdfFirmaVector(bytes.logoDark):'');obj(d.contentId,[`<< /Length ${toBytes(commands).length} >>\nstream\n`,commands,'endstream']);if(bytes.png){const parms=`<< /Predictor 15 /Colors ${bytes.colors||3} /BitsPerComponent 8 /Columns ${bytes.width} >>`;obj(d.imgId,[`<< /Type /XObject /Subtype /Image /Width ${bytes.width} /Height ${bytes.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /DecodeParms ${parms}${d.smaskId?' /SMask '+d.smaskId+' 0 R':''} /Length ${bytes.png.length} >>\nstream\n`,bytes.png,'\nendstream']);if(d.smaskId)obj(d.smaskId,[`<< /Type /XObject /Subtype /Image /Width ${bytes.width} /Height ${bytes.height} /ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /FlateDecode /DecodeParms << /Predictor 15 /Colors 1 /BitsPerComponent 8 /Columns ${bytes.width} >> /Length ${bytes.smask.length} >>\nstream\n`,bytes.smask,'\nendstream']);}else{obj(d.imgId,[`<< /Type /XObject /Subtype /Image /Width ${bytes.width} /Height ${bytes.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.jpeg.length} >>\nstream\n`,bytes.jpeg,'\nendstream']);}}const pos=total;add(`xref\n0 ${nextId}\n0000000000 65535 f \n`);for(let i=1;i<nextId;i++)add(`${String(offsets[i]).padStart(10,'0')} 00000 n \n`);add(`trailer\n<< /Size ${nextId} /Root ${catalog} 0 R >>\nstartxref\n${pos}\n%%EOF`);return new Blob(pieces,{type:'application/pdf'});}
async function exportPdf(){
 if(busy)return;
 busy=true;E('proyDownload').disabled=true;
 const msg=E('proyStatus'),canvases=[];
 try{
  await prepararFuentesProyeccion();
  await document.fonts.ready;
  const planned=planPages();
  if(planned.length<2)throw Error('Pegá o agregá al menos una actividad antes de descargar.');
  const activos=state.eventos.filter(e=>!e.excluido);
  if(activos.some(e=>!['SEDE','EXTERIOR'].includes(e.seccion)||!e.titulo.trim()))throw Error('Revisá las actividades sin ámbito o sin título antes de descargar.');
  for(let i=0;i<planned.length;i++){
   msg.textContent=`Preparando PDF · página ${i+1} de ${planned.length}…`;
   await new Promise(r=>setTimeout(r,0));
   const pg=planned[i],footer=pg.kind!=='cover';
   proyPDFVectorFirma=footer;
   let c;
   try{c=paintPage(pg,3)}finally{proyPDFVectorFirma=false;}
   const img=await canvasToPdfImage(c);
   img.logoVector=footer;
   img.logoDark=footer&&pg.section==='SEDE';
   canvases.push(img);
   c.width=c.height=1;
  }
  const blob=pdfFromCanvasPages(canvases);
  const url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download=`Proyeccion_de_temas_${state.metadatos.semana_inicio||'semana'}.pdf`;
  document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
  msg.textContent=`PDF preparado: ${planned.length} páginas · ${(blob.size/1024/1024).toFixed(1)} MB. Logotipo vectorial.`;
  registrarArteUtilizado({ruta:'interno',id:'proyeccion',variante:''});
 }catch(err){console.error(err);msg.textContent='No se pudo generar el PDF: '+err.message;}
 finally{proyPDFVectorFirma=false;busy=false;E('proyDownload').disabled=false;}
}
function applyParsed(parsed,original,source){if(parsed.eventos.length>500)throw Error('Importar hasta 500 actividades a la vez.');if(state.eventos.length&&!confirm('Se reemplazará el formulario actual por los datos importados. ¿Continuar?'))return false;state={...state,...parsed,original,filter:'TODOS'};actual=0;mount();const sede=state.eventos.filter(e=>e.seccion==='SEDE').length,ext=state.eventos.filter(e=>e.seccion==='EXTERIOR').length;const msg=`Importación realizada (${source}): ${state.eventos.length} actividades (${sede} Sede y ${ext} Exterior). Revisar los campos antes de descargar.`;E('proyImportMsg').textContent=msg;E('proyFileMsg').textContent=msg;E('proyImport').open=false;if(source==='pegado')E('proyPreview').scrollIntoView({block:'nearest'});return true;}
function performImport(){const text=E('proyRaw').value;try{const parsed=parseInput(text);if(!applyParsed(parsed,text,'pegado'))E('proyImportMsg').textContent='Importación cancelada; se conservaron los datos anteriores.';}catch(err){E('proyImportMsg').textContent=err.message;E('proyImport').open=true;}}
let fileBusy=false,pendingFile=null;
function readFileAsText(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||''));r.onerror=()=>reject(Error('No se pudo leer el archivo seleccionado. Volver a intentarlo.'));r.readAsText(file,'utf-8');});}
async function performFileImport(){
 if(fileBusy||!pendingFile||E('proyFileBtn').disabled)return;
 fileBusy=true;E('proyFileBtn').disabled=true;
 const msg=E('proyFileMsg'),file=pendingFile;
 try{
  msg.textContent='Leyendo «'+file.name+'»…';
  let text=await readFileAsText(file);
  if(text.charCodeAt(0)===0xFEFF)text=text.slice(1); // UTF-8 con BOM
  text=text.trim();
  if(!text)throw Error('El archivo «'+file.name+'» está vacío.');
  let obj;try{obj=JSON.parse(text);}catch(err){throw Error('«'+file.name+'» no contiene JSON válido: '+err.message+'. Verificar que sea un archivo PROYECCION_TEMAS_V1.');}
  if(pendingFile!==file||E('proyFile').files[0]!==file)return;
  const parsed=normalizarJson(obj); // mismo validador/normalizador que el pegado
  if(applyParsed(parsed,text,'archivo '+file.name)){pendingFile=null;E('proyFile').value='';E('proyFileName').textContent='Ningún archivo seleccionado';}
  else msg.textContent='Importación cancelada; se conservaron los datos anteriores.';
 }catch(err){msg.textContent=err.message;}
 finally{fileBusy=false;E('proyFileBtn').disabled=!pendingFile;}
}
function manipulate(i,action){const list=state.eventos;if(action==='remove'){if(!confirm('¿Eliminar esta actividad del formulario?'))return;list.splice(i,1);}else if(action==='duplicate'){list.splice(i+1,0,copyEvt(list[i]));}else if(action==='up'&&i>0){[list[i-1],list[i]]=[list[i],list[i-1]];}else if(action==='down'&&i<list.length-1){[list[i+1],list[i]]=[list[i],list[i+1]];}eventList();showWarnings();schedule();}
function montarPromptProyeccion(){
 const area=E('proyImport');
 const editor=area?.parentElement;
 if(!editor||E('proyPrompt'))return;
 const help=document.createElement('details');
 help.id='proyPrompt';
 help.className='proy-import';
 help.innerHTML='<summary>Prompt para preparar la semana desde la matriz</summary><p class="field-help">Completá el período en Datos generales y copiá el prompt. Adjuntá a tu IA las filas o el archivo que tu institución permita compartir. Exterior no envía la matriz ni el texto a servicios externos.</p><textarea id="proyPromptText" aria-label="Prompt para preparar la proyección" rows="9" style="width:100%;box-sizing:border-box;resize:vertical" readonly></textarea><button type="button" class="g" id="proyCopyPrompt">Copiar prompt</button><p id="proyPromptMsg" role="status" aria-live="polite"></p>';
 editor.insertBefore(help,area);
 area.open=true;
 const summary=area.querySelector('summary');
 if(summary)summary.textContent='Pegar texto de la proyección';
 const info=area.querySelector('.field-help');
 if(info)info.textContent='Pegá el texto devuelto por la IA y pasalo al formulario. Revisá fechas y actividades antes de descargar.';
 E('proyRaw').placeholder='Pegá aquí el texto de la proyección semanal.';
 E('proyImportBtn').textContent='Importar texto';
 const file=editor.querySelector('.proy-file-import');
 if(file){
  const text=file.querySelector('.field-help');
  if(text)text.textContent='Si ya tenés un archivo JSON de otra semana, podés cargarlo aquí.';
  editor.append(file);
 }
 const refresh=()=>{E('proyPromptText').value=promptProyeccion(state.metadatos);};
 help.addEventListener('toggle',refresh);
 E('proyMeta').addEventListener('input',()=>queueMicrotask(refresh));
 E('proyCopyPrompt').addEventListener('click',async()=>{
  refresh();
  try{await navigator.clipboard.writeText(E('proyPromptText').value);E('proyPromptMsg').textContent='Prompt copiado.';}
  catch(err){E('proyPromptText').focus();E('proyPromptText').select();E('proyPromptMsg').textContent='El prompt está seleccionado. Copialo desde el menú de tu dispositivo.';}
 });
 refresh();
}
E('proyImportBtn').addEventListener('click',performImport);
E('proyFile').addEventListener('change',e=>{const f=e.target.files&&e.target.files[0];pendingFile=f||null;E('proyFileName').textContent=f?f.name:'Ningún archivo seleccionado';E('proyFileBtn').disabled=!f||fileBusy;E('proyFileMsg').textContent=f?'Archivo listo: «'+f.name+'». Seleccionar «Cargar al formulario».':'';});
E('proyFileBtn').addEventListener('click',performFileImport);
E('proyRaw').addEventListener('input',()=>{E('proyImportMsg').textContent='';});
E('proyMeta').addEventListener('input',e=>{const k=e.target.dataset.proyMeta;if(!k)return;state.metadatos[k]=e.target.value;showWarnings();schedule();});
E('proyEventos').addEventListener('input',e=>{const f=e.target.dataset.proyField,i=Number(e.target.dataset.proyIndex);if(!f||!Number.isInteger(i)||!state.eventos[i])return;state.eventos[i][f]=f==='excluido'?e.target.checked:e.target.value;showWarnings();schedule();});
E('proyEventos').addEventListener('change',e=>{const f=e.target.dataset.proyField,i=Number(e.target.dataset.proyIndex);if(f&&state.eventos[i]){state.eventos[i][f]=f==='excluido'?e.target.checked:e.target.value;if(f==='seccion')eventList();showWarnings();schedule();}});
E('proyEventos').addEventListener('click',e=>{const b=e.target.closest('[data-proy-action]');if(!b)return;manipulate(Number(b.dataset.proyIndex),b.dataset.proyAction);});
E('proyFilter').addEventListener('change',e=>{state.filter=e.target.value;eventList();});
E('proyAddSede').addEventListener('click',()=>{state.eventos.push(copyEvt(nuevo('SEDE')));state.filter='TODOS';E('proyFilter').value='TODOS';eventList();showWarnings();schedule();});
E('proyAddExterior').addEventListener('click',()=>{state.eventos.push(copyEvt(nuevo('EXTERIOR')));state.filter='TODOS';E('proyFilter').value='TODOS';eventList();showWarnings();schedule();});
E('proyGrupos').addEventListener('click',e=>{const btn=e.target.closest('[data-proy-delgroup]');if(!btn)return;const names=[...new Set(state.eventos.map(v=>v.grupo.trim()).filter(Boolean))],name=names[Number(btn.dataset.proyDelgroup)];if(!name)return;if(!confirm(`Quitar la agrupación «${name}» de todas sus actividades, sin eliminarlas?`))return;state.eventos.filter(v=>v.grupo.trim()===name).forEach(v=>v.grupo='');eventList();schedule();});
E('proyNotas').addEventListener('input',e=>{state.texto_sin_clasificar=e.target.value.split('\n');});
E('proyPrev').addEventListener('click',()=>{if(actual>0){actual--;renderPreview();}});E('proyNext').addEventListener('click',()=>{if(actual+1<pages.length){actual++;renderPreview();}});
E('proyDownload').addEventListener('click',exportPdf);
E('proyPreviewJump').addEventListener('click',()=>{E('proyPreview').scrollIntoView({behavior:'smooth',block:'start'});});
E('proyBackEdit').addEventListener('click',()=>{E('proyMeta').scrollIntoView({behavior:'smooth',block:'start'});});
window.proyRefresh=function(){if(!root.hidden)schedule();};
montarPromptProyeccion();
mount();
prepararFuentesProyeccion().then(()=>{if(!root.hidden)schedule();});
})();
