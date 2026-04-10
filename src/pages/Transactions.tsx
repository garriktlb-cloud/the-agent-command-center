import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Deal {
  address: string;
  price: string;
  type: "Buyer" | "Seller";
  stage: string;
  healthScore: number;
  daysToClose: number;
  alerts: { label: string; color: "red" | "amber" | "green" }[];
}

const deals: Deal[] = [
  {
    address: "76 S Humboldt St",
    price: "$3.40M",
    type: "Buyer",
    stage: "Pre-Close",
    healthScore: 94,
    daysToClose: 4,
    alerts: [
      { label: "Inspection", color: "green" },
      { label: "Loan", color: "red" },
      { label: "Title", color: "green" },
      { label: "Appraisal", color: "amber" },
    ],
  },
  {
    address: "1420 Pearl St",
    price: "$1.85M",
    type: "Buyer",
    stage: "Earnest Money",
    healthScore: 72,
    daysToClose: 28,
    alerts: [
      { label: "Earnest money", color: "red" },
      { label: "Inspection", color: "amber" },
      { label: "Loan", color: "amber" },
    ],
  },
  {
    address: "890 Broadway",
    price: "$925K",
    type: "Seller",
    stage: "Inspection",
    healthScore: 85,
    daysToClose: 21,
    alerts: [
      { label: "Inspection", color: "green" },
      { label: "Appraisal", color: "amber" },
    ],
  },
  {
    address: "3420 Iris Ave",
    price: "$680K",
    type: "Buyer",
    stage: "Contract Intake",
    healthScore: 45,
    daysToClose: 42,
    alerts: [
      { label: "Contract", color: "red" },
      { label: "Earnest money", color: "red" },
    ],
  },
];

function healthColor(score: number) {
  if (score >= 90) return "bg-success text-success-foreground";
  if (score >= 80) return "bg-info text-info-foreground";
  if (score >= 60) return "bg-warning text-warning-foreground";
  return "bg-destructive text-destructive-foreground";
}

function healthLabel(score: number) {
  if (score >= 90) return "Strong";
  if (score >= 80) return "Good";
  if (score >= 60) return "Watch";
  return "At Risk";
}

const alertColors = {
  red: "text-destructive",
  amber: "text-warning",
  green: "text-success",
};

export default function Transactions() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Transactions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Active deals, key dates, and health monitoring.</p>
        </div>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" />New Transaction</Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search transactions..." className="pl-9" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {deals.map((deal) => (
          <div key={deal.address} className="rounded-lg border bg-card overflow-hidden hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="bg-primary px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-primary-foreground/70">
                  {deal.type} · {deal.stage}
                </p>
                <h3 className="font-heading font-bold text-primary-foreground text-lg">{deal.address}</h3>
                <p className="text-xs text-primary-foreground/70">{deal.price} · {deal.daysToClose} days to close</p>
              </div>
              <div className={`flex flex-col items-center justify-center rounded-md px-2.5 py-1.5 ${healthColor(deal.healthScore)}`}>
                <span className="text-lg font-heading font-bold">{deal.healthScore}</span>
                <span className="text-[9px] uppercase font-semibold">{healthLabel(deal.healthScore)}</span>
              </div>
            </div>

            {/* Body */}
            <div className="p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Deal Health</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {deal.alerts.map((a) => (
                  <span key={a.label} className={`text-xs font-medium ${alertColors[a.color]}`}>
                    {a.color === "green" ? "✓" : a.color === "red" ? "⚠" : "◉"} {a.label}
                  </span>
                ))}
              </div>
              <Progress value={deal.healthScore} className="h-1.5 mb-3" />
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">{deal.daysToClose} days remaining</span>
                <Button variant="outline" size="sm">Details</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
