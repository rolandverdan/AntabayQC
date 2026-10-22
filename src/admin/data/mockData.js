// Bus stop coordinates are approximate (schematic), not surveyed positions.
// No GPS device, driver, passenger or emergency service is connected to this data.

const ago = (minutes) => new Date(Date.now() - minutes * 60000).toISOString()

export const defaultSettings = {
  name: 'Maria Santos',
  email: 'admin@antabayqc.com',
  phone: '09171230000',
  role: 'System Administrator',
  notifications: { emergency: true, reports: true, logs: false, emailDigest: false },
  showMapPreview: true,
  showRecentActivity: true,
  pageSize: 8,
  density: 'comfortable',
  sidebarCollapsed: false,
}

// ---------------------------------------------------------------------------
// QC Bus (Quezon City Bus Service) – 8 routes, based on the official QC Bus
// route map. Stop NAMES / ORDER follow the poster; COORDINATES ARE APPROXIMATE
// (schematic) and should be replaced with surveyed positions before real use.
// ---------------------------------------------------------------------------
const STOP_DEFS = [
  // slug, name, address, lat, lng
  ['hall', 'Quezon City Hall', 'Elliptical Rd, Diliman (Terminal)', 14.6465, 121.0502],

  // Route 1 – Cubao
  ['kalayaan-masigla', 'Kalayaan Ave cor. Masigla St', 'Kalayaan Ave, Diliman', 14.6402, 121.0548],
  ['kalayaan-kamias', 'Kalayaan Ave cor. Kamias Rd (Interchange)', 'Kalayaan Ave cor. Kamias Rd', 14.6322, 121.0560],
  ['silangan', 'Barangay Silangan Hall', 'Silangan, Cubao', 14.6240, 121.0565],
  ['cubao', 'Araneta City, Cubao', 'General Roxas Ave, Cubao (Terminal)', 14.6208, 121.0530],
  ['aurora-15th', '15th Ave cor. Aurora Blvd', 'Aurora Blvd, Cubao', 14.6225, 121.0600],

  // Route 2 – Litex / IBP Road
  ['commonwealth-stpeter', 'Commonwealth Ave (St. Peter Parish Church)', 'Commonwealth Ave, Holy Spirit', 14.6690, 121.0770],
  ['ibp-maclang', 'IBP Rd. Maclang General Hospital', 'IBP Rd, Batasan Hills', 14.6830, 121.0945],
  ['ibp-qcu', 'IBP Rd. QCU – Batasan Hills', 'IBP Rd, Batasan Hills', 14.6985, 121.1050],
  ['litex', 'Litex / IBP Road', 'Litex Rd, Payatas (Terminal)', 14.7080, 121.1160],

  // Route 3 – Welcome Rotonda to Aurora-Katipunan
  ['rotonda', 'Welcome Rotonda', 'Quezon Ave cor. E. Rodriguez Sr. (Terminal)', 14.6187, 120.9990],
  ['erod-araneta', 'E. Rodriguez Sr. Ave cor. Araneta Ave', 'E. Rodriguez Sr. Ave', 14.6213, 121.0035],
  ['erod-qi', 'E. Rodriguez Sr. Ave (Quezon Institute)', 'E. Rodriguez Sr. Ave', 14.6236, 121.0078],
  ['erod-nch', "E. Rodriguez Sr. Ave (St. Luke's / National Children's Hospital)", 'E. Rodriguez Sr. Ave', 14.6240, 121.0210],
  ['gilmore-interchange', 'E. Rodriguez Sr. Ave cor. Gilmore (Interchange)', 'E. Rodriguez Sr. Ave cor. Gilmore Ave', 14.6190, 121.0335],
  ['kamuning-market', 'Kamuning Rd. (Delgado Hospital / Kamuning Market)', 'Kamuning Rd, Kamuning', 14.6285, 121.0425],
  ['kamias-edsa', 'Kamias Rd. cor. EDSA', 'Kamias Rd, Kamuning', 14.6335, 121.0475],
  ['kamias-anonas', 'Kamias Rd. cor. Anonas Rd.', 'Kamias Rd, Project 3', 14.6330, 121.0562],
  ['anonas-chico', 'Anonas Rd. cor. Chico St.', 'Anonas Rd, Project 3', 14.6305, 121.0598],
  ['anonas-lrt', 'Aurora Blvd. LRT-2 Anonas Station', 'Aurora Blvd, Project 3', 14.6280, 121.0640],
  ['aurora-katipunan', 'Aurora-Katipunan (Interchange)', 'Aurora Blvd cor. Katipunan Ave (Terminal)', 14.6307, 121.0733],

  // Route 4 / 5 shared corridor – Mindanao Ave
  ['north-vertis', 'North Ave. Veterans Hospital / Vertis North', 'North Ave, Bagong Pag-asa', 14.6552, 121.0375],
  ['mindanao-road1', 'Mindanao Ave. cor. Road 1', 'Mindanao Ave, Bagong Pag-asa', 14.6590, 121.0395],
  ['tullahan', 'Mindanao Ave. (Tullahan Bridge)', 'Mindanao Ave, Tullahan', 14.6628, 121.0398],
  ['mindanao-congressional', 'Mindanao Ave. cor. Congressional Ave.', 'Mindanao Ave, Pag-ibig sa Nayon', 14.6685, 121.0405],
  ['mindanao-tandangsora', 'Mindanao Ave. cor. Tandang Sora Ave.', 'Mindanao Ave, Tandang Sora', 14.6755, 121.0390],
  ['mindanao-munoz', 'Mindanao Ave. cor. D. Muñoz St.', 'Mindanao Ave, Tandang Sora', 14.6820, 121.0385],
  ['mindanao-sauyo', 'Mindanao Ave. cor. Old Sauyo Rd.', 'Mindanao Ave, Sauyo', 14.6885, 121.0368],
  ['mindanao-quirino', 'Mindanao Ave. cor. Quirino Highway', 'Mindanao Ave cor. Quirino Hwy', 14.6960, 121.0330],

  // Route 4 – General Luis Avenue
  ['qcu-novaliches', 'Quezon City University – Main Campus / Novaliches District Hospital', 'Quirino Highway, San Bartolome', 14.7080, 121.0345],
  ['sm-novaliches', 'Quirino Highway (SM Novaliches)', 'Quirino Highway, Novaliches', 14.7237, 121.0377],
  ['quirino-foresthills', 'Quirino Highway cor. Forest Hills Drive', 'Quirino Highway, Novaliches', 14.7310, 121.0400],
  ['genluis-banahaw', 'Gen. Luis cor. Banahaw St.', 'General Luis Ave, Novaliches', 14.7385, 121.0322],
  ['genluis', 'Gen. Luis / Nova Bayan', 'General Luis Ave, Novaliches (Terminal)', 14.7400, 121.0360],

  // Route 5 – Mindanao Avenue
  ['visayas-central', 'Visayas Ave. cor. Central Ave.', 'Visayas Ave, Central', 14.6595, 121.0505],
  ['visayas-vargas', 'Visayas Ave. cor. Vargas St.', 'Visayas Ave, Vasra', 14.6650, 121.0500],
  ['congressional-visayas', 'Congressional Ave. cor. Visayas Ave.', 'Congressional Ave, Project 8', 14.6685, 121.0482],
  ['congressional-circle', 'Congressional Ave. (Circle C)', 'Congressional Ave, Project 8', 14.6705, 121.0435],
  ['sauyo-footbridge', 'Old Sauyo Rd. Footbridge', 'Old Sauyo Rd, Sauyo', 14.6910, 121.0365],
  ['mindanao-terminal', 'Mindanao Ave. cor. Quirino Hwy (Terminal)', 'Mindanao Ave cor. Quirino Hwy', 14.6962, 121.0326],

  // Route 6 – Gilmore Avenue
  ['quezon-pcmc', "Quezon Ave. (Philippine Children's Medical Center)", 'Quezon Ave, Diliman', 14.6445, 121.0415],
  ['quezon-edsa', 'Quezon Ave. EDSA (Ibabaw)', 'Quezon Ave cor. EDSA', 14.6420, 121.0370],
  ['quezon-examiner', 'Quezon Ave. cor. Examiner St.', 'Quezon Ave, West Triangle', 14.6395, 121.0330],
  ['quezon-delta', 'Quezon Ave. (Delta)', 'Quezon Ave, Delta', 14.6385, 121.0290],
  ['tobias-timog', 'Sct. Tobias cor. Timog Ave.', 'Sct. Tobias St, Laging Handa', 14.6350, 121.0260],
  ['tobias-roces', 'Sct. Tobias cor. A. Roces Ave.', 'Sct. Tobias St, Laging Handa', 14.6310, 121.0250],
  ['gilmore-end', 'Hemady St.', 'Gilmore Ave, New Manila (Terminal)', 14.6140, 121.0350],

  // Route 7 – Ortigas Avenue
  ['cp-garcia', 'C. P. Garcia Ave. (Krus Na Ligas)', 'C. P. Garcia Ave, UP Diliman', 14.6545, 121.0665],
  ['katipunan-stamaria', 'Katipunan Ave. (Sta. Maria Della Strada Parish)', 'Katipunan Ave, White Plains', 14.6470, 121.0745],
  ['katipunan-ateneo', 'Katipunan Ave. (Ateneo de Manila Gate 3)', 'Katipunan Ave, Loyola Heights', 14.6370, 121.0765],
  ['katipunan-quirino', 'Katipunan Ave. cor. P. Tuazon (Quirino Memorial Medical Center)', 'Katipunan Ave, Blue Ridge', 14.6240, 121.0750],
  ['katipunan-boni', 'Katipunan Ave. cor. Boni Serrano', 'Katipunan Ave, Libis', 14.6140, 121.0740],
  ['erodjr-eastwood', 'E. Rodriguez Jr. Ave. / Eastwood City', 'E. Rodriguez Jr. Ave, Libis', 14.6097, 121.0785],
  ['erodjr-greenmeadows', 'E. Rodriguez Jr. Ave. cor. Green Meadows Ave.', 'E. Rodriguez Jr. Ave, Bagumbayan', 14.6035, 121.0795],
  ['ortigas', 'Ortigas Avenue', 'Ortigas Ave, Quezon City (Terminal)', 14.5940, 121.0790],

  // Route 8 – Muñoz
  ['north-vertis-south', 'North Ave. (Vertis South)', 'North Ave, Bagong Pag-asa', 14.6532, 121.0388],
  ['qcu-sanfrancisco', 'QCU San Francisco', 'San Francisco del Monte', 14.6520, 121.0345],
  ['corregidor-ilocos', 'Corregidor St. cor. Ilocos Sur St.', 'Corregidor St, Bago Bantay', 14.6535, 121.0310],
  ['magsaysay-brgy', 'Ramon Magsaysay Barangay Hall', 'Ramon Magsaysay Ave, Bago Bantay', 14.6580, 121.0288],
  ['pma', 'Philippine Medical Association', 'Ramon Magsaysay Ave, Bago Bantay', 14.6625, 121.0310],
  ['munoz', 'Congressional Ave. cor. Abra St. (Muñoz)', 'Congressional Ave, Muñoz (Terminal)', 14.6650, 121.0345],
]

