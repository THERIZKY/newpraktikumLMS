Salin seluruh teks di dalam blok di bawah ini ke AI Agent kamu (pastikan file `AGENTS.md` dan `prisma/schema.prisma` sudah ada di folder project):

```text
Kamu adalah Senior Fullstack Next.js 16 Architect.
Tugas kamu adalah membangun aplikasi web fullstack **Sistem Manajemen Praktikum (LMS Praktikum)** dengan menggabungkan:
1. Desain visual & struktur UI dari **Google Stitch Project ID `12827378863387529883`** (15 Screens di bawah).
2. Aturan teknis modern dari `GEMINI.md` (Next.js 16.2+, React 19.2, Tailwind CSS v4, shadcn/ui, Auth.js v5, Prisma v7).
3. Skema database 21 model PostgreSQL di `prisma/schema.prisma` (referensi spesifikasi `THERIZKY/projectPraktikum`).

## Stitch Instructions

Get the images and code for the following Stitch project's screens:

## Project
Title: Learning Platform Web App
ID: 12827378863387529883

## Screens:
1. prd_dan_erd_lms_praktikum_nextjs16.md
    ID: 10887000942785304740

2. Generating Screen...
    ID: 9935fed123d14d32b7bea2ad4dd08352

3. Generating Screen...
    ID: a2e8ffe8043446bab001138e26956d22

4. Generating Screen...
    ID: e9a4bb6792e1463eb0eeb96093e5bb82

5. Generating Screen...
    ID: 27b64597ca244d1ba045cfffc8dedfce

6. Generating Screen...
    ID: 06f48ea46b5f4867ace3e3ac447f3af6

7. Generating Screen...
    ID: 885351391da64c1c89442048a1714066

8. Generating Screen...
    ID: 14c9fcddc49140248131a3e5b9a12bfc

9. Generating Screen...
    ID: 27e3b6f4bb664b529191274755a9e0ab

10. Generating Screen...
    ID: f53f5a1f7b8449f9a84b4378276e6c50

11. Generating Screen...
    ID: cd5d80687537417cba759a7c7c10ea2b

12. Generating Screen...
    ID: d1509de3f2ac458387f4111ae5ab868c

13. Generating Screen...
    ID: a7e3a8d3e77b4a5499d07defb2b7034a

14. Generating Screen...
    ID: 2a487af6abb2445caab2eb2eb0086294

15. Generating Screen...
    ID: 402dfd344cc340d5888dc246d3651b9b

Use a utility like `curl -L` to download the hosted URLs.

## Instruksi Eksekusi Wajib untuk ke-15 Screen Stitch di Atas:

1. **Fetch & Inspect Semua 15 Screen ID**:
   - Karena Screen 2 s.d. Screen 15 disalin saat status teksnya masih "Generating Screen...", ambil metadata terbaru, screenshot, dan kode HTML/Tailwind dari masing-masing Screen ID di atas menggunakan tool Stitch / `curl -L`.
   - Identifikasi fungsi setiap layar dan petakan secara tepat ke route Next.js 16 App Router:
     * `/login` (Halaman Autentikasi NIM / Username / Email)
     * `/dashboard` (Variasi Bento Dashboard untuk `SYSTEM_ADMIN`, `LAB_ADMIN`, `ASSISTANT`, dan `STUDENT`)
     * `/laboratories` & `/laboratories/[labId]` (Manajemen Laboratorium)
     * `/practicums` & `/practicums/[practicumId]` (Katalog Praktikum, Komponen Nilai `GradingComponent`, & Konversi Huruf `GradeLetterMapping`)
     * `/practicums/[practicumId]/classes/[classId]` (Manajemen Kelas, Enrollment Praktikan, & Penugasan Asisten)
     * `/practicums/[practicumId]/classes/[classId]/sessions/[sessionId]` (Workspace Sesi Pertemuan, Modul PDF `SessionMaterial`, & Presensi Bulk `Attendance`)
     * `/submissions` & `/practicums/[practicumId]/submissions` (Pengumpulan Tugas & Slide-over Drawer `SubmissionVersion` `v1`, `v2`, dst.)
     * `/grades` & `/practicums/[practicumId]/grades` (Interactive Spreadsheet Grading Matrix, Publikasi Nilai `PublishedGrade`, & Export `.xlsx`)
     * `/announcements`, `/notifications`, `/users`, `/audit-log`, `/settings`, dan `/profile`.

2. **Konversi Desain Stitch ke Tailwind CSS v4 + `shadcn/ui`**:
   - Ekstrak palet warna, font, border-radius, dan efek visual dari ke-15 screen Stitch ke `src/app/globals.css` menggunakan sintaks Tailwind CSS v4 (`@import "tailwindcss";` dan `@theme inline`). JANGAN membuat `tailwind.config.js`.
   - Ubah elemen HTML statis dari Stitch menjadi komponen `shadcn/ui` yang aksesibel (`SidebarProvider`, `Sidebar`, `Card`, `Tabs`, `Table` + `@tanstack/react-table`, `Sheet`, `Dialog`, `ToggleGroup`, `CommandDialog` `⌘K`, `Badge`, `Sonner`) sambil mempertahankan tampilan visual sesuai desain Stitch.

3. **Wajib Gunakan Fitur Terbaru Next.js 16, Auth.js v5, & Prisma v7 (Jangan Pakai Sintaks Lama!)**:
   - Aktifkan `cacheComponents: true` dan `reactCompiler: true` di `next.config.ts` beserta profil `cacheLife`: `semester_static`, `practicum_catalog`, `session_schedule`, dan `dashboard_stats`.
   - Semua `params`, `searchParams`, `cookies()`, dan `headers()` WAJIB bertipe `Promise` dan diakses dengan `await`.
   - Semua fungsi pembacaan data di `src/server/queries/*.ts` WAJIB memakai `'use cache'` (untuk data bersama) atau `'use cache: private'` (untuk data per-user), ditambah `cacheLife(...)` dan `cacheTag(...)` dari `'next/cache'`.
   - Semua mutasi data di `src/server/actions/*.ts` (`'use server'`) WAJIB memanggil `updateTag('nama-tag')` untuk *read-your-own-writes* dan `revalidateTag('nama-tag', 'max')` untuk revalidasi background.
   - Gunakan `src/proxy.ts` (bukan `middleware.ts`) dengan `auth()` dari Auth.js v5 (`@/lib/auth`) untuk proteksi route berbasis `UserRole`.
   - Gunakan rumus nilai asli: agregasi sesi (`AVERAGE`, `SUM`, `HIGHEST`, `LATEST`) untuk komponen `isPerSession = true`, lalu hitung `weightedScore = (rawScore / maxScore) * weight * 100`.
```

---

## OPSI 2: Prompt Modular Bertahap (6 Tahap untuk Gemini Flash agar Kode Tidak Terpotong)

Jika kamu menggunakan model dengan batas output per respons yang lebih pendek (seperti **Gemini Flash**), jalankan 6 prompt di bawah ini satu per satu secara berurutan:

### Prompt Tahap 1 — Fetch 15 Layar Stitch, Mapping Route, & Setup `globals.css` + Fondasi Next.js 16

```text
Patuhi seluruh aturan di `AGENTS.md`.
1. Ambil gambar dan kode HTML dari Stitch Project **Learning Platform Web App (`12827378863387529883`)** untuk ke-15 Screen ID berikut (gunakan Stitch tool / `curl -L`):
   - `10887000942785304740`
   - `9935fed123d14d32b7bea2ad4dd08352`
   - `a2e8ffe8043446bab001138e26956d22`
   - `e9a4bb6792e1463eb0eeb96093e5bb82`
   - `27b64597ca244d1ba045cfffc8dedfce`
   - `06f48ea46b5f4867ace3e3ac447f3af6`
   - `885351391da64c1c89442048a1714066`
   - `14c9fcddc49140248131a3e5b9a12bfc`
   - `27e3b6f4bb664b529191274755a9e0ab`
   - `f53f5a1f7b8449f9a84b4378276e6c50`
   - `cd5d80687537417cba759a7c7c10ea2b`
   - `d1509de3f2ac458387f4111ae5ab868c`
   - `a7e3a8d3e77b4a5499d07defb2b7034a`
   - `2a487af6abb2445caab2eb2eb0086294`
   - `402dfd344cc340d5888dc246d3651b9b`
2. Tampilkan tabel pemetaan ke-15 Screen ID tersebut ke halaman Next.js 16 App Router.
3. Buatkan kode lengkap untuk:
   - `src/app/globals.css` (Tailwind v4 `@import "tailwindcss";` & `@theme inline` sesuai palet warna dan font dari Stitch Project `12827378863387529883`).
   - `next.config.ts` (`cacheComponents: true`, `reactCompiler: true`, dan 4 profil `cacheLife`).
   - `src/lib/prisma.ts` (Prisma v7 `@prisma/adapter-pg`).
   - `src/types/next-auth.d.ts`, `src/lib/auth.ts` (Auth.js v5 Credentials NIM/Username/Email), `src/app/api/auth/[...nextauth]/route.ts`, dan `src/proxy.ts`.
```

### Prompt Tahap 2 — Generate Halaman Login & App Shell (`Sidebar` + `Header`) dari Layar Stitch

```text
Patuhi seluruh aturan di `AGENTS.md`. Gunakan kode HTML/desain dari layar Login dan Sidebar/Dashboard Shell pada Stitch Project `12827378863387529883` untuk membuat kode lengkap:
1. `src/app/(auth)/login/page.tsx` & `src/components/auth/login-form.tsx` (komponen `shadcn/ui` dengan tampilan visual persis layar Login Stitch, terhubung ke Auth.js v5 `signIn('credentials')`).
2. `src/app/(dashboard)/layout.tsx`, `src/components/layout/app-sidebar.tsx`, dan `src/components/layout/dashboard-header.tsx` (menggunakan `SidebarProvider` shadcn/ui, filter menu berdasarkan `UserRole`, `Breadcrumb` otomatis, `CommandDialog` `⌘K`, dan Popover notifikasi).
```

### Prompt Tahap 3 — Generate Bento Dashboard 4 Role + Cache Components Next.js 16 dari Layar Stitch

```text
Patuhi seluruh aturan di `AGENTS.md`. Gunakan layar Dashboard dari Stitch Project `12827378863387529883` untuk membuat kode lengkap:
1. `src/server/queries/dashboard.queries.ts` dengan `'use cache'` untuk System Admin (`getSystemAdminStats`) dan `'use cache: private'` + `cacheLife('dashboard_stats')` + `cacheTag()` untuk `getLabAdminStats`, `getAssistantStats`, dan `getStudentStats`.
2. `src/app/(dashboard)/dashboard/page.tsx` beserta ke-4 komponen dashboard role (`SystemAdminDashboard`, `LabAdminDashboard`, `AssistantDashboard`, `StudentDashboard`) yang mengadopsi desain kartu, metrik, dan tabel dari Stitch serta dibungkus `<Suspense fallback={<Skeleton />}>`.
```

### Prompt Tahap 4 — Generate Halaman Laboratorium, Katalog Praktikum, & Skema Penilaian dari Layar Stitch

```text
Patuhi seluruh aturan di `AGENTS.md` (termasuk `await params` dan `'use cache'`). Gunakan layar Laboratorium dan Praktikum dari Stitch Project `12827378863387529883` untuk membuat kode lengkap:
1. `src/server/queries/laboratory.queries.ts` & `src/server/actions/laboratory.actions.ts` (CRUD Lab + assign `LAB_ADMIN` + `updateTag('labs')`).
2. `src/server/queries/practicum.queries.ts` & `src/server/actions/practicum.actions.ts` (CRUD Praktikum, konfigurasi `GradingComponent` dengan `aggregationMethod`: `AVERAGE`|`SUM`|`HIGHEST`|`LATEST`, dan `GradeLetterMapping` + `updateTag()`).
3. Halaman UI `/laboratories`, `/practicums`, dan `/practicums/[practicumId]` sesuai desain Stitch.
```

### Prompt Tahap 5 — Generate Workspace Kelas, Sesi Pertemuan, Modul Materi, & Presensi Bulk dari Layar Stitch

```text
Patuhi seluruh aturan di `AGENTS.md`. Gunakan layar Kelas, Sesi, dan Presensi dari Stitch Project `12827378863387529883` untuk membuat kode lengkap:
1. `src/server/queries/session.queries.ts` & `src/server/actions/session.actions.ts` (enrollment praktikan dengan batas `maxStudents`, penugasan asisten, generate sesi 1..N, unggah PDF `SessionMaterial` ke Supabase Storage, dan `saveBulkAttendanceAction` + `updateTag()`).
2. Halaman UI `/practicums/[practicumId]/classes/[classId]` dan `/practicums/[practicumId]/classes/[classId]/sessions/[sessionId]` lengkap dengan `ToggleGroup` status kehadiran (`PRESENT`, `LATE`, `EXCUSED`, `ABSENT`) dan tombol "Tandai Semua Hadir".
```

### Prompt Tahap 6 — Generate Versioning Tugas (`v1`, `v2`), Grading Matrix, Export Excel, & Halaman Admin dari Layar Stitch

```text
Patuhi seluruh aturan di `AGENTS.md`. Gunakan sisa layar pada Stitch Project `12827378863387529883` (Submissions, Grades, Announcements, Users, Audit Log, Settings, Profile) untuk membuat kode lengkap:
1. `src/server/actions/submission.actions.ts` & halaman `/submissions`: *Multi-Version Submission* (`SubmissionVersion` `v1`, `v2`, dst.), deteksi otomatis `LATE` vs `SUBMITTED`, *signed URL* Supabase Storage, dan slide-over `Sheet` drawer untuk review asisten (`ACCEPTED`, `REVISION_REQUESTED`, `REJECTED`).
2. `src/server/services/grading.service.ts`, halaman `/practicums/[practicumId]/grades`, & Route Handler `src/app/api/practicums/[id]/export/grades/route.ts` (`ExcelJS`): tabel *Interactive Grading Matrix*, kalkulasi `weightedScore`, dan tombol **Publish Final Grade** (`PublishedGrade`).
3. Halaman `/announcements`, `/notifications`, `/users` (dengan Bulk Import Excel), `/audit-log` (JSON Diff Viewer), `/settings`, dan `/profile`.
```
