# Blue Lock: Egoist Career Mode ⚽🔥

Simulador de gestión deportiva y modo carrera del anime **Blue Lock** con la profundidad táctica de *Football Manager*, optimizado para despliegue serverless de **Presupuesto 0€** en **Vercel** con base de datos en **Supabase Free Tier**.

- 🌐 **Despliegue en Producción:** [https://blue-lock-career-mode.vercel.app](https://blue-lock-career-mode.vercel.app)
- 🔗 **Mirror Alias Vercel:** [https://blue-lock-career-mode-ale-e704.vercel.app](https://blue-lock-career-mode-ale-e704.vercel.app)
- 🗄️ **Supabase Project:** `wucthebjndvwyoabztib` (EU West - Frankfurt / Ireland)

---

## ⚡ 1. Características del Dominio de Blue Lock

- **Arsenal de Armas Únicas (Weapons):**
  - **Metavisión (Metavision):** Cartografía 360° del campo, anticipación de líneas de pase (+25% evasión en duelos y precisión de pase filtrado).
  - **Direct Shot (Tiro Directo):** Golpeo al primer toque sin control previo (+35% conversión reduciendo el tiempo de reacción del portero).
  - **Predator Eye (Ojo de Depredador):** Acecho y lectura del centro de gravedad del portero en el 1v1.
  - **Kaiser Impact:** Velocidad de oscilación más rápida del mundo del fútbol (+45% velocidad de disparo).
  - **Speed 44-Area / Speed Burst:** Desmarques al espacio y rotura de la trampa del fuera de juego.
  - **Scorpion Saves & Primal Reflexes:** Paradas acrobáticas felinas estilo Gagamaru.
- **Sistema de Flow y Reacciones Químicas:**
  - El medidor de **Ego (0-100)** aumenta con cada duelo ganado.
  - Al superar el 85% de Ego en momentos de alta tensión, se activa el **Estado Flow** (ojos encendidos, instinto desatado).
  - Jugadores con perfiles complementarios (ej: Isagi Metavisión + Bachira Dribble) desatan **Reacciones Químicas** que multiplican la probabilidad de gol y asistencia.
- **Subastas NEL (Neo Egoist League):**
  - Valoración de mercado en **Yenes (¥)** según goles, asistencias, paradas, duelos y valoración del partido (Match Rating).
  - Ofertas anuales emitidas por los gigantes europeos: *Bastard München, Paris X Gen, Manshine City, Ubers y FC Barcha*.
- **Cantera Japonesa & Módulo Wild Card:**
  - Ojeo de talentos en institutos japoneses (*Ichinan High, Matsukaze Kokuou*).
  - Repesca experimental *Wild Card* (Kunigami) para reconstruir el físico al estándar de Noel Noa.
- **Auditoría Táctica de Jinpachi Ego con Fallback Offline:**
  - Conexión ultra-rápida a **Groq (Llama-3.3-70b-versatile)** para ruedas de prensa y críticas tácticas con voz auténtica de Ego.
  - **Fallback procedural 100% offline:** Si no se suministra API key o se llega al límite de cuota (HTTP 429), se activa el generador procedural con vocabulario exacto de Ego (*"Diamantes en bruto", "Basura sin ego"*), garantizando coste 0€ y disponibilidad total.

---

## 🛠️ 2. Arquitectura de Despliegue (Presupuesto 0€ Estricto)

| Componente | Proveedor | Nivel de Coste | Propósito |
| :--- | :--- | :--- | :--- |
| **Frontend & API** | Vercel | Hobby (0€) | Next.js 14 App Router, SSR, Turbopack |
| **Base de Datos** | Supabase | Free Tier (0€) | PostgreSQL con RLS estricto e índices optimizados |
| **Conexiones BD** | `@supabase/ssr` | Free Tier (0€) | Acceso stateless sin saturar el Connection Pool |
| **IA Narrativa** | Groq Cloud | Free Tier (0€) | Inferencia gratuita con Llama-3.3-70b |
| **Motor Fallback** | Local TS Engine | 0€ Local | Generación de diálogos procedurales sin red |

---

## 🚀 3. Puesta en Marcha Local

### 1. Clonar e Instalar Dependencias
```bash
npm install
```

### 2. Configurar Variables de Entorno
Copia el archivo `.env.example` a `.env.local`:
```bash
cp .env.example .env.local
```
*(Opcional: puedes dejar las credenciales por defecto; la aplicación incluye datos precargados y fallback procedural para jugar inmediatamente).*

### 3. Ejecutar en Modo Desarrollo
```bash
npm run dev
```
Abre en tu navegador: [http://localhost:3000](http://localhost:3000)

### 4. Compilación para Producción (Vercel)
```bash
npm run build
```

---

## 🗄️ 4. Base de Datos Supabase (Migración y Seed)

En el panel de Supabase (**SQL Editor**), ejecuta en orden:
1. `supabase/migrations/0001_initial_schema.sql` (Crea tablas con RLS e índices)
2. `supabase/seed.sql` (Inserta los 5 clubes de la NEL, estrellas y promesas)
