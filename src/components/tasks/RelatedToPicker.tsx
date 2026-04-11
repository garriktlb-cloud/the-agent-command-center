import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link2, Search, Home, ArrowRightLeft, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RelatedToPickerProps {
  listingId: string | null;
  transactionId: string | null;
  contactId: string | null;
  onChange: (field: "listing_id" | "transaction_id" | "contact_id", value: string | null) => void;
}

export default function RelatedToPicker({
  listingId,
  transactionId,
  contactId,
  onChange,
}: RelatedToPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: listings } = useQuery({
    queryKey: ["listings-picker"],
    queryFn: async () => {
      const { data } = await supabase.from("listings").select("id, address, city, state").limit(50);
      return data ?? [];
    },
    enabled: open,
  });

  const { data: transactions } = useQuery({
    queryKey: ["transactions-picker"],
    queryFn: async () => {
      const { data } = await supabase
        .from("transactions")
        .select("id, buyer_name, seller_name, closing_date")
        .limit(50);
      return data ?? [];
    },
    enabled: open,
  });

  const { data: contacts } = useQuery({
    queryKey: ["contacts-picker"],
    queryFn: async () => {
      const { data } = await supabase.from("contacts").select("id, name, company").limit(50);
      return data ?? [];
    },
    enabled: open,
  });

  const linkedLabel = listingId
    ? listings?.find((l) => l.id === listingId)?.address
    : transactionId
      ? (() => {
          const t = transactions?.find((t) => t.id === transactionId);
          return t ? `${t.buyer_name || ""} / ${t.seller_name || ""}`.trim() : "Transaction";
        })()
      : contactId
        ? contacts?.find((c) => c.id === contactId)?.name
        : null;

  const handleClear = () => {
    onChange("listing_id", null);
    onChange("transaction_id", null);
    onChange("contact_id", null);
  };

  const filterText = (text: string) =>
    text.toLowerCase().includes(search.toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-dashed border-border text-xs hover:bg-muted/50 transition-colors">
          <Link2 className="h-3 w-3" />
          {linkedLabel || "Link to…"}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="h-8 pl-7 text-sm border-0 shadow-none focus-visible:ring-0"
            />
          </div>
        </div>

        {(listingId || transactionId || contactId) && (
          <div className="px-2 py-1.5 border-b border-border">
            <button
              onClick={() => {
                handleClear();
                setOpen(false);
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Remove link
            </button>
          </div>
        )}

        <Tabs defaultValue="listings" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent h-8 px-2">
            <TabsTrigger value="listings" className="text-xs h-6 gap-1 data-[state=active]:shadow-none">
              <Home className="h-3 w-3" /> Listings
            </TabsTrigger>
            <TabsTrigger value="transactions" className="text-xs h-6 gap-1 data-[state=active]:shadow-none">
              <ArrowRightLeft className="h-3 w-3" /> Deals
            </TabsTrigger>
            <TabsTrigger value="contacts" className="text-xs h-6 gap-1 data-[state=active]:shadow-none">
              <User className="h-3 w-3" /> Contacts
            </TabsTrigger>
          </TabsList>

          <div className="max-h-48 overflow-y-auto">
            <TabsContent value="listings" className="m-0">
              {listings
                ?.filter((l) => filterText(l.address || ""))
                .map((l) => (
                  <button
                    key={l.id}
                    onClick={() => {
                      handleClear();
                      onChange("listing_id", l.id);
                      setOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                  >
                    <div className="font-medium truncate">{l.address}</div>
                    {(l.city || l.state) && (
                      <div className="text-xs text-muted-foreground">
                        {[l.city, l.state].filter(Boolean).join(", ")}
                      </div>
                    )}
                  </button>
                ))}
            </TabsContent>

            <TabsContent value="transactions" className="m-0">
              {transactions
                ?.filter((t) =>
                  filterText(`${t.buyer_name || ""} ${t.seller_name || ""}`)
                )
                .map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      handleClear();
                      onChange("transaction_id", t.id);
                      setOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                  >
                    <div className="font-medium truncate">
                      {t.buyer_name || t.seller_name || "Unnamed"}
                    </div>
                    {t.closing_date && (
                      <div className="text-xs text-muted-foreground">
                        Closing: {t.closing_date}
                      </div>
                    )}
                  </button>
                ))}
            </TabsContent>

            <TabsContent value="contacts" className="m-0">
              {contacts
                ?.filter((c) => filterText(`${c.name} ${c.company || ""}`))
                .map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      handleClear();
                      onChange("contact_id", c.id);
                      setOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                  >
                    <div className="font-medium">{c.name}</div>
                    {c.company && (
                      <div className="text-xs text-muted-foreground">{c.company}</div>
                    )}
                  </button>
                ))}
            </TabsContent>
          </div>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
