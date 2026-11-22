# Conductor live feed backend contract

The conductor app sends each bus's live location and passenger count to `busLocations/{busId}`. The Admin and commuter maps read these records. Deploy the repository Firestore rules to enable the feed:

```bash
npx firebase-tools deploy --only firestore:rules
```

Assign an active bus to a conductor account in Admin before testing.

## Rules

The `accounts` rule lets a conductor read only their own record, which the app uses to find their bus.

```
match /accounts/{accountId} {
  allow read: if isAdmin() || (signedIn() && resource.data.uid == request.auth.uid);
  allow write: if isAdmin();
}
```

These functions validate the assigned conductor and the live-feed schema:

```
function isConductor() {
  return signedIn()
    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'conductor';
}

// The signed-in conductor is the Active account assigned to this bus.
function isAssignedConductor(busId) {
  let bus = get(/databases/$(database)/documents/buses/$(busId)).data;
  let account = get(/databases/$(database)/documents/accounts/$(bus.get('conductorId', ''))).data;
  return isConductor()
    && bus.get('conductorId', '') != ''
    && account.uid == request.auth.uid
    && account.status == 'Active';
}

function optionalNumber(data, key, low, high) {
  return !(key in data) || (data[key] is number && data[key] >= low && data[key] <= high);
}

function optionalCount(data, key) {
  return !(key in data) || (data[key] is int && data[key] >= 0 && data[key] <= 100000);
}

function validBusLocation(busId) {
  let data = request.resource.data;
  return data.keys().hasOnly([
      'busId', 'source', 'updatedAt',
      'lat', 'lng', 'speed', 'heading', 'accuracy',
      'passengers', 'entries', 'exits', 'nextStopId', 'nextStopName'
    ])
    && data.keys().hasAll(['busId', 'source', 'updatedAt', 'passengers', 'entries', 'exits'])
    && data.busId == busId
    && data.source == 'conductor-phone'
    && data.updatedAt == request.time
    && (('lat' in data) == ('lng' in data))
    && optionalNumber(data, 'lat', -90, 90)
    && optionalNumber(data, 'lng', -180, 180)
    && optionalNumber(data, 'speed', 0, 200)
    && optionalNumber(data, 'heading', 0, 360)
    && optionalNumber(data, 'accuracy', 0, 100000)
    && optionalCount(data, 'passengers')
    && optionalCount(data, 'entries')
    && optionalCount(data, 'exits')
    && (!('nextStopId' in data) || (data.nextStopId is string && data.nextStopId.size() <= 100))
    && (!('nextStopName' in data) || (data.nextStopName is string && data.nextStopName.size() <= 200));
}

function isPublicBusLocation(busId) {
  let data = resource.data;
  return data.keys().hasOnly([
      'busId', 'source', 'updatedAt',
      'lat', 'lng', 'speed', 'heading', 'accuracy',
      'passengers', 'entries', 'exits', 'nextStopId', 'nextStopName'
    ])
    && data.keys().hasAll(['busId', 'source', 'updatedAt'])
    && data.busId == busId;
}
```

**Replace** the `busLocations` match:

```
match /busLocations/{busId} {
  allow read: if isAdmin() || isPublicBusLocation(busId);
  allow create, update: if isAssignedConductor(busId) && validBusLocation(busId);
  allow delete: if false;
}
```

## What the app writes

| Field | Type | Notes |
|---|---|---|
| busId | string | same as the document id |
| source | string | always `conductor-phone` |
| updatedAt | timestamp | server time |
| lat, lng | number | only while phone GPS is on |
| speed | number | km/h |
| heading | number | degrees, 0–359 |
| accuracy | number | GPS accuracy in metres |
| passengers | int | onboard count |
| entries, exits | int | door-camera totals |
| nextStopId, nextStopName | string | from the bus's route |

The rules verify the authenticated conductor against the assigned account and bus before accepting writes. Only records in the public field allowlist are visible to commuter pages; the caller's UID is not stored in the publicly readable location document. The app sends right away when the passenger count changes, and otherwise every 15 seconds, never more often than once every 5 seconds. That's about 4 writes a minute per bus.

## How to check it works

Log in as the assigned conductor and open the Map page. The **Live feed to admin** card should say "Last sent …". If it says "The server refused the update", the rules aren't published or the bus isn't assigned to that conductor.

---

# Conductor SOS → Emergency Logs

The conductor **SOS** button now saves the report to `emergencies/{id}`, which Admin → Emergency Logs already lists. Today only admins can write there, so the conductor app shows **"Report NOT sent. Call operations directly."** until this rule is added.

**Replace** the `emergencies` match:

```
match /emergencies/{emergencyId} {
  allow read, update, delete: if isAdmin();
  allow create: if isAdmin() || isConductorSos(emergencyId);
}
```

**Add** next to the other functions (it reuses `isConductor()` and `isAssignedConductor()` from the live-feed rules above):

```
// A conductor may create one new SOS for the bus they are assigned to. Admin handles it from there.
function isConductorSos(emergencyId) {
  let data = request.resource.data;
  return isConductor()
    && data.keys().hasOnly([
        'id', 'type', 'severity', 'status', 'busId', 'routeId', 'location', 'lat', 'lng',
        'description', 'reportedBy', 'reporterUid', 'source', 'datetime', 'history', 'createdAt'
      ])
    && data.keys().hasAll(['id', 'type', 'severity', 'status', 'busId', 'location', 'description', 'reportedBy', 'reporterUid', 'source', 'datetime', 'history', 'createdAt'])
    && data.id == emergencyId
    && data.status == 'New'
    && data.source == 'conductor-sos'
    && data.reporterUid == request.auth.uid
    && data.severity in ['Critical', 'High', 'Medium', 'Low']
    && data.type is string && data.type.size() <= 60
    && data.description is string && data.description.size() <= 400
    && data.location is string && data.location.size() <= 120
    && data.history is list && data.history.size() == 1
    && data.createdAt == request.time
    && (!('lat' in data) || (data.lat is number && data.lat >= -90 && data.lat <= 90))
    && (!('lng' in data) || (data.lng is number && data.lng >= -180 && data.lng <= 180))
    && isAssignedConductor(data.busId);
}
```

## What the app writes

| Field | Example | Notes |
|---|---|---|
| id | `Xy12…` | same as the document id |
| type | `Medical Emergency` | Admin incident types, plus `Other` |
| severity | `Critical` | Medical, accident, security, fire = Critical; breakdown, harassment, other = High |
| status | `New` | admin changes it afterwards |
| busId, routeId | `BUS-001`, `NCR 0001` | conductor's assigned bus and route |
| location | `14.65432, 121.04321 (phone GPS)` | or `Unavailable (phone GPS off)` |
| lat, lng | numbers | only when GPS is on |
| description | text | up to 300 characters from the conductor |
| reportedBy | conductor's name | |
| reporterUid | Firebase uid | must match the signed-in user |
| source | `conductor-sos` | |
| datetime | ISO time | same format Admin uses |
| history | `[{ status: 'New', at, by }]` | |
| createdAt | server time | |

A conductor must have an assigned bus to send an SOS. Without one the rule refuses it, and the app tells them to call operations.
