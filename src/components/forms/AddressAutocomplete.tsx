import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Suggestion {
  placeId: string;
  text: string;
  structuredFormat: {
    mainText: string;
    secondaryText: string;
  };
}

interface AddressComponents {
  address: string;
  city: string;
  state: string;
  zip: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (components: AddressComponents) => void;
  placeholder?: string;
  className?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Start typing an address…",
  className,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const sessionTokenRef = useRef(crypto.randomUUID());
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchSuggestions = useCallback(async (input: string) => {
    if (input.length < 3) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("address-autocomplete", {
        body: { input, sessionToken: sessionTokenRef.current },
      });
      if (!error && data?.suggestions) {
        setSuggestions(data.suggestions);
        setOpen(data.suggestions.length > 0);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (val: string) => {
    onChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const handleSelect = async (suggestion: Suggestion) => {
    setOpen(false);
    onChange(suggestion.structuredFormat.mainText || suggestion.text);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("place-details", {
        body: { placeId: suggestion.placeId, sessionToken: sessionTokenRef.current },
      });
      if (!error && data) {
        onSelect({
          address: data.address || suggestion.structuredFormat.mainText,
          city: data.city || "",
          state: data.state || "",
          zip: data.zip || "",
        });
        // New session token after selection (Google billing best practice)
        sessionTokenRef.current = crypto.randomUUID();
      }
    } catch {
      // still set what we have
      onSelect({
        address: suggestion.structuredFormat.mainText,
        city: "",
        state: "",
        zip: "",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        className={cn(className)}
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-md border bg-popover shadow-md max-h-60 overflow-auto">
          {suggestions.map((s) => (
            <button
              key={s.placeId}
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-accent text-sm transition-colors"
              onClick={() => handleSelect(s)}
            >
              <span className="font-medium">{s.structuredFormat.mainText}</span>
              {s.structuredFormat.secondaryText && (
                <span className="text-muted-foreground ml-1 text-xs">
                  {s.structuredFormat.secondaryText}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="h-3.5 w-3.5 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
