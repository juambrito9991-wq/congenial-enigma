# Padrón Primarias Pachakutik

Aplicación web responsive para consultar el padrón electoral interno de las primarias de Pachakutik, registrar teléfono celular e intención de voto, importar padrones desde PDF y administrar consultas con estadísticas y exportación Excel.

## Arquitectura

- **Frontend:** Next.js App Router, TypeScript y Tailwind CSS.
- **Backend:** rutas API de Next.js ejecutadas server-side.
- **Base de datos:** PostgreSQL en Supabase.
- **Autenticación admin:** Supabase Auth con lista blanca de correos en `ADMIN_EMAILS`.
- **PDF:** extracción automática con `pdf-parse`.
- **Reportes:** exportación `.xlsx` con `exceljs`.
- **Despliegue:** Vercel conectado a Supabase.

Flujo público:

1. Ciudadano busca por cédula o nombres.
2. El servidor consulta `PADRON` con clave de servicio.
3. Si existe, muestra nombre, cédula, cantón y parroquia donde consta para sufragar.
4. Luego solicita teléfono celular ecuatoriano.
5. Finalmente muestra candidatas y guarda una sola respuesta por cédula en `CONSULTAS`.

Flujo administrativo:

1. Admin inicia sesión con Supabase Auth.
2. Puede importar nuevos PDF del padrón.
3. Puede ver consultas, buscar, filtrar, exportar Excel y revisar gráficos en tiempo real.

## Estructura de carpetas

```txt
src/
  app/
    api/
      search/route.ts
      register/route.ts
      admin/
        consultas/route.ts
        export/route.ts
        import/route.ts
        stats/route.ts
    admin/
      login/page.tsx
      import/page.tsx
      page.tsx
    page.tsx
    layout.tsx
    globals.css
  components/
    AdminDashboard.tsx
    AdminImport.tsx
    AdminShell.tsx
    LoginForm.tsx
    PhoneVoteForm.tsx
    SearchForm.tsx
  lib/
    auth.ts
    candidates.ts
    pdf.ts
    request.ts
    validation.ts
    supabase/
      admin.ts
      browser.ts
      server.ts
supabase/
  schema.sql
  seed_padron_huambi.sql
  seed_padron_huambi.csv
```

## Base inicial provincial

Se procesaron los padrones PDF de los 13 cantones entregados:

- PDFs procesados: **138**.
- Registros extraídos: **53.709**.
- Registros únicos por cédula: **53.688**.
- Cédulas repetidas entre padrones: **21**.
- Cédulas con nombres conflictivos: **5**.

Distribución por cantón:

| Cantón | Registros únicos |
| --- | ---: |
| Morona | 9.384 |
| Taisha | 7.851 |
| Gualaquiza | 6.492 |
| Sevilla Don Bosco | 4.892 |
| Tiwintza | 4.357 |
| Sucúa | 4.029 |
| Huamboya | 3.589 |
| Santiago de Méndez | 3.304 |
| Logroño | 2.839 |
| Palora | 2.589 |
| Limón | 1.951 |
| San Juan Bosco | 1.415 |
| Pablo Sexto | 996 |

Los archivos generados son:

- `supabase/seed_padron_provincial.sql`: carga inicial provincial para Supabase.
- `supabase/seed_padron_provincial.csv`: respaldo auditable con `cedula`, `nombres`, `canton`, `parroquia`, `sexo`, `fuente`.
- `supabase/seed_padron_provincial.sql`: inserta también `canton` y `parroquia` para informar el lugar de sufragio al ciudadano.
- `supabase/resumen_padron_provincial.json`: resumen por cantón y por archivo.
- `supabase/duplicados_conflictivos.csv`: cédulas que aparecen con nombres diferentes en los PDF.
- `supabase/seed_padron_huambi.sql` y `supabase/seed_padron_huambi.csv`: se conservan como referencia del primer ejemplo.

## Instalación local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Configure `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_solo_servidor
ADMIN_EMAILS=correo-admin@dominio.com
```

## Configuración de Supabase

1. Crear un proyecto en Supabase.
2. Abrir **SQL Editor**.
3. Ejecutar `supabase/schema.sql`.
4. Ejecutar `supabase/seed_padron_provincial.sql`.
5. Ir a **Authentication > Users** y crear el usuario administrador.
6. Colocar el correo del administrador en `ADMIN_EMAILS`.

La clave `SUPABASE_SERVICE_ROLE_KEY` solo debe estar en variables del servidor. No debe exponerse en el navegador.

## Configuración de Vercel

1. Subir el repositorio a GitHub.
2. Importarlo en Vercel como proyecto Next.js.
3. Agregar variables de entorno:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_EMAILS`
4. Desplegar.

`vercel.json` aumenta el tiempo máximo de la ruta de importación PDF para padrones grandes.

Para activar la aplicación en producción, revisar también `ACTIVACION_PRODUCCION.md`.

## Seguridad aplicada

- Validación server-side con `zod`.
- Sanitización de cédula, nombres y teléfono.
- Teléfono celular ecuatoriano obligatorio en formato normalizado `+5939XXXXXXXX`.
- `CONSULTAS.cedula` es única para evitar duplicados.
- Fecha y hora se registran en cada consulta.
- IP y dispositivo se guardan desde cabeceras del request.
- RLS activado y acceso directo revocado para `anon` y `authenticated`.
- Panel admin protegido por Supabase Auth y lista blanca de correos.

## Uso

- Consulta pública: `/`
- Panel administrativo: `/admin`
- Importar PDF: `/admin/import`
- Exportación Excel: botón **Excel** del dashboard.

## Comandos útiles

```bash
npm run typecheck
npm run lint
npm run build
```
