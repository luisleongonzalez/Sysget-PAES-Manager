/* ═══════════════════════════════════════════════════════════
   PAES MANAGER - BIBLIOTECA DIGITAL DE ESTUDIO
   Parte 2 & 3: Gestión de URLs, Visor PDF, YouTube, Drive
   y Soporte Integrado de Carpeta Drive Oficial
   ═══════════════════════════════════════════════════════════ */

let bibliotecaMateriales = [];
let filtroAsignaturaActual = 'matematica';
let filtroEjeActual = 'todos';
let busquedaTextoActual = '';

const DRIVE_FOLDER_OFICIAL_URL = 'https://drive.google.com/drive/folders/1pd6PXvuU87PVfLe0nevk_oWaWXBlVA4k?usp=sharing';
const DRIVE_FOLDER_ID = '1pd6PXvuU87PVfLe0nevk_oWaWXBlVA4k';

// URLs asignadas por el admin (guardadas en Firebase y localStorage como fallback)
let urlsPersonalizadas = {};

// Ejes temáticos oficiales DEMRE por asignatura
const EJES_POR_ASIGNATURA = {
  matematica: ['Números', 'Álgebra y Funciones', 'Geometría', 'Datos y Azar'],
  lenguaje:   ['Comprensión Lectora', 'Vocabulario', 'Textos Literarios', 'Textos No Literarios'],
  historia:   ['Historia de Chile', 'Formación Ciudadana', 'Economía', 'Mundo Global'],
  biologia:   ['Biología Celular', 'Genética y Evolución', 'Fisiología', 'Ecología'],
  fisica:     ['Mecánica', 'Termodinámica', 'Electricidad y Magnetismo', 'Óptica y Ondas'],
  quimica:    ['Materia y sus Transformaciones', 'Reacciones Químicas', 'Química Orgánica', 'Solución y Mezclas'],
  tp:         ['Ciencias para la Vida', 'Tecnología y Sociedad', 'Sistemas de Producción']
};

document.addEventListener('DOMContentLoaded', () => {
  cargarUrlsGuardadas();
  cargarCatalogoBiblioteca();
  renderChipsEje('matematica');
  inyectarModalBiblioteca();
});

/* Persistencia de URLs */
async function cargarUrlsGuardadas() {
  try {
    if (typeof db !== 'undefined' && db) {
      const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      const snap = await getDoc(doc(db, 'config', 'biblioteca_urls'));
      if (snap.exists()) {
        urlsPersonalizadas = snap.data() || {};
        localStorage.setItem('paes_biblioteca_urls', JSON.stringify(urlsPersonalizadas));
        return;
      }
    }
  } catch (e) {}
  try {
    const guardado = localStorage.getItem('paes_biblioteca_urls');
    if (guardado) urlsPersonalizadas = JSON.parse(guardado);
  } catch (e) { urlsPersonalizadas = {}; }
}

async function guardarUrls() {
  localStorage.setItem('paes_biblioteca_urls', JSON.stringify(urlsPersonalizadas));
  try {
    if (typeof db !== 'undefined' && db) {
      const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      await setDoc(doc(db, 'config', 'biblioteca_urls'), urlsPersonalizadas);
    }
  } catch (e) {}
}

/* Carga del catálogo */
async function cargarCatalogoBiblioteca() {
  try {
    const res = await fetch('biblioteca_paes.json');
    if (res.ok) {
      bibliotecaMateriales = await res.json();
      renderBiblioteca();
    }
  } catch (err) {
    console.error("[PAES Biblioteca] Error al cargar catálogo:", err);
  }
}

/* Cambio de asignatura */
function cambiarAsignaturaBiblioteca(asig) {
  filtroAsignaturaActual = asig;
  filtroEjeActual = 'todos';
  document.querySelectorAll('.btn-asig-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.asig === asig);
  });
  renderChipsEje(asig);
  renderBiblioteca();
}