const STOP_ID = Object.fromEntries(STOP_DEFS.map(([slug], i) => [slug, `S-${String(i + 1).padStart(3, '0')}`]))

const stops = STOP_DEFS.map(([slug, name, address, lat, lng]) => ({
  id: STOP_ID[slug], name, address, lat, lng, status: 'Active',
}))

// Colours follow the QC Bus poster (Route 1 red … Route 8 light blue).
const routes = [
  ['R-01', 'QC Hall – Cubao', '#E4264B', ['hall', 'kalayaan-masigla', 'kalayaan-kamias', 'silangan', 'aurora-15th', 'cubao']],
  ['R-02', 'QC Hall – Litex / IBP Road', '#E6168E', ['hall', 'commonwealth-stpeter', 'ibp-maclang', 'ibp-qcu', 'litex']],
  ['R-03', 'Welcome Rotonda – Aurora-Katipunan', '#E8B800', ['rotonda', 'erod-araneta', 'erod-qi', 'erod-nch', 'gilmore-interchange', 'kamuning-market', 'kamias-edsa', 'kamias-anonas', 'anonas-chico', 'anonas-lrt', 'aurora-katipunan']],
  ['R-04', 'QC Hall – General Luis Avenue', '#7A2E8E', ['hall', 'north-vertis', 'mindanao-road1', 'tullahan', 'mindanao-congressional', 'mindanao-tandangsora', 'mindanao-munoz', 'mindanao-sauyo', 'mindanao-quirino', 'qcu-novaliches', 'sm-novaliches', 'quirino-foresthills', 'genluis-banahaw', 'genluis']],
  ['R-05', 'QC Hall – Mindanao Avenue', '#F28C1E', ['hall', 'visayas-central', 'visayas-vargas', 'congressional-visayas', 'congressional-circle', 'mindanao-congressional', 'mindanao-tandangsora', 'mindanao-munoz', 'sauyo-footbridge', 'mindanao-terminal']],
  ['R-06', 'QC Hall – Gilmore Avenue', '#1FA34A', ['hall', 'quezon-pcmc', 'quezon-edsa', 'quezon-examiner', 'quezon-delta', 'tobias-timog', 'tobias-roces', 'gilmore-interchange', 'gilmore-end']],
  ['R-07', 'QC Hall – Ortigas Avenue', '#1566B8', ['hall', 'cp-garcia', 'katipunan-stamaria', 'katipunan-ateneo', 'aurora-katipunan', 'katipunan-quirino', 'katipunan-boni', 'erodjr-eastwood', 'erodjr-greenmeadows', 'ortigas']],
  ['R-08', 'QC Hall – Muñoz', '#2BA8E8', ['hall', 'north-vertis-south', 'qcu-sanfrancisco', 'corregidor-ilocos', 'magsaysay-brgy', 'pma', 'munoz']],
].map(([id, name, color, slugs]) => ({ id, name, color, stopIds: slugs.map((s) => STOP_ID[s]), status: 'Active' }))

