# ⚽ Prode 2026

Prode del Mundial 2026 para jugar con amigos. Predicciones en tiempo real, ranking automático, grupos con código.

## Stack
- **Next.js 14** — frontend + API
- **Supabase** — base de datos PostgreSQL + autenticación sin contraseña
- **Tailwind CSS** — estilos
- **Vercel** — deploy

---

## 🚀 Cómo deployar (paso a paso)

### 1. Crear cuenta en Supabase
1. Entrá a [supabase.com](https://supabase.com) y creá una cuenta gratis
2. Hacé click en **"New project"**
3. Elegí un nombre (ej: `prode2026`) y una contraseña para la DB
4. Esperá ~2 minutos a que se cree el proyecto

### 2. Configurar la base de datos
1. En tu proyecto de Supabase, andá a **SQL Editor** (ícono de terminal en el sidebar)
2. Hacé click en **"New query"**
3. Copiá y pegá TODO el contenido del archivo `supabase/migrations/001_schema.sql`
4. Hacé click en **"Run"** (verde)
5. Deberías ver "Success. No rows returned" — listo, la DB está lista

### 3. Habilitar autenticación por email
1. En Supabase, andá a **Authentication > Providers**
2. Asegurate que **Email** esté habilitado (viene por defecto)
3. Andá a **Authentication > URL Configuration**
4. En "Site URL" poné: `https://TU-PROYECTO.vercel.app` (lo tenés después del deploy)
5. En "Redirect URLs" agregá: `https://TU-PROYECTO.vercel.app/auth/callback`

### 4. Obtener las keys de Supabase
1. En Supabase, andá a **Settings > API**
2. Copiá:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ nunca la expongas públicamente

### 5. Subir a GitHub
```bash
git init
git add .
git commit -m "prode 2026 inicial"
# Creá un repo en github.com, luego:
git remote add origin https://github.com/TU_USUARIO/prode2026.git
git push -u origin main
```

### 6. Deploy en Vercel
1. Entrá a [vercel.com](https://vercel.com) con tu cuenta de GitHub
2. Hacé click en **"New Project"**
3. Importá el repo `prode2026`
4. En **"Environment Variables"** agregá las 3 keys de Supabase:
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOi...
   SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOi...
   ```
5. Hacé click en **"Deploy"**

### 7. Actualizar URL en Supabase
1. Una vez que Vercel te dé la URL (ej: `prode2026.vercel.app`)
2. Volvé a Supabase > Authentication > URL Configuration
3. Actualizá el Site URL y el Redirect URL con tu URL real de Vercel

---

## 🎮 Cómo usar

1. Entrá a la app y registrate con tu email (te manda un link, sin contraseña)
2. Creá un grupo y compartí el **código** con tus amigos
3. Tus amigos entran, usan el código para unirse
4. Todos cargan sus predicciones antes de cada partido
5. Cuando termina un partido, **cargás el resultado real** y los puntos se calculan solos

### Cargar resultados reales
Para marcar un partido como terminado y cargar el resultado:
1. Andá a Supabase > Table Editor > `matches`
2. Encontrá el partido
3. Poné `home_score`, `away_score` y cambiá `finished` a `true`
4. Los puntos se calculan automáticamente con el trigger de la DB

---

## 📊 Sistema de puntos
| Resultado | Puntos |
|-----------|--------|
| Marcador exacto (ej: predijiste 2-1, salió 2-1) | **3 pts** |
| Ganador/empate correcto (ej: predijiste 2-1, salió 3-0) | **1 pt** |
| Resultado incorrecto | 0 pts |

---

## 🛠 Desarrollo local

```bash
npm install
cp .env.example .env.local
# Editá .env.local con tus keys de Supabase
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)
