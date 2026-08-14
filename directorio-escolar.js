/**
 * SYSGET SUITE · PAES MANAGER
 * Directorio Escolar: Alumnos Matriculados y Equipo Docente
 * Gestión de Nóminas, Filtros por Curso e Importación Masiva
 */

const directorioState = {
  alumnos: [],
  docentes: [],
  filtroCurso: 'all',
  busquedaAlumno: '',
  busquedaDocente: '',
  tabActiva: 'alumnos' // 'alumnos' | 'docentes'
};

document.addEventListener('DOMContentLoaded', () => {
  cargarDirectorioEscolar();
});

async function cargarDirectorioEscolar() {
  try {
    const [alumnos, docentes] = await Promise.all([
      PAES_DB.obtenerAlumnosMatriculados(),
      PAES_DB.obtenerDocentes()
    ]);
    directorioState.alumnos = alumnos || [];
    directorioState.docentes = docentes || [];
    
    // Auto-poblar datos de ejemplo iniciales si está completamente vacío para facilitar uso inmediato
    if (directorioState.alumnos.length === 0 && directorioState.docentes.length === 0) {
      await sembrarDatosDemoDirectorio();
    } else {
      renderDirectorioCompleto();
      actualizarSelectorCursosEnEnvio();
    }
  } catch (err) {
    console.warn("[Directorio] Error al cargar:", err);
  }
}

async function sembrarDatosDemoDirectorio() {
  const demoAlumnos = [
    { rut: '21.345.678-9', nombre: 'Sofía Valenzuela Castro', curso: '4° Medio A', email: 'sofia.valenzuela@colegio.cl', estado: 'Activo' },
    { rut: '21.567.890-1', nombre: 'Benjamín Morales Silva', curso: '4° Medio A', email: 'benjamin.morales@colegio.cl', estado: 'Activo' },
    { rut: '21.678.901-2', nombre: 'Martina Rojas Pizarro', curso: '4° Medio A', email: 'martina.rojas@colegio.cl', estado: 'Activo' },
    { rut: '21.789.012-3', nombre: 'Matías Fernández Soto', curso: '4° Medio B', email: 'matias.fernandez@colegio.cl', estado: 'Activo' },
    { rut: '21.890.123-4', nombre: 'Valentina Díaz Muñoz', curso: '4° Medio B', email: 'valentina.diaz@colegio.cl', estado: 'Activo' },
    { rut: '22.012.345-6', nombre: 'Lucas Sepúlveda Lagos', curso: '3° Medio A', email: 'lucas.sepulveda@colegio.cl', estado: 'Activo' },
    { rut: '22.123.456-7', nombre: 'Isidora Carrasco Peña', curso: '3° Medio A', email: 'isidora.carrasco@colegio.cl', estado: 'Activo' }
  ];

  const demoDocentes = [
    { nombre: 'Prof. Carlos Araya Méndez', email: 'carlos.araya@colegio.cl', asignatura: 'Matemática', rol: 'Profesor de Asignatura', cursos: '4° Medio A, 4° Medio B' },
    { nombre: 'Prof. Andrea Guzmán Vera', email: 'andrea.guzman@colegio.cl', asignatura: 'Competencia Lectora', rol: 'Profesor Jefe', cursos: '4° Medio A' },
    { nombre: 'Prof. Rodrigo Henríquez T.', email: 'rodrigo.henriquez@colegio.cl', asignatura: 'Ciencias', rol: 'Profesor de Asignatura', cursos: '3° Medio A, 4° Medio A' },
    { nombre: 'Prof. Marcela Bustamante L.', email: 'marcela.bustamante@colegio.cl', asignatura: 'Historia', rol: 'Coordinador UTP', cursos: 'Todos' }
  ];

  await PAES_DB.importarAlumnosBatch(demoAlumnos);
  await PAES_DB.importarDocentesBatch(demoDocentes);

  directorioState.alumnos = await PAES_DB.obtenerAlumnosMatriculados();
  directorioState.docentes = await PAES_DB.obtenerDocentes();

  renderDirectorioCompleto();
  actualizarSelectorCursosEnEnvio();
}

