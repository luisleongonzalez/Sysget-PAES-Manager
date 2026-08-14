---
name: web-app-security
description: Estándares, directrices y mejores prácticas de seguridad para el desarrollo de aplicaciones web fullstack (protección de secretos y .env, sanitización y validación Zod/XSS/SQLi, autenticación RBAC/IDOR, CORS, cabeceras HTTP/Helmet, rate limiting, manejo seguro de errores, cookies HttpOnly y auditoría de dependencias). Usar siempre que se diseñe, programe, audite o refactorice código backend, APIs, frontend, autenticación o manejo de datos sensibles.
---

# 🛡️ Guía y Estándares de Seguridad para Aplicaciones Web

Este skill establece los principios, directrices obligatorias y listas de verificación para garantizar la máxima seguridad en aplicaciones web modernas, arquitecturas cliente-servidor y plataformas SaaS.

---

## 🔒 1. Protección de Secretos y Variables de Entorno (`.env`)

- **Prohibido el Hardcoding:** Las API Keys, tokens de servicio, claves maestras y credenciales de bases de datos nunca deben escribirse directamente en el código fuente.
- **Separación Cliente / Servidor:**
  - En Vite, solo las variables con prefijo `VITE_` se exponen al bundle del navegador (como la URL pública de Supabase y la `anon_key`). Claves como `SUPABASE_SERVICE_ROLE_KEY` o secrets de pasarelas de pago **jamás** deben tener prefijo cliente ni importarse en el frontend.
  - En Next.js, solo `NEXT_PUBLIC_` es visible en el cliente.
- **Control de Versiones:** Asegurar que `.env`, `.env.local` y archivos con credenciales reales estén rigurosamente incluidos en `.gitignore`. Proveer siempre un `.env.example` sanitizado.

---

## 🧹 2. Validación y Sanitización de Entradas (Prevención de XSS y SQLi)

