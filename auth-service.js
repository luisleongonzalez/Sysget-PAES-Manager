/**
 * SYSGET SUITE · PAES MANAGER
 * Módulo de Autenticación y Control de Acceso (Auth Service)
 * Protege los perfiles de Docente y Administrador mediante credenciales
 */

const AUTH_KEY = 'paes_auth_session';

const DEFAULT_CREDENTIALS = {
  docente: {
    email: 'docente@colegio.cl',
    password: 'docente2026',
    nombre: 'Profesor / Docente'
  },
  admin: {
    email: 'admin@colegio.cl',
    password: 'admin2026',
    nombre: 'Administrador del Sistema'
  }
};

let currentAuthRoleTarget = 'docente';

function obtenerSesionActual() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function guardarSesion(authData) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
}

function cerrarSesion() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem('paes_user_role');
  setRole('landing');
  showToast('🔒 Sesión cerrada correctamente');
}

function abrirModalLogin(roleTarget = 'docente') {
  currentAuthRoleTarget = roleTarget;
  const sesion = obtenerSesionActual();

  // Si ya tiene sesión activa para el rol solicitado o es admin, entra directamente
  if (sesion && (sesion.role === roleTarget || sesion.role === 'admin')) {
    setRole(roleTarget);
    return;
  }

  const modal = document.getElementById('modal-auth-login');
  const modalTitle = document.getElementById('auth-modal-title');
  const modalDesc = document.getElementById('auth-modal-desc');
  const roleBadge = document.getElementById('auth-modal-role-badge');
  const emailInput = document.getElementById('auth-email-input');
  const passInput = document.getElementById('auth-password-input');
  const errorBox = document.getElementById('auth-error-msg');

  if (errorBox) errorBox.style.display = 'none';
  if (passInput) passInput.value = '';

  if (roleTarget === 'admin') {
    if (modalTitle) modalTitle.textContent = 'Panel Administrador';
    if (modalDesc) modalDesc.textContent = 'Ingresa tus credenciales de administrador institucional.';
    if (roleBadge) {
      roleBadge.textContent = '⚙️ Administrador';
      roleBadge.className = 'role-badge-nav admin';
    }
    if (emailInput && !emailInput.value) emailInput.value = 'admin@colegio.cl';
  } else {
    if (modalTitle) modalTitle.textContent = 'Portal Docente';
    if (modalDesc) modalDesc.textContent = 'Ingresa tu correo institucional y contraseña para gestionar evaluaciones.';
    if (roleBadge) {
      roleBadge.textContent = '👨‍🏫 Docente';
      roleBadge.className = 'role-badge-nav docente';
    }
    if (emailInput && !emailInput.value) emailInput.value = 'docente@colegio.cl';
  }

  if (modal) modal.style.display = 'flex';
  setTimeout(() => {
    if (passInput) passInput.focus();
  }, 100);
}

function cerrarModalLogin() {
  const modal = document.getElementById('modal-auth-login');
  if (modal) modal.style.display = 'none';
}

function toggleMostrarPassword(inputId, btnEl) {
  const input = document.getElementById(inputId);
  if (!input) return;

  if (input.type === 'password') {
    input.type = 'text';
    if (btnEl) btnEl.textContent = '🙈';
  } else {
    input.type = 'password';
    if (btnEl) btnEl.textContent = '👁️';
  }
}

async function procesarLogin() {
  const emailInput = document.getElementById('auth-email-input');
  const passInput = document.getElementById('auth-password-input');
  const errorBox = document.getElementById('auth-error-msg');
  const submitBtn = document.getElementById('btn-auth-submit');

  const email = (emailInput ? emailInput.value : '').trim().toLowerCase();
  const password = (passInput ? passInput.value : '').trim();

  if (!email || !password) {
    mostrarErrorAuth('Por favor completa todos los campos.');
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Validando credenciales...';
  }

  try {
    let authValida = false;
    let nombreUsuario = '';
    let rolAsignado = currentAuthRoleTarget;

    // 1. Validar contra credenciales maestras
    if (currentAuthRoleTarget === 'admin') {
      if (email === DEFAULT_CREDENTIALS.admin.email.toLowerCase() && password === DEFAULT_CREDENTIALS.admin.password) {
        authValida = true;
        nombreUsuario = DEFAULT_CREDENTIALS.admin.nombre;
        rolAsignado = 'admin';
      }
    } else {
      // Docente: aceptar credencial maestra
      if (email === DEFAULT_CREDENTIALS.docente.email.toLowerCase() && password === DEFAULT_CREDENTIALS.docente.password) {
        authValida = true;
        nombreUsuario = DEFAULT_CREDENTIALS.docente.nombre;
        rolAsignado = 'docente';
      } else if (password === DEFAULT_CREDENTIALS.docente.password || password === DEFAULT_CREDENTIALS.admin.password) {
        // También verificar si el correo pertenece a algún profesor del Directorio Escolar
        const docentes = await PAES_DB.obtenerDocentes();
        const encontrado = docentes.find(d => d.email && d.email.toLowerCase() === email);
        if (encontrado) {
          authValida = true;
          nombreUsuario = encontrado.nombre;
          rolAsignado = 'docente';
        }
      }
    }

    if (authValida) {
      const sesionData = {
        role: rolAsignado,
        email: email,
        nombre: nombreUsuario,
        loggedAt: new Date().toISOString()
      };

      guardarSesion(sesionData);
      cerrarModalLogin();
      showToast(`👋 Bienvenido, ${nombreUsuario}`);
      setRole(rolAsignado);
    } else {
      mostrarErrorAuth('Correo o contraseña incorrectos. Verifica tus datos.');
    }
  } catch (err) {
    mostrarErrorAuth(`Error al autenticar: ${err.message}`);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Ingresar al Sistema ➔';
    }
  }
}

function mostrarErrorAuth(mensaje) {
  const errorBox = document.getElementById('auth-error-msg');
  if (errorBox) {
    errorBox.textContent = `⚠️ ${mensaje}`;
    errorBox.style.display = 'block';
  } else {
    showToast(`⚠️ ${mensaje}`);
  }
}

// Inicializar sesión guardada al arrancar la app
document.addEventListener('DOMContentLoaded', () => {
  const sesion = obtenerSesionActual();
  if (sesion && (sesion.role === 'docente' || sesion.role === 'admin')) {
    setRole(sesion.role);
  }
});