const person = (n, type, fullName, employeeId, username, contact, status = 'Active', daysAgo = 90) => ({
  id: `ACC-${String(n).padStart(3, '0')}`,
  type,
  fullName,
  employeeId,
  username,
  contact,
  status,
  createdAt: ago(daysAgo * 1440),
})

const accounts = [
  person(1, 'Driver', 'Ramon dela Cruz', 'EMP-D-001', 'ramon.delacruz', '09171234501'),
  person(2, 'Driver', 'Jose Santiago', 'EMP-D-002', 'jose.santiago', '09171234502'),
  person(3, 'Driver', 'Antonio Reyes', 'EMP-D-003', 'antonio.reyes', '09171234503'),
  person(4, 'Driver', 'Eduardo Villanueva', 'EMP-D-004', 'eduardo.villanueva', '09171234504'),
  person(5, 'Driver', 'Marlon Bautista', 'EMP-D-005', 'marlon.bautista', '09171234505'),
  person(6, 'Driver', 'Rodel Mendoza', 'EMP-D-006', 'rodel.mendoza', '09171234506', 'Active', 40),
  person(7, 'Conductor', 'Maria Lourdes Garcia', 'EMP-C-001', 'lourdes.garcia', '09181234507'),
  person(8, 'Conductor', 'Jennifer Ramos', 'EMP-C-002', 'jennifer.ramos', '09181234508'),
  person(9, 'Conductor', 'Carlo Aquino', 'EMP-C-003', 'carlo.aquino', '09181234509'),
  person(10, 'Conductor', 'Liza Fernandez', 'EMP-C-004', 'liza.fernandez', '09181234510'),
  person(11, 'Conductor', 'Pedro Navarro', 'EMP-C-005', 'pedro.navarro', '09181234511', 'Inactive', 200),
]

