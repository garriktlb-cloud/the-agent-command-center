import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const listings = [
  { address: "4521 E Alameda Ave", city: "Denver", state: "CO", zip: "80246", price: 925000, status: "active", listing_type: "seller", listing_date: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0], seller_name: "Marcus & Jennifer Bell", bedrooms: 4, bathrooms: 3, sqft: 2840, property_type: "Single Family", mls_number: "MLS-2025-001" },
  { address: "1847 S Fillmore St", city: "Denver", state: "CO", zip: "80210", price: 1150000, status: "coming_soon", listing_type: "seller", listing_date: new Date(Date.now() + 12 * 86400000).toISOString().split("T")[0], seller_name: "Rachel Gallegos", bedrooms: 5, bathrooms: 4, sqft: 3620, property_type: "Single Family", mls_number: "MLS-2025-002" },
  { address: "922 Corona St", city: "Denver", state: "CO", zip: "80218", price: 675000, status: "photography_scheduled", listing_type: "seller", listing_date: new Date(Date.now() + 18 * 86400000).toISOString().split("T")[0], seller_name: "Tom & Lisa Park", bedrooms: 3, bathrooms: 2, sqft: 1950, property_type: "Single Family", mls_number: "MLS-2025-003" },
  { address: "3301 Wyandot St", city: "Denver", state: "CO", zip: "80211", price: 820000, status: "signed", listing_type: "seller", listing_date: new Date(Date.now() + 25 * 86400000).toISOString().split("T")[0], seller_name: "Sarah Chen", bedrooms: 4, bathrooms: 3, sqft: 2200, property_type: "Single Family", mls_number: "MLS-2025-004" },
  { address: "76 S Humboldt St", city: "Denver", state: "CO", zip: "80209", price: 1380000, status: "live", listing_type: "seller", listing_date: new Date(Date.now() - 10 * 86400000).toISOString().split("T")[0], seller_name: "James & Amy Kowalski", bedrooms: 5, bathrooms: 4, sqft: 4100, property_type: "Single Family", mls_number: "MLS-2025-005" },
];

const contacts = [
  { name: "Marcus Bell", email: "marcus.bell@email.com", phone: "720-555-0101", role_label: "Seller", company: null },
  { name: "Rachel Gallegos", email: "rgallegos@email.com", phone: "303-555-0182", role_label: "Seller", company: null },
  { name: "Tom Park", email: "tom.park@email.com", phone: "720-555-0234", role_label: "Seller", company: null },
  { name: "Studio Pro Photography", email: "bookings@studiopro.com", phone: "303-555-0310", role_label: "Vendor", company: "Studio Pro" },
  { name: "SignCo Denver", email: "orders@signco.com", phone: "720-555-0445", role_label: "Vendor", company: "SignCo" },
  { name: "Colorado Title Group", email: "closings@cotitle.com", phone: "303-555-0567", role_label: "Title Company", company: "Colorado Title Group" },
];