function cambiarTabDirectorio(tab) {
  directorioState.tabActiva = tab;
  const btnAlm = document.getElementById('tab-btn-alumnos');
  const btnDoc = document.getElementById('tab-btn-docentes');
  const secAlm = document.getElementById('directorio-alumnos-sec');
  const secDoc = document.getElementById('directorio-docentes-sec');

  if (tab === 'alumnos') {
    if (btnAlm) { btnAlm.classList.add('active'); }
    if (btnDoc) { btnDoc.classList.remove('active'); }
    if (secAlm) { secAlm.style.display = 'block'; }
    if (secDoc) { secDoc.style.display = 'none'; }
    renderTablaAlumnos();
  } else {
    if (btnAlm) { btnAlm.classList.remove('active'); }
    if (btnDoc) { btnDoc.classList.add('active'); }
    if (secAlm) { secAlm.style.display = 'none'; }
    if (secDoc) { secDoc.style.display = 'block'; }
    renderTablaDocentes();
  }
}

function renderDirectorioCompleto() {
  renderDirectorioKPIs();
  renderFiltrosCursos();
  renderTablaAlumnos();
  renderTablaDocentes();
}

function renderDirectorioKPIs() {
  const kpiTotalAlm = document.getElementById('kpi-total-alumnos');
  const kpiCursosAct = document.getElementById('kpi-cursos-activos');
  const kpiTotalDoc = document.getElementById('kpi-total-docentes');

  const cursosUnicos = new Set(directorioState.alumnos.map(a => (a.curso || '').trim()).filter(Boolean));

  if (kpiTotalAlm) kpiTotalAlm.textContent = directorioState.alumnos.length;
  if (kpiCursosAct) kpiCursosAct.textContent = cursosUnicos.size;
  if (kpiTotalDoc) kpiTotalDoc.textContent = directorioState.docentes.length;
}

function renderFiltrosCursos() {
  const select = document.getElementById('select-filtro-curso');
  if (!select) return;

  const cursos = Array.from(new Set(directorioState.alumnos.map(a => (a.curso || '').trim()).filter(Boolean))).sort();
  
  let html = '<option value="all">📚 Todos los Cursos (' + directorioState.alumnos.length + ')</option>';
  cursos.forEach(c => {
    const count = directorioState.alumnos.filter(a => a.curso === c).length;
    html += `<option value="${c}">${c} (${count} alumnos)</option>`;
  });
  select.innerHTML = html;
  select.value = directorioState.filtroCurso || 'all';
}

function filtrarPorCurso(curso) {
  directorioState.filtroCurso = curso;
  renderTablaAlumnos();
}

function buscarAlumnosInput(q) {
  directorioState.busquedaAlumno = (q || '').toLowerCase().trim();
  renderTablaAlumnos();
}

function buscarDocentesInput(q) {
  directorioState.busquedaDocente = (q || '').toLowerCase().trim();
  renderTablaDocentes();
}