const bus = (id, plate, model, capacity, routeId, driverId, conductorId, status, passengers, speed, progress) => ({
  id, plate, model, capacity, routeId, driverId, conductorId, status, passengers, speed, progress,
})

const buses = [
  bus('BUS-101', 'NCB 1101', 'Higer KLQ6118 City Bus', 60, 'R-01', 'ACC-001', 'ACC-007', 'Active', 28, 32, 0.15),
  bus('BUS-102', 'NCB 1102', 'Higer KLQ6118 City Bus', 60, 'R-02', 'ACC-002', 'ACC-008', 'Active', 51, 26, 0.55),
  bus('BUS-103', 'NDA 2203', 'Yutong ZK6116 Coach', 50, 'R-06', 'ACC-003', 'ACC-009', 'Active', 50, 18, 0.3),
  bus('BUS-104', 'NDA 2204', 'Yutong ZK6116 Coach', 50, 'R-04', 'ACC-004', 'ACC-010', 'Active', 12, 35, 0.7),
  bus('BUS-105', 'NEC 3305', 'Hino Modern Bus', 50, 'R-07', 'ACC-005', '', 'Maintenance', 0, 0, 0.05),
  bus('BUS-106', 'NEC 3306', 'Hino Modern Bus', 40, 'R-08', '', '', 'Inactive', 0, 0, 0),
  bus('BUS-107', 'NFD 4407', 'Yutong ZK6116 Coach', 50, 'R-06', '', '', 'Emergency', 34, 0, 0.62),
  bus('BUS-108', 'NFD 4408', 'Isuzu Modern Jeepney', 40, 'R-05', 'ACC-006', '', 'Active', 22, 22, 0.4),
]

