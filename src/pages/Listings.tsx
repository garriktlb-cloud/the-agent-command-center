import ListingCard from "@/components/dashboard/ListingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  {
    address: "2659 W Winona Street",
    agent: "Rachel Gallegos",
    status: "Active This Week",
    statusColor: "blue" as const,
    readiness: 100,
    checklist: [
      { label: "Listing agreement", done: true },
      { label: "Photography", done: true },
      { label: "MLS Input", done: true },
      { label: "Signage", done: true },
    ],
    nextAction: "Live — monitor activity",
  },
];

export default function Listings() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Listings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Prep, launch, and marketing coordination.</p>
        </div>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" />New Listing</Button>
      </div>

      <div className="flex items-center gap-3">
        <Tabs defaultValue="listings">
          <TabsList>
            <TabsTrigger value="listings">Listings</TabsTrigger>
            <TabsTrigger value="under-contract">Under Contract</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="ml-auto relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search listings..." className="pl-9" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {listings.map((l) => (
          <ListingCard key={l.address} {...l} />
        ))}
      </div>
    </div>
  );
}
