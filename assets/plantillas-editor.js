const LIMIT_BYTES = 32 * 1024 * 1024;
const LIMIT_PAGES = 48;
const LIMIT_PNG = 20_000_000;
const LIMIT_FIELDS = 24;
const FORMATS = {
  'original': {title:'Proporción del editable'},
  'facebook': {title:'Facebook · 4:5', ratio:4/5},
  'x': {title:'X · 16:9', ratio:16/9},
  'historia': {title:'Historia · 9:16', ratio:9/16},
};
const FONT_CHOICES = {
  museo: '500 22px "Museo Sans oficial"',
  poppins: '500 22px "Cartelera Poppins"',
  serif: '22px Georgia',
};
const doc = document.createElement('dialog');
doc.className = 'exterior-plantillas-dialogo';
doc.setAttribute('aria-labelledby', 'extPlantillasTitulo');
doc.innerHTML = `
  <header class="extpl-cabecera">
    <h2 id="extPlantillasTitulo">Plantillas propias</h2>
    <button type="button" class="g" data-extpl="close">Cerrar</button>
  </header>
  <p role="status" class="field-help" data-extpl="status"></p>
  <section data-extpl="library">
    <div class="extpl-controles">
      <label>Filtrar por familia <select data-extpl="filter"></select></label>
      <button type="button" class="g" data-extpl="new">Importar plantilla</button>
    </div>
    <div data-extpl="list"></div>
  </section>
  <section data-extpl="import" hidden>
    <div class="extpl-controles">
      <button type="button" class="g" data-extpl="cancelImport">Volver a la biblioteca</button>
      <label>Archivo de Illustrator o PDF <input type="file" accept=".ai,.pdf,application/pdf,application/postscript,application/illustrator" data-extpl="file"></label>
    </div>
    <p class="field-help">En Illustrator, guardá el .ai con «Crear archivo compatible con PDF».</p>
    <div class="extpl-controles" data-extpl="importOptions" hidden>
      <label>Mesa de trabajo <select data-extpl="page"></select></label>
      <label>Nombre de la plantilla <input maxlength="100" data-extpl="name" type="text"></label>
      <label>Familia <select data-extpl="family"></select></label>
      <label>Formato <select data-extpl="format"></select></label>
      <button type="button" class="g" data-extpl="usePage">Preparar mesa</button>
    </div>
  </section>
  <section data-extpl="editor" hidden>
    <div class="extpl-controles">
      <button type="button" class="g" data-extpl="back">Volver a la biblioteca</button>
      <h3 data-extpl="editingTitle"></h3>
    </div>
    <div class="extpl-editor">
      <div>
        <div class="extpl-visor" data-extpl="viewer">
          <canvas aria-label="Vista previa de la plantilla" data-extpl="canvas"></canvas>
          <div aria-hidden="true" class="extpl-marco" data-extpl="box" hidden></div>
        </div>
        <label class="extpl-switch" data-extpl="showOriginalLabel"><input type="checkbox" data-extpl="showOriginal"> Mostrar la mesa original</label>
      </div>
      <div class="extpl-campos">
        <div data-extpl="mapper">
          <p class="field-help">Elegí un texto detectado o marcá una zona. En fondos lisos podés elegir el color que cubrirá el texto del original.</p>
          <label>Texto detectado <select data-extpl="detected"></select></label>
          <button type="button" class="g" data-extpl="draw">Marcar una zona</button>
          <div data-extpl="coordinates" class="extpl-coordenadas" hidden>
            <label>Desde la izquierda (%) <input data-extpl="left" type="number" min="0" max="99" step="0.1"></label>
            <label>Desde arriba (%) <input data-extpl="top" type="number" min="0" max="99" step="0.1"></label>
            <label>Ancho (%) <input data-extpl="width" type="number" min="1" max="100" step="0.1"></label>
            <label>Alto (%) <input data-extpl="height" type="number" min="1" max="100" step="0.1"></label>
          </div>
          <label>Nombre del campo <input data-extpl="fieldName" maxlength="60" placeholder="Ej. Fecha"></label>
          <button type="button" class="g" data-extpl="addField" disabled>Agregar campo</button>
        </div>
        <div data-extpl="fields"></div>
        <div class="extpl-controles">
          <button type="button" data-extpl="save">Guardar plantilla</button>
          <button type="button" class="g" data-extpl="export">Descargar PNG</button>
        </div>
      </div>
    </div>
  </section>`;