const L = (n, mins, action, user, module, severity, description) => ({
  id: `LOG-${String(n).padStart(4, '0')}`,
  timestamp: ago(mins),
  action, user, module, severity, description,
})

const logs = [
  L(24, 12, 'Admin logged in', 'Maria Santos', 'Authentication', 'Info', 'Administrator signed in.'),
  L(23, 55, 'Bus information updated', 'Maria Santos', 'Buses', 'Info', 'BUS-102 capacity and plate number reviewed.'),
  L(22, 95, 'Emergency status updated', 'Maria Santos', 'Emergencies', 'Warning', 'EMG-2002 marked Acknowledged.'),
  L(21, 180, 'Route modified', 'Maria Santos', 'Routes', 'Info', 'R-04 stop order changed.'),
  L(20, 260, 'Driver account created', 'Maria Santos', 'Accounts', 'Success', 'Account ACC-006 (Rodel Mendoza) created.'),
  L(19, 400, 'Bus stop added', 'Maria Santos', 'Bus Stops', 'Success', 'S-012 Kamias Rd. cor. Anonas Rd. added to the stop list.'),
  L(18, 640, 'Settings changed', 'Maria Santos', 'Settings', 'Info', 'Notification preferences updated.'),
  L(17, 900, 'Report status updated', 'Maria Santos', 'Reports', 'Info', 'RPT-1004 moved to Under Review.'),
  L(16, 1300, 'Failed login attempt', 'unknown', 'Authentication', 'Warning', 'Incorrect password entered.'),
  L(15, 1500, 'Bus set to Maintenance', 'Maria Santos', 'Buses', 'Warning', 'BUS-105 flagged for maintenance.'),
  L(14, 1800, 'Route modified', 'Maria Santos', 'Routes', 'Info', 'R-08 stop list reviewed against the QC Bus route map.'),
  L(13, 2200, 'Conductor account deactivated', 'Maria Santos', 'Accounts', 'Warning', 'Account ACC-011 (Pedro Navarro) set to Inactive.'),
  L(12, 2700, 'Admin logged in', 'Maria Santos', 'Authentication', 'Info', 'Administrator signed in.'),
  L(11, 3100, 'Bus added', 'Maria Santos', 'Buses', 'Success', 'BUS-108 added to fleet.'),
  L(10, 3600, 'Map layer reviewed', 'Maria Santos', 'Map', 'Info', 'Live map opened.'),
  L(9, 4300, 'Report resolved', 'Maria Santos', 'Reports', 'Success', 'RPT-1002 marked Resolved.'),
  L(8, 5000, 'Bus stop edited', 'Maria Santos', 'Bus Stops', 'Info', 'S-009 address corrected.'),
  L(7, 5800, 'Emergency resolved', 'Maria Santos', 'Emergencies', 'Success', 'EMG-2006 marked Resolved.'),
  L(6, 6900, 'Driver account edited', 'Maria Santos', 'Accounts', 'Info', 'Contact number updated for ACC-003.'),
  L(5, 8200, 'Admin logged out', 'Maria Santos', 'Authentication', 'Info', 'Administrator signed out.'),
  L(4, 9800, 'Route added', 'Maria Santos', 'Routes', 'Success', 'R-04 QC Hall – General Luis Avenue created.'),
  L(3, 11000, 'Settings changed', 'Maria Santos', 'Settings', 'Info', 'Display density preference updated.'),
  L(2, 13000, 'Bus stop added', 'Maria Santos', 'Bus Stops', 'Success', 'S-010 Litex / IBP Road added.'),
  L(1, 15000, 'Admin logged in', 'Maria Santos', 'Authentication', 'Info', 'Administrator signed in.'),
]

const R = (n, type, mins, busId, reportedBy, description, status, priority) => ({
  id: `RPT-${1000 + n}`,
  type,
  datetime: ago(mins),
  busId,
  routeId: buses.find((b) => b.id === busId)?.routeId || '',
  reportedBy,
  description,
  status,
  priority,
})

