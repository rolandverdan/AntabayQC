# Backend request: conductor live feed

**For:** whoever owns `firestore.rules`
**Why:** the conductor app sends each bus's live location and passenger count to `busLocations/{busId}`, which the admin Dashboard and Live Map already read. The current rules block it.

## What to do

1. Add the rules below to `firestore.rules`.
2. Publish: `firebase deploy --only firestore:rules`
3. In the admin pages, assign a bus (with a capacity) to a conductor account.

## Rules

**Replace** the `accounts` match. A conductor can read only their own record, which the app uses to find their bus.

```
match /accounts/{accountId} {
  allow read: if isAdmin() || (signedIn() && resource.data.uid == request.auth.uid);
  allow write: if isAdmin();
}
```

**Add** these functions next to `isAdmin()`:

```
function isConductor() {
  return signedIn()
    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'conductor';
}

// The signed-in conductor is the Active account assigned to this bus.
function isAssignedConductor(busId) {
  let bus = get(/databases/$(database)/documents/buses/$(busId)).data;
  let account = get(/databases/$(database)/documents/accounts/$(bus.conductorId)).data;
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
      'busId', 'conductorUid', 'source', 'updatedAt',
      'lat', 'lng', 'speed', 'heading', 'accuracy',
      'passengers', 'entries', 'exits', 'nextStopId', 'nextStopName'
    ])
    && data.busId == busId
    && data.conductorUid == request.auth.uid
    && data.source == 'conductor-phone'
    && data.updatedAt == request.time
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
```

**Replace** the `busLocations` match:

```
match /busLocations/{busId} {
  allow read: if isAdmin() || isAssignedConductor(busId);
  allow create, update: if isAssignedConductor(busId) && validBusLocation(busId);
  allow delete: if false;
}
```

## What the app writes

| Field | Type | Notes |
|---|---|---|
| busId | string | same as the document id |
| conductorUid | string | sender's Firebase Auth uid |
| source | string | always `conductor-phone` |
| updatedAt | timestamp | server time |
| lat, lng | number | only while phone GPS is on |
| speed | number | km/h |
| heading | number | degrees, 0–359 |
| accuracy | number | GPS accuracy in metres |
| passengers | int | onboard count |
| entries, exits | int | door-camera totals |
| nextStopId, nextStopName | string | from the bus's route |

The app sends right away when the passenger count changes, and otherwise every 15 seconds, never more often than once every 5 seconds. That's about 4 writes a minute per bus.

## How to check it works

Log in as the assigned conductor and open the Map page. The **Live feed to admin** card should say "Last sent …". If it says "The server refused the update", the rules aren't published or the bus isn't assigned to that conductor.
