# ANTABAY QC: unified Admin, Conductor and Commuter app

One React + Vite + Tailwind CSS 4 app. Admin is desktop-first; Conductor and Commuter are mobile-first. Email/password and Google sign-in use Firebase Authentication; most of the other app data is still demonstration data.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

## Login and routes

There is **one login page** at `/`. Each account belongs to a role, and the role decides where it opens.
(Old paths such as `/admin/login` and `/login/*` redirect to `/`.) The login also has a **Continue as guest commuter** button.
Commuters can create Firebase accounts at `/signup` or sign in with Google from the login page. Google sign-in creates the Firebase account on the first successful login.

| Account | Username | Password | Opens |
|---|---|---|---|
| Admin | `admin` or `admin@antabayqc.com` | `Admin123!` | `/admin/dashboard` |
| Conductor | `lourdes.garcia` or `conductor` | `Conductor123!` | `/conductor/dashboard` (the live map) |
| Commuter | `commuter` | `Commuter123!` | `/commuter/home` |

All three sides share the Admin sidebar (icon-only, expands on hover, pin button in the header, drawer on phones) and the Admin header.

## Security note

Firebase Authentication verifies email/password and Google sign-ins. Each signed-in Firebase account is routed according to its Firestore `users/{uid}.role` (`commuter`, `conductor`, or `admin`); legacy demo credentials remain available for frontend testing. The UI route guards are client-side only and are not a security boundary. Protect any real admin/conductor data with trusted server-side authorization (for example, Firebase custom claims and corresponding security rules). Only one role can be active in the UI at a time.

Before testing Firebase sign-in, enable **Email/Password** and **Google** under Firebase Console → Authentication → Sign-in method, add the app's local/deployed host to Authorized domains, and create a Firestore database. Publish the included `firestore.rules` in Firestore's Rules tab. Each Firebase user gets a `users/{uid}` document with `role: "commuter"` by default. To change it manually, open Firestore Data → `users` → the user's document and edit `role` to `commuter`, `conductor`, or `admin`. A Firestore document alone does not create login credentials: the account must also exist in Firebase Authentication → Users. Changing the role controls which frontend area opens, but production authorization requires trusted server-side authorization (such as custom claims and matching security rules).

Firebase client configuration is in `src/firebase/firebase.js`; auth operations and user-profile helpers are grouped in `src/firebase/`. The phone number is saved to the user's Firestore profile and mirrored in this browser's commuter settings.

## Structure

- `src/admin/` Admin side (unchanged apart from login, guard redirect and logout destination)
- `src/conductor/` Conductor side merged from the separate project (uses the shared Admin sidebar and header)
- `src/commuter/` Commuter side (Admin sidebar and header, `CommuterContext`)
- `src/shared/` Shared `AuthShell` (login layout), `BrandBackdrop` (the Quezon Memorial Circle image treatment), `Logo`
- `src/pages/Login.jsx` The single login for all roles
- `src/firebase/` Firebase initialization and authentication operations

## Assets

- Circular image: `public/images/quezon-memorial-circle.png`, used on the login page
- Logo: `public/images/antabay-qc-logo.svg` (multi-colour, so it sits on a white tile over blue backgrounds)

All bus, route, position and arrival data is demonstration data. Nothing is live GPS.
