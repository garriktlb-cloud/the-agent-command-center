import OrderRow from "@/components/dashboard/OrderRow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const orders = [
  { service: "Photography", property: "123 Main Street", vendor: "Studio Pro", status: "Scheduled" as const, dueDate: "Apr 6", price: "$450", billing: "Not billed" as const },
  { service: "MLS Input", property: "123 Main Street", vendor: "List Bar Team", status: "In Progress" as const, dueDate: "Apr 7", price: "$150", billing: "Billed" as const },
  { service: "Photography", property: "11211 E Avenue", vendor: "Studio Pro", status: "In Progress" as const, dueDate: "Tomorrow", price: "$450", billing: "Not billed" as const },
  { service: "Sign Install", property: "246 Main Street", vendor: "SignCo", status: "Pending" as const, dueDate: "This week", price: "$95", billing: "Not billed" as const },
  { service: "Staging Consultation", property: "222 Address", vendor: "Stage & Style", status: "Pending" as const, dueDate: "Apr 12", price: "$300", billing: "Not billed" as const },
  { service: "Virtual Tour", property: "123 Main Street", vendor: "VR Tours", status: "Completed" as const, dueDate: "Apr 3", price: "$275", billing: "Paid" as const },
  { service: "Lockbox Install", property: "2659 W Winona", vendor: "List Bar Team", status: "Completed" as const, dueDate: "Apr 1", price: "$0", billing: "Paid" as const },
];

export default function Orders() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Orders</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Service orders, vendor assignments, and billing status.</p>
        </div>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" />New Order</Button>
      </div>

      <div className="flex items-center gap-3">
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="ml-auto relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search orders..." className="pl-9" />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Pending</p>
          <p className="text-xl font-heading font-bold mt-1">2</p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">In Progress</p>
          <p className="text-xl font-heading font-bold mt-1">2</p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Completed</p>
          <p className="text-xl font-heading font-bold mt-1">3</p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Unbilled</p>
          <p className="text-xl font-heading font-bold mt-1 text-warning">$995</p>
        </div>
      </div>

      <div className="space-y-2">
        {orders.map((o, i) => (
          <OrderRow key={i} {...o} />
        ))}
      </div>
    </div>
  );
}
