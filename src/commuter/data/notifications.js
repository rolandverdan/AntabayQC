import { Bell, Clock3, MapPinned, ShieldCheck } from 'lucide-react'

// Shared by the header bell, the Home "Latest updates" card and the Notifications page.
export const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    category: 'Service update',
    title: 'Route 2 delay expected',
    detail: 'Traffic congestion near Quezon Memorial Circle may affect arrivals by 8 to 12 minutes this afternoon.',
    time: '2 mins ago',
    icon: Clock3,
    tone: 'amber',
    unread: true,
  },
  {
    id: 2,
    category: 'Safety alert',
    title: 'Weather advisory',
    detail: 'Light rain is expected along Commonwealth and Katipunan corridors. Please allow extra time for boarding.',
    time: '1 hour ago',
    icon: ShieldCheck,
    tone: 'blue',
    unread: true,
  },
  {
    id: 3,
    category: 'Travel update',
    title: 'Bus stop temporarily rerouted',
    detail: 'Stop at Batasan Road will be temporarily moved to the adjacent curb due to road repair works.',
    time: 'Today, 8:45 AM',
    icon: MapPinned,
    tone: 'green',
    unread: false,
  },
  {
    id: 4,
    category: 'Important',
    title: 'Report status update',
    detail: 'Your lost item report has been reviewed and the operations desk has assigned a follow-up team to check the terminal desk.',
    time: 'Yesterday',
    icon: Bell,
    tone: 'red',
    unread: true,
  },
]

export const TONE_CLASSES = {
  amber: 'bg-amber-100 text-amber-700',
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
}
