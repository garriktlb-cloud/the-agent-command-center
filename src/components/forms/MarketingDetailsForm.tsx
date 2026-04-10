import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const schema = z.object({
  property_type: z.string().optional(),
  bedrooms: z.string().optional(),
  bathrooms: z.string().optional(),
  sqft: z.string().optional(),
  lot_size: z.string().optional(),
  year_built: z.string().optional(),
  garage_spaces: z.string().optional(),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const PROPERTY_TYPES = [
  "Single Family",
  "Condo",
  "Townhouse",
  "Multi-Family",
  "Land",
  "Commercial",
  "Other",
];

const FIELD_KEYS = [
  "property_type",
  "bedrooms",
  "bathrooms",
  "sqft",
  "lot_size",
  "year_built",
  "garage_spaces",
  "description",
] as const;

interface MarketingDetailsFormProps {
  listingId: string;
  listing: Record<string, any>;
}

export function MarketingDetailsForm({ listingId, listing }: MarketingDetailsFormProps) {
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);

  const filledCount = FIELD_KEYS.filter(
    (k) => listing[k] !== null && listing[k] !== undefined && listing[k] !== ""
  ).length;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      property_type: listing.property_type || "",
      bedrooms: listing.bedrooms?.toString() || "",
      bathrooms: listing.bathrooms?.toString() || "",
      sqft: listing.sqft?.toString() || "",
      lot_size: listing.lot_size || "",
      year_built: listing.year_built?.toString() || "",
      garage_spaces: listing.garage_spaces?.toString() || "",
      description: listing.description || "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("listings")
        .update({
          property_type: values.property_type || null,
          bedrooms: values.bedrooms ? parseInt(values.bedrooms) : null,
          bathrooms: values.bathrooms ? parseFloat(values.bathrooms) : null,
          sqft: values.sqft ? parseInt(values.sqft.replace(/,/g, "")) : null,
          lot_size: values.lot_size || null,
          year_built: values.year_built ? parseInt(values.year_built) : null,
          garage_spaces: values.garage_spaces ? parseInt(values.garage_spaces) : null,
          description: values.description || null,
        } as any)
        .eq("id", listingId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["listing", listingId] });
      toast.success("Property details saved");
    } catch (err: any) {
      toast.error(err.message || "Failed to save details");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold">Property Details</h3>
        <Badge variant="outline" className="text-xs">
          {filledCount} of {FIELD_KEYS.length} complete
        </Badge>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="property_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PROPERTY_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="year_built"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year Built</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. 2005" />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormField
              control={form.control}
              name="bedrooms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bedrooms</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="3" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bathrooms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bathrooms</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="2.5" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="garage_spaces"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Garage</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="2" />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="sqft"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sq. Ft.</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="2,400" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lot_size"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lot Size</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="0.25 acres" />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={4} placeholder="Property highlights, unique features…" />
                </FormControl>
              </FormItem>
            )}
          />

          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Save Property Details"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