export default function Seed() {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [log, setLog] = useState<string[]>([]);
  const navigate = useNavigate();

  const addLog = (msg: string) => setLog((l) => [...l, msg]);

  const seed = async () => {
    setStatus("running");
    setLog([]);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");
      addLog(`✓ Logged in as ${user.email}`);

      // Listings
      addLog("Adding listings...");
      const { data: insertedListings, error: lErr } = await supabase
        .from("listings")
        .insert(listings.map((l) => ({ ...l, user_id: user.id })))
        .select();
      if (lErr) throw new Error(`Listings: ${lErr.message}`);
      addLog(`✓ Added ${insertedListings.length} listings`);

      // Contacts
      addLog("Adding contacts...");
      const { data: insertedContacts, error: cErr } = await supabase
        .from("contacts")
        .insert(contacts.map((c) => ({ ...c, user_id: user.id })))
        .select();
      if (cErr) throw new Error(`Contacts: ${cErr.message}`);
      addLog(`✓ Added ${insertedContacts.length} contacts`);

      // Transactions
      addLog("Adding transactions...");
      const liveListingId = insertedListings.find((l) => l.status === "live")?.id;
      const activeListingId = insertedListings.find((l) => l.status === "active")?.id;
      const comingSoonId = insertedListings.find((l) => l.status === "coming_soon")?.id;

      const transactions = [
        { user_id: user.id, listing_id: liveListingId, stage: "inspection", health_score: 88, buyer_name: "Derek & Mona Patel", seller_name: "James & Amy Kowalski", closing_date: new Date(Date.now() + 22 * 86400000).toISOString().split("T")[0], contract_price: 1365000, earnest_money_amount: 27300, earnest_money_due: new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0] },
        { user_id: user.id, listing_id: activeListingId, stage: "earnest_money", health_score: 95, buyer_name: "Chris & Julia Navarro", seller_name: "Marcus & Jennifer Bell", closing_date: new Date(Date.now() + 31 * 86400000).toISOString().split("T")[0], contract_price: 918000, earnest_money_amount: 18360, earnest_money_due: new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0] },
        { user_id: user.id, listing_id: comingSoonId, stage: "contract_intake", health_score: 100, buyer_name: "Will Thompson", seller_name: "Rachel Gallegos", closing_date: new Date(Date.now() + 45 * 86400000).toISOString().split("T")[0], contract_price: 1140000, earnest_money_amount: 22800, earnest_money_due: new Date(Date.now() + 8 * 86400000).toISOString().split("T")[0] },
      ];

      const { data: insertedTxns, error: tErr } = await supabase
        .from("transactions")
        .insert(transactions)
        .select();
      if (tErr) throw new Error(`Transactions: ${tErr.message}`);
      addLog(`✓ Added ${insertedTxns.length} transactions`);

      // Orders
      addLog("Adding orders...");
      const orders = [
        { user_id: user.id, listing_id: insertedListings[2].id, title: "Listing Photography", vendor_name: "Studio Pro", vendor_email: "bookings@studiopro.com", status: "pending", priority: "high", cost: 450, due_date: new Date(Date.now() + 4 * 86400000).toISOString().split("T")[0] },
        { user_id: user.id, listing_id: insertedListings[3].id, title: "Sign Installation", vendor_name: "SignCo Denver", vendor_email: "orders@signco.com", status: "pending", priority: "normal", cost: 95, due_date: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0] },
        { user_id: user.id, listing_id: insertedListings[0].id, title: "Staging Consultation", vendor_name: "Denver Home Staging", status: "in_progress", priority: "normal", cost: 650, due_date: new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0] },
      ];

      const { data: insertedOrders, error: oErr } = await supabase
        .from("orders")
        .insert(orders)
        .select();
      if (oErr) throw new Error(`Orders: ${oErr.message}`);
      addLog(`✓ Added ${insertedOrders.length} orders`);

      // Tasks
      addLog("Adding tasks...");
      const tasks = [
        { user_id: user.id, listing_id: insertedListings[0].id, title: "Confirm showing instructions with seller", status: "todo", priority: "high", task_type: "todo", due_date: new Date(Date.now() + 1 * 86400000).toISOString().split("T")[0] },
        { user_id: user.id, listing_id: insertedListings[1].id, title: "Send coming soon announcement email", status: "todo", priority: "normal", task_type: "email", due_date: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0] },
        { user_id: user.id, transaction_id: insertedTxns[0].id, title: "Follow up on inspection objection deadline", status: "todo", priority: "urgent", task_type: "follow_up", due_date: new Date(Date.now() + 1 * 86400000).toISOString().split("T")[0] },
        { user_id: user.id, transaction_id: insertedTxns[1].id, title: "Confirm earnest money wire received", status: "todo", priority: "high", task_type: "call", due_date: new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0] },
        { user_id: user.id, listing_id: insertedListings[2].id, title: "Review photography proofs", status: "todo", priority: "normal", task_type: "todo", due_date: new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0] },
      ];

      const { error: taskErr } = await supabase.from("tasks").insert(tasks);
      if (taskErr) throw new Error(`Tasks: ${taskErr.message}`);
      addLog(`✓ Added ${tasks.length} tasks`);

      addLog("✓ All done! Redirecting to dashboard...");
      setStatus("done");
      setTimeout(() => navigate("/"), 1500);
    } catch (err: any) {
      addLog(`✗ Error: ${err.message}`);
      setStatus("error");
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-20 p-8 rounded-xl border bg-card space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Seed Demo Data</h1>
        <p className="text-sm text-muted-foreground mt-1">
          This will add realistic fake listings, transactions, contacts, orders, and tasks to your account.
        </p>
      </div>

      {status === "idle" && (
        <Button onClick={seed} className="w-full">Load Demo Data</Button>
      )}

      {status === "running" && (
        <Button disabled className="w-full">Loading...</Button>
      )}

      {status === "done" && (
        <Button variant="outline" onClick={() => navigate("/")} className="w-full">Go to Dashboard →</Button>
      )}

      {status === "error" && (
        <Button onClick={seed} variant="destructive" className="w-full">Retry</Button>
      )}

      {log.length > 0 && (
        <div className="rounded-lg bg-muted p-4 space-y-1">
          {log.map((l, i) => (
            <p key={i} className="text-xs font-mono text-foreground/80">{l}</p>
          ))}
        </div>
      )}
    </div>
  );
}
