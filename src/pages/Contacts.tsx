import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Phone, Mail, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Contact = Tables<"contacts">;

const ROLES = ["Seller", "Buyer", "Agent", "Vendor", "Title Company", "Lender", "Inspector", "Other"];

const roleColors: Record<string, string> = {
  Seller: "bg-blue-500/10 text-blue-700",
  Buyer: "bg-emerald-500/10 text-emerald-700",
  Agent: "bg-purple-500/10 text-purple-700",
  Vendor: "bg-amber-500/10 text-amber-700",
  "Title Company": "bg-foreground/10 text-foreground",
  Lender: "bg-cyan-500/10 text-cyan-700",
  Inspector: "bg-orange-500/10 text-orange-700",
  Other: "bg-muted text-muted-foreground",
};

function ContactForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Contact>;
  onSave: (data: Partial<Contact>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    email: initial?.email || "",
    phone: initial?.phone || "",
    company: initial?.company || "",
    role_label: initial?.role_label || "",
    notes: initial?.notes || "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Name *</Label>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Full name" />
        </div>
        <div className="space-y-1.5">
          <Label>Role</Label>
          <Select value={form.role_label} onValueChange={(v) => set("role_label", v)}>
            <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="email@example.com" type="email" />
        </div>
        <div className="space-y-1.5">
          <Label>Phone</Label>
          <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="303-555-0000" />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Company</Label>
          <Input value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Company name" />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Notes</Label>
          <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Any notes..." rows={3} />
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(form)} disabled={!form.name.trim()}>Save Contact</Button>
      </div>
    </div>
  );
}

export default function Contacts() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [newOpen, setNewOpen] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);

  const { data: contacts, isLoading } = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return data as Contact[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Contact>) => {
      const { error } = await supabase.from("contacts").insert({ ...data, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      setNewOpen(false);
      toast.success("Contact added");
    },
    onError: () => toast.error("Failed to add contact"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Contact> }) => {
      const { error } = await supabase.from("contacts").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      setEditContact(null);
      toast.success("Contact updated");
    },
    onError: () => toast.error("Failed to update contact"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contacts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contact deleted");
    },
    onError: () => toast.error("Failed to delete contact"),
  });

  const filtered = contacts?.filter((c) => {
    const matchesSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.company?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || c.role_label === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roles = ["all", ...ROLES];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Contacts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Sellers, buyers, vendors, and partners.</p>
        </div>
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />New Contact</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>New Contact</DialogTitle></DialogHeader>
            <ContactForm onSave={(data) => createMutation.mutate(data)} onCancel={() => setNewOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search contacts..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {roles.map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                roleFilter === r
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card text-muted-foreground border-border hover:border-foreground/30"
              }`}
            >
              {r === "all" ? "All" : r}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
        </div>
      ) : filtered && filtered.length > 0 ? (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[22%]">Name</TableHead>
                <TableHead className="w-[14%]">Role</TableHead>
                <TableHead className="w-[20%]">Email</TableHead>
                <TableHead className="w-[14%]">Phone</TableHead>
                <TableHead className="w-[16%]">Company</TableHead>
                <TableHead className="w-[14%] text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground/60 shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <p className="font-medium text-sm">{c.name}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {c.role_label && (
                      <Badge variant="outline" className={`border-0 text-[11px] font-medium ${roleColors[c.role_label] || roleColors.Other}`}>
                        {c.role_label}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {c.email ? (
                      <a href={`mailto:${c.email}`} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" />{c.email}
                      </a>
                    ) : <span className="text-muted-foreground text-sm">—</span>}
                  </TableCell>
                  <TableCell>
                    {c.phone ? (
                      <a href={`tel:${c.phone}`} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" />{c.phone}
                      </a>
                    ) : <span className="text-muted-foreground text-sm">—</span>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.company || "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditContact(c)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          if (confirm(`Delete ${c.name}?`)) deleteMutation.mutate(c.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground border rounded-lg bg-card">
          <p className="text-sm">{search || roleFilter !== "all" ? "No contacts match your search." : "No contacts yet. Add your first contact."}</p>
        </div>
      )}

      {/* Edit dialog */}
      {editContact && (
        <Dialog open={!!editContact} onOpenChange={() => setEditContact(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Edit Contact</DialogTitle></DialogHeader>
            <ContactForm
              initial={editContact}
              onSave={(data) => updateMutation.mutate({ id: editContact.id, data })}
              onCancel={() => setEditContact(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
