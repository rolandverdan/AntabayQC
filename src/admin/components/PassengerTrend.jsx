import Card from './Card.jsx'

export default function PassengerTrend({ locations = [] }) {
  const reporting = locations.filter((location) => typeof location.passengers === 'number' && Number.isFinite(location.passengers))
  const passengers = reporting.reduce((total, location) => total + location.passengers, 0)

  return (
    <Card title="Passenger counts">
      {reporting.length ? (
        <div className="rounded-lg bg-slate-50 p-4">
          <p className="text-2xl font-bold text-navy">{passengers}</p>
          <p className="text-sm text-slate-500">Passengers reported across {reporting.length} bus{reporting.length === 1 ? '' : 'es'}.</p>
        </div>
      ) : (
        <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">No passenger-counter feed is connected, so live counts and historical trends are unavailable.</p>
      )}
      <p className="mt-3 text-xs text-slate-500">Counts are shown only when supplied by a connected counter.</p>
    </Card>
  )
}
