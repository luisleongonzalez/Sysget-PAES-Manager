/* ═══════════════════════════════════════════════════════════
   PAES MANAGER - FIREBASE CONFIG & DATA INTERFACE (PAES_DB)
   Permite operar con Firebase Firestore o caer en LocalStorage
═══════════════════════════════════════════════════════════ */

(function() {
  // Configuración dinámica de Firebase para PAES Manager (sin credenciales hardcodeadas en repositorio)
  const CFG_KEY = 'paes_firebase_config';
  
  let savedConfig = {};
  try {
    savedConfig = JSON.parse(localStorage.getItem(CFG_KEY) || '{}');
  } catch (e) {
    savedConfig = {};
  }

  const firebaseConfig = {
    apiKey:            savedConfig.apiKey            || "AIzaSyC2D4SaRCWTzm7Pkg3zhIVCvY4svPgFI5s",
    authDomain:        savedConfig.authDomain        || "proyecto-paes-web-ia.firebaseapp.com",
    projectId:         savedConfig.projectId         || "proyecto-paes-web-ia",
    storageBucket:     savedConfig.storageBucket     || "proyecto-paes-web-ia.firebasestorage.app",
    messagingSenderId: savedConfig.messagingSenderId || "481585784153",
    appId:             savedConfig.appId             || "1:481585784153:web:81d6737725ddaf5cf99848"
  };

  let isFirebaseActive = false;
  let firestoreDb = null;

  // Validar que las credenciales no sean los valores por defecto
  if (
    firebaseConfig.apiKey && 
    firebaseConfig.apiKey !== "YOUR_API_KEY" && 
    firebaseConfig.projectId && 
    firebaseConfig.projectId !== "YOUR_PROJECT_ID"
  ) {
    try {
      // Inicializar Firebase (Compat Mode)
      firebase.initializeApp(firebaseConfig);
      firestoreDb = firebase.firestore();
      isFirebaseActive = true;
      console.log("[PAES Manager] Conectado con Firebase Firestore con éxito.");
    } catch (error) {
      console.error("[PAES Manager] Error al inicializar Firebase. Usando LocalStorage como fallback:", error);
      isFirebaseActive = false;
    }
  } else {
    console.log("[PAES Manager] Firebase sin configurar o en modo Local. Usando LocalStorage local.");
    isFirebaseActive = false;
  }

  window.abrirConfigFirebase = function() {
    const ak  = prompt('🔑 Firebase API Key:', savedConfig.apiKey || '');
    if (ak === null) return;
    const pid = prompt('📁 Firebase Project ID (ej: proyecto-paes-web-ia):', savedConfig.projectId || '');
    if (pid === null) return;
    const ad  = prompt('🌐 Auth Domain (ej: proyecto-paes-web-ia.firebaseapp.com):', savedConfig.authDomain || `${pid}.firebaseapp.com`);
    if (ad === null) return;
    const sb  = prompt('📦 Storage Bucket:', savedConfig.storageBucket || `${pid}.firebasestorage.app`);
    if (sb === null) return;

    const newCfg = {
      apiKey: ak.trim(),
      authDomain: ad.trim(),
      projectId: pid.trim(),
      storageBucket: sb.trim()
    };

    localStorage.setItem(CFG_KEY, JSON.stringify(newCfg));
    alert('✅ Configuración de Firebase guardada. La página se recargará para conectar.');
    window.location.reload();
  };

  // Interfaz unificada de datos
  const PAES_DB = {
    /**
     * Devuelve si la base de datos de Firebase está activa.
     */
    isFirebase() {
      return isFirebaseActive;
    },

    /**
     * Crea una nueva sesión de evaluación y sus respectivos envíos de alumnos.
     */
    async crearSesion(sesion, alumnos) {
      if (isFirebaseActive && firestoreDb) {
        // 1. Guardar la sesión en Firestore
        await firestoreDb.collection("sesiones").doc(sesion.id).set(sesion);
        
        // 2. Crear los envíos de alumnos en Firestore
        const batch = firestoreDb.batch();
        alumnos.forEach(al => {
          const envioRef = firestoreDb.collection("envios").doc(al.token);
          batch.set(envioRef, {
            token: al.token,
            sesionId: sesion.id,
            alumnoNombre: al.nombre,
            alumnoEmail: al.email,
            estado: 'pendiente',
            respuestas: {},
            fechaRespuesta: null
          });
        });
        await batch.commit();
      } else {
        // Fallback Local
        const sesionesLocales = JSON.parse(localStorage.getItem('paes_sesiones_locales') || '[]');
        sesionesLocales.push(sesion);
        localStorage.setItem('paes_sesiones_locales', JSON.stringify(sesionesLocales));

        const enviosLocales = JSON.parse(localStorage.getItem('paes_envios_locales') || '{}');
        alumnos.forEach(al => {
          enviosLocales[al.token] = {
            token: al.token,
            sesionId: sesion.id,
            alumnoNombre: al.nombre,
            alumnoEmail: al.email,
            estado: 'pendiente',
            respuestas: {}
          };
        });
        localStorage.setItem('paes_envios_locales', JSON.stringify(enviosLocales));
        window.dispatchEvent(new Event('paes_local_update'));
      }
    },

    /**
     * Obtiene una sesión específica por ID.
     */
    async obtenerSesion(sesionId) {
      if (isFirebaseActive && firestoreDb) {
        const doc = await firestoreDb.collection("sesiones").doc(sesionId).get();
        return doc.exists ? doc.data() : null;
      } else {
        const sesionesLocales = JSON.parse(localStorage.getItem('paes_sesiones_locales') || '[]');
        return sesionesLocales.find(s => s.id === sesionId) || null;
      }
    },

    /**
     * Escucha la lista de sesiones disponibles en orden cronológico inverso.
     */
    escucharSesiones(callback) {
      if (isFirebaseActive && firestoreDb) {
        return firestoreDb.collection("sesiones")
          .orderBy("fechaCreacion", "desc")
          .onSnapshot(snapshot => {
            const sesiones = [];
            snapshot.forEach(doc => sesiones.push(doc.data()));
            callback(sesiones);
          }, error => {
            console.error("Error al escuchar sesiones de Firestore:", error);
          });
      } else {
        // Fallback local: ejecutar inmediatamente y suscribir evento
        const obtenerLocales = () => {
          const sesionesLocales = JSON.parse(localStorage.getItem('paes_sesiones_locales') || '[]');
          return [...sesionesLocales].reverse();
        };
        
        callback(obtenerLocales());
        
        const handler = () => callback(obtenerLocales());
        window.addEventListener('paes_local_update', handler);
        return () => window.removeEventListener('paes_local_update', handler);
      }
    },

    /**
     * Escucha en tiempo real los envíos de alumnos asociados a una sesión.
     */
    escucharEnvios(sesionId, callback) {
      if (isFirebaseActive && firestoreDb) {
        return firestoreDb.collection("envios")
          .where("sesionId", "==", sesionId)
          .onSnapshot(snapshot => {
            const envios = [];
            snapshot.forEach(doc => envios.push(doc.data()));
            callback(envios);
          }, error => {
            console.error("Error al escuchar envíos de Firestore:", error);
          });
      } else {
        // Fallback local
        const obtenerEnviosLocales = () => {
          const enviosLocales = JSON.parse(localStorage.getItem('paes_envios_locales') || '{}');
          return Object.values(enviosLocales).filter(e => e.sesionId === sesionId);
        };
        
        callback(obtenerEnviosLocales());
        
        const handler = () => callback(obtenerEnviosLocales());
        window.addEventListener('paes_local_update', handler);
        return () => window.removeEventListener('paes_local_update', handler);
      }
    },

    /**
     * Obtiene tanto el envío del alumno como la sesión correspondiente por token.
     */
    async obtenerEnvioYPrueba(token) {
      if (isFirebaseActive && firestoreDb) {
        const envioDoc = await firestoreDb.collection("envios").doc(token).get();
        if (!envioDoc.exists) return null;
        const envioData = envioDoc.data();

        // Registrar fecha de inicio la primera vez que el alumno abre el link
        if (!envioData.fechaInicio && envioData.estado !== 'completado') {
          const now = new Date().toISOString();
          try {
            await firestoreDb.collection("envios").doc(token).update({ fechaInicio: now });
          } catch (updateErr) {
            console.warn("[PAES] No se pudo guardar fechaInicio en Firestore:", updateErr.message);
          }
          envioData.fechaInicio = now;
        }

        const sesionDoc = await firestoreDb.collection("sesiones").doc(envioData.sesionId).get();
        if (!sesionDoc.exists) return null;
        const sesionData = sesionDoc.data();

        return { envio: envioData, sesion: sesionData };
      } else {
        const enviosLocales = JSON.parse(localStorage.getItem('paes_envios_locales') || '{}');
        const envio = enviosLocales[token];
        if (!envio) return null;

        // Registrar fecha de inicio la primera vez que el alumno abre el link
        if (!envio.fechaInicio && envio.estado !== 'completado') {
          envio.fechaInicio = new Date().toISOString();
          enviosLocales[token] = envio;
          localStorage.setItem('paes_envios_locales', JSON.stringify(enviosLocales));
        }

        const sesionesLocales = JSON.parse(localStorage.getItem('paes_sesiones_locales') || '[]');
        const sesion = sesionesLocales.find(s => s.id === envio.sesionId);
        if (!sesion) return null;

        return { envio, sesion };
      }
    },

    /**
     * Guarda el borrador de respuestas en progreso en Firestore/LocalStorage.
     */
    async guardarBorrador(token, respuestas) {
      if (isFirebaseActive && firestoreDb) {
        try {
          await firestoreDb.collection("envios").doc(token).update({
            respuestas: respuestas,
            estado: 'en_progreso',
            ultimaActualizacion: new Date().toISOString()
          });
        } catch (e) {
          console.warn("[PAES DB] Error al guardar borrador en Firestore:", e.message);
        }
      } else {
        const enviosLocales = JSON.parse(localStorage.getItem('paes_envios_locales') || '{}');
        if (enviosLocales[token] && enviosLocales[token].estado !== 'completado') {
          enviosLocales[token].respuestas = respuestas;
          enviosLocales[token].estado = 'en_progreso';
          enviosLocales[token].ultimaActualizacion = new Date().toISOString();
          localStorage.setItem('paes_envios_locales', JSON.stringify(enviosLocales));
          window.dispatchEvent(new Event('paes_local_update'));
        }
      }
    },

    /**
     * Actualiza las respuestas de un estudiante en la base de datos y marca el estado como completado.
     */
    async enviarRespuestas(token, respuestas) {
      if (isFirebaseActive && firestoreDb) {
        await firestoreDb.collection("envios").doc(token).update({
          respuestas: respuestas,
          estado: 'completado',
          fechaRespuesta: new Date().toISOString()
        });
      } else {
        const enviosLocales = JSON.parse(localStorage.getItem('paes_envios_locales') || '{}');
        if (!enviosLocales[token]) {
          throw new Error('El envío no existe localmente.');
        }
        enviosLocales[token].respuestas = respuestas;
        enviosLocales[token].estado = 'completado';
        enviosLocales[token].fechaRespuesta = new Date().toISOString();
        localStorage.setItem('paes_envios_locales', JSON.stringify(enviosLocales));
        
        window.dispatchEvent(new Event('paes_local_update'));
      }
    },

    /**
     * Obtiene todas las sesiones guardadas (para el panel de gestión).
     */
    async obtenerTodasLasSesiones() {
      if (isFirebaseActive && firestoreDb) {
        const snapshot = await firestoreDb.collection("sesiones")
          .orderBy("fechaCreacion", "desc").get();
        return snapshot.docs.map(doc => doc.data());
      } else {
        const sesiones = JSON.parse(localStorage.getItem('paes_sesiones_locales') || '[]');
        return [...sesiones].sort((a, b) =>
          new Date(b.fechaCreacion) - new Date(a.fechaCreacion)
        );
      }
    },

    /**
     * Elimina una sesión y todos sus envíos asociados.
     */
    async borrarSesion(sesionId) {
      if (isFirebaseActive && firestoreDb) {
        // 1. Borrar la sesión (operación principal)
        await firestoreDb.collection("sesiones").doc(sesionId).delete();

        // 2. Intentar borrar envíos asociados (puede fallar si no hay índice aún — no es crítico)
        try {
          const enviosSnap = await firestoreDb.collection("envios")
            .where("sesionId", "==", sesionId).get();
          if (!enviosSnap.empty) {
            const batch = firestoreDb.batch();
            enviosSnap.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
          }
        } catch (envioErr) {
          console.warn("[PAES] Sesión eliminada, pero no se pudieron limpiar los envíos:", envioErr.message);
        }
      } else {
        // LocalStorage: borrar sesión
        let sesiones = JSON.parse(localStorage.getItem('paes_sesiones_locales') || '[]');
        sesiones = sesiones.filter(s => s.id !== sesionId);
        localStorage.setItem('paes_sesiones_locales', JSON.stringify(sesiones));
        // Borrar envíos de esa sesión
        const envios = JSON.parse(localStorage.getItem('paes_envios_locales') || '{}');
        Object.keys(envios).forEach(token => {
          if (envios[token].sesionId === sesionId) delete envios[token];
        });
        localStorage.setItem('paes_envios_locales', JSON.stringify(envios));
        window.dispatchEvent(new Event('paes_local_update'));
      }
    }
  };

  window.PAES_DB = PAES_DB;
})();