const reports = [
  R(1, 'Overcrowding', 35, 'BUS-103', 'Passenger', 'Bus was at standing capacity and doors would not close at Kamuning.', 'Pending', 'High'),
  R(2, 'Delay / Schedule', 220, 'BUS-101', 'Passenger', 'More than 30 minutes headway between buses on Commonwealth.', 'Resolved', 'Medium'),
  R(3, 'Driver Conduct', 500, 'BUS-102', 'Anonymous', 'Driver skipped the designated stop at Batasan Complex.', 'Under Review', 'High'),
  R(4, 'Bus Condition', 950, 'BUS-105', 'Conductor', 'Air conditioning not working; unit flagged for maintenance.', 'Under Review', 'Medium'),
  R(5, 'Lost Item', 1400, 'BUS-104', 'Passenger', 'Black backpack left on the rear seats.', 'Resolved', 'Low'),
  R(6, 'Safety Concern', 1900, 'BUS-108', 'Passenger', 'Loose handrail near the rear door.', 'Pending', 'High'),
  R(7, 'General Concern', 2600, 'BUS-104', 'Anonymous', 'Terminal cleanliness at UP Diliman stop.', 'Dismissed', 'Low'),
  R(8, 'Delay / Schedule', 3300, 'BUS-103', 'Passenger', 'Trip cancelled without notice at Welcome Rotonda.', 'Pending', 'Medium'),
  R(9, 'Driver Conduct', 4400, 'BUS-101', 'Passenger', 'Rude conduct towards a senior passenger.', 'Resolved', 'Medium'),
  R(10, 'Overcrowding', 6000, 'BUS-102', 'Passenger', 'Overloading reported during evening peak.', 'Resolved', 'Medium'),
  R(11, 'Bus Condition', 8000, 'BUS-108', 'Conductor', 'Broken seat on the left row, third from front.', 'Pending', 'Low'),
  R(12, 'Safety Concern', 9500, 'BUS-107', 'Driver', 'Brake warning light observed before the incident on Route R-06.', 'Under Review', 'High'),
]

const history = (status, minsAgo) => {
  const order = ['New', 'Acknowledged', 'In Progress', 'Resolved']
  const upTo = order.indexOf(status)
  return order.slice(0, upTo + 1).map((s, i) => ({
    status: s,
    at: ago(Math.max(1, minsAgo - i * 8)),
    by: i === 0 ? 'System' : 'Maria Santos',
  }))
}

const E = (n, mins, busId, type, reportedBy, location, description, severity, status) => ({
  id: `EMG-${2000 + n}`,
  datetime: ago(mins),
  busId,
  routeId: buses.find((b) => b.id === busId)?.routeId || '',
  type, reportedBy, location, description, severity, status,
  history: history(status, mins),
})

const emergencies = [
  E(1, 28, 'BUS-107', 'Mechanical Breakdown', 'Driver', 'E. Rodriguez Sr. Ave, near Kamuning', 'Brake failure warning; bus pulled over safely with passengers on board.', 'Critical', 'In Progress'),
  E(2, 95, 'BUS-103', 'Medical Emergency', 'Conductor', 'Quezon Ave near Welcome Rotonda', 'Passenger fainted; first aid administered on board.', 'High', 'Acknowledged'),
  E(3, 15, 'BUS-102', 'Security Threat', 'Passenger', 'Commonwealth Ave, Batasan', 'Suspicious unattended bag reported near the rear door.', 'Critical', 'New'),
  E(4, 600, 'BUS-104', 'Harassment', 'Passenger', 'Katipunan Ave, Loyola Heights', 'Passenger reported harassment by another commuter.', 'Medium', 'Resolved'),
  E(5, 1500, 'BUS-101', 'Accident', 'Driver', 'Commonwealth Ave cor. Tandang Sora', 'Minor side-swipe with a private vehicle; no injuries.', 'Medium', 'Resolved'),
  E(6, 2900, 'BUS-108', 'Mechanical Breakdown', 'Driver', 'Elliptical Rd, QC Circle', 'Flat tire; replaced on site.', 'Low', 'Resolved'),
  E(7, 4100, 'BUS-103', 'Fire', 'Conductor', 'Aurora Blvd, Cubao', 'Smoke from engine bay; extinguished by crew.', 'High', 'Resolved'),
  E(8, 7200, 'BUS-104', 'Medical Emergency', 'Passenger', 'UP Diliman, Roxas Ave', 'Passenger with chest pain assisted by campus responders.', 'High', 'Resolved'),
]

export const seedData = () => ({
  accounts,
  buses,
  stops,
  routes,
  logs,
  reports,
  emergencies,
  settings: defaultSettings,
})
