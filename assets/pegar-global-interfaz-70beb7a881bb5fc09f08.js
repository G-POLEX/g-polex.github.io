(function(){
'use strict';
const api=window.exteriorRecomendarArte,$=id=>document.getElementById(id);
if(!api||typeof catalogoPlantillas!=='object'||typeof familiasExterior!=='object')return;
const entries=api.entries(catalogoPlantillas);
const stdAD={titulo:'adf_t0',subtitulo:'adf_t1',fecha:'adf_fecha',hora:'adf_hora',lugar:'adf_lugar',entrada:'adf_intro',nota:'adf_info'};
const campos={
 prensa:{titulo:'editorial-sede-titulo',cuerpo:'editorial-sede-cuerpo',fecha:'editorial-sede-fecha'},
 sede:{titulo:'sede-titulo',subtitulo:'sede-subtitulo',hora:'sede-horario',dias:'sede-dias',nota:'sede-nota'},
 consular:{titulo:'editorial-ad-titulo',lugar:'editorial-ad-lugar',representacion:'editorial-ad-repre1',
  nota:'editorial-ad-info',modalidad:'editorial-ad-atencion',whatsapp:'editorial-ad-whatsapp'},
 efemerides:{titulo:'d2',subtitulo:'d3',fecha:'df',hora:'dh',lugar:'du',entrada:'d1'},
 firma:{nombre:'editorial-sede-nombre',cargo:'editorial-sede-cargo',correo:'editorial-sede-correo',telefono:'editorial-sede-telefono',
  representacion:'editorial-sede-sede',lugar:'editorial-sede-direccion'},
 esquelas:{entrada:'editorial-ad-texto1',nombre:'editorial-ad-nombre',nota:'editorial-ad-texto2',fecha:'editorial-ad-fecha'},
 'otras-instituciones':{titulo:'t',subtitulo:'s',pais:'p',ciudad:'dui_city_0',fecha:'dui_date_0',hora:'dui_time_0',lugar:'dui_address_0'}
};
const texto=(datos,id)=>datos[id]?.valor||'';
const esPrensa=x=>x.ruta==='prensa';
const el=(tag,t,cls)=>{const e=document.createElement(tag);if(t)e.textContent=t;if(cls)e.className=cls;return e;};
const btn=(t,fn,cls='g')=>{const b=el('button',t,cls);b.type='button';b.addEventListener('click',fn);return b;};
const label=(t,n)=>{const a=el('label',t);a.append(n);return a;};
const editable=f=>f?.isConnected&&!f.disabled&&!f.readOnly&&['text','textarea','email','url','tel','search'].includes(f.type)&&!f.closest('[hidden]');
function set(f,value){f.value=value;f.dispatchEvent(new Event('input',{bubbles:true}));}
function valorCompatible(f,valor){
 if(!editable(f)||(f.maxLength>=0&&valor.length>f.maxLength)||(f.type!=='textarea'&&/[\r\n]/u.test(valor)))return false;
 const probe=f.cloneNode(false);probe.value=valor;return probe.value===valor;
}
function escribir(id,valor,protegidos,primerImport){
 const f=$(id);
 if(!valorCompatible(f,valor)||protegidos.has(id))return false;
 const regional=id.startsWith('sede-')?seleccionSede()?.plantilla?.campos?.find(([k])=>'sede-'+k===id)?.[2]:undefined;
 const representacionInicial=primerImport&&id==='editorial-ad-repre1'&&
   (f.value===representacionConsularPredeterminada||f.value===nombreOficialMinisterio);
 if(f.value.trim()&&f.value!==f.defaultValue&&f.value!==regional&&!representacionInicial)return false;
 if(f.value!==valor)set(f,valor);
 return !!valor;
}
const contenidoOrdenado=(datos,claves)=>claves.map(k=>datos[k]).filter(Boolean).sort((a,b)=>a.i-b.i).map(x=>x.valor).filter(Boolean).join('\n\n');
function importarAviso(raw,datos,proteccion){
 const ficha=fichaAviso(datosEditoriales('aviso'));
 const contactos=['telefono','whatsapp','virtual','correo'];
 const disponibles=contactos.filter(k=>texto(datos,k));
 const claves=['titulo','cuerpo','hora'];
 if(!datos.fecha?.enTexto)claves.push('fecha');
 let textoAviso=contenidoOrdenado(datos,claves);
 const excepcion=texto(datos,'excepcionHorario');
 if(excepcion&&textoAviso.includes('\n'+excepcion))textoAviso=textoAviso.replace('\n'+excepcion,'\n\n'+excepcion);
 let previo=null;
 if(textoAviso)try{previo=importarTextoAviso(textoAviso);}catch(_){}
 // El importador existente separa el mensaje, sedes y párrafos adicionales.
 if(!proteccion.has('editorial-ad-mensaje')&&!ficha.mensaje?.trim()&&previo?.mensaje){
  ficha.mensaje=previo.mensaje;
  ficha.pie ||= previo.pie;
  if(!ficha.parrafosAdicionales?.length)ficha.parrafosAdicionales=previo.parrafosAdicionales;
  ficha.incluye.pie=Boolean(ficha.pie||ficha.parrafosAdicionales?.length);
 }
 const ubicaciones=[...(previo?.sedes||[]),...texto(datos,'lugar').split('\n')].filter(Boolean);
 if(ubicaciones.length&&!ficha.sedes.some(s=>s?.trim())){
  ficha.sedes=[...new Set(ubicaciones)];
  ficha.sedesInicializadas=ficha.incluye.sedes=true;
 }
 for(const key of disponibles)if(!ficha[key]?.trim()&&!proteccion.has('editorial-ad-'+key)){
  ficha[key]=texto(datos,key);
  ficha.incluye.contactos=true;
 }
 ficha.textoImportado=raw;
 montarEditorialAD(false);
 $('adF').querySelector('.ag-metodos button:last-child')?.click();
 go();
}
function importarCartelera(raw){
 const estado=cartelera.mixta;
 if(estado.registros.some(r=>actividadCarteleraConDatos(r,r.tipo)))return;
 try{
  const {registros,fechas,fechaPortada}=importarListadoCartelera(raw,'mixta');
  Object.assign(estado,{registros,fechas,fechaPortada,listado:raw});
  montarCartelera('mixta');
  go();
 }catch(_){}
}
function importarEspecial(entry,raw,datos,protegidos){
 if(entry.ruta==='mov'){
  if(MVHayEdicion())return true;
  const base=raw.replace(/^(?:#{1,6}\s+)?\s*(?:\*\*)?Programa de Movilidad Laboral(?:\*\*)?[ \t]*\n+\s*/iu,'');
  const [oferta,...resto]=MVLeerConvocatorias(base);
  if(oferta&&!resto.length){
   Object.assign(MP(),{heroTitle:oferta.titulo,heroText:oferta.intro,blocks:oferta.blocks.map(b=>({...b}))});
   mvEditor.pegado=raw;
   mvEditor.textoEditado=true;
   mvEditor.importarAbierto=false;
   MVRefrescar();
  }
  return true;
 }
 if(entry.id==='el-salvador-mas'){
  const estado=datosEditoriales('el-salvador-mas');
  const previos=estado.convocatoriasSvp||[];
  const serviciosBase=JSON.stringify(estado.serviciosSvp||[]);
  const ajustado=previos.some(a=>JSON.stringify(a.serviciosSvp)!==serviciosBase||
   a.svpIntro||a.svpCiudad||a.svpObservaciones||a.svpTitulo!==SVP_TITULO||a.institucionesSvp.length||
   a.jornadasSvp.some(j=>Object.values(j).some(Boolean)));
  if(estado.svpPegado||protegidos.size||previos.length>1||ajustado)return true;
  try{
   const fechasYHoras=datos.fechas.flatMap(d=>[d.fecha?'Fecha: '+d.fecha:'',
    d.hora?'Horario: '+d.hora:'']).filter(Boolean);
   let ubicacion=texto(datos,'lugar'),representacion=texto(datos,'representacion');
   const sede=ubicacion.match(/^(consulado (?:general|de el salvador)[^\n]*?|embajada de el salvador[^\n]*?)(?:\s+[-–—]\s+|\n|$)([\s\S]*)$/iu);
   if(sede){representacion||=sede[1].trim();ubicacion=sede[2].trim();}
   const materiales=[texto(datos,'titulo'),...datos.lineasCuerpo,...fechasYHoras].filter(Boolean);
   const importados=svpLeerPegado(fechasYHoras.length?materiales.join('\n'):raw);
   if(fechasYHoras.length)for(const arte of importados)for(const jornada of arte.jornadasSvp){
    if(representacion)jornada.representacion=representacion;
    if(ubicacion)jornada.direccion=ubicacion;
   }
   Object.assign(estado,{convocatoriasSvp:importados,svpSeleccion:0,svpPegado:raw});
   montarEditorialAD(false);go();
  }catch(_){}
  return true;
 }
 if(entry.id==='proyeccion'){
  const f=$('proyRaw');
  if(f?.isConnected&&!f.value.trim()){
   set(f,raw);
   // El importador personal conserva su confirmación de reemplazo si ya hay una agenda.
   if(!$('proyEventos')?.querySelector('[data-proy-field]'))$('proyImportBtn')?.click();
  }
  return true;
 }
 return false;
}

function camposLogoEditorial(entry){
 if(entry.ruta==='avisos')return ['editorial-ad-repre1','editorial-ad-repre2'];
 if(entry.id==='invitacion-interna')return ['adInvitacionRepre1','adInvitacionRepre2'];
 if(entry.key==='atencion-consular|individual')return ['editorial-ad-repre1','editorial-ad-repre2'];
 return [];
}
function colocarLogoEditorial(entry,datos,protegidos,primera){
 const nombre=texto(datos,'representacion').trim();
 const [id1,id2]=camposLogoEditorial(entry);
 if(!nombre||!id1||!editable($(id1)))return;
 const [_,institucion,localidad]=/^((?:Consulado(?: General)?|Embajada) de El Salvador)\s+((?:en|ante)\s+.+)$/iu.exec(nombre)||[];
 if(institucion&&editable($(id2))&&!$(id2).value.trim()&&!protegidos.has(id2)){
  if(escribir(id1,institucion,protegidos,primera))escribir(id2,localidad,protegidos,primera);
 }else escribir(id1,nombre,protegidos,primera);
}
function colocarDatos(entry,variante,raw,protegidos,primera){
 const datos=api.extraer(raw,entry);
 const body=api.contenidoPara(raw,entry);
 if(entry.ruta==='avisos'){importarAviso(body,datos,protegidos);colocarLogoEditorial(entry,datos,protegidos,primera);return;}
 if(entry.key==='atencion-consular|mixta'){importarCartelera(body);return;}
 if(importarEspecial(entry,body,datos,protegidos))return;
 let mapa=campos[entry.ruta], valores={};
 if(entry.id==='firma')mapa=campos.firma;
 if(entry.id==='invitacion-interna'||entry.id==='navidad-2026'||entry.ruta==='ad')mapa=stdAD;
 if(entry.key==='ad|cafe'&&variante==='rojizo'){
  mapa={titulo:'editorial-ad-titulo',entrada:'editorial-ad-entrada',cuerpo:'editorial-ad-cuerpo',nota:'editorial-ad-cierre'};
  valores.cuerpo=contenidoOrdenado(datos,['cuerpo','fecha','hora','lugar']);
 }
 if(esPrensa(entry))valores.cuerpo=datos.cuerpoEditorial??contenidoOrdenado(datos,['cuerpo','hora','lugar','telefono','correo','whatsapp']);
 const contactos=contenidoOrdenado(datos,['nota','telefono','correo','virtual']);
 if(mapa===stdAD){
  const analizado=window.exteriorImportacionActividad?.analizar?.(datos.lineasCuerpo.join('\n'),{campos:['intro','info','t1']});
  valores.entrada=texto(datos,'entrada')||analizado?.asignados?.get('intro');
  valores.nota=contactos||analizado?.asignados?.get('info');
  valores.subtitulo=texto(datos,'subtitulo')||analizado?.asignados?.get('t1');
  if(texto(datos,'plataforma')){
   valores.lugar=[texto(datos,'lugar'),'Plataforma: '+texto(datos,'plataforma'),texto(datos,'enlace')].filter(Boolean).join('\n');
  }
  if(texto(datos,'instruccion'))valores.nota=[valores.nota,texto(datos,'instruccion')].filter(Boolean).join('\n');
 }
 if(entry.key==='atencion-consular|individual'){
  const {representacion:_logo,...camposVisibles}=campos.consular;
  mapa=camposVisibles;
  const fechas=datos.fechas;
  const modelo=datosEditoriales('actividad-consular-individual');
  if(fechas.length>modelo.numeroFechas){modelo.numeroFechas=Math.min(fechas.length,30);montarEditorialAD(false);}
  for(let i=0;i<(fechas.length||1)&&i<30;i++){
   escribir('editorial-ad-fecha'+(i+1),fechas[i]?.fecha??texto(datos,'fecha'),protegidos,primera);
   escribir('editorial-ad-hora'+(i===0?'':i+1),fechas[i]?.hora||(!i&&!fechas.length?texto(datos,'hora'):''),protegidos,primera);
  }
  valores.nota=contactos;
 }
 if(mapa===campos['otras-instituciones']&&api.norm(texto(datos,'titulo'))===api.norm(entry.nombre))valores.titulo='';
 for(const [k,id] of Object.entries(mapa||{}))escribir(id,valores[k]??texto(datos,k),protegidos,primera);
 colocarLogoEditorial(entry,datos,protegidos,primera);
}

const editor=document.querySelector('.exterior-layout'), header=editor?.querySelector('.exterior-editor-top');
const stage=$('osStage'),actions=stage?.querySelector('.os-stage-actions');
if(!editor||!header||!actions)return;
const nativo=document.documentElement.classList.contains('exterior-native');
const dialog=el('dialog','', 'exterior-pegado-global');
dialog.id='exteriorPegarDialogo';dialog.setAttribute('aria-labelledby','exteriorPegarTitulo');
const cab=el('header'), h=el('h2','Pegar texto');
h.id='exteriorPegarTitulo';cab.append(h,btn('Cerrar',()=>dialog.close()));
const area=el('textarea');
area.rows=4;area.id='exteriorPegarTexto';area.placeholder='Pegue el texto aquí';area.spellcheck=false;
area.setAttribute('aria-label','Texto base');
const status=el('p','','field-help');status.role='status';status.hidden=true;
const group=el('section');group.hidden=true;
const piezas=el('select');piezas.id='exteriorPegarPieza';
const elegirPieza=label('Pieza',piezas);elegirPieza.hidden=true;
const opciones=el('div','','ext-arte-orientacion');
const opts=el('select');opts.id='exteriorPegarTipo';
const variantes=el('select');variantes.id='exteriorPegarVariante';
const selVar=label('Variante',variantes);
const selector=el('details','','ext-arte-selector');
const resumenSelector=el('summary','Elegir otra plantilla');
const abrirManual=btn('Abrir diseño',()=>abrir(opts.value,variantes.value),'b');
selector.append(resumenSelector,label('Tipo de arte',opts),selVar,abrirManual);
group.append(elegirPieza,opciones,selector);
dialog.append(cab,area,status,group);
document.body.append(dialog);
const sourceBox=el('details','','exterior-pegado-original');sourceBox.hidden=true;
const resumen=el('summary','Texto original');
const source=el('textarea');source.rows=4;source.readOnly=true;source.setAttribute('aria-label','Texto original conservado');
const revision=el('p','','ext-revision-importacion');revision.hidden=true;revision.role='status';
header.after(revision,sourceBox);
const limpiar=btn('Borrar texto pegado',()=>{
 area.value='';source.value='';sourceBox.hidden=true;review();
});
sourceBox.append(resumen,source,btn('Volver a Pegar texto',open),limpiar);
let result=null, tramite=null, timer;
const borradores=new Map();
const ediciones=new Map();
const camposFormulario=()=>[...editor.querySelectorAll('input[id],textarea[id]')].filter(f=>editable(f)&&
 !f.closest('.exterior-pegado-original')&&!['avisoTextoBase','sedeTextoCartelera','mvPegado','proyRaw','svpTextoPegado'].includes(f.id));
const capturar=()=>new Map(camposFormulario().map(f=>[f.id,f.value]));
function restaurar(mapa){
 for(const [id,valor] of mapa){
  const f=$(id);
  if(valorCompatible(f,valor)&&f.value!==valor)set(f,valor);
 }
}
function actual(){
 const r=$('m')?.value;
 const id=familiasExterior[r]?.selector?$(familiasExterior[r].selector)?.value:'';
 return r+'|'+id;
}
function varianteActual(entry){
 const ficha=catalogoPlantillas[entry.ruta]?.[entry.id];
 const variante=ficha&&valorVarianteCatalogo(entry.ruta,ficha);
 return entry.variantes.some(v=>v.id===variante)?variante:entry.variantes[0]?.id||'';
}
function claveDiseno(k,variant){return k+'::'+variant;}
function copiarModelo(valor){
 if(Array.isArray(valor))return valor.map(copiarModelo);
 if(valor&&Object.getPrototypeOf(valor)===Object.prototype)
  return Object.fromEntries(Object.entries(valor).filter(([,v])=>typeof v!=='function').map(([k,v])=>[k,copiarModelo(v)]));
 return valor;
}
function modeloActivo(entry){
 if(entry.key==='atencion-consular|mixta')return {nombre:'cartelera-mixta',obtener:()=>cartelera.mixta,
  poner:m=>{cartelera.mixta=m;},montar:()=>montarCartelera('mixta')};
 if(entry.ruta==='mov')return {nombre:'movilidad',obtener:()=>({datos:datosMov,editor:{...mvEditor}}),
  poner:m=>{datosMov=m.datos;Object.assign(mvEditor,m.editor);},montar:()=>movForm()};
 const nombre=entry.ruta==='prensa'?claveDatosPrensa(sedeVersionActiva()):
  entry.ruta==='avisos'?'aviso':entry.key==='atencion-consular|individual'?'actividad-consular-individual':
  entry.ruta==='esquelas'?'esquela':entry.id==='firma'?'firma-ucom':entry.id==='el-salvador-mas'?'el-salvador-mas':
  modeloEditorialAD()==='cafe-rojizo'?'cafe-rojizo':null;
 if(!nombre)return null;
 const montar=entry.ruta==='prensa'?()=>montarUcomSede('prensa'):entry.id==='firma'?()=>montarUcomSede('firma'):()=>montarEditorialAD(false);
 return {nombre,obtener:()=>datosEditoriales(nombre),poner:m=>fichasEditoriales.set(nombre,m),montar};
}
function registrarVariante(variant,importar){
 const {entry,clavePieza,original,variantes:estados,modelos,anterior}=tramite;
 const id=claveDiseno(entry.key,variant);
 const previo=borradores.get(clavePieza).get(id);
 const estado={id,base:capturar(),campos:null,proteccion:new Set(previo?.proteccion||anterior)};
 const modelo=modeloActivo(entry);
 if(modelo&&!modelos.has(modelo.nombre)){
  estado.modelo=modelo;
  estado.modeloAnterior=modelo.obtener();
  modelo.poner(previo?.datos||copiarModelo(estado.modeloAnterior));
  if(modelo.nombre==='movilidad'&&!previo){mvEditor.pegado='';mvEditor.opciones=null;}
  modelo.montar();
  modelos.set(modelo.nombre,estado);
 }
 if(modelo)estado.datos=modelo.obtener;
 estados.set(id,estado);
 tramite.activo=estado;
 ediciones.set(entry.key,estado.proteccion);
 if(entry.ruta==='avisos'&&previo)$('adF').querySelector('.ag-metodos button:last-child')?.click();
 if(previo)restaurar(previo.campos);
 else if(importar)colocarDatos(entry,variant,original,estado.proteccion,true);
 estado.campos=capturar();
}
function cambiarVarianteActiva(){
 if(!tramite||actual()!==tramite.entry.key){actualizarAviso();return;}
 const {entry,variantes:estados}=tramite;
 const v=varianteActual(entry),id=claveDiseno(entry.key,v);
 if(tramite.activo?.id!==id){
  if(!estados.has(id))registrarVariante(v,false);
  else{
   tramite.activo=estados.get(id);
   ediciones.set(entry.key,tramite.activo.proteccion);
  }
 }
 actualizarAviso();
}
function cambioEditor(e){
 if(!e.isTrusted||!e.target.id||!editable(e.target)||!editor.contains(e.target))return;
 const seleccionado=actual();
 if(!ediciones.has(seleccionado))ediciones.set(seleccionado,new Set());
 if(tramite?.entry.key===seleccionado){
  cambiarVarianteActiva();
  if(tramite.activo)tramite.activo.campos=capturar();
 }
 ediciones.get(seleccionado).add(e.target.id);
 if(tramite?.entry.key===seleccionado)actualizarAviso();
}
editor.addEventListener('input',cambioEditor);
const selectores=new Set(['m','adT','adV','sedeVersion','sedeVariante','sedeDiseno','consularDiseno','internoDiseno','efemerideDiseno','dp','lay','mvDiseno','aviso-comunicado','prensa-formato','prensa-tipo-comunicado','prensa-tipo-convocatoria']);
for(const evento of ['input','change'])document.addEventListener(evento,e=>{
 if(selectores.has(e.target.id))queueMicrotask(cambiarVarianteActiva);
});
function guardarTramite(){
 if(!tramite)return;
 const {clavePieza,entry,variantes:estados,modelos,activo,anterior}=tramite;
 const enContexto=entry.key===actual();
 if(enContexto&&activo?.id===claveDiseno(entry.key,varianteActual(entry)))activo.campos=capturar();
 const record=borradores.get(clavePieza);
 for(const estado of estados.values())record.set(estado.id,{
  campos:estado.campos,datos:estado.datos?.(),proteccion:new Set(estado.proteccion)
 });
 const modeloVisible=enContexto?modeloActivo(entry):null;
 for(const estado of modelos.values())estado.modelo.poner(estado.modeloAnterior);
 if(modeloVisible&&modelos.has(modeloVisible.nombre))modeloVisible.montar();
 if(enContexto&&activo&&activo.id===claveDiseno(entry.key,varianteActual(entry))&&!modeloVisible)restaurar(activo.base);
 ediciones.set(entry.key,anterior);
 tramite=null;
}
function edicionesDelMismoTexto(entry,id,nuevo){
 if(!tramite||tramite.activo?.id!==id||actual()!==entry.key)return new Map();
 const previo=tramite.original.trim();
 if(!nuevo.trim().startsWith(previo+'\n'))return new Map();
 const actualizados=capturar();
 return new Map([...tramite.activo.proteccion].filter(c=>actualizados.has(c)).map(c=>[c,actualizados.get(c)]));
}
function iniciarTramite(entry,variante,parte,repeticion){
 const id=claveDiseno(entry.key,variante);
 const clavePieza=JSON.stringify([parte.raw,repeticion]);
 if(tramite?.clavePieza===clavePieza&&tramite.activo?.id===id&&entry.key===actual()&&
    editor.getClientRects().length&&!stage.getClientRects().length){
  actualizarAviso();
  return;
 }
 const conservados=repeticion===0?edicionesDelMismoTexto(entry,id,parte.raw):new Map();
 guardarTramite();
 const pasos=variante?varianteCatalogo(entry.ruta,entry.id,variante)?.pasos||[]:[];
 if(stage.getClientRects().length){
  const catalogo=stage.querySelector('[data-os-action="map"]');
  const crear=document.querySelector('[data-and-nav="crear"]');
  (crear||catalogo)?.click();
 }
 abrirEntradaCatalogo(entry.ruta,entry.id,pasos);
 if(!borradores.has(clavePieza))borradores.set(clavePieza,new Map());
 tramite={clavePieza,original:parte.raw,datosOrigen:parte.datos,variantes:new Map(),modelos:new Map(),anterior:ediciones.get(entry.key)||new Set(),entry};
 registrarVariante(variante,true);
 if(conservados.size){
  restaurar(conservados);
  for(const campo of conservados.keys())tramite.activo.proteccion.add(campo);
  tramite.activo.campos=capturar();
 }
 source.value=result.raw;
 sourceBox.open=false;
 actualizarAviso();
}

const prepararArteActividad=window.prepararActividadAD;
window.prepararActividadAD=function(...args){
 const arte=prepararArteActividad.apply(this,args);
 if(tramite?.entry.key===actual()&&!document.querySelector('#adF [id^="adf_"]')?.closest('[hidden]')){
  const campos=[...$('adF').querySelectorAll('[id^="adf_"]')];
  if(campos.length&&!campos.some(f=>f.value.trim()))arte.incompleto=true;
 }
 return arte;
};
const esperadosActividad={adf_t0:'título',adf_fecha:'fecha',adf_hora:'horario',adf_lugar:'ubicación'};
const accesosEditarWeb=nativo?[]:[$('uxEdit'),document.querySelector('#resultCard .ag-regresar')].filter(Boolean)
 .map(boton=>[boton,boton.textContent]);
function actualizarAviso(){
 sourceBox.hidden=!source.value||!tramite||actual()!==tramite.entry.key;
 for(const [boton,texto] of accesosEditarWeb){
  const nombre=sourceBox.hidden?texto:'Volver a editar';
  if(boton.textContent!==nombre)boton.textContent=nombre;
 }
 if(sourceBox.hidden){revision.hidden=true;return;}
 const faltan=new Set();
 for(const f of camposFormulario()){
  if(f.value.trim())continue;
  if(f.dataset.revisionEditorial){
   const nombre=f.labels?.[0]?.textContent.trim();
   if(nombre)faltan.add(nombre.toLowerCase());
  }else if(esperadosActividad[f.id])faltan.add(esperadosActividad[f.id]);
 }
 if(tramite.entry.ruta==='avisos'&&!$('editorial-ad-mensaje')?.value.trim())faltan.add('mensaje principal');
 const mensajes=faltan.size?['Por completar: '+new Intl.ListFormat('es',{type:'conjunction'}).format([...faltan])+'.']:[];
 const destino=tramite.datosOrigen?.destino?.valor;
 if(destino==='publicación e historia')mensajes.push('Formatos solicitados: publicación e historia.');
 if(destino==='correo')mensajes.push('Destino solicitado: correo.');
 const emisor=texto(tramite.datosOrigen||{},'representacion');
 if(emisor&&tramite.entry.ruta==='ad'&&tramite.entry.id!=='el-salvador-mas'&&!camposLogoEditorial(tramite.entry).length){
  mensajes.push('Representación indicada: '+emisor+'. Esta plantilla conserva el logo del Ministerio.');
 }
 const plazo=tramite.datosOrigen?.plazo?.valor;
 if(plazo)mensajes.push('Fecha límite de inscripción: '+plazo+'.');
 for(const p of tramite.datosOrigen?.pendientes||[])mensajes.push(p.motivo);
 if(tramite.datosOrigen?.logosPendientes&&!LG.ad.length)mensajes.push('Puede agregar los logos indicados en el texto original.');
 revision.textContent=mensajes.join(' ');
 revision.hidden=!mensajes.length;
}
const editorObserver=new MutationObserver(actualizarAviso);
editorObserver.observe($('m'),{childList:true});
editor.addEventListener('change',()=>queueMicrotask(actualizarAviso));
function abrir(clave,variante){
 if(result?.raw!==area.value){review();return;}
 const i=Number(piezas.value)||0;
 const parte=result?.piezas[i];
 const entry=entries.find(x=>x.key===clave);
 if(!parte||!entry||(entry.variantes.length&&!variante))return;
 dialog.close();
 const repeticion=result.piezas.slice(0,i).filter(p=>p.raw===parte.raw).length;
 iniciarTramite(entry,variante,parte,repeticion);
 // Usar el mismo acceso de la barra del editor. En móvil activa la zona
 // de vista previa y en escritorio conserva los dos paneles y la enfoca.
 go();
 const abierto=tramite;
 requestAnimationFrame(()=>{
  if(tramite===abierto&&actual()===entry.key&&!editor.hidden&&stage.hidden)$('uxPreview').click();
 });
}
for(const [ruta,familia] of Object.entries(familiasExterior)){
 const opciones=entries.filter(x=>x.ruta===ruta);
 if(!opciones.length)continue;
 if(opciones.length===1&&opciones[0].nombre===familia.nombre){
  opts.append(new Option(opciones[0].nombre,opciones[0].key));
  continue;
 }
 const grupo=el('optgroup');grupo.label=familia.nombre;
 grupo.append(...opciones.map(x=>new Option(x.nombre,x.key)));
 opts.append(grupo);
}
opts.prepend(new Option('Elegir un tipo de arte',''));opts.value='';
function mostrarVariantes(){
 const entry=entries.find(x=>x.key===opts.value);
 const vars=entry?.variantes||[];
 variantes.replaceChildren(new Option('Elegir una variante',''),...vars.map(v=>new Option(v.nombre,v.id)));
 selVar.hidden=vars.length===0;
 if(vars.length===1)variantes.value=vars[0].id;
 abrirManual.disabled=!entry||(vars.length>0&&!variantes.value);
}
opts.addEventListener('change',mostrarVariantes);
variantes.addEventListener('change',()=>{abrirManual.disabled=!variantes.value;});
function mostrarPieza(){
 const parte=result.piezas[Number(piezas.value)||0];
 opciones.replaceChildren();
 opts.value='';
 mostrarVariantes();
 selector.open=!parte.opciones.length;
 resumenSelector.textContent=parte.opciones.length?'Elegir otra plantilla':'Elegir plantilla';
 status.textContent=parte.opciones.length>1?'Dos diseños posibles':!parte.opciones.length?'Elija una plantilla para este texto.':'';
 status.hidden=!status.textContent;
 for(const sugerencia of parte.opciones){
  const item=entries.find(e=>e.key===sugerencia.key);
  const variante=item.variantes.find(v=>v.id===sugerencia.variante);
  const nombre=variante&&esPrensa(item)?variante.nombre:item.nombre;
  const boton=btn('',()=>abrir(item.key,sugerencia.variante),'ext-arte-abrir');
  const texto=el('span');
  texto.append(el('strong',nombre));
  if(variante&&!esPrensa(item))texto.append(el('span',variante.nombre));
  if(parte.opciones.length>1&&sugerencia.diferencia)texto.append(el('small',sugerencia.diferencia));
  boton.append(texto,el('span','Abrir diseño','ext-arte-accion'));
  opciones.append(boton);
 }
}
piezas.addEventListener('change',mostrarPieza);
function review(){
 clearTimeout(timer);
 const previa=result?.piezas[Number(piezas.value)||0]?.raw;
 result=api.analizar(area.value,entries);
 group.hidden=result.status!=='listo';
 if(group.hidden){
  status.hidden=result.status!=='limite';
  status.textContent=status.hidden?'':'El texto supera el tamaño permitido. Divídalo para continuar.';
  return;
 }
 piezas.replaceChildren(...result.piezas.map((p,i)=>new Option((i+1)+' de '+result.piezas.length+(p.datos.titulo?.valor?' · '+p.datos.titulo.valor.slice(0,70):''),i)));
 piezas.value=String(Math.max(0,result.piezas.findIndex(p=>p.raw===previa)));
 elegirPieza.hidden=result.piezas.length<2;
 mostrarPieza();
}
area.addEventListener('input',event=>{
 clearTimeout(timer);
 if(event.isComposing)return;
 if(event.inputType==='insertFromPaste')review();
 else timer=setTimeout(review,120);
});
area.addEventListener('paste',()=>setTimeout(()=>{if(dialog.open&&result?.raw!==area.value)review();},0));
area.addEventListener('compositionend',review);
function open(){
 if(dialog.open)return;
 dialog.showModal();
 area.focus();
 if(result?.raw!==area.value)review();
}

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
const consejosInicio=[
 ['editar','Use «Pegar texto» para ver un diseño sugerido.'],
 ['lista','En «Pegar texto», separe cada pieza con una línea de tres guiones.'],
 ['documento','En Avisos, marque «Contactos» para agregar un teléfono o correo.'],
 ['lista','En una jornada individual, use «Agregar fecha» para incluir otro horario.'],
 ['lupa','Compruebe los números de contacto en la vista previa.'],
 ['descarga','Busque sus artes en Descargas/Exterior del dispositivo.','android'],
 ['descarga','Busque los artes en las descargas del navegador.','web'],
 ['editar','En Inicio, use «Continuar edición» para retomar el arte abierto.','android'],
 ['documento','Para un comunicado, abra «Comunicados» en Inicio.','android'],
 ['documento','Busque «Comunicados y convocatorias» para redactar un comunicado.','web']
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
const claveConsejo='exterior.consejos.rotacion.v4';
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
const guiaConsejo=stage.querySelector('.ux-home-guide');
const anclaConsejo=nativo?stage.querySelector('.and-home-search'):($('osHomeSearchForm')||stage.querySelector('.os-stage-hero .os-stage-actions'));
if(anclaConsejo&&!stage.querySelector('.ext-consejo-inicio')){
 const nota=el('p','','ext-consejo-inicio'+(nativo?'':' ext-consejo-inicio-web'));
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 for(const [nombre,valor] of Object.entries({viewBox:'0 0 24 24','aria-hidden':'true',fill:'none',stroke:'currentColor','stroke-width':'1.7','stroke-linecap':'round','stroke-linejoin':'round'}))svg.setAttribute(nombre,valor);
 const camino=document.createElementNS(svg.namespaceURI,'path');camino.setAttribute('d',dibujosConsejo[iconoConsejo]);svg.append(camino);
 const texto=el('span',textoConsejo);
 nota.append(svg,texto);
 anclaConsejo.after(nota);
 if(!nativo&&guiaConsejo){
  const clave='exterior.web.consejos.v1';
  const control=document.createElement('input');control.type='checkbox';control.setAttribute('role','switch');
  control.checked=true;
  try{control.checked=localStorage.getItem(clave)!=='off';}catch(_){}
  nota.hidden=!control.checked;
  const rotulo=el('label','','ext-consejo-preferencia');
  rotulo.append(control,el('span','Mostrar consejos en Inicio'));
  guiaConsejo.append(rotulo);
  control.addEventListener('change',()=>{
   nota.hidden=!control.checked;
   try{localStorage.setItem(clave,control.checked?'on':'off');}catch(_){}
  });
 }
}

})();
