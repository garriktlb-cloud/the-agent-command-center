import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddressAutocomplete } from "./AddressAutocomplete";

const schema = z.object({
  address: z.string().min(1, "Address is required"),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  seller_name: z.string().optional(),
  listing_type: z.enum(["buyer", "seller"]),
  price: z.string().optional(),
  listing_date: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function NewListingForm({ onSuccess }: { onSuccess?: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [templateId, setTemplateId] = useState<string>("");

  const { data: templates = [] } = useQuery({
    queryKey: ["available_templates", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checklist_templates")
        .select("id, name, user_id, is_default")
        .or(`user_id.eq.${user!.id},user_id.is.null`)
        .order("user_id", { nullsFirst: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Default to user's starred template, else platform template
  useEffect(() => {
    if (templateId || templates.length === 0) return;
    const userDefault = templates.find((t: any) => t.user_id === user?.id && t.is_default);
    const platform = templates.find((t: any) => t.user_id === null);
    setTemplateId(userDefault?.id ?? platform?.id ?? "none");
  }, [templates, templateId, user]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      address: "",
      city: "",
      state: "",
      zip: "",
      seller_name: "",
      listing_type: "seller",
      price: "",
      listing_date: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!user) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("listings")
        .insert({
          user_id: user.id,
          address: values.address,
          city: values.city || null,
          state: values.state || null,
          zip: values.zip || null,
          seller_name: values.seller_name || null,
          listing_type: values.listing_type,
          price: values.price ? parseFloat(values.price.replace(/,/g, "")) : null,
          listing_date: values.listing_date || null,
        })
        .select("id")
        .single();

      if (error) throw error;

      // Apply selected template (if any)
      if (templateId && templateId !== "none") {
        const { error: applyErr } = await supabase.rpc("apply_template_to_listing", {
          _template_id: templateId,
          _listing_id: data.id,
        });
        if (applyErr) console.error("Template apply failed:", applyErr);
      }

      queryClient.invalidateQueries({ queryKey: ["listings"] });
      toast.success("Listing created");
      onSuccess?.();
      navigate(`/listings/${data.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create listing");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <AddressAutocomplete
                  value={field.value}
                  onChange={field.onChange}
                  onSelect={(components) => {
                    form.setValue("address", components.address);
                    form.setValue("city", components.city);
                    form.setValue("state", components.state);
                    form.setValue("zip", components.zip);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-3 gap-3">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="zip"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Zip</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="seller_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Seller Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. John & Jane Smith" />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="listing_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Listing Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="seller">Seller</SelectItem>
                    <SelectItem value="buyer">Buyer</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Est. Price</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="450,000" />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="listing_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Est. List Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Creating…" : "Create Listing"}
        </Button>
      </form>
    </Form>
  );
}