document.body.append(doc);
const el = key => doc.querySelector('[data-extpl="'+key+'"]');
const status = message => { el('status').textContent = message; };
const clamp = (n, max = 1) => Math.max(0, Math.min(max, n));
const selectedFile = el('file');
const canvas = el('canvas');
const context = canvas.getContext('2d', {willReadFrequently:true});
const familyNames = Object.fromEntries(Object.entries(familiasExterior).map(([key, value]) => [key,value.nombre]));
familyNames.otras = 'Otras plantillas';
el('family').replaceChildren(...Object.entries(familyNames).map(([key, name]) => new Option(name,key)));
el('filter').replaceChildren(new Option('Todas las familias',''), ...Object.entries(familyNames).map(([key,name]) => new Option(name,key)));
el('format').replaceChildren(...Object.entries(FORMATS).map(([key,value]) => new Option(value.title,key)));

let database, pdfLib, pdf, loadingTask, base, draft, candidate, pointer;
let snippets = [], mapping = false, busy = false, dirty = false;
let requestedFamily = '';

function db() {
  if (database) return database;
  database = new Promise((resolve, reject) => {
    const request = indexedDB.open('exterior-plantillas-propias', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('plantillas', {keyPath:'id'});
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Cerrá la biblioteca en otras ventanas y volvé a intentarlo.'));
  }).catch(error => { database = null; throw error; });
  return database;
}

async function access(mode, operation) {
  const database = await db();
  return new Promise((resolve, reject) => {
    const tx = database.transaction('plantillas', mode);
    const request = operation(tx.objectStore('plantillas'));
    tx.oncomplete = () => resolve(request.result);
    tx.onabort = () => reject(tx.error || request.error);
    tx.onerror = () => reject(tx.error || request.error);
  });
}
function section(name) {
  for (const key of ['library','import','editor']) el(key).hidden = key !== name;
  el('close').focus();
}
function haveChanges() {
  return !dirty || confirm('¿Salir sin guardar los cambios de la plantilla?');
}
function resetPicture() {
  base?.close?.();
  base = null;
  draft = null;
  snippets = [];
  canvas.width = canvas.height = 1;
  candidate = null;
  pointer = null;
  mapping = dirty = false;
}
async function releasePdf() {
  const active = loadingTask;
  pdf = null;
  loadingTask = null;
  if (active) await active.destroy();
}
async function displayLibrary(filter = el('filter').value) {
  await releasePdf();
  resetPicture();
  section('library');
  el('filter').value = filter;
  const items = await access('readonly', store => store.getAll());
  try {
    if (items.length) localStorage.setItem('exterior-plantillas-propias','1');
    else localStorage.removeItem('exterior-plantillas-propias');
  } catch {}
  document.dispatchEvent(new Event('exterior-plantillas-guardadas'));
  const filtered = items.filter(item => !filter || item.family === filter);
  filtered.sort((a,b) => b.modified - a.modified);
  el('list').replaceChildren();
  if (!filtered.length) {
    const empty = document.createElement('p');
    empty.textContent = filter ? 'Esta familia todavía no tiene plantillas propias.' : 'Todavía no hay plantillas propias en este dispositivo.';
    el('list').append(empty);
    return;
  }
  for (const item of filtered) {
    const row = document.createElement('article');
    row.className = 'extpl-item';
    const title = document.createElement('h3');
    title.textContent = item.name;
    const meta = document.createElement('p');
    meta.textContent = familyNames[item.family]+' · '+FORMATS[item.format].title;
    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'g';
    open.textContent = 'Usar plantilla';
    open.setAttribute('aria-label', 'Usar plantilla '+item.name);
    open.onclick = () => { void run(() => useTemplate(item)); };
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'g';
    remove.textContent = 'Eliminar';
    remove.setAttribute('aria-label', 'Eliminar plantilla '+item.name);
    remove.onclick = () => {
      if (!confirm('¿Eliminar la plantilla «'+item.name+'» de este dispositivo?')) return;
      void run(async () => {
        await access('readwrite', store => store.delete(item.id));
        await displayLibrary();
        status('Plantilla eliminada.');
      });
    };
    row.append(title, meta, open, remove);
    el('list').append(row);
  }
}
async function useTemplate(item) {
  resetPicture();
  draft = {...item, fields:item.fields.map(field => ({...field}))};
  base = await createImageBitmap(draft.image);
  for (const choice of new Set(draft.fields.map(field=>FONT_CHOICES[field.font]))) await document.fonts.load(choice);
  showEditor(false);
}
export async function familyTemplates(family) {
  const items = await access('readonly', store => store.getAll());
  return items.filter(item => item.family === family)
    .sort((a,b) => a.name.localeCompare(b.name,'es'))
    .map(({id,name,format}) => ({id,name,format:FORMATS[format].title}));
}
export async function openSavedTemplate(id) {
  if (doc.open) return;
  doc.showModal();
  status('');
  await run(async()=>{
    const item = await access('readonly',store=>store.get(id));
    if (!item) {
      await displayLibrary();
      status('La plantilla ya no está guardada.');
      return;
    }
    el('filter').value = requestedFamily = item.family;
    await useTemplate(item);
  });
}
export async function openLibrary(family = '') {
  if (doc.open) return;
  requestedFamily = Object.hasOwn(familyNames, family) ? family : '';
  status('');
  doc.showModal();
  await run(() => displayLibrary(requestedFamily));
}
async function run(task) {
  if (busy) return;
  busy = true;
  doc.setAttribute('aria-busy','true');
  for (const key of ['library','import','editor']) el(key).inert = true;
  try { await task(); }
  catch (error) {
    status(error?.name === 'QuotaExceededError' ? 'No hay espacio para guardar la plantilla. Liberá espacio y volvé a intentarlo.' : (error?.message || 'La operación no se pudo completar.'));
  } finally {
    busy = false;
    doc.removeAttribute('aria-busy');
    for (const key of ['library','import','editor']) el(key).inert = false;
  }
}
function close() {
  if (!busy && haveChanges()) doc.close();
}
doc.addEventListener('cancel', event => { event.preventDefault(); close(); });
doc.addEventListener('close', () => { resetPicture(); void releasePdf(); });
el('close').onclick = close;
el('new').onclick = () => {
  if (busy) return;
  selectedFile.value = '';
  el('importOptions').hidden = true;
  status('');
  section('import');
  selectedFile.focus();
};
el('filter').onchange = () => { status(''); void run(() => displayLibrary()); };
el('cancelImport').onclick = el('back').onclick = () => {
  if (!busy && haveChanges()) { status(''); void run(() => displayLibrary()); }
};

async function pdfModule() {
  if (pdfLib) return pdfLib;
  const module = await import('./pdfjs-6.5.438/pdf.min.js');
  module.GlobalWorkerOptions.workerSrc = new URL('./pdfjs-6.5.438/pdf.worker.min.js', import.meta.url).href;
  pdfLib = module;
  return module;
}
function fittedFormat(width, height) {
  return Object.keys(FORMATS).find(key => Math.abs(width / height - FORMATS[key].ratio) < .005) || 'original';
}
async function boardChanged() {
  const page = await pdf.getPage(Number(el('page').value));
  const v = page.getViewport({scale:1});
  el('format').value = fittedFormat(v.width, v.height);
}
selectedFile.onchange = () => void run(async () => {
  el('importOptions').hidden = true;
  await releasePdf();
  const file = selectedFile.files[0];
  if (!file) return;
  if (!/\.(?:ai|pdf)$/i.test(file.name)) throw new Error('Elegí un archivo .ai o .pdf.');
  if (!file.size || file.size > LIMIT_BYTES) throw new Error('El archivo debe pesar entre 1 byte y 32 MiB.');
  const header = new TextDecoder('ascii').decode(await file.slice(0,1024).arrayBuffer());
  if (!header.includes('%PDF-')) throw new Error('El .ai necesita la opción «Crear archivo compatible con PDF». También podés guardar una copia PDF.');
  status('Leyendo las mesas de trabajo en este dispositivo…');
  const engine = await pdfModule();
  const data = new Uint8Array(await file.arrayBuffer());
  const assetRoot = new URL('./pdfjs-6.5.438/', import.meta.url);
  loadingTask = engine.getDocument({
    data,
    cMapUrl:new URL('cmaps/',assetRoot).href,
    standardFontDataUrl:new URL('standard_fonts/',assetRoot).href,
    cMapPacked:true,
    useWasm:false,
    enableXfa:false,
    disableAutoFetch:true,
    disableStream:true,
    isEvalSupported:false,
    isOffscreenCanvasSupported:false,
  });
  try { pdf = await loadingTask.promise; }
  catch (error) {
    await releasePdf().catch(()=>{});
    if (error.name === 'PasswordException') throw new Error('Guardá una copia del archivo desbloqueada y volvé a importarla.');
    throw new Error('No se pudo leer el editable. Guardá una copia compatible con PDF.');
  }
  if (!pdf.numPages || pdf.numPages > LIMIT_PAGES) {
    await releasePdf();
    throw new Error('El archivo puede tener hasta '+LIMIT_PAGES+' mesas de trabajo.');
  }
  el('page').replaceChildren(...Array.from({length:pdf.numPages},(_,i)=>new Option('Mesa '+(i+1), String(i+1))));
  el('name').value = file.name.replace(/\.(?:ai|pdf)$/i,'').slice(0,100);
  el('family').value = requestedFamily || el('filter').value || 'otras';
  await boardChanged();
  el('importOptions').hidden = false;
  el('page').focus();
  status(pdf.numPages === 1 ? 'Se encontró una mesa de trabajo.' : 'Se encontraron '+pdf.numPages+' mesas de trabajo.');
});
el('page').onchange = () => void run(boardChanged);

function takeSnippets(items, viewport, util) {
  return items
    .filter(item => item.str?.trim() && item.width > 2)
    .map(item => {
      const t = util.transform(viewport.transform, item.transform);
      const height = Math.hypot(t[2],t[3]);
      if (Math.abs(t[1]) > height*.25 || !height) return null;
      const width = item.width*viewport.scale;
      const x = clamp((t[4]-3)/viewport.width), y = clamp((t[5]-height*.92)/viewport.height);
      return {x,y,w:Math.min(1-x,(width+7)/viewport.width),h:Math.min(1-y,height*1.2/viewport.height),text:item.str.trim().slice(0,280)};
    })
    .filter(rect => rect && rect.w > .002 && rect.h > .002)
    .slice(0,350);
}
function pngBlob(picture) {
  return new Promise((resolve,reject) => picture.toBlob(blob => {
    if (!blob) reject(new Error('No se pudo generar la imagen.'));
    else if (blob.size > LIMIT_PNG) reject(new Error('La imagen supera el límite de 20 MB.'));
    else resolve(blob);
  },'image/png'));
}
el('usePage').onclick = () => void run(async () => {
  if (!pdf) return;
  const name = el('name').value.trim();
  if (!name) throw new Error('Escribí el nombre de la plantilla.');
  const number = Number(el('page').value);
  const page = await pdf.getPage(number);
  const size = page.getViewport({scale:1});
  const ratio = FORMATS[el('format').value].ratio;
  if (ratio && Math.abs(size.width / size.height - ratio) >= .005) throw new Error('La proporción de esta mesa no coincide con ese formato. Elegí otra mesa o conservá la proporción del editable.');
  if (!Number.isFinite(size.width) || !Number.isFinite(size.height) || Math.min(size.width,size.height)<2) throw new Error('No se pudo determinar el tamaño de la mesa.');
  const scale = Math.min(3200 / Math.max(size.width,size.height), 3, Math.sqrt(8_000_000 / (size.width*size.height)));
  const viewport = page.getViewport({scale});
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  status('Preparando vista previa…');
  await page.render({canvas, canvasContext:context, viewport, annotationMode:pdfLib.AnnotationMode.DISABLE}).promise;
  const content = await page.getTextContent({includeMarkedContent:false});
  snippets = takeSnippets(content.items, viewport, pdfLib.Util);
  page.cleanup();
  const image = await pngBlob(canvas);
  base = await createImageBitmap(image);
  draft = {id:crypto.randomUUID?.() || Array.from(crypto.getRandomValues(new Uint8Array(16)),v=>v.toString(16).padStart(2,'0')).join(''),name,family:el('family').value,format:el('format').value,image,fields:[],modified:Date.now()};
  dirty = true;
  await releasePdf();
  showEditor(true);
  status('Marcá los datos que se van a editar o guardá la mesa como plantilla fija.');
});
function showEditor(isNew) {
  el('editingTitle').textContent = draft.name;
  el('showOriginal').checked = false;
  el('mapper').hidden = !isNew;
  el('detected').replaceChildren(new Option('Elegí un texto',''), ...snippets.map((item,i)=>new Option(item.text, String(i))));
  el('detected').disabled = !snippets.length;
  el('coordinates').hidden = true;
  el('fieldName').value = '';
  el('addField').disabled = true;
  canvas.width = base.width; canvas.height = base.height;
  section('editor');
  drawFields();
  paint();
}
function wrap(ctx, value, width) {
  const lines = [];
  for (const paragraph of value.split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const next = line ? line+' '+word : word;
      if (line && ctx.measureText(next).width > width) { lines.push(line); line = word; }
      else line = next;
    }
    lines.push(line);
  }
  return lines;
}
function renderField(f) {
  const x = f.x * canvas.width, y = f.y * canvas.height;
  const w = f.w * canvas.width, h = f.h * canvas.height;
  context.save();
  context.beginPath();
  context.rect(x,y,w,h);
  context.clip();
  context.fillStyle = f.background;
  context.fillRect(x,y,w,h);
  context.textBaseline = 'middle';
  context.textAlign = f.align;
  context.fillStyle = f.ink;
  let size = Math.max(1, h * f.fontScale);
  let lines;
  for (let count=0; count<8; count++) {
    context.font = FONT_CHOICES[f.font].replace('22px',size+'px');
    lines = wrap(context,f.value,w*.96);
    if (lines.length*size*1.1 <= h) break;
    size = Math.max(1,h/(lines.length*1.13));
  }
  const textX = x + (f.align === 'center' ? w*.5 : f.align === 'right' ? w*.98 : w*.02);
  const top = y+(h-lines.length*size*1.1)/2;
  for (const [i,line] of lines.entries()) context.fillText(line,textX,top+(i+.5)*size*1.1,w*.96);
  context.restore();
}
function paint() {
  if (!draft || !base) return;
  context.clearRect(0,0,canvas.width,canvas.height);
  context.drawImage(base,0,0);
  if (!el('showOriginal').checked) for (const field of draft.fields) renderField(field);
}
el('showOriginal').onchange = paint;

