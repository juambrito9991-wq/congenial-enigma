# Activación en producción

Esta aplicación ya está construida. Para que quede activa y pueda ser usada por ciudadanos desde celulares se necesita publicarla con:

- Supabase: base de datos, usuario administrador y claves de conexión.
- Vercel: publicación web de la aplicación.

La vista `preview.html` es solo una demostración local. Para uso real no debe usarse como sistema final, porque guarda respuestas únicamente en el navegador de la computadora.

## 1. Crear la base de datos en Supabase

1. Entrar a Supabase.
2. Crear un proyecto nuevo.
3. Ir a SQL Editor.
4. Ejecutar:

```sql
-- Archivo:
supabase/schema.sql
```

5. Luego ejecutar:

```sql
-- Archivo:
supabase/seed_padron_provincial.sql
```

Esto carga el padrón provincial con:

- Cédula
- Nombres
- Cantón
- Parroquia
- Sexo
- Fuente PDF

## 2. Crear administrador

En Supabase:

1. Ir a Authentication.
2. Crear usuario con correo y contraseña.
3. Ese correo debe ir en la variable `ADMIN_EMAILS`.

## 3. Variables necesarias

Crear estas variables en Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_EMAILS=
NEXT_PUBLIC_APP_NAME=Padrón Primarias Pachakutik
```

Dónde obtenerlas:

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase > Project Settings > API > Project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase > Project Settings > API > anon public key.
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase > Project Settings > API > service_role key.
- `ADMIN_EMAILS`: correo del administrador. Ejemplo: `admin@correo.com`.

Importante: `SUPABASE_SERVICE_ROLE_KEY` no debe compartirse públicamente.

## 4. Publicar en Vercel

1. Subir la carpeta del proyecto a GitHub.
2. Entrar a Vercel.
3. Importar el repositorio.
4. Configurar las variables del paso anterior.
5. Publicar.

Rutas finales:

- Consulta ciudadana: `https://tu-dominio.vercel.app`
- Panel administrativo: `https://tu-dominio.vercel.app/admin`
- Importar nuevo padrón PDF: `https://tu-dominio.vercel.app/admin/import`

## 5. Verificación antes de difundir

Probar:

1. Buscar una cédula real del padrón.
2. Verificar que muestre nombre, cédula, cantón y parroquia.
3. Registrar teléfono e intención de voto.
4. Entrar al panel administrativo.
5. Confirmar que aparece la consulta.
6. Descargar Excel.
7. Revisar el reporte por cantón, parroquia e intención de voto.

## Datos que faltan para activarla

Para dejarla publicada necesito:

1. URL del proyecto Supabase.
2. Clave pública anon de Supabase.
3. Clave service_role de Supabase.
4. Correo del administrador.
5. Acceso o repositorio de Vercel/GitHub donde se publicará.

## Verificador incluido

Después de crear `.env.local`, puede ejecutarse:

```powershell
.\scripts\activar-produccion.ps1
```

También se puede verificar el estado con:

```bash
npm run activation:check
```
