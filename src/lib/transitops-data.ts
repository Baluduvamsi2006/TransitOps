export const navItems = [
  { href: "/", label: "Dashboard", icon: "◧" },
  { href: "/fleet", label: "Fleet Registry", icon: "🚚" },
  { href: "/drivers", label: "Drivers", icon: "🪪" },
  { href: "/trips", label: "Trips", icon: "🧭" },
  { href: "/maintenance", label: "Maintenance", icon: "🔧" },
  { href: "/finance", label: "Fuel & Expenses", icon: "⛽" },
  { href: "/reports", label: "Reports", icon: "📊" },
  { href: "/settings", label: "Settings", icon: "⚙" }
] as const;

const accent = "var(--accent)";
const success = "var(--success)";
const warning = "var(--warning)";
const info = "var(--info)";
const danger = "var(--danger)";
const muted = "var(--muted)";

export const dashboardKpis = [
  { label: "Active Vehicles", value: "24", tone: "accent" },
  { label: "Available Vehicles", value: "16", tone: "success" },
  { label: "In Maintenance", value: "5", tone: "warning" },
  { label: "Active Trips", value: "9", tone: "info" },
  { label: "Pending Trips", value: "4", tone: "neutral" },
  { label: "Drivers On Duty", value: "11", tone: "neutral" },
  { label: "Fleet Utilization", value: "38%", tone: "accent" },
  { label: "Operational Cost", value: "$128,400", tone: "warning" }
] as const;

export const recentTrips = [
  { code: "T-104", vehicle: "GJ01AB1234", driver: "Alex Verma", status: "Dispatched", tone: "info", notes: "North Depot to Hub A" },
  { code: "T-103", vehicle: "GJ03BB9991", driver: "Meera Das", status: "Completed", tone: "success", notes: "Delivered on schedule" },
  { code: "T-102", vehicle: "GJ07EE3344", driver: "Rahul Kapoor", status: "Draft", tone: "muted", notes: "Awaiting dispatch approval" },
  { code: "T-101", vehicle: "GJ04FF5566", driver: "Farah Khan", status: "Cancelled", tone: "danger", notes: "Vehicle reassigned" }
] as const;

export const vehicleStatusBars = [
  { label: "Available", count: 16, width: "74%", fill: "bg-(--success)" },
  { label: "On Trip", count: 9, width: "42%", fill: "bg-(--info)" },
  { label: "In Shop", count: 5, width: "23%", fill: "bg-(--warning)" },
  { label: "Retired", count: 2, width: "10%", fill: "bg-(--danger)" }
] as const;

export const vehicleRows = [
  { reg: "GJ01AB1234", name: "Van-05", type: "Van", capacity: 500, status: "Available", tone: "success" },
  { reg: "GJ03BB9991", name: "Truck-08", type: "Truck", capacity: 8000, status: "On Trip", tone: "info" },
  { reg: "GJ05CC0850", name: "Midi-03", type: "Mini Truck", capacity: 1000, status: "In Shop", tone: "warning" },
  { reg: "GJ01CD0917", name: "Van-09", type: "Van", capacity: 750, status: "Retired", tone: "danger" },
  { reg: "GJ02DD1122", name: "Van-12", type: "Van", capacity: 600, status: "Available", tone: "success" },
  { reg: "GJ07EE3344", name: "Truck-03", type: "Truck", capacity: 6000, status: "Available", tone: "success" }
] as const;

export const driverRows = [
  { name: "Alex Verma", license: "DL-99135", category: "LMV", expiry: "2027-03-14", status: "On Trip", tone: "info", safety: 94 },
  { name: "Meera Das", license: "DL-77213", category: "HMV", expiry: "2026-07-25", status: "Available", tone: "success", safety: 96 },
  { name: "Sam Iyer", license: "DL-44580", category: "HMV", expiry: "2025-07-01", status: "Suspended", tone: "danger", safety: 87 },
  { name: "Gopal Sen", license: "DL-48395", category: "LMV", expiry: "2026-08-20", status: "Off Duty", tone: "muted", safety: 83 },
  { name: "Priya Nair", license: "DL-19031", category: "LMV", expiry: "2027-01-09", status: "On Trip", tone: "info", safety: 91 }
] as const;

export const tripRows = [
  { id: "T-104", route: "Northbridge Depot → Ashapiladad Hub", vehicle: "GJ01AB1234", driver: "Alex Verma", status: "Dispatched", tone: "info", weight: "450 kg", distance: "96 km" },
  { id: "T-103", route: "Warehouse 4 → Retail Industrial Area", vehicle: "GJ03BB9991", driver: "Meera Das", status: "Completed", tone: "success", weight: "320 kg", distance: "62 km" },
  { id: "T-102", route: "Central Yard → East Terminal", vehicle: "GJ07EE3344", driver: "Rahul Kapoor", status: "Draft", tone: "muted", weight: "—", distance: "—" },
  { id: "T-101", route: "Port Yard → City Center", vehicle: "GJ04FF5566", driver: "Farah Khan", status: "Cancelled", tone: "danger", weight: "200 kg", distance: "18 km" }
] as const;

