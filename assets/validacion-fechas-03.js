
/* Proyecto 03 · Advertencias no invasivas de fechas (solo interfaz). */
(() => {
 'use strict';
 const meses = {
  enero:1, febrero:2, marzo:3, abril:4, mayo:5, junio:6,
  julio:7, agosto:8, septiembre:9, setiembre:9, octubre:10, noviembre:11, diciembre:12,
  ene:1, feb:2, mar:3, abr:4, jun:6, jul:7, ago:8, sep:9, sept:9, set:9, oct:10, nov:11, dic:12,
  january:1, february:2, march:3, april:4, may:5, june:6, july:7, august:8,
  september:9, october:10, november:11, december:12
 };
 const dias = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
 const diaNumero = {domingo:0,lunes:1,martes:2,miercoles:3,jueves:4,viernes:5,sabado:6,
  sunday:0,monday:1,tuesday:2,wednesday:3,thursday:4,friday:5,saturday:6};
 const mesNombre = ['','enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
 const limpiar = texto => String(texto||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const cantidadDias = (mes,anio) => {
  if(mes<1||mes>12)return 0;
  if(mes===2)return anio ? (anio%4===0&&(anio%100!==0||anio%400===0)?29:28) : 29;
  return [4,6,9,11].includes(mes)?30:31;
 };
 const validarParte = (dia,mes,anio,diaEscrito) => {
  if(mes===undefined)return 'El mes indicado no se reconoce.';
  if(mes<1||mes>12)return 'Revisar el mes: debe estar entre 1 y 12.';
  if(anio!==undefined&&(anio<1||anio>9999))return 'Revisar el año de la fecha.';
  const tope=cantidadDias(mes,anio);
  if(dia<1||dia>tope){
   const contexto=anio ? ' de '+anio : '';
   return 'La fecha no existe: '+mesNombre[mes]+contexto+' tiene '+tope+' días como máximo.';
  }
  if(anio!==undefined&&diaEscrito!==undefined){
   const fecha=new Date(0);
   fecha.setUTCHours(12,0,0,0);
   fecha.setUTCFullYear(anio,mes-1,dia);
   const correcto=fecha.getUTCDay();
   if(correcto!==diaEscrito)return 'Revisar el día de la semana: esa fecha cae '+dias[correcto]+'.';
  }
  return '';
 };
 // Comprueba la escritura antes de normalizar las tildes para los cálculos del calendario.
 const mesesEsp = new Set(['enero','febrero','marzo','abril','mayo','junio','julio','agosto',
  'septiembre','setiembre','octubre','noviembre','diciembre',
  'ene','feb','mar','abr','jun','jul','ago','sep','sept','set','oct','nov','dic']);
 function revisarRedaccionFecha(texto) {
  const contenido=String(texto||'').trim();
  if(!contenido)return '';
  let coincidencia;
  // Solo se revisa una palabra cuando acompaña una fecha, sin corregirla automáticamente.
  const diaSinTilde=/(?:^|[^\p{L}])([\p{L}]+)(?=\s*,?\s+\d{1,2}(?!\d))/giu;
  while((coincidencia=diaSinTilde.exec(contenido))){
   const nombre=coincidencia[1], simple=limpiar(nombre);
   const esperado={sabado:'sábado',miercoles:'miércoles',dia:'día'}[simple];
   if(esperado&&nombre.toLocaleLowerCase('es')!==esperado)
    return 'Revisar la tilde: escribir «'+esperado+'».';
  }
  // Distinguir los meses mal acentuados o con mayúscula dentro de una fecha.
  const mesDeFecha=/\b\d{1,2}\s+de\s+([\p{L}]+)(?=$|[^\p{L}])/giu;
  while((coincidencia=mesDeFecha.exec(contenido))){
   const nombre=coincidencia[1], simple=limpiar(nombre);
   if(!mesesEsp.has(simple))continue; // El validador de calendario revisa meses no reconocidos.
   if(nombre!==simple){
    return 'Escribir el mes en minúscula y sin tilde: «'+simple+'».';
   }
  }
  if(/\b\d{1,2}\s+de\s+de\s+[\p{L}]+/iu.test(contenido))
   return 'Se repite «de» en la fecha. Eliminar una de las dos palabras.';
  // «21 noviembre» y «21 y 22 noviembre» requieren «de» antes del mes.
  const sinDeDiaMes=/\b\d{1,2}\s+([\p{L}]+)(?=$|[^\p{L}])/giu;
  while((coincidencia=sinDeDiaMes.exec(contenido))){
   const mes=limpiar(coincidencia[1]);
   if(mesesEsp.has(mes))return 'Falta «de» entre el día y el mes. Ejemplo: «21 de noviembre».';
  }
  // «21 de noviembre 2026» requiere «de» antes del año.
  const sinDeMesAnio=/\b\d{1,2}\s+de\s+([\p{L}]+)\.?\s*,?\s+(\d{4})(?!\d)/giu;
  while((coincidencia=sinDeMesAnio.exec(contenido))){
   if(mesesEsp.has(limpiar(coincidencia[1])))
    return 'Falta «de» antes del año. Ejemplo: «21 de noviembre de 2026».';
  }
  if(/\b\d{1,2}\s+de\s*$/iu.test(contenido))
   return 'Falta indicar el mes después de «de».';
  if(/\b\d{1,2}\s+de\s+[\p{L}]+\s+de\s+\d{1,3}\s*$/iu.test(contenido))
   return 'El año está incompleto. Indicar cuatro cifras.';
  return '';
 }
 function validarTextoFecha(texto) {
  const redaccion=revisarRedaccionFecha(texto);
  if(redaccion)return redaccion;
  const contenido=limpiar(texto).replace(/\s+/g,' ').trim();
  if(!contenido)return '';
  // El año se exige únicamente para contrastar los días de la semana.
  // Las fechas pasadas son válidas: no todas las plantillas son convocatorias futuras.
  const coincidencias=[];
  const agregar=(inicio,fin,dia,mes,anio,nombreDia) => coincidencias.push({inicio,fin,dia:Number(dia),mes,anio:anio?Number(anio):undefined,diaEscrito:nombreDia===undefined?undefined:diaNumero[nombreDia]});
  let m;
  const fechasNumericas=/\b(\d{4})-(\d{1,2})-(\d{1,2})\b|\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})\b/g;
  while((m=fechasNumericas.exec(contenido))){
   const anio=m[1]||m[6],mes=Number(m[2]||m[5]),dia=m[3]||m[4];
   agregar(m.index,fechasNumericas.lastIndex,dia,mes,anio);
  }
  // «Del 21 al 23 de noviembre de 2026» y «21 y 22 de noviembre».
  const rango=/\b(?:del?\s+)?(\d{1,2})\s+(?:al|a|y)\s+(\d{1,2})\s+de\s+([a-z]{3,16})(?:\s+(?:de|del)\s+(\d{4}))?\b/g;
  while((m=rango.exec(contenido))){
   const mes=meses[m[3]],inicio=Number(m[1]),fin=Number(m[2]);
   if(mes===undefined)return 'El mes «'+m[3]+'» no se reconoce.';
   const error=validarParte(inicio,mes,m[4])||validarParte(fin,mes,m[4]);
   if(error)return error;
   if(fin<inicio)return 'Revisar el rango: la última fecha es anterior a la primera.';
   coincidencias.push({inicio:m.index,fin:rango.lastIndex,rango:true});
  }
  // «Sábado 21 de noviembre de 2026»; el año también puede omitirse.
  const escrita=/\b(?:(lunes|martes|miercoles|jueves|viernes|sabado|domingo|monday|tuesday|wednesday|thursday|friday|saturday|sunday)[,\s]+)?(\d{1,2})\s+de\s+([a-z]{3,16})(?:\s+(?:de|del)\s+(\d{4}))?\b/g;
  while((m=escrita.exec(contenido))){
   if(coincidencias.some(c=>m.index>=c.inicio&&m.index<c.fin))continue;
   const mes=meses[m[3]];
   if(mes===undefined)return 'El mes «'+m[3]+'» no se reconoce.';
   agregar(m.index,escrita.lastIndex,m[2],mes,m[4],m[1]);
  }
  // Formato habitual en convocatorias traducidas: «Tuesday, November 24, 2026».
  const inglesa=/\b(?:(monday|tuesday|wednesday|thursday|friday|saturday|sunday)[,\s]+)?(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2}),?\s+(\d{4})\b/g;
  while((m=inglesa.exec(contenido))){
   if(coincidencias.some(c=>m.index>=c.inicio&&m.index<c.fin))continue;
   agregar(m.index,inglesa.lastIndex,m[3],meses[m[2]],m[4],m[1]);
  }
  for(const fecha of coincidencias){
   if(fecha.rango)continue;
   const error=validarParte(fecha.dia,fecha.mes,fecha.anio,fecha.diaEscrito);
   if(error)return error;
  }
  return '';
 }
 let secuencia=0;
 const patronFecha=/^(?:fecha(?:\s|\d|$)|d[ií]a(?:\s+de\s+la\s+actividad)?\s*$)/i;
 function tipoDeCampo(campo) {
  if(!(campo instanceof HTMLInputElement||campo instanceof HTMLTextAreaElement))return '';
  if(campo instanceof HTMLInputElement&&!['text','search','date'].includes(campo.type))return '';
  // Conservar la clasificación cuando el aviso se inserta dentro de la etiqueta.
  if(campo.__tipoFecha03)return campo.__tipoFecha03;
  const id=campo.id||'';
  if(id==='sedeTextoCartelera'||id==='mvPegado')return 'listado';
  if(/^mvTexto-\d+$/.test(id)){
   const bloque=Number(id.slice(8));
   if(typeof MP==='function'&&MP().blocks?.[bloque]?.k==='facts')return 'listado';
  }
  if(['gd','df'].includes(id)||/^dui_date_\d+$/.test(id)||/^(?:fecha\d*|fecha1|fecha2)$/.test(campo.dataset.campoEditorial||''))return 'fecha';
  const etiqueta=campo.closest('label')||Array.from(document.querySelectorAll('label[for]')).find(e=>e.htmlFor===id);
  const titulo=etiqueta?.textContent?.trim()||'';
  if(patronFecha.test(titulo)){campo.__tipoFecha03='fecha';return 'fecha';}
  return '';
 }
 function textoParaValidar(campo,tipo) {
  if(tipo!=='listado')return campo.value;
  // En documentos completos solo se comprueban líneas que indiquen fechas.
  const lineas=campo.value.split(/\r?\n/).map(l=>l.trim()).filter(l=>/^(?:fecha\b|jornadas extraordinarias\b|consulados moviles\b|consulados móviles\b|(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\s+\d)/i.test(l));
  return lineas.join('\n');
 }
 function presentarAdvertencia(campo) {
  const tipo=tipoDeCampo(campo);
  if(!tipo)return;
  const mensaje=validarTextoFecha(textoParaValidar(campo,tipo));
  let aviso=campo.__avisoFecha03;
  if(!mensaje){
   if(aviso){aviso.remove();delete campo.__avisoFecha03;}
   campo.removeAttribute('aria-invalid');
   if(campo.dataset.descripcionPreviaFecha03!==undefined){
    const anterior=campo.dataset.descripcionPreviaFecha03;
    if(anterior)campo.setAttribute('aria-describedby',anterior);
    else campo.removeAttribute('aria-describedby');
    delete campo.dataset.descripcionPreviaFecha03;
   }
   return;
  }
  if(!aviso){
   aviso=document.createElement('small');
   aviso.id='advertencia-fecha-03-'+(++secuencia);
   aviso.className='advertencia-fecha-03';
   aviso.setAttribute('role','status');
   aviso.setAttribute('aria-live','polite');
   campo.insertAdjacentElement('afterend',aviso);
   campo.__avisoFecha03=aviso;
   campo.dataset.descripcionPreviaFecha03=campo.getAttribute('aria-describedby')||'';
   campo.setAttribute('aria-describedby',[campo.dataset.descripcionPreviaFecha03,aviso.id].filter(Boolean).join(' '));
  }
  aviso.textContent='⚠ '+mensaje;
  campo.setAttribute('aria-invalid','true');
 }
 function revisarGrupo(raiz) {
  if(raiz.matches?.('input,textarea'))presentarAdvertencia(raiz);
  raiz.querySelectorAll?.('input,textarea').forEach(presentarAdvertencia);
 }
 document.addEventListener('input',e=>presentarAdvertencia(e.target),true);
 document.addEventListener('change',e=>presentarAdvertencia(e.target),true);
 document.addEventListener('focusout',e=>presentarAdvertencia(e.target),true);
 // Los formularios de jornadas y carteleras se regeneran al agregar fechas o pegar listados.
 const observar=new MutationObserver(mutaciones=>{
  for(const mutacion of mutaciones){
   for(const nodo of mutacion.addedNodes){
    if(nodo.nodeType!==1)continue;
    if(nodo.matches?.('.advertencia-fecha-03'))continue;
    revisarGrupo(nodo);
   }
  }
 });
 const editor=document.querySelector('.exterior-editor');
 if(editor){observar.observe(editor,{childList:true,subtree:true});revisarGrupo(editor);}
})();
