"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, DollarSign, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { apiFetch } from "@/lib/api-client";
import { ExchangeRates } from "@/lib/types";
import { useAppStore, CurrentUser } from "@/lib/store";
import { toast } from "sonner";

const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
];

export function CurrencySelector() {
  const { currency, setCurrency } = useAppStore();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // Fetch live exchange rates for the info panel
  const { data: ratesData } = useQuery<ExchangeRates>({
    queryKey: ["rates"],
    queryFn: () => apiFetch<ExchangeRates>("/api/currencies/rates"),
    staleTime: 60 * 60 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: (newCurrency: string) =>
      apiFetch<{ user: CurrentUser }>("/api/user/currency", {
        method: "PUT",
        body: JSON.stringify({ currency: newCurrency }),
      }),
    onSuccess: (data) => {
      setCurrency(data.user.currency);
      // Update the session cache so the new currency persists
      queryClient.setQueryData(["session"], { user: data.user });
      toast.success(`Currency changed to ${data.user.currency}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const current = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors text-sm">
          <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
            {current.symbol}
          </div>
          <div className="flex-1 text-left min-w-0">
            <div className="text-xs text-muted-foreground">Currency</div>
            <div className="font-medium text-sm">{current.code}</div>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Select Currency
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {CURRENCIES.map((c) => (
          <DropdownMenuItem
            key={c.code}
            onClick={() => {
              updateMutation.mutate(c.code);
              setOpen(false);
            }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <span className="w-6 text-center font-semibold text-sm">{c.symbol}</span>
            <div className="flex-1">
              <div className="text-sm font-medium">{c.code}</div>
              <div className="text-xs text-muted-foreground">{c.name}</div>
            </div>
            {c.code === currency && <Check className="w-4 h-4 text-primary" />}
          </DropdownMenuItem>
        ))}
        {ratesData && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Live Rates (1 USD)
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {CURRENCIES.filter((c) => c.code !== "USD").map((c) => (
                  <div key={c.code} className="flex justify-between">
                    <span className="text-muted-foreground">{c.code}</span>
                    <span className="font-medium">
                      {ratesData.rates[c.code]?.toFixed(2) ?? "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
