# Gestión de Estantería — Maderable

App de inventario y ubicación de placas, alojada 100% en Vercel.

---

## Deploy en Vercel (una sola vez)

### 1. Subir el código a GitHub

1. Crear cuenta en github.com si no tenés
2. Nuevo repositorio (privado) → "estanteria"
3. Subir todos estos archivos al repositorio

### 2. Conectar con Vercel

1. Entrar a vercel.com → crear cuenta con GitHub
2. "Add New Project" → importar el repositorio "estanteria"
3. Dejar todas las opciones por defecto → Deploy

### 3. Crear la base de datos

1. En el dashboard de Vercel → tu proyecto → pestaña "Storage"
2. "Create Database" → elegir "Postgres" → crear (plan gratuito)
3. Vercel conecta automáticamente la base de datos al proyecto

### 4. Inicializar las tablas (una sola vez)

Abrir en el navegador:
```
https://tu-proyecto.vercel.app/api/init
```
Tiene que responder: `{"ok":true,"message":"Base de datos inicializada correctamente."}`

### 5. ¡Listo!

La app está en `https://tu-proyecto.vercel.app`

Para instalar en el tablet:
- **iPad:** Safari → compartir → "Agregar al inicio"
- **Android:** Chrome → menú → "Instalar app"

---

## Estructura de la estantería

| Columnas | Formato | Tamaño | Niveles | Capacidad/nivel |
|----------|---------|--------|---------|-----------------|
| A1, A2, A3, A4 | A | 122 cm | 5 | 40 placas |
| B1, B2 | B | 180 cm | 5 | 25 placas |
| X1 | Especial | — | 1 | 150 placas |

**Total: 31 posiciones**

---

## Modificar la estantería

Si cambian las columnas o capacidades, editar `api/init.js` 
y volver a ejecutar `/api/init`.