/* Chips de eje dinámicos */
function renderChipsEje(asig) {
  const container = document.getElementById('chips-eje-container');
  if (!container) return;
  const ejes = EJES_POR_ASIGNATURA[asig] || [];
  container.innerHTML = `
    <span style="font-size:12px;color:#64748b;font-weight:600;margin-right:4px;">Eje DEMRE:</span>
    <button class="chip-eje" data-eje="todos" onclick="filtrarEjeBiblioteca('todos')"
      style="background:rgba(124,58,237,0.35);border:1px solid rgba(124,58,237,0.6);color:#fff;padding:5px 12px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;">Todos</button>
    ${ejes.map(eje => `
    <button class="chip-eje" data-eje="${eje}" onclick="filtrarEjeBiblioteca('${eje}')"
      style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#94a3b8;padding:5px 12px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;">${eje}</button>`).join('')}
  `;
}

/* Filtro por eje */
function filtrarEjeBiblioteca(eje) {
  filtroEjeActual = eje;
  document.querySelectorAll('.chip-eje').forEach(c => {
    const activo = c.dataset.eje === eje;
    c.style.background = activo ? 'rgba(124,58,237,0.35)' : 'rgba(255,255,255,0.05)';
    c.style.border = activo ? '1px solid rgba(124,58,237,0.6)' : '1px solid rgba(255,255,255,0.1)';
    c.style.color = activo ? '#fff' : '#94a3b8';
  });
  renderBiblioteca();
}

/* Búsqueda */
function buscarEnBiblioteca(q) {
  busquedaTextoActual = q.toLowerCase().trim();
  renderBiblioteca();
}

/* Helpers */
function getUrlEfectiva(m) {
  return urlsPersonalizadas[m.id] || m.url || '#';
}

/* Render de tarjetas */
function renderBiblioteca() {
  const container = document.getElementById('grid-materiales-biblioteca');
  const contadorEl = document.getElementById('cant-materiales-badge');
  if (!container) return;

  const filtrados = bibliotecaMateriales.filter(m => {
    const matchAsig = m.asignatura === filtroAsignaturaActual;
    const matchEje  = (filtroEjeActual === 'todos') || (m.eje === filtroEjeActual);
    const matchQ    = !busquedaTextoActual ||
      m.titulo.toLowerCase().includes(busquedaTextoActual) ||
      m.eje.toLowerCase().includes(busquedaTextoActual) ||
      m.descripcion.toLowerCase().includes(busquedaTextoActual);
    return matchAsig && matchEje && matchQ;
  });

  if (contadorEl) {
    const conUrl = filtrados.filter(m => getUrlEfectiva(m) !== '#').length;
    contadorEl.textContent = filtrados.length + ' Recursos · ' + conUrl + ' con enlace';
  }

  if (filtrados.length === 0) {
    container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px 20px;background:rgba(0,0,0,0.2);border-radius:12px;border:1px dashed rgba(255,255,255,0.1);"><p style="font-size:24px;margin-bottom:8px;">🔍</p><p style="color:#94a3b8;font-weight:600;font-size:14px;margin:0;">No se encontraron materiales para esta búsqueda.</p></div>';
    return;
  }

  container.innerHTML = filtrados.map(m => renderTarjetaMaterial(m)).join('');
}

function renderTarjetaMaterial(m) {
  const tipoMap = {
    pdf:       { icon: '📄', color: '#3b82f6', label: 'PDF Formulario' },
    ppt:       { icon: '💻', color: '#eab308', label: 'PPT Clase' },
    video:     { icon: '🎥', color: '#ef4444', label: 'Video Clase' },
    ejercicio: { icon: '📝', color: '#10b981', label: 'Ejercitación' }
  };
  const { icon, color, label } = tipoMap[m.tipo] || tipoMap['pdf'];
  const urlEfectiva = getUrlEfectiva(m);
  const tieneUrl = urlEfectiva && urlEfectiva !== '#';
  const esFav = localStorage.getItem('fav_bib_' + m.id) === '1';
  const tituloEscapado = m.titulo.replace(/'/g, "&#39;").replace(/"/g, "&quot;");

  return `
    <div id="card-${m.id}" style="background:rgba(15,23,42,0.65);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:20px;display:flex;flex-direction:column;justify-content:space-between;transition:all 0.2s ease;"
      onmouseover="this.style.borderColor='rgba(124,58,237,0.4)'"
      onmouseout="this.style.borderColor='rgba(255,255,255,0.08)'">
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <span style="font-size:11px;font-weight:700;color:#a78bfa;text-transform:uppercase;background:rgba(124,58,237,0.15);padding:4px 10px;border-radius:6px;border:1px solid rgba(124,58,237,0.3);">📍 ${m.eje}</span>
          <span style="font-size:11px;font-weight:700;color:${color};background:rgba(255,255,255,0.05);padding:4px 10px;border-radius:6px;border:1px solid rgba(255,255,255,0.1);">${icon} ${label}</span>
        </div>
        <h3 style="font-size:15px;font-weight:700;color:#f8fafc;margin:0 0 8px;line-height:1.4;">${m.titulo}</h3>
        <p style="font-size:12px;color:#94a3b8;margin:0 0 14px;line-height:1.5;">${m.descripcion}</p>
        ${tieneUrl ? '' : '<div style="font-size:11px;color:#f59e0b;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.25);border-radius:6px;padding:6px 10px;margin-bottom:10px;">⚠️ Sin enlace propio · <a href="javascript:void(0)" onclick="abrirCarpetaDriveOficial()" style="color:#f59e0b;font-weight:700;">Buscar en Drive</a></div>'}
      </div>
      <div style="display:flex;gap:8px;margin-top:auto;flex-wrap:wrap;">
        <button onclick="abrirMaterial('${m.id}')"
          style="flex:1;min-width:100px;text-align:center;background:${tieneUrl ? 'rgba(124,58,237,0.25)' : 'rgba(16,185,129,0.15)'};border:1px solid ${tieneUrl ? 'rgba(124,58,237,0.5)' : 'rgba(16,185,129,0.3)'};color:${tieneUrl ? '#c4b5fd' : '#34d399'};padding:8px 12px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;">
          ${tieneUrl ? '👁️ Ver / Descargar' : '📂 Explorar en Drive'}
        </button>
        <button onclick="abrirModalAsignarUrl('${m.id}', '${tituloEscapado}')" title="Asignar o cambiar URL específica"
          style="background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.3);color:#f59e0b;padding:8px 12px;border-radius:8px;font-size:13px;cursor:pointer;">⚙️</button>
        <button id="fav-${m.id}" onclick="toggleFavoritoBiblioteca('${m.id}', this)"
          style="background:${esFav ? 'rgba(234,179,8,0.15)' : 'rgba(255,255,255,0.05)'};border:1px solid rgba(255,255,255,0.12);color:${esFav ? '#eab308' : '#e2e8f0'};padding:8px 12px;border-radius:8px;cursor:pointer;">⭐</button>
      </div>
    </div>`;
}

/* Abrir material o Carpeta Drive */
function abrirMaterial(id) {
  const material = bibliotecaMateriales.find(m => m.id === id);
  if (!material) return;
  const url = getUrlEfectiva(material);

  if (!url || url === '#') {
    // Si no tiene URL específica, abrir la carpeta oficial de Drive
    abrirCarpetaDriveOficial();
    return;
  }

  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const videoId = extraerYoutubeId(url);
    if (videoId) { abrirVisorModal({ titulo: material.titulo, embedUrl: 'https://www.youtube.com/embed/' + videoId + '?autoplay=1', externalUrl: url }); return; }
  }
  if (url.includes('drive.google.com')) {
    abrirVisorModal({ titulo: material.titulo, embedUrl: convertirDriveAEmbed(url), externalUrl: url }); return;
  }
  if (url.includes('onedrive.live.com') || url.includes('1drv.ms')) {
    abrirVisorModal({ titulo: material.titulo, embedUrl: url.replace('/view', '/embed'), externalUrl: url }); return;
  }
  if (url.toLowerCase().includes('.pdf')) {
    abrirVisorModal({ titulo: material.titulo, embedUrl: url, externalUrl: url }); return;
  }
  window.open(url, '_blank');
}

function abrirCarpetaDriveOficial() {
  const embedUrl = 'https://drive.google.com/embeddedfolderview?id=' + DRIVE_FOLDER_ID + '#grid';
  abrirVisorModal({
    titulo: '📂 Carpeta Oficial de Materiales (Google Drive)',
    embedUrl: embedUrl,
    externalUrl: DRIVE_FOLDER_OFICIAL_URL
  });
}

function extraerYoutubeId(url) {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function convertirDriveAEmbed(url) {
  if (url.includes('/folders/')) {
    const mFolder = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (mFolder) return 'https://drive.google.com/embeddedfolderview?id=' + mFolder[1] + '#grid';
  }
  const m = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return 'https://drive.google.com/file/d/' + m[1] + '/preview';
  const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m2) return 'https://drive.google.com/file/d/' + m2[1] + '/preview';
  return url;
}

/* Modal visor */
function abrirVisorModal({ titulo, embedUrl, externalUrl }) {
  const modal = document.getElementById('modal-visor-biblioteca');
  if (!modal) return;
  document.getElementById('modal-visor-titulo').textContent = titulo;

  const headerActions = document.getElementById('modal-visor-header-actions');
  if (headerActions) {
    let extBtn = '';
    if (externalUrl) {
      extBtn = `<a href="${externalUrl}" target="_blank" style="background:rgba(16,185,129,0.2);border:1px solid rgba(16,185,129,0.4);color:#34d399;padding:6px 14px;border-radius:8px;text-decoration:none;font-size:12px;font-weight:700;margin-right:10px;display:inline-flex;align-items:center;gap:6px;">🔗 Abrir en Google Drive</a>`;
    }
    headerActions.innerHTML = extBtn + '<button onclick="cerrarVisorBiblioteca()" style="background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);color:#f87171;padding:6px 14px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;">✕ Cerrar</button>';
  }

  document.getElementById('modal-visor-content').innerHTML =
    '<iframe src="' + embedUrl + '" style="width:100%;height:75vh;border:none;border-radius:8px;background:#000;" allow="autoplay;fullscreen" allowfullscreen></iframe>';
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function cerrarVisorBiblioteca() {
  const modal = document.getElementById('modal-visor-biblioteca');
  if (modal) { modal.style.display = 'none'; document.getElementById('modal-visor-content').innerHTML = ''; }
  document.body.style.overflow = '';
}

/* Modal asignar URL */
function abrirModalAsignarUrl(id, titulo) {
  const modal = document.getElementById('modal-asignar-url');
  if (!modal) return;
  document.getElementById('asignar-url-titulo').textContent = titulo;
  document.getElementById('asignar-url-input').value = urlsPersonalizadas[id] || '';
  document.getElementById('asignar-url-id').value = id;
  modal.style.display = 'flex';
  setTimeout(() => document.getElementById('asignar-url-input').focus(), 100);
}

function cerrarModalAsignarUrl() {
  const modal = document.getElementById('modal-asignar-url');
  if (modal) modal.style.display = 'none';
}

async function guardarUrlMaterial() {
  const id  = document.getElementById('asignar-url-id').value;
  const url = document.getElementById('asignar-url-input').value.trim();
  if (!id) return;
  if (url) { urlsPersonalizadas[id] = url; } else { delete urlsPersonalizadas[id]; }
  await guardarUrls();
  cerrarModalAsignarUrl();
  renderBiblioteca();
  const toast = document.createElement('div');
  toast.textContent = url ? '✅ Enlace guardado correctamente' : '🗑️ Enlace eliminado';
  toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#10b981;color:#fff;padding:12px 24px;border-radius:10px;font-weight:700;font-size:14px;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.4);';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2800);
}

/* Favoritos */
function toggleFavoritoBiblioteca(id, btn) {
  const favKey = 'fav_bib_' + id;
  const esFav = localStorage.getItem(favKey) === '1';
  if (esFav) { localStorage.removeItem(favKey); btn.style.color = '#e2e8f0'; btn.style.background = 'rgba(255,255,255,0.05)'; }
  else { localStorage.setItem(favKey, '1'); btn.style.color = '#eab308'; btn.style.background = 'rgba(234,179,8,0.15)'; }
}

/* Inyección de modales */
function inyectarModalBiblioteca() {
  if (document.getElementById('modal-visor-biblioteca')) return;
  document.body.insertAdjacentHTML('beforeend', `
    <div id="modal-visor-biblioteca"
      style="display:none;position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,0.88);align-items:flex-start;justify-content:center;padding:20px;overflow-y:auto;"
      onclick="if(event.target===this) cerrarVisorBiblioteca()">
      <div style="background:#0f172a;border:1px solid rgba(255,255,255,0.12);border-radius:16px;width:100%;max-width:960px;overflow:hidden;margin:auto;">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.08);background:rgba(124,58,237,0.12);">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:20px;">📚</span>
            <span id="modal-visor-titulo" style="font-size:16px;font-weight:700;color:#f8fafc;"></span>
          </div>
          <div id="modal-visor-header-actions" style="display:flex;align-items:center;">
            <button onclick="cerrarVisorBiblioteca()" style="background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);color:#f87171;padding:6px 14px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;">✕ Cerrar</button>
          </div>
        </div>
        <div id="modal-visor-content" style="padding:0;background:#000;"></div>
      </div>
    </div>

    <div id="modal-asignar-url"
      style="display:none;position:fixed;inset:0;z-index:9100;background:rgba(0,0,0,0.82);align-items:center;justify-content:center;"
      onclick="if(event.target===this) cerrarModalAsignarUrl()">
      <div style="background:#1e293b;border:1px solid rgba(255,255,255,0.12);border-radius:16px;width:100%;max-width:520px;padding:28px;margin:20px;">
        <h3 style="font-size:17px;font-weight:700;color:#f8fafc;margin:0 0 6px;">⚙️ Asignar Enlace al Material</h3>
        <p id="asignar-url-titulo" style="font-size:13px;color:#94a3b8;margin:0 0 20px;font-style:italic;"></p>
        <input type="hidden" id="asignar-url-id">
        <label style="font-size:12px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">URL del material</label>
        <input id="asignar-url-input" type="url" placeholder="https://drive.google.com/... o https://youtube.com/..."
          style="width:100%;margin-top:6px;margin-bottom:8px;padding:12px 14px;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.15);border-radius:10px;color:#f8fafc;font-size:14px;outline:none;box-sizing:border-box;"
          onkeydown="if(event.key==='Enter') guardarUrlMaterial()">
        <div style="font-size:11px;color:#64748b;margin-bottom:20px;line-height:1.7;">
          ✅ Soporta: Google Drive · OneDrive · YouTube · URL directa de PDF<br>
          💡 Drive: comparte con "Cualquiera con el enlace → Lector"<br>
          🗑️ Deja en blanco y guarda para eliminar el enlace
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;">
          <button onclick="cerrarModalAsignarUrl()" style="padding:10px 20px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#94a3b8;border-radius:8px;cursor:pointer;font-weight:600;">Cancelar</button>
          <button onclick="guardarUrlMaterial()" style="padding:10px 24px;background:linear-gradient(135deg,#7c3aed,#6d28d9);border:none;color:#fff;border-radius:8px;cursor:pointer;font-weight:700;font-size:14px;">💾 Guardar Enlace</button>
        </div>
      </div>
    </div>
  `);
}