export const maintenanceRows = [
  { vehicle: "GJ05CC0850", service: "Oil Change", date: "2026-07-01", cost: "$4,600", state: "Active", tone: "warning" },
  { vehicle: "GJ01HH9900", service: "Brake Repair", date: "2026-07-05", cost: "$12,900", state: "Active", tone: "warning" },
  { vehicle: "GJ03BB9991", service: "Engine Repair", date: "2026-06-10", cost: "$19,200", state: "Closed", tone: "success" },
  { vehicle: "GJ06GG7788", service: "Tyre Replace", date: "2026-05-22", cost: "$6,300", state: "Closed", tone: "success" }
] as const;

export const fuelRows = [
  { vehicle: "GJ01AB1234", date: "2026-07-05", liters: "42", cost: "$5,100" },
  { vehicle: "GJ03BB9991", date: "2026-07-06", liters: "60", cost: "$6,400" },
  { vehicle: "GJ07EE3344", date: "2026-07-06", liters: "8", cost: "$2,050" },
  { vehicle: "GJ08II1234", date: "2026-07-08", liters: "44", cost: "$4,600" },
  { vehicle: "GJ10JJ4455", date: "2026-07-09", liters: "70", cost: "$7,350" }
] as const;

export const expenseRows = [
  { trip: "T-104", vehicle: "GJ01AB1234", toll: "$120", other: "$0", date: "2026-07-05" },
  { trip: "T-103", vehicle: "GJ03BB9991", toll: "$240", other: "$60", date: "2026-07-06" }
] as const;

export const reportMetrics = [
  { label: "Fuel Efficiency", value: "14.8 km/L", tone: "success" },
  { label: "Fleet Utilization", value: "38%", tone: "accent" },
  { label: "Operational Cost", value: "$128,400", tone: "warning" },
  { label: "Vehicle ROI", value: "12.4%", tone: "info" }
] as const;

export const monthlyBars = [
  { label: "Jan", width: "20%" },
  { label: "Feb", width: "42%" },
  { label: "Mar", width: "55%" },
  { label: "Apr", width: "68%" },
  { label: "May", width: "44%" },
  { label: "Jun", width: "78%" },
  { label: "Jul", width: "88%" }
] as const;

export const topCostBars = [
  { label: "GJ03BB9991", cost: "$28,900", width: "92%" },
  { label: "GJ08II1234", cost: "$22,100", width: "76%" },
  { label: "GJ01HH9900", cost: "$19,900", width: "68%" },
  { label: "GJ05CC0850", cost: "$14,300", width: "50%" },
  { label: "GJ07EE3344", cost: "$11,800", width: "40%" }
] as const;

export const rbacRows = [
  ["Super Admin", "✓", "✓", "✓", "✓", "✓", "✓", "✓"],
  ["Fleet Manager", "✓", "✓", "✓", "✓", "✓", "✓", "—"],
  ["Dispatcher", "✓", "—", "—", "✓", "—", "—", "—"],
  ["Safety Officer", "✓", "—", "✓", "—", "—", "—", "—"],
  ["Financial Analyst", "✓", "—", "—", "—", "—", "✓", "✓"]
] as const;

export const financeSummary = [
  { label: "Fuel", value: "$31,500", tone: "accent" },
  { label: "Maintenance", value: "$43,000", tone: "warning" },
  { label: "Tolls / Misc", value: "$12,400", tone: "info" },
  { label: "Total", value: "$86,900", tone: "success" }
] as const;

export const routeSummary = [
  { label: "Dispatchable vehicles", value: "16", tone: "success" },
  { label: "Active service logs", value: "2", tone: "warning" },
  { label: "Trips waiting", value: "4", tone: "info" },
  { label: "Expired licenses", value: "1", tone: "danger" }
] as const;

export const settingsRows = [
  ["Dashboard", "✓ view", "✓ view", "✓ view", "✓ view"],
  ["Fleet Registry", "✓ manage", "✓ view", "—", "—"],
  ["Drivers", "✓ manage", "✓ view", "✓ manage", "—"],
  ["Trips", "✓ manage", "✓ manage", "✓ view", "—"],
  ["Maintenance", "✓ manage", "—", "—", "✓ view"],
  ["Fuel / Expenses", "✓ manage", "—", "—", "✓ manage"],
  ["Reports", "✓ view", "—", "—", "✓ manage"]
] as const;
