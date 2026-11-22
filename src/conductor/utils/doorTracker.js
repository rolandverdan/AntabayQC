// Doorway person tracker used by the Camera page. Pure functions (no React), so they can be
// tested by replaying recorded walks. Positions are fractions of the frame (0..1).

export const MIN_SCORE = 0.4 // person confidence; fast walkers are blurred and score lower
const MATCH_RADIUS = 0.35 // how far a person may be from where we expected them and still be the same track
export const TRACK_TTL_MS = 1200 // keep a lost track this long so a brief miss does not split one walk into two people
const LINE_DEAD_ZONE = 0.05 // band around the line where the side is undecided (prevents jitter double-counts)
const SMOOTHING = 0.7 // weight of the newest position; lower values lag behind fast walkers
const CONFIRM_CHECKS = 2 // a person must be seen on the new side this many checks in a row…
const CONFIRM_MS = 150 // …and for at least this long before a crossing counts (ignores one-frame bounces)
const EXIT_MARGIN = 0.1 // a person who vanishes at least this far past the line is counted as having crossed
const MIN_HITS_FOR_EXIT_COUNT = 3 // …but only if they were tracked for a few checks first (not a stray box)
const MAX_PREDICT_MS = 600 // never extrapolate motion further than this
const MAX_BOX_SPAN = 0.85 // a box wider (vertical line) / taller (horizontal line) than this fills nearly the whole
// picture (someone right at the lens); its centre says little about which side they are on, so it is not trusted

const along = (point, orientation) => (orientation === 'horizontal' ? point.y : point.x)

export function sideOfLine(point, orientation) {
  const coordinate = along(point, orientation)
  if (coordinate <= 0.5 - LINE_DEAD_ZONE) return 0
  if (coordinate >= 0.5 + LINE_DEAD_ZONE) return 1
  return null
}

export function isTrustedBox(person, orientation) {
  return (orientation === 'horizontal' ? person.height : person.width) <= MAX_BOX_SPAN
}

export function newTrack(id, center, orientation, now, trusted = true) {
  return {
    id,
    x: center.x,
    y: center.y,
    rx: center.x,
    ry: center.y,
    vx: 0,
    vy: 0,
    side: trusted ? sideOfLine(center, orientation) : null,
    seenAt: now,
    hits: 1,
    pendingSide: null,
    pendingCount: 0,
  }
}

// Where the person should be now, continuing at their last speed (fast walkers move a lot
// between two checks, especially on slow phones).
function predict(track, now) {
  const dt = Math.min(MAX_PREDICT_MS, Math.max(0, now - track.seenAt))
  return { x: track.rx + track.vx * dt, y: track.ry + track.vy * dt }
}

// Pair each detected person with the track whose predicted position is nearest, closest pairs first.
export function matchToTracks(centers, tracks, now) {
  const predicted = tracks.map((track) => predict(track, now))
  const pairs = []
  centers.forEach((center, personIndex) => {
    predicted.forEach((expected, trackIndex) => {
      // Closest of "where they were" and "where they were heading": prediction helps fast
      // walkers, but a jittery box can make it overshoot, so it never makes a match worse.
      // The "where they were" option only applies to tracks seen a moment ago; otherwise a person
      // who already walked through would steal the next person arriving behind them.
      const last = tracks[trackIndex]
      const fresh = now - last.seenAt <= 300
      const distance = Math.min(
        Math.hypot(center.x - expected.x, center.y - expected.y),
        fresh ? Math.hypot(center.x - last.rx, center.y - last.ry) : Infinity,
      )
      if (distance < MATCH_RADIUS) pairs.push({ personIndex, trackIndex, distance })
    })
  })
  pairs.sort((a, b) => a.distance - b.distance)
  const trackForPerson = new Map()
  const usedTracks = new Set()
  for (const { personIndex, trackIndex } of pairs) {
    if (trackForPerson.has(personIndex) || usedTracks.has(trackIndex)) continue
    trackForPerson.set(personIndex, trackIndex)
    usedTracks.add(trackIndex)
  }
  return { trackForPerson, usedTracks }
}

// Advance one track by one check. Returns the updated track and, if a crossing was confirmed,
// the side the person came from.
export function stepTrack(track, rawCenter, orientation, now, trusted = true) {
  const dt = Math.max(1, now - track.seenAt)
  const x = track.x + (rawCenter.x - track.x) * SMOOTHING
  const y = track.y + (rawCenter.y - track.y) * SMOOTHING
  const next = {
    ...track,
    x,
    y,
    rx: rawCenter.x,
    ry: rawCenter.y,
    vx: track.vx * 0.5 + ((rawCenter.x - track.rx) / dt) * 0.5,
    vy: track.vy * 0.5 + ((rawCenter.y - track.ry) / dt) * 0.5,
    seenAt: now,
    hits: track.hits + 1,
    trustedLast: trusted,
  }
  const side = trusted ? sideOfLine({ x, y }, orientation) : null
  let crossedFrom = null

  if (side === null) return { track: next, crossedFrom }
  if (track.side === null) return { track: { ...next, side, pendingSide: null, pendingCount: 0 }, crossedFrom }
  if (side === track.side) return { track: { ...next, pendingSide: null, pendingCount: 0 }, crossedFrom }

  const pendingCount = track.pendingSide === side ? track.pendingCount + 1 : 1
  const pendingSince = track.pendingSide === side ? track.pendingSince : now
  if (pendingCount >= CONFIRM_CHECKS && now - pendingSince >= CONFIRM_MS) {
    crossedFrom = track.side
    return { track: { ...next, side, pendingSide: null, pendingCount: 0 }, crossedFrom }
  }
  return { track: { ...next, pendingSide: side, pendingCount, pendingSince }, crossedFrom }
}

// A fast walker often leaves the picture right after crossing, before the live confirmation
// finishes. When their track expires, count the crossing if they ended clearly on the other side.
export function finishTrack(track, orientation) {
  if (track.side === null) return null
  if (track.pendingSide !== null && track.pendingSide !== track.side && track.pendingCount >= CONFIRM_CHECKS) {
    return track.side
  }
  if (track.hits < MIN_HITS_FOR_EXIT_COUNT || track.trustedLast === false) return null
  const last = along({ x: track.rx, y: track.ry }, orientation)
  const velocity = orientation === 'horizontal' ? track.vy : track.vx
  const farSide = track.side === 0 ? last >= 0.5 + EXIT_MARGIN : last <= 0.5 - EXIT_MARGIN
  const movingThatWay = track.side === 0 ? velocity > 0 : velocity < 0
  return farSide && movingThatWay ? track.side : null
}