function point(event) {
  const box = canvas.getBoundingClientRect();
  return {x:clamp((event.clientX-box.left)/box.width), y:clamp((event.clientY-box.top)/box.height)};
}
function showBox() {
  const box = el('box');
  box.hidden = !candidate;
  if (candidate) {
    for (const [key,value] of [['left',candidate.x],['top',candidate.y],['width',candidate.w],['height',candidate.h]]) box.style[key] = (value*100)+'%';
  }
}
function selectRect(rect) {
  candidate = rect;
  el('coordinates').hidden = !rect;
  el('addField').disabled = !rect;
  if (rect) for (const [key,value] of [['left',rect.x],['top',rect.y],['width',rect.w],['height',rect.h]]) el(key).value = (value*100).toFixed(1);
  showBox();
}
el('detected').onchange = () => {
  mapping = false;
  canvas.classList.remove('extpl-marcando');
  const index = el('detected').value;
  selectRect(index === '' ? null : {...snippets[Number(index)]});
};
el('draw').onclick = () => {
  mapping = !mapping;
  canvas.classList.toggle('extpl-marcando', mapping);
  el('detected').value = '';
  if (mapping && !candidate) selectRect({x:.10,y:.10,w:.45,h:.075,text:''});
  status(mapping ? 'Arrastrá sobre la vista previa o completá las coordenadas.' : '');
};
for (const key of ['left','top','width','height']) el(key).oninput = () => {
  if (!candidate) return;
  const x = clamp(el('left').valueAsNumber/100 || 0,.99);
  const y = clamp(el('top').valueAsNumber/100 || 0,.99);
  candidate = {...candidate,x,y,w:Math.max(.01,clamp(el('width').valueAsNumber/100 || 0,1-x)),h:Math.max(.01,clamp(el('height').valueAsNumber/100 || 0,1-y))};
  showBox();
};
canvas.addEventListener('pointerdown',event=>{
  if (!mapping) return;
  pointer = point(event);
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove',event=>{
  if (!pointer) return;
  const next = point(event);
  const w = Math.abs(pointer.x-next.x), h = Math.abs(pointer.y-next.y);
  if (w < .004 || h < .004) return;
  selectRect({x:Math.min(pointer.x,next.x),y:Math.min(pointer.y,next.y),w,h,text:''});
});
function endPointer() { pointer = null; }
canvas.addEventListener('pointerup',endPointer);
canvas.addEventListener('pointercancel',endPointer);

