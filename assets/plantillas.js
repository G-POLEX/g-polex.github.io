(() => {
'use strict';

const entry = document.getElementById('exteriorPlantillasPropias');
const catalog = document.getElementById('mapaGenerador');
const familyList = document.getElementById('ramasMapa');
const subMenu = document.getElementById('subcategoriasSede');
const recentFamily = document.getElementById('exteriorPlantillasFamilia');
const familyCards = document.getElementById('exteriorPlantillasEnCatalogo');
const launch = document.getElementById('exteriorAbrirPlantillas');
const openCategory = document.getElementById('exteriorAbrirPlantillasFamilia');

function hasTemplates() {
  try { return localStorage.getItem('exterior-plantillas-propias') === '1'; }
  catch { return false; }
}

let selectedFamily = '';
let revision = 0;
function updateLink() {
  const current = ++revision;
  const show = !familyList.hidden && !catalog.hidden;
  const route = subMenu.hidden ? '' : (rutaSubmenuCatalogo || selectedFamily);
  launch.hidden = !show;
  openCategory.hidden = !route || !hasTemplates() || catalog.hidden;
  const family = familiasExterior[route];
  if (family) recentFamily.textContent = family.nombre;
  entry.hidden = launch.hidden && openCategory.hidden;
  familyCards.replaceChildren();
  openCategory.dataset.family = route;
  if (!openCategory.hidden) {
    void loadEditor().then(module=>module.familyTemplates(route)).then(items=>{
      if (current !== revision) return;
      for (const item of items) {
        const button = document.createElement('button');
        const name = document.createElement('strong');
        const format = document.createElement('span');
        button.type = 'button';
        button.className = 'g';
        name.textContent = item.name;
        format.textContent = item.format;
        button.append(name, format);
        button.onclick = () => { void loadEditor().then(module=>module.openSavedTemplate(item.id)); };
        familyCards.append(button);
      }
    }).catch(()=>{});
  }
}

let pending;
function loadEditor() {
  pending ||= import('./plantillas-editor.js').catch(error => { pending = null; throw error; });
  return pending;
}
async function openLibrary(family) {
  const status = document.getElementById('exteriorPlantillasEstado');
  status.textContent = 'Abriendo plantillas propias…';
  try {
    await (await loadEditor()).openLibrary(family);
    status.textContent = '';
  } catch {
    status.textContent = 'No se pudo abrir la biblioteca. Volvé a intentarlo.';
  }
}

familyList.addEventListener('click', event => {
  const button = event.target.closest('[data-destino]');
  if (button) {
    selectedFamily = button.dataset.destino;
    queueMicrotask(updateLink);
  }
}, true);
new MutationObserver(updateLink).observe(familyList, {attributes:true, attributeFilter:['hidden']});
new MutationObserver(updateLink).observe(catalog, {attributes:true, attributeFilter:['hidden']});
new MutationObserver(updateLink).observe(subMenu, {attributes:true, attributeFilter:['hidden','aria-label']});
document.addEventListener('exterior-plantillas-guardadas', updateLink);
launch.addEventListener('click', () => openLibrary(''));
openCategory.addEventListener('click', () => openLibrary(openCategory.dataset.family));
updateLink();
})();
