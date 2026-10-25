# ANTABAY QC: unified Admin, Conductor and Commuter app

One React + Vite + Tailwind CSS 4 frontend (no backend). Admin is desktop-first; Conductor and Commuter are mobile-first.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

## Login and routes

There is **one login page** at `/`. Each account belongs to a role, and the role decides where it opens.
(Old paths such as `/admin/login` and `/login/*` redirect to `/`.) The login also has a **Continue as guest commuter** button.

| Account | Username | Password | Opens |
|---|---|---|---|
| Admin | `admin` or `admin@antabayqc.com` | `Admin123!` | `/admin/dashboard` |
| Conductor | `lourdes.garcia` or `conductor` | `Conductor123!` | `/conductor/dashboard` (the live map) |
| Commuter | `commuter` | `Commuter123!` | `/commuter/home` |

All three sides share the Admin sidebar (icon-only, expands on hover, pin button in the header, drawer on phones) and the Admin header.

## Security note

Authentication and route guards are **simulated in the browser** (`sessionStorage` / `localStorage` flags). They only
keep the demo flow tidy; they are not secure and cannot protect real data. A real deployment needs server-side
authentication and authorization. Only one role can be signed in at a time: signing in as one role signs the others out.

## Structure

- `src/admin/` Admin side (unchanged apart from login, guard redirect and logout destination)
- `src/conductor/` Conductor side merged from the separate project (uses the shared Admin sidebar and header)
- `src/commuter/` Commuter side (Admin sidebar and header, `CommuterContext`)
- `src/shared/` Shared `AuthShell` (login layout), `BrandBackdrop` (the Quezon Memorial Circle image treatment), `Logo`
- `src/pages/Login.jsx` The single login for all roles

## Assets

- Circular image: `public/images/quezon-memorial-circle.png`, used on the login page
- Logo: `public/images/antabay-qc-logo.svg` (multi-colour, so it sits on a white tile over blue backgrounds)

All bus, route, position and arrival data is demonstration data. Nothing is live GPS.
