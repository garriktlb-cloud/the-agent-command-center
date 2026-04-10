import MetricCard from "@/components/dashboard/MetricCard";
import ListingCard from "@/components/dashboard/ListingCard";
import OrderRow from "@/components/dashboard/OrderRow";
import DeadlineItem from "@/components/dashboard/DeadlineItem";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const listings = [
  {
    address: "123 Main Street",
    agent: "Rachel Gallegos",
    status: "Active This Week",
    statusColor: "blue" as const,
    readiness: 92,
    checklist: [
      { label: "Listing agreement", done: true },
      { label: "Photography", done: true },
      { label: "MLS Input", done: true },
      { label: "Signage", done: false },
    ],
    nextAction: "Ready to launch",
  },
  {
    address: "11211 E Avenue",
    agent: "Sarah Chen",
    status: "Signed",
    statusColor: "green" as const,
    readiness: 68,
    checklist: [
      { label: "Listing agreement", done: true },
      { label: "Photography", done: true },
      { label: "MLS Input", done: false },
      { label: "Signage", done: false },
    ],
    nextAction: "Photography scheduled",
  },
  {
    address: "246 Main Street",
    agent: "Marcus Bell",
    status: "Coming Soon",
    statusColor: "amber" as const,
    readiness: 54,
    checklist: [
      { label: "Listing agreement", done: true },
      { label: "Photography", done: false },
      { label: "MLS Input", done: false },
      { label: "Signage", done: false },
    ],
    nextAction: "MLS input in progress",
  },
  {
    address: "222 Address",
    agent: "John Peters",
    status: "New Listing",
    statusColor: "purple" as const,
    readiness: 24,
    checklist: [
      { label: "Listing agreement", done: false },
      { label: "Photography", done: false },
      { label: "MLS Input", done: false },
      { label: "Signage", done: false },
    ],
    nextAction: "Agreement out for signature",
  },
];

const orders = [
  { service: "Photography", property: "123 Main Street", vendor: "Studio Pro", status: "Scheduled" as const, dueDate: "Apr 6", price: "$450", billing: "Not billed" as const },
  { service: "MLS Input", property: "123 Main Street", vendor: "List Bar Team", status: "In Progress" as const, dueDate: "Apr 7", price: "$150", billing: "Billed" as const },
  { service: "Sign Install", property: "246 Main Street", vendor: "SignCo", status: "Pending" as const, dueDate: "Apr 8", price: "$95", billing: "Not billed" as const },
];

const deadlines = [
  { label: "Inspection objection deadline", property: "76 S Humboldt St", date: "Today", urgency: "red" as const },
  { label: "Earnest money due", property: "1420 Pearl St", date: "Tomorrow", urgency: "red" as const },
  { label: "Pre-CDA review due", property: "76 S Humboldt St", date: "Apr 13", urgency: "amber" as const },
  { label: "Appraisal scheduled", property: "890 Broadway", date: "Apr 15", urgency: "normal" as const },
  { label: "Closing", property: "76 S Humboldt St", date: "Apr 16", urgency: "normal" as const },
];

export default function Dashboard() {
  const today = new Date();
  const greeting = today.getHours() < 12 ? "Good morning" : today.getHours() < 17 ? "Good afternoon" : "Good evening";
  const dateStr = today.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{dateStr}</p>
          <h1 className="text-2xl font-heading font-bold mt-0.5">{greeting}, Garrik.</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Run your listings and active deals in one place.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Order Service</Button>
          <Button size="sm"><Plus className="h-4 w-4 mr-1" />Start Listing</Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MetricCard label="Active Listings" value={4} variant="primary" />
        <MetricCard label="Need Orders" value={2} />
        <MetricCard label="Projected GCI" value="$85K" />
        <MetricCard label="Launching Soon" value={2} />
        <MetricCard label="Outstanding" value="$695" sublabel="2 invoices" />
      </div>

      {/* Deadlines */}
      <section>
        <h2 className="text-base font-heading font-semibold mb-3">Upcoming Deadlines</h2>
        <div className="space-y-2">
          {deadlines.map((d, i) => (
            <DeadlineItem key={i} {...d} />
          ))}
        </div>
      </section>

      {/* Listings */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-heading font-semibold">Your Listings</h2>
          <Button variant="ghost" size="sm" className="text-accent">View all</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {listings.map((l) => (
            <ListingCard key={l.address} {...l} />
          ))}
        </div>
      </section>

      {/* Active Orders */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-heading font-semibold">Active Orders</h2>
          <Button variant="ghost" size="sm" className="text-accent">View all</Button>
        </div>
        <div className="space-y-2">
          {orders.map((o, i) => (
            <OrderRow key={i} {...o} />
          ))}
        </div>
      </section>
    </div>
  );
}
