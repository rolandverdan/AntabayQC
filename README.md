# ANTABAY QC: unified Admin, Conductor and Commuter app

One React + Vite + Tailwind CSS 4 app. Admin is desktop-first; Conductor and Commuter are mobile-first. Admin records and sign-in use Firebase; the Conductor and Commuter experiences still contain demo data outside the report-submission flow.

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
| Firebase Admin | Administrator account created in Firebase Authentication with Firestore role `admin` | Set in Firebase Authentication | `/admin/dashboard` |
| Conductor | Created from Admin → Accounts | Set when the account is created | `/conductor/map` |
| Driver | Admin-managed staff record; no sign-in account | — | — |
| Commuter | `commuter` | `Commuter123!` | `/commuter/home` |

All three sides share the Admin sidebar (icon-only, expands on hover, pin button in the header, drawer on phones) and the Admin header.

## Admin database setup

The Admin console uses Firestore as its source of truth. It starts with **empty** buses, routes, stops, accounts, reports, emergencies, and logs; no sample records are copied from browser storage. Firestore collections are created automatically when the first record is saved (Firestore has collections/documents, not SQL tables).

1. In the `antabayqc` Firebase project, enable Email/Password sign-in and create a Firestore database.
2. Create the first administrator in Firebase Authentication. In Firestore, create `users/{that-auth-user-uid}` with `displayName`, `email`, `phone`, and `role: "admin"` (plus `createdAt` and `updatedAt` timestamps). Admin roles must be assigned by a trusted administrator; users cannot grant themselves admin access.
3. From the repository root, install the app and Functions dependencies, sign in to Firebase, and deploy:

   ```bash
   npm install
   npm run install:functions
   npx firebase login
   npm run deploy
   ```

   `npm run deploy` builds the Vite app and deploys Hosting, Firestore rules, and Cloud Functions. On the Spark plan, deploy the web app and rules without Functions using `npm run deploy:app`. To deploy only Hosting, run `npm run deploy:hosting`; to deploy only rules or Functions, use `npm run deploy:rules` or `npm run deploy:functions`. Cloud Functions deployment requires a Firebase plan that supports Functions. Functions run on Node.js 22.
4. Sign in with the administrator account. Create routes first, then add bus stops and select the route or routes they serve; stops are appended in creation order. Assign a route to each bus from Create Buses, then add staff. Driver entries are directory-only. Creating a Conductor also creates a Firebase Authentication account through a callable Cloud Function.

Collections used by the Admin console: `buses`, `routes`, `stops`, `accounts`, `reports`, `emergencies`, `logs`, `adminSettings`, and `busLocations`. Bus, route, stop, and live bus-location records are readable by commuter pages; administrative records are restricted by `firestore.rules`. Signed-in commuters can submit reports and read only reports they submitted.

The Admin Live Bus Map and commuter Live Tracking use conductor GPS records in `busLocations`; they do not simulate vehicle movement. A conductor must be assigned to an active bus and enable phone GPS before a location is published. Locations are visible to commuter pages only while their report is recent; stale positions are hidden. Speed and passenger counts are shown only when provided by the feed, and arrival-time estimates are not available. Emergency records can be entered manually in Admin → Emergency Logs; no dispatch service is connected.

## Security note

Firebase Authentication verifies email/password and Google sign-ins. Each signed-in Firebase account is routed according to its Firestore `users/{uid}.role` (`commuter`, `conductor`, or `admin`). The Admin UI route guard is not a security boundary; Firestore rules and callable functions enforce administrator access. The first admin profile must be assigned in the Firebase console by a trusted project owner.

Before testing sign-in, add the app's local/deployed host to Firebase Authentication → Authorized domains. New commuter accounts get a `users/{uid}` document with `role: "commuter"` by default. Staff sign-ins are created by the deployed callable functions; a Firestore user document alone does not create login credentials.

Firebase client configuration is in `src/firebase/firebase.js`; auth operations and user-profile helpers are grouped in `src/firebase/`. The phone number is saved to the user's Firestore profile and mirrored in this browser's commuter settings.

## Structure

- `src/admin/` Admin pages, Firebase-backed data context, account management and role-protected routes
- `src/conductor/` Conductor side merged from the separate project (uses the shared Admin sidebar and header)
- `src/commuter/` Commuter side (Admin sidebar and header, `CommuterContext`)
- `src/shared/` Shared `AuthShell` (login layout), `BrandBackdrop` (the Quezon Memorial Circle image treatment), `Logo`
- `src/pages/Login.jsx` The single login for all roles
- `src/firebase/` Firebase initialization and authentication operations

## Assets

- Circular image: `public/images/quezon-memorial-circle.png`, used on the login page
- Logo: `public/images/antabay-qc-logo.svg` (multi-colour, so it sits on a white tile over blue backgrounds)

The conductor map has no simulated vehicle movement or location fallback. It requests phone/browser GPS only after the conductor taps **Enable phone GPS**; without a current location, coordinates, speed, and next stop are unavailable. Location access requires a supported browser and a secure context (normally HTTPS). When the conductor has an active bus assignment and the deployed Firestore rules permit it, the app uploads coordinates and the available trip data to `busLocations` for the Admin and commuter maps. The route and stop assignments are managed in Admin; the next stop is estimated against that route and is not road-snapped navigation. The passenger count comes from the experimental browser counter described below and is sent with the live feed.

The conductor Camera page has an experimental in-browser passenger counter using TensorFlow.js COCO-SSD person detection. It can use two different camera devices exposed to the browser, track detections across a configurable doorway line, and store the onboard count on that device. The starting count is conductor-entered; video is processed locally and is not uploaded. The model weights download on first use, requiring an internet connection. The V720 app feed is not integrated, and this prototype cannot access it unless a camera is independently exposed to the browser. Person detection is approximate and must be validated against manual counts before operational use; the displayed sample route/vehicle assignments are not connected to a dispatcher.