- **Validación en Capas:** Validar y tipar todas las entradas del usuario en el frontend (para feedback rápido de UX) y **obligatoriamente en el backend** (fuente de verdad).
- **Esquemas de Validación:** Usar librerías declarativas con tipado estricto como [Zod](https://zod.dev), Joi o Pydantic para validar payloads JSON, parámetros de URL y headers.
- **Prevención de Inyección SQL/NoSQL:**
  - Usar siempre consultas parametrizadas o un ORM/Query Builder seguro (Prisma, Drizzle, SQLAlchemy).
  - En Supabase / PostgreSQL, utilizar Row Level Security (RLS) y funciones RPC parametrizadas.
- **Prevención de XSS (Cross-Site Scripting):**
  - Evitar `dangerouslySetInnerHTML` en React salvo sanitización estricta con DOMPurify.
  - Escapar contenido dinámico renderizado en HTML.

---

## 👥 3. Autenticación y Autorización en el Servidor (RBAC & IDOR)

- **No confiar en la interfaz (UI):** Ocultar botones, menús o pestañas en el frontend no protege los recursos. Cada endpoint, API Route, Server Action o consulta a BD debe verificar independientemente la identidad y los permisos del usuario.
- **Prevención de IDOR (Insecure Direct Object References):**
  - Al consultar o modificar un registro (ej. `/api/rendiciones/:id`), validar que el recurso pertenezca al usuario autenticado o a su institución/colegio (`tenant_id`).
  - Implementar políticas RLS (`USING (auth.uid() = user_id)`) en la base de datos como primera línea de defensa.
- **Control de Acceso Basado en Roles (RBAC):** Definir roles explícitos (`administrador`, `profesor`, `alumno`) y validar los privilegios antes de ejecutar mutaciones críticas.

---

## 🌐 4. Configuración de CORS y Cabeceras HTTP de Seguridad

- **Restricción de CORS:**
  - En producción, restringir el intercambio de recursos de origen cruzado (`Access-Control-Allow-Origin`) únicamente a los dominios autorizados. **Nunca usar `*` (permitir todo) con credenciales**.
- **Cabeceras de Seguridad:** Implementar middleware de seguridad (como [Helmet](https://helmetjs.github.io/) en Express/Node):
  - `Content-Security-Policy` (CSP) para mitigar XSS y scripts no autorizados.
  - `Strict-Transport-Security` (HSTS) para forzar conexiones HTTPS.
  - `X-Frame-Options: DENY` o `SAMEORIGIN` para prevenir ataques de Clickjacking.
  - `X-Content-Type-Options: nosniff`.

---

## 📦 5. Revisión de Dependencias y Paquetes "Alucinados"

- **Verificación de Integridad:** Antes de instalar cualquier paquete sugerido por herramientas de IA, confirmar que el paquete sea legítimo, exista en el registro oficial (npm/PyPI) y cuente con mantenimiento activo (prevención de *package hallucination* o *typosquatting*).
- **Auditorías Periódicas:**
  - Ejecutar `npm audit` o `pip-audit` en el flujo de CI/CD para detectar y corregir vulnerabilidades conocidas en dependencias transitivas.

---

## ⏱️ 6. Límite de Peticiones (Rate Limiting) y Protección contra Abusos

- **Rutas Críticas Protegidas:** Implementar limitadores de tasa (usando Redis, Upstash o middlewares como `express-rate-limit`) en:
  - Rutas de autenticación (Login, Registro, Recuperación de contraseña) para mitigar ataques de fuerza bruta y *credential stuffing*.
  - Endpoints que invocan APIs de IA de pago o servicios externos costosos para prevenir denegación de servicio (DoS) y sobrecostos.

---

## 🚨 7. Manejo Seguro de Errores y Logs

- **Mensajes al Cliente:** Los endpoints nunca deben responder con stack traces detallados, consultas SQL internas, rutas del sistema de archivos ni esquemas de base de datos.
- **Mensajes Genéricos y Amigables:** Retornar códigos de estado HTTP apropiados (400, 401, 403, 404, 500) y mensajes genéricos hacia el usuario final.
- **Logs Internos:** Centralizar los logs detallados de error en herramientas de observabilidad de servidor (Sentry, Datadog, CloudWatch, BetterStack), asegurando sanitizar datos sensibles (PII, tarjetas, contraseñas) antes de loguear.

---

## 🔐 8. Cifrado de Datos y Hash de Contraseñas

- **HTTPS Obligatorio:** Todo el tráfico debe viajar cifrado mediante TLS/SSL tanto en tránsito como en reposo.
- **Hashing de Contraseñas:**
  - Si se gestiona autenticación personalizada, nunca almacenar contraseñas en texto plano ni con algoritmos obsoletos (MD5, SHA1).
  - Usar algoritmos lentos y resistentes a fuerza bruta como **Argon2id** o **bcrypt** con salt aleatorio.
  - Preferir proveedores de identidad robustos (Supabase Auth, Auth0, Clerk, NextAuth/Auth.js).

---

## 🍪 9. Políticas de Cookies y Tokens de Sesión

- **Flags Obligatorios en Cookies:**
  - `HttpOnly`: Impide el acceso a la cookie desde JavaScript, mitigando el robo de tokens vía XSS.
  - `Secure`: Asegura que la cookie solo se transmita sobre conexiones cifradas HTTPS.
  - `SameSite=Lax` o `SameSite=Strict`: Protege contra ataques de falsificación de peticiones en sitios cruzados (CSRF).
- **Expiración y Revocación:** Configurar tiempos de vida cortos para tokens de acceso (JWT) y soporte de rotación de refresh tokens.

---

## 🔍 10. Revisión y Auditoría de Código (Code Review & SAST)

- **Revisión Humana Obligatoria:** Nunca desplegar a producción código generado por IA sin haberlo revisado, comprendido y validado manualmente.
- **Análisis Estático:** Integrar linters de seguridad y herramientas SAST (SonarQube, Semgrep, CodeQL) en el pipeline de desarrollo.

---

## ✅ Checklist Rápido de Verificación de Seguridad

| Ítem | Control de Seguridad | Verificado |
| :--- | :--- | :---: |
| 1 | ¿No hay API Keys privadas ni credenciales hardcodeadas en frontend? | [ ] |
| 2 | ¿`.env` y `.env.local` están en `.gitignore`? | [ ] |
| 3 | ¿Las entradas en endpoints y formularios están validadas con Zod/esquemas? | [ ] |
| 4 | ¿Se aplican políticas RLS o validación de propiedad de recurso (IDOR)? | [ ] |
| 5 | ¿CORS está restringido a orígenes autorizados? | [ ] |
| 6 | ¿Las rutas de login y consumo de IA tienen Rate Limiting? | [ ] |
| 7 | ¿Los errores hacia el cliente ocultan stack traces y detalles internos? | [ ] |
| 8 | ¿Las cookies de sesión usan `HttpOnly`, `Secure` y `SameSite`? | [ ] |
