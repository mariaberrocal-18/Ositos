# Ositos · Simona y Amelia

En producción: https://ositos-nine.vercel.app

App para llevar la historia médica de Simona y Amelia: visitas al vet, vacunas, desparasitación, estudios con PDFs, remedios, peso y un journal de síntomas. Se instala en el celular como una app y la usan dos personas con su propio email.

**Stack:** Next.js 16 · Supabase (login por email, base de datos y archivos) · Vercel. Todo con planes gratuitos.

> Los datos médicos **no** están en este repo. Viven en tu base de Supabase. El archivo `seed-privado.sql` y los PDFs se pasan aparte y están en `.gitignore`.

---

## Puesta en marcha (una sola vez, ~20 minutos)

### 1. Supabase: crear el proyecto
1. Entrá a [supabase.com](https://supabase.com), creá una cuenta y un proyecto nuevo (región: São Paulo). Guardá la contraseña de la base en algún lado.
2. Andá a **SQL Editor → New query**, pegá todo `supabase/schema.sql` y tocá **Run**.
3. Abrí `seed-privado.sql`, completá el email de tu esposo donde dice `EMAIL_DE_TU_ESPOSO` (sacale los `--` de esa línea), pegalo en otra query y tocá **Run**. Eso carga los miembros, las fichas y todos los registros.

### 2. Subir los PDFs
1. **Storage → docs** → **Create folder** → `historia`.
2. Entrá a la carpeta y subí los 4 PDFs con estos nombres exactos:
   - `Historia_clinica_Amelia.pdf`
   - `Historia_clinica_Simona.pdf`
   - `Ecografia_abdominal_Simona_2025-12-02.pdf`
   - `PCR_VIF-VILEF_Amelia_2023-07-24.pdf`

### 3. Login por email con código
1. **Authentication → Emails → Magic Link**: reemplazá el cuerpo del email por algo así, para que llegue también el código de 6 dígitos (en iPhone, el código funciona dentro de la app instalada; el link abre Safari):
   ```html
   <h2>Tu código para entrar</h2>
   <p style="font-size:28px;letter-spacing:6px"><b>{{ .Token }}</b></p>
   <p>O tocá este link: <a href="{{ .ConfirmationURL }}">Entrar</a></p>
   ```
2. **Authentication → Sign In / Providers → Email**: dejalo activado.

### 4. Vercel: publicar la app
1. Entrá a [vercel.com](https://vercel.com) con tu GitHub y tocá **Add New → Project → Import** el repo `Ositos`.
2. En **Environment Variables** agregá (los valores están en Supabase → **Project Settings → API Keys** / **Data API**):
   | Nombre | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL, ej. `https://abcd.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key (`sb_publishable_…`) |
3. **Deploy**. Te da una dirección tipo `https://ositos.vercel.app`.
4. Volvé a Supabase → **Authentication → URL Configuration**:
   - **Site URL**: tu dirección de Vercel.
   - **Redirect URLs**: agregá `https://TU-APP.vercel.app/auth/callback`.

### 5. Instalarla en el celular
- **iPhone:** abrí la dirección en Safari → botón Compartir → **Agregar a inicio**.
- **Android:** abrí en Chrome → menú ⋮ → **Instalar app**.

Entrás con tu email, te llega un código y listo.

---

## Agregar a alguien más
En Supabase → SQL Editor:
```sql
insert into public.members (email, name) values ('alguien@email.com', 'Nombre');
```

## Desarrollo local
```bash
npm install
cp .env.example .env.local   # y completá las dos variables
npm run dev
```
Para ver la app sin Supabase, poné `NEXT_PUBLIC_DEMO=1` y un archivo `public/demo.json` con `{ "records": [], "pets": {} }`.

## Estructura
- `app/` rutas: inicio, `gata/[id]`, `calendario`, `login`, `auth/callback`.
- `components/` vistas, tarjetas, formularios (`Sheet.tsx`), navegación (`Shell.tsx`).
- `lib/config.ts` datos fijos de cada gata y los tipos de registro con sus campos.
- `lib/store.tsx` lectura y escritura en Supabase, con cambios en vivo entre los dos teléfonos.
- `supabase/schema.sql` tablas, permisos (solo los miembros leen y escriben) y bucket privado de archivos.
- `proxy.ts` mantiene la sesión y manda a `/login` si no entraste.