function renderTablaAlumnos() {
  const tbody = document.getElementById('tabla-alumnos-tbody');
  if (!tbody) return;

  let filtrados = directorioState.alumnos;

  // Filtrar por curso
  if (directorioState.filtroCurso && directorioState.filtroCurso !== 'all') {
    filtrados = filtrados.filter(a => a.curso === directorioState.filtroCurso);
  }

  // Filtrar por búsqueda
  if (directorioState.busquedaAlumno) {
    filtrados = filtrados.filter(a =>
      (a.nombre || '').toLowerCase().includes(directorioState.busquedaAlumno) ||
      (a.rut || '').toLowerCase().includes(directorioState.busquedaAlumno) ||
      (a.email || '').toLowerCase().includes(directorioState.busquedaAlumno) ||
      (a.curso || '').toLowerCase().includes(directorioState.busquedaAlumno)
    );
  }

  if (filtrados.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center; padding:30px 15px; color:var(--text-muted);">
          <div style="font-size:32px; margin-bottom:8px;">🔍</div>
          No se encontraron alumnos con los criterios seleccionados.
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = filtrados.map(a => {
    const iniciales = (a.nombre || 'A').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    return `
      <tr style="border-bottom: 1px solid var(--border);">
        <td style="padding: 12px 14px;">
          <span style="font-family: monospace; font-size: 13px; font-weight: 600; color: #a78bfa;">${a.rut || '—'}</span>
        </td>
        <td style="padding: 12px 14px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); color: #fff; font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center;">
              ${iniciales}
            </div>
            <div>
              <div style="font-weight: 700; color: var(--text-primary); font-size: 14px;">${a.nombre}</div>
              <div style="font-size: 12px; color: var(--text-secondary);">${a.email || 'Sin correo registrado'}</div>
            </div>
          </div>
        </td>
        <td style="padding: 12px 14px;">
          <span class="role-badge" style="background: rgba(37,99,235,0.12); color: var(--blue-light); border: 1px solid rgba(37,99,235,0.3); font-size: 11.5px;">
            ${a.curso || 'Sin asignar'}
          </span>
        </td>
        <td style="padding: 12px 14px;">
          <span style="font-size: 11.5px; font-weight: 700; color: #10b981; background: rgba(16,185,129,0.1); padding: 3px 8px; border-radius: 99px; border: 1px solid rgba(16,185,129,0.3);">
            ✓ ${a.estado || 'Activo'}
          </span>
        </td>
        <td style="padding: 12px 14px; text-align: right;">
          <button class="btn-sm btn-outline" onclick="abrirModalEditarAlumno('${a.id}')" style="padding: 4px 8px; font-size: 12px; margin-right: 4px;" title="Editar">
            ✏️
          </button>
          <button class="btn-sm btn-outline" onclick="eliminarAlumnoConfirmar('${a.id}')" style="padding: 4px 8px; font-size: 12px; border-color: rgba(239,68,68,0.4); color: #ef4444;" title="Eliminar">
            🗑️
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderTablaDocentes() {
  const tbody = document.getElementById('tabla-docentes-tbody');
  if (!tbody) return;

  let filtrados = directorioState.docentes;

  if (directorioState.busquedaDocente) {
    filtrados = filtrados.filter(d =>
      (d.nombre || '').toLowerCase().includes(directorioState.busquedaDocente) ||
      (d.email || '').toLowerCase().includes(directorioState.busquedaDocente) ||
      (d.asignatura || '').toLowerCase().includes(directorioState.busquedaDocente) ||
      (d.rol || '').toLowerCase().includes(directorioState.busquedaDocente)
    );
  }

  if (filtrados.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center; padding:30px 15px; color:var(--text-muted);">
          <div style="font-size:32px; margin-bottom:8px;">👨‍🏫</div>
          No hay docentes registrados.
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = filtrados.map(d => {
    const iniciales = (d.nombre || 'D').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    return `
      <tr style="border-bottom: 1px solid var(--border);">
        <td style="padding: 12px 14px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: #fff; font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center;">
              ${iniciales}
            </div>
            <div>
              <div style="font-weight: 700; color: var(--text-primary); font-size: 14px;">${d.nombre}</div>
              <div style="font-size: 12px; color: var(--text-secondary);">${d.email || 'Sin correo'}</div>
            </div>
          </div>
        </td>
        <td style="padding: 12px 14px;">
          <span style="font-size: 12px; font-weight: 700; color: #a78bfa; background: rgba(124,58,237,0.12); padding: 4px 10px; border-radius: 8px; border: 1px solid rgba(124,58,237,0.3);">
            ${d.asignatura || 'General'}
          </span>
        </td>
        <td style="padding: 12px 14px;">
          <span style="font-size: 12px; color: var(--text-secondary); font-weight: 600;">
            ${d.rol || 'Docente'}
          </span>
        </td>
        <td style="padding: 12px 14px; font-size: 12px; color: var(--text-muted);">
          ${d.cursos || 'Todos'}
        </td>
        <td style="padding: 12px 14px; text-align: right;">
          <button class="btn-sm btn-outline" onclick="abrirModalEditarDocente('${d.id}')" style="padding: 4px 8px; font-size: 12px; margin-right: 4px;" title="Editar">
            ✏️
          </button>
          <button class="btn-sm btn-outline" onclick="eliminarDocenteConfirmar('${d.id}')" style="padding: 4px 8px; font-size: 12px; border-color: rgba(239,68,68,0.4); color: #ef4444;" title="Eliminar">
            🗑️
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// ──────────────────────────────────────────────────────────
// MODALES Y FORMULARIOS (ALUMNOS Y DOCENTES)
// ──────────────────────────────────────────────────────────

function abrirModalNuevoAlumno() {
  document.getElementById('modal-alumno-id').value = '';
  document.getElementById('modal-alumno-rut').value = '';
  document.getElementById('modal-alumno-nombre').value = '';
  document.getElementById('modal-alumno-curso').value = '4° Medio A';
  document.getElementById('modal-alumno-email').value = '';
  document.getElementById('modal-alumno-title').textContent = '➕ Registrar Nuevo Alumno';
  document.getElementById('modal-alumno').style.display = 'flex';
}

function abrirModalEditarAlumno(alumnoId) {
  const alm = directorioState.alumnos.find(a => a.id === alumnoId);
  if (!alm) return;

  document.getElementById('modal-alumno-id').value = alm.id;
  document.getElementById('modal-alumno-rut').value = alm.rut || '';
  document.getElementById('modal-alumno-nombre').value = alm.nombre || '';
  document.getElementById('modal-alumno-curso').value = alm.curso || '4° Medio A';
  document.getElementById('modal-alumno-email').value = alm.email || '';
  document.getElementById('modal-alumno-title').textContent = '✏️ Editar Alumno';
  document.getElementById('modal-alumno').style.display = 'flex';
}

function cerrarModalAlumno() {
  document.getElementById('modal-alumno').style.display = 'none';
}

async function guardarAlumnoDesdeModal() {
  const id = document.getElementById('modal-alumno-id').value;
  const rut = document.getElementById('modal-alumno-rut').value.trim();
  const nombre = document.getElementById('modal-alumno-nombre').value.trim();
  const curso = document.getElementById('modal-alumno-curso').value.trim();
  const email = document.getElementById('modal-alumno-email').value.trim();

  if (!nombre) {
    showToast('⚠️ Ingresa el nombre del alumno');
    return;
  }

  const alumnoObj = {
    id: id || undefined,
    rut: rut,
    nombre: nombre,
    curso: curso || '4° Medio A',
    email: email,
    estado: 'Activo'
  };

  try {
    await PAES_DB.guardarAlumnoMatriculado(alumnoObj);
    cerrarModalAlumno();
    await cargarDirectorioEscolar();
    showToast('✅ Alumno guardado con éxito');
  } catch (err) {
    showToast(`❌ Error al guardar alumno: ${err.message}`);
  }
}

async function eliminarAlumnoConfirmar(alumnoId) {
  const alm = directorioState.alumnos.find(a => a.id === alumnoId);
  if (!alm) return;

  if (confirm(`¿Estás seguro de eliminar a ${alm.nombre} de la matrícula?`)) {
    try {
      await PAES_DB.eliminarAlumnoMatriculado(alumnoId);
      await cargarDirectorioEscolar();
      showToast('🗑️ Alumno eliminado correctamente');
    } catch (err) {
      showToast(`❌ Error al eliminar: ${err.message}`);
    }
  }
}

// DOCENTES
function abrirModalNuevoDocente() {
  document.getElementById('modal-docente-id').value = '';
  document.getElementById('modal-docente-nombre').value = '';
  document.getElementById('modal-docente-email').value = '';
  document.getElementById('modal-docente-asig').value = 'Matemática';
  document.getElementById('modal-docente-rol').value = 'Profesor de Asignatura';
  document.getElementById('modal-docente-cursos').value = '4° Medio A, 4° Medio B';
  document.getElementById('modal-docente-title').textContent = '➕ Registrar Nuevo Docente';
  document.getElementById('modal-docente').style.display = 'flex';
}

function abrirModalEditarDocente(docenteId) {
  const doc = directorioState.docentes.find(d => d.id === docenteId);
  if (!doc) return;

  document.getElementById('modal-docente-id').value = doc.id;
  document.getElementById('modal-docente-nombre').value = doc.nombre || '';
  document.getElementById('modal-docente-email').value = doc.email || '';
  document.getElementById('modal-docente-asig').value = doc.asignatura || 'Matemática';
  document.getElementById('modal-docente-rol').value = doc.rol || 'Profesor de Asignatura';
  document.getElementById('modal-docente-cursos').value = doc.cursos || '';
  document.getElementById('modal-docente-title').textContent = '✏️ Editar Docente';
  document.getElementById('modal-docente').style.display = 'flex';
}

function cerrarModalDocente() {
  document.getElementById('modal-docente').style.display = 'none';
}

async function guardarDocenteDesdeModal() {
  const id = document.getElementById('modal-docente-id').value;
  const nombre = document.getElementById('modal-docente-nombre').value.trim();
  const email = document.getElementById('modal-docente-email').value.trim();
  const asig = document.getElementById('modal-docente-asig').value.trim();
  const rol = document.getElementById('modal-docente-rol').value.trim();
  const cursos = document.getElementById('modal-docente-cursos').value.trim();

  if (!nombre) {
    showToast('⚠️ Ingresa el nombre del docente');
    return;
  }

  const docenteObj = {
    id: id || undefined,
    nombre: nombre,
    email: email,
    asignatura: asig,
    rol: rol,
    cursos: cursos
  };

  try {
    await PAES_DB.guardarDocente(docenteObj);
    cerrarModalDocente();
    await cargarDirectorioEscolar();
    showToast('✅ Docente guardado con éxito');
  } catch (err) {
    showToast(`❌ Error al guardar docente: ${err.message}`);
  }
}

async function eliminarDocenteConfirmar(docenteId) {
  const doc = directorioState.docentes.find(d => d.id === docenteId);
  if (!doc) return;

  if (confirm(`¿Estás seguro de eliminar a ${doc.nombre} del equipo docente?`)) {
    try {
      await PAES_DB.eliminarDocente(docenteId);
      await cargarDirectorioEscolar();
      showToast('🗑️ Docente eliminado correctamente');
    } catch (err) {
      showToast(`❌ Error al eliminar: ${err.message}`);
    }
  }
}

// ──────────────────────────────────────────────────────────
// IMPORTACIÓN Y EXPORTACIÓN CSV
// ──────────────────────────────────────────────────────────

async function importarAlumnosMatriculadosCSV(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function(e) {
    const text = e.target.result;
    const lines = text.split(/\r\n|\n/).map(l => l.trim()).filter(Boolean);

    const importados = [];
    lines.forEach((line, idx) => {
      // Ignorar cabecera si existe
      if (idx === 0 && (line.toLowerCase().includes('nombre') || line.toLowerCase().includes('rut'))) return;

      const cols = line.split(/[,;\t]/).map(c => c.trim().replace(/^["']|["']$/g, ''));
      if (cols.length >= 2) {
        let rut = '', nombre = '', curso = '4° Medio A', email = '';

        if (cols.length === 2) {
          // Formato: Nombre, Email
          nombre = cols[0];
          email = cols[1];
        } else if (cols.length === 3) {
          // Formato: Nombre, Curso, Email
          nombre = cols[0];
          curso = cols[1];
          email = cols[2];
        } else if (cols.length >= 4) {
          // Formato: RUT, Nombre, Curso, Email
          rut = cols[0];
          nombre = cols[1];
          curso = cols[2];
          email = cols[3];
        }

        if (nombre) {
          importados.push({
            rut: rut,
            nombre: nombre,
            curso: curso || '4° Medio A',
            email: email,
            estado: 'Activo'
          });
        }
      }
    });

    if (importados.length > 0) {
      try {
        await PAES_DB.importarAlumnosBatch(importados);
        await cargarDirectorioEscolar();
        showToast(`📥 ${importados.length} alumnos importados exitosamente`);
      } catch (err) {
        showToast(`❌ Error al importar alumnos: ${err.message}`);
      }
    } else {
      showToast('⚠️ No se encontraron filas válidas en el archivo');
    }
  };
  reader.readAsText(file, 'UTF-8');
  event.target.value = '';
}

function exportarAlumnosCSV() {
  if (directorioState.alumnos.length === 0) {
    showToast('⚠️ No hay alumnos para exportar');
    return;
  }

  const csvRows = ['RUT,Nombre,Curso,Email,Estado'];
  directorioState.alumnos.forEach(a => {
    csvRows.push(`"${a.rut || ''}","${a.nombre}","${a.curso || ''}","${a.email || ''}","${a.estado || 'Activo'}"`);
  });

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Matricula_Alumnos_PAES_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('📄 Archivo CSV descargado correctamente');
}

// ──────────────────────────────────────────────────────────
// INTEGRACIÓN CON SECCIÓN "ENVIAR EVALUACIÓN EN LÍNEA" (PASO 3)
// ──────────────────────────────────────────────────────────

function actualizarSelectorCursosEnEnvio() {
  const select = document.getElementById('select-curso-rapido-envio');
  if (!select) return;

  const cursos = Array.from(new Set(directorioState.alumnos.map(a => (a.curso || '').trim()).filter(Boolean))).sort();
  
  if (cursos.length === 0) {
    select.innerHTML = '<option value="">No hay cursos matriculados</option>';
    return;
  }

  let html = '<option value="">-- Seleccionar Curso para Cargar Nómina --</option>';
  cursos.forEach(c => {
    const count = directorioState.alumnos.filter(a => a.curso === c).length;
    html += `<option value="${c}">📚 ${c} (${count} alumnos matriculados)</option>`;
  });
  html += `<option value="__all__">👥 Todos los Alumnos Matriculados (${directorioState.alumnos.length})</option>`;
  select.innerHTML = html;
}

function cargarAlumnosDeCursoEnSesion() {
  const select = document.getElementById('select-curso-rapido-envio');
  if (!select || !select.value) {
    showToast('⚠️ Selecciona un curso primero');
    return;
  }

  const valor = select.value;
  let alumnosACargar = [];

  if (valor === '__all__') {
    alumnosACargar = directorioState.alumnos;
  } else {
    alumnosACargar = directorioState.alumnos.filter(a => a.curso === valor);
  }

  if (alumnosACargar.length === 0) {
    showToast('⚠️ No hay alumnos en el curso seleccionado');
    return;
  }

  let agregados = 0;
  alumnosACargar.forEach(a => {
    const token = 'tok_' + Math.random().toString(36).substr(2, 9);
    // Evitar duplicar si ya existe el mismo email o nombre en la sesión
    const yaExiste = state.alumnosEnSession.some(x => 
      (a.email && x.email && x.email.toLowerCase() === a.email.toLowerCase()) || 
      (x.nombre.toLowerCase() === a.nombre.toLowerCase())
    );

    if (!yaExiste) {
      state.alumnosEnSession.push({
        nombre: a.nombre,
        email: a.email || '',
        curso: a.curso || '',
        token: token
      });
      agregados++;
    }
  });

  renderAlumnosLista();
  showToast(`✅ Se cargaron ${agregados} alumnos del curso ${valor === '__all__' ? 'general' : valor}`);
}