function sampledBackground(rect) {
  const x = clamp(Math.floor(rect.x*canvas.width)-3,canvas.width-1);
  const y = clamp(Math.floor(rect.y*canvas.height)-3,canvas.height-1);
  const [r,g,b] = context.getImageData(x,y,1,1).data;
  return '#'+[r,g,b].map(value=>value.toString(16).padStart(2,'0')).join('');
}
el('addField').onclick = () => {
  if (!candidate || !draft || busy) return;
  const label = el('fieldName').value.trim();
  if (!label) { status('Escribí un nombre para el campo.'); el('fieldName').focus(); return; }
  if (draft.fields.length >= LIMIT_FIELDS) { status('Cada plantilla admite hasta '+LIMIT_FIELDS+' campos.'); return; }
  const {text,...rect} = candidate;
  draft.fields.push({...rect,label,original:text,value:text,font:'museo',align:'left',fontScale:.72,background:sampledBackground(rect),ink:'#111e60'});
  dirty = true;
  selectRect(null);
  el('fieldName').value = '';
  el('detected').value = '';
  mapping = false;
  canvas.classList.remove('extpl-marcando');
  drawFields();
  paint();
  status('Campo agregado.');
};
function fieldControl(parent,label,control,field,key,read) {
  const row = document.createElement('label');
  row.textContent = label;
  control.value = field[key];
  control.oninput = () => { field[key] = read(control); paint(); };
  row.append(control);
  parent.append(row);
}
function drawFields() {
  const fields = el('fields');
  fields.replaceChildren();
  for (const field of draft.fields) {
    const group = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = field.label;
    group.append(legend);
    const input = document.createElement('textarea');
    input.rows = 2;
    input.maxLength = 280;
    fieldControl(group, field.label, input, field, 'value', node=>node.value);
    if (!el('mapper').hidden) {
      const colors = document.createElement('div');
      colors.className = 'extpl-colores';
      const background = document.createElement('input'); background.type = 'color';
      const ink = document.createElement('input'); ink.type = 'color';
      const font = document.createElement('select');
      font.append(new Option('Museo Sans','museo'),new Option('Poppins','poppins'),new Option('Serif','serif'));
      const align = document.createElement('select');
      align.append(new Option('Izquierda','left'),new Option('Centro','center'),new Option('Derecha','right'));
      fieldControl(colors,'Fondo',background,field,'background',node=>node.value);
      fieldControl(colors,'Texto',ink,field,'ink',node=>node.value);
      fieldControl(colors,'Tipografía',font,field,'font',node=>node.value);
      fieldControl(colors,'Alineación',align,field,'align',node=>node.value);
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'g';
      remove.textContent = 'Quitar campo';
      remove.onclick = () => {
        draft.fields = draft.fields.filter(item=>item!==field);
        drawFields(); paint();
      };
      group.append(colors,remove);
    }
    fields.append(group);
  }
}
el('save').onclick = () => void run(async () => {
  if (!draft) return;
  const record = {...draft,fields:draft.fields.map(field=>({...field,original:field.value})),modified:Date.now()};
  await access('readwrite',store=>store.put(record));
  dirty = false;
  requestedFamily = record.family;
  await displayLibrary(record.family);
  status('La plantilla está disponible en '+familyNames[record.family]+'.');
});
el('export').onclick = () => void run(async () => {
  if (!draft) return;
  await Promise.all([...new Set(draft.fields.map(f=>FONT_CHOICES[f.font]))].map(f=>document.fonts.load(f)));
  el('showOriginal').checked = false;
  paint();
  const png = await pngBlob(canvas);
  const clean = draft.name.replace(/[\\/:*?"<>|]/g,'_');
  await guardarPng(clean+'.png',png);
  status('PNG preparado.');
});
