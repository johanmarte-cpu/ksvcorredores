# CLAUDE.md

Este archivo orienta a Claude Code (claude.ai/code) al trabajar con el código de este repositorio.

@AGENTS.md

## Proyecto

Aplicación de back-office para una correduría de seguros (KSV Corredores de Seguros, República Dominicana). Todo el texto de la interfaz, los mensajes de validación y las etiquetas están en **español**; los identificadores del código están en inglés. Moneda: DOP, locale `es-DO`.

Stack: Next.js 16 (App Router) · React 19 · Prisma 7 (PostgreSQL vía `@prisma/adapter-pg`) · Auth.js v5 (credenciales, JWT) · Tailwind v4 + shadcn/ui · Zod 4 · Vercel Blob (documentos) · Resend (correo) · Framer Motion. Desplegado en Vercel.

## Comandos

```bash
npm run dev          # servidor de desarrollo en :3000
npm run lint         # eslint
npx tsc --noEmit     # verificación de tipos (no hay script propio)
npm run build        # ejecuta `prisma migrate deploy` y LUEGO `next build` — modifica la BD de DIRECT_URL
npm run db:migrate   # prisma migrate dev (crear/aplicar migraciones)
npm run db:seed      # tsx prisma/seed.ts
npm run db:studio
npx prisma generate  # regenerar el cliente tras editar el schema (también corre en postinstall)
```

No hay suite de pruebas.

## Arquitectura

- **El cliente de Prisma se genera en `src/generated/prisma`** (ignorado por git): importa desde `@/generated/prisma/client` y usa el singleton `prisma` de `@/lib/prisma`. `prisma.config.ts` usa `DIRECT_URL` para migraciones; en tiempo de ejecución se usa `DATABASE_URL` (pooler).
- **La autenticación está dividida para ser compatible con edge**: `src/auth.config.ts` (sin Prisma/bcrypt) lo usa `src/proxy.ts` (el reemplazo de `middleware.ts` en Next 16) para proteger todas las rutas excepto `/login`, `/api/*` y archivos estáticos. `src/auth.ts` añade el proveedor Credentials. `session.user.role`/`id` se agregan en los callbacks JWT (tipados en `src/types/next-auth.d.ts`). Roles: `ADMIN, BROKER, CUSTOMER_SERVICE, ACCOUNTING, READ_ONLY`; las acciones solo para administradores verifican `session?.user?.role !== "ADMIN"` en línea.
- **Estructura de rutas**: `src/app/(app)/<módulo>/` contiene cada módulo autenticado (clients, quotes, policies, renewals, collections, commissions, claims, referrals, insurers, users, reports, settings, dashboard). Patrón por módulo:
  - `page.tsx` — Server Component asíncrono que consulta Prisma directamente.
  - `actions.ts` — server actions `"use server"` con firma `(prevState, formData)`, validan con Zod, devuelven `{ error }` / `{ success }` y luego llaman `revalidatePath`. Los formularios cliente usan `useActionState` + `useCloseDialogOnSuccess` (`src/lib/use-close-on-success.ts`) para cerrar los diálogos.
  - `*-dialog.tsx` / `*-forms.tsx` — componentes cliente para crear/editar.
- **Paginación de listados**: cada página de listado lee `searchParams.page`, usa `parsePage`/`paginate`/`totalPages` de `src/lib/pagination.ts` (10 por página) con un `count()` en paralelo y renderiza `<ListPagination>`. Las páginas con dos tablas (renewals, referrals) usan parámetros de página separados.
- **Configuración del sistema**: es una fila única en la BD (`SystemSettings`, id `"singleton"`) que se lee con `getSettings()` en `src/lib/settings.ts`. Sus valores (p. ej. API key de Resend, remitente, activación de notificaciones y días de anticipación) tienen prioridad sobre las variables de entorno.
- **Notificaciones**: `src/app/api/cron/notifications/route.ts` se ejecuta a diario vía Vercel Cron (`vercel.json`), protegido con el bearer `CRON_SECRET`. Envía recordatorios de pago, avisos de renovación y felicitaciones de cumpleaños usando las plantillas de `src/lib/notification-templates.ts` y `sendEmail` de `src/lib/email.ts` (no envía nada y muestra una advertencia si no hay API key).
- **Fechas**: los valores de solo fecha (fechas de póliza/pago, cumpleaños) se guardan como **medianoche UTC**. Formatea siempre con `timeZone: "UTC"` (`formatDate` en `src/lib/format.ts`) y calcula rangos de días en UTC; si no, el día se desplaza en America/Santo_Domingo (UTC-4).
- **Utilidades de presentación compartidas**: `src/lib/labels.ts` (mapas enum → etiqueta en español), `src/lib/status-colors.ts` (enum → tono de badge), `src/lib/format.ts` (moneda, fechas, `clientDisplayName`). Al añadir valores a un enum, agrégalos también a estos mapas.
- Otra lógica de dominio en `src/lib`: `payment-schedule.ts` (cuotas según la frecuencia de pago), `tax.ts`, `client-import.ts` (importación masiva desde Excel/CSV con `xlsx`; la plantilla se sirve desde `api/settings/client-import-template`).
- `src/app/print/policies/[id]` es una página optimizada para impresión, fuera del layout `(app)`.
- Los documentos se suben a Vercel Blob desde server actions (`next.config.ts` eleva el límite del cuerpo de las server actions a 15mb).

## Convenciones de UI

- Los componentes shadcn/ui están en `src/components/ui`; los envoltorios de animación, en `src/components/effects` (`FadeIn` con `delay` escalonado se usa en todas las páginas). El skill del proyecto `rediseno-ui` (`.claude/skills`) describe el enfoque de rediseño estilo Aceternity.
- El dashboard es una vista de back-office densa: prioriza paneles compactos y con mucha información sobre gráficos grandes y decorativos.
