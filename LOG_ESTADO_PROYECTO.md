# 📌 Registro de Estado y Continuación — Proyecto PAES WEB (Sysget-PAES-Manager)

**Fecha de Última Actualización:** 13 de Agosto, 2026  
**Ubicación Local del Proyecto:** `C:\Proyectos\Proyecto PAES WEB`  
**Repositorio GitHub:** `https://github.com/leontestvirtual1-sketch/Sysget-PAES-Manager`  
**Despliegue Producción (Vercel):** `https://sysget-paes-manager.vercel.app`  
**Base de Datos Nube:** 🟢 Firebase Firestore (`proyecto-paes-web-ia`)  

---

## 🚀 Novedades de la Versión Actual (2026-08-13)

### 7. 🔐 Sistema de Autenticación con Contraseña (NUEVO)
- **Módulo `auth-service.js`:** Login con credenciales institucionales para perfiles Docente y Administrador.
  - `abrirModalLogin(role)`: Abre modal animado según rol.
  - `procesarLogin()`: Valida credenciales contra tabla maestra + Directorio Escolar.
  - `cerrarSesion()`: Destruye sesión en `localStorage` y regresa a Landing.
- **Modal de Login:** Campos correo/contraseña, botón 👁️ ver/ocultar contraseña, mensaje de error, hint credenciales demo.
- **Persistencia:** Sesión guardada en `localStorage` (`paes_auth_session: { role, email, nombre, loggedAt }`). Recarga de página mantiene sesión activa.
- **Protección de rutas:** `setRole('docente')` y `setRole('admin')` verifican sesión antes de conceder acceso.
- **Navbar:** Badge muestra nombre real del usuario autenticado. Botón "🚪 Cerrar Sesión" en header.

**Credenciales por defecto:**

| Perfil | Correo | Contraseña |
|---|---|---|
| 👨‍🏫 Docente | `docente@colegio.cl` | `docente2026` |
| ⚙️ Administrador | `admin@colegio.cl` | `admin2026` |

---

### 6. 👥 Directorio Escolar (NUEVO)
- **`directorio-escolar.js`:** Módulo completo con:
  - Gestión de **Alumnos Matriculados** (CRUD, filtro por curso/nivel, búsqueda).
  - Gestión de **Equipo Docente** (CRUD, búsqueda, importar/exportar CSV).
  - KPIs (total alumnos, docentes, cursos activos).
  - Selector rápido de curso para cargar alumnos en una sesión de evaluación.
- **`firebase-config.js`:** Métodos CRUD para colecciones `alumnos_matriculados` y `equipo_docente` con fallback a `localStorage`.
- **CSV Import/Export Docentes:**
  - `importarDocentesCSV(event)`: Detecta encabezados automáticamente, acepta columnas `[nombre, email, asignatura, rol, cursos]`.
  - `exportarDocentesCSV()`: Descarga archivo `Equipo_Docente_PAES_YYYY-MM-DD.csv`.

---

### 5. ☀️/🌙 Toggle de Tema Claro / Oscuro
- Botón `#btn-theme-toggle` en el header (igual que SysgetSaber / Evaluaciones Nacionales).
- Variables CSS `body.light-theme` con transiciones suaves (0.25s).
- Tema persiste entre recargas vía `localStorage`.

---

### 1–4. Funcionalidades anteriores (hasta 2026-08-09)
- Descargador de Pruebas PAES DEMRE (2023–2026).
- Mezclador de Ensayos sin repetir preguntas.
- Portal Alumno con auto-guardado en tiempo real y solucionario pedagógico.
- Dashboard de Resultados escala PAES (100–1000 pts).
- Envío de evaluaciones por correo (Outlook-compatible).
- Gestión y eliminación reactiva de sesiones vía `onSnapshot`.

---

## 🛠️ Comandos de Desarrollo y Despliegue

### Para ejecutar en entorno local:
```powershell
cd "C:\Proyectos\Proyecto PAES WEB"
python -m http.server 8080
# Abrir en navegador: http://localhost:8080
```

### Para publicar cambios en Producción (Vercel):
```powershell
cd "C:\Proyectos\Proyecto PAES WEB"
git add -A
git commit -m "Descripción del cambio"
npx vercel --prod --yes
# Vercel actualizará la web pública en aprox. 30 segundos
```

---

## 📁 Estructura del Proyecto (actualizada)

```
Proyecto PAES WEB/
├── .gitignore                  ← Excluye PDFs pesados y scripts temporales
├── vercel.json                 ← Configuración de Vercel (URLs limpias y caché)
├── index.html                  ← Panel docente (descarga, mezcla, envío, resultados, directorio)
├── responder.html              ← Portal del alumno + Solucionario y retroalimentación
├── styles.css                  ← Sistema de diseño Dark Mode Premium (glassmorphism) + Light Mode
├── app.js                      ← Lógica del docente, roles, navegación y resultados PAES
├── auth-service.js             ← ✨ NUEVO: Módulo de autenticación (login, sesión, logout)
├── directorio-escolar.js       ← ✨ NUEVO: Alumnos matriculados y Equipo Docente
├── app-responder.js            ← Lógica del alumno, auto-guardado y retroalimentación
├── biblioteca.js               ← Manejo de catálogo y selección de materiales
├── firebase-config.js          ← Interfaz PAES_DB IIFE (Firestore + fallback LocalStorage)
├── email-service.js            ← Generador de plantillas HTML de correo para Outlook
├── generador-evaluaciones.js   ← Generación dinámica de evaluaciones y PDFs
├── catalogo_historico.json     ← Catálogo de pruebas oficiales del DEMRE
├── claves_y_escalas.json       ← Claves oficiales y tablas de conversión (100-1000 pts)
├── explicaciones_paes.json     ← Base de datos de retroalimentación y solucionario paso a paso
├── biblioteca_paes.json        ← Catálogo unificado de ensayos, videos y PDFs
└── LOG_ESTADO_PROYECTO.md      ← Este documento de registro de estado
```

---

## 💬 Cómo continuar en próximas sesiones

Al iniciar una nueva conversación con el Asistente AI, simplemente indica:
> *"Continuemos con el proyecto PAES WEB basándote en LOG_ESTADO_PROYECTO.md"*
