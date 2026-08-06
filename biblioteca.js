/* ═══════════════════════════════════════════════════════════
   PAES MANAGER - BIBLIOTECA DIGITAL DE ESTUDIO
   Gestión y renderizado de materiales por Eje Temático DEMRE
   ═══════════════════════════════════════════════════════════ */

let bibliotecaMateriales = [];
let filtroAsignaturaActual = 'matematica';
let filtroEjeActual = 'todos';
let busquedaTextoActual = '';

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
  cargarCatalogoBiblioteca();
  renderChipsEje('matematica'); // Inicializar chips por defecto
});

/**
 * Carga el catálogo JSON de la biblioteca.
 */
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

/**
 * Cambia la asignatura seleccionada (Matemática, Lenguaje, Historia, Ciencias)
 */
function cambiarAsignaturaBiblioteca(asig) {
  filtroAsignaturaActual = asig;
  filtroEjeActual = 'todos';
  
  // Actualizar estados visuales de botones
  const btns = document.querySelectorAll('.btn-asig-tab');
  btns.forEach(btn => {
    if (btn.dataset.asig === asig) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  renderChipsEje(asig);
  renderBiblioteca();
}

/**
 * Renderiza los chips de Eje Temático para la asignatura seleccionada
 */
function renderChipsEje(asig) {
  const container = document.getElementById('chips-eje-container');
  if (!container) return;

  const ejes = EJES_POR_ASIGNATURA[asig] || [];

  container.innerHTML = `
    <span style="font-size: 12px; color: #64748b; font-weight: 600; margin-right: 4px;">Eje DEMRE:</span>
    <button class="chip-eje" data-eje="todos" onclick="filtrarEjeBiblioteca('todos')"
      style="background: rgba(124, 58, 237, 0.35); border: 1px solid rgba(124, 58, 237, 0.6); color: #fff; padding: 5px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer;">
      Todos
    </button>
    ${ejes.map(eje => `
    <button class="chip-eje" data-eje="${eje}" onclick="filtrarEjeBiblioteca('${eje}')"
      style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #94a3b8; padding: 5px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer;">
      ${eje}
    </button>`).join('')}
  `;
}

/**
 * Filtra por Eje Temático
 */
function filtrarEjeBiblioteca(eje) {
  filtroEjeActual = eje;
  const chips = document.querySelectorAll('.chip-eje');
  chips.forEach(c => {
    if (c.dataset.eje === eje) {
      c.style.background = 'rgba(124, 58, 237, 0.35)';
      c.style.borderColor = 'rgba(124, 58, 237, 0.6)';
      c.style.color = '#fff';
    } else {
      c.style.background = 'rgba(255, 255, 255, 0.05)';
      c.style.borderColor = 'rgba(255, 255, 255, 0.1)';
      c.style.color = '#94a3b8';
    }
  });

  renderBiblioteca();
}

/**
 * Buscar texto en tiempo real
 */
function buscarEnBiblioteca(q) {
  busquedaTextoActual = q.toLowerCase().trim();
  renderBiblioteca();
}

/**
 * Renderiza la grilla de materiales filtrados
 */
function renderBiblioteca() {
  const container = document.getElementById('grid-materiales-biblioteca');
  const contadorEl = document.getElementById('cant-materiales-badge');
  if (!container) return;

  // Filtrado
  const filtrados = bibliotecaMateriales.filter(m => {
    const matchAsig = m.asignatura === filtroAsignaturaActual;
    const matchEje = (filtroEjeActual === 'todos') || (m.eje === filtroEjeActual);
    const matchQ = !busquedaTextoActual || 
      m.titulo.toLowerCase().includes(busquedaTextoActual) || 
      m.eje.toLowerCase().includes(busquedaTextoActual) ||
      m.descripcion.toLowerCase().includes(busquedaTextoActual);
    
    return matchAsig && matchEje && matchQ;
  });

  if (contadorEl) {
    contadorEl.textContent = `${filtrados.length} Recursos Disponibles`;
  }

  if (filtrados.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; background: rgba(0,0,0,0.2); border-radius: 12px; border: 1px dashed rgba(255,255,255,0.1);">
        <p style="font-size: 24px; margin-bottom: 8px;">🔍</p>
        <p style="color: #94a3b8; font-weight: 600; font-size: 14px; margin: 0;">No se encontraron materiales para esta búsqueda.</p>
        <p style="color: #64748b; font-size: 12px; margin-top: 4px;">Intenta seleccionando otro eje temático o borrando el filtro.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtrados.map(m => {
    let icon = '📄';
    let badgeColor = '#3b82f6';
    let labelTipo = 'PDF Formulario';

    if (m.tipo === 'ppt') {
      icon = '💻';
      badgeColor = '#eab308';
      labelTipo = 'PPT Clase';
    } else if (m.tipo === 'video') {
      icon = '🎥';
      badgeColor = '#ef4444';
      labelTipo = 'Video Clase';
    } else if (m.tipo === 'ejercicio') {
      icon = '📝';
      badgeColor = '#10b981';
      labelTipo = 'Ejercitación';
    }

    return `
      <div style="background: rgba(15, 23, 42, 0.65); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 20px; display: flex; flex-direction: column; justify-content: space-between; transition: all 0.2s ease;" onmouseover="this.style.borderColor='rgba(124, 58, 237, 0.4)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.08)'">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span style="font-size: 11px; font-weight: 700; color: #a78bfa; text-transform: uppercase; background: rgba(124, 58, 237, 0.15); padding: 4px 10px; border-radius: 6px; border: 1px solid rgba(124, 58, 237, 0.3);">
              📍 ${m.eje}
            </span>
            <span style="font-size: 11px; font-weight: 700; color: ${badgeColor}; background: rgba(255,255,255,0.05); padding: 4px 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);">
              ${icon} ${labelTipo}
            </span>
          </div>

          <h3 style="font-size: 15px; font-weight: 700; color: #f8fafc; margin: 0 0 8px; line-height: 1.4;">${m.titulo}</h3>
          <p style="font-size: 12px; color: #94a3b8; margin: 0 0 16px; line-height: 1.5;">${m.descripcion}</p>
        </div>

        <div style="display: flex; gap: 8px; margin-top: auto;">
          <a href="${m.url}" target="_blank" onclick="if('${m.url}'==='#'){ event.preventDefault(); alert('📄 Descargando recurso educativo...'); }" style="flex: 1; text-align: center; text-decoration: none; background: rgba(124, 58, 237, 0.2); border: 1px solid rgba(124, 58, 237, 0.4); color: #c4b5fd; padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; transition: background 0.2s;">
            👁️ Ver / Descargar
          </a>
          <button onclick="toggleFavoritoBiblioteca('${m.id}', this)" title="Guardar en favoritos" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); color: #e2e8f0; padding: 8px 12px; border-radius: 8px; cursor: pointer;">
            ⭐
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function toggleFavoritoBiblioteca(id, btn) {
  if (btn.style.color === 'rgb(234, 179, 8)') {
    btn.style.color = '#e2e8f0';
    btn.style.background = 'rgba(255,255,255,0.05)';
  } else {
    btn.style.color = '#eab308';
    btn.style.background = 'rgba(234, 179, 8, 0.15)';
  }
}
