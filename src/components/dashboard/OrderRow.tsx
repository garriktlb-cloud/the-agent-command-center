import { Badge } from "@/components/ui/badge";

interface OrderRowProps {
  service: string;
  property: string;
  vendor: string;
  status: "Pending" | "Scheduled" | "In Progress" | "Completed";
  dueDate: string;
  price: string;
  billing: "Not billed" | "Billed" | "Paid";
}

const statusStyles: Record<string, string> = {
  Pending: "bg-foreground/5 text-foreground/60 border-foreground/10",
  Scheduled: "bg-foreground/8 text-foreground/70 border-foreground/15",
  "In Progress": "bg-foreground/5 text-foreground/60 border-foreground/10",
  Completed: "bg-foreground/10 text-foreground border-foreground/20",
};

const billingStyles: Record<string, string> = {
  "Not billed": "text-muted-foreground",
  Billed: "text-foreground/70",
  Paid: "text-foreground",
};

export default function OrderRow({ service, property, vendor, status, dueDate, price, billing }: OrderRowProps) {
  return (
    <div className="flex items-center gap-4 rounded-lg border bg-card px-4 py-3 hover:shadow-sm transition-shadow">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{service}</p>
        <p className="text-xs text-muted-foreground truncate">{property} · {vendor}</p>
      </div>
      <Badge variant="outline" className={statusStyles[status]}>
        {status}
      </Badge>
      <span className="text-xs text-muted-foreground w-20 text-right">{dueDate}</span>
      <span className="text-sm font-semibold w-16 text-right">{price}</span>
      <span className={`text-xs w-20 text-right font-medium ${billingStyles[billing]}`}>{billing}</span>
    </div>
  );
}
