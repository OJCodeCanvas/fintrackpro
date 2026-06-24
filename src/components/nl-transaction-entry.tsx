"use client";

import { useState, useRef } from "react";
import { Mic, Camera, Sparkles, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api-client";
import { toast } from "sonner";

interface ParsedTransaction {
  amount: number;
  type: "income" | "expense";
  categoryId: string;
  date: string;
  notes: string;
  tags: string;
}

interface Props {
  onParsed: (tx: ParsedTransaction) => void;
}

export function NLTransactionEntry({ onParsed }: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleParse() {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const { transaction } = await apiFetch<{ transaction: ParsedTransaction }>("/api/nl-parse", {
        method: "POST",
        body: JSON.stringify({ text: text.trim() }),
      });
      onParsed(transaction);
      setText("");
      toast.success("Transaction parsed — review and save");
    } catch {
      toast.error("Could not parse. Try: 'spent $45 on groceries'");
    } finally {
      setLoading(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanLoading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { transaction } = await apiFetch<{ transaction: ParsedTransaction }>("/api/scan-receipt", {
        method: "POST",
        body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
      });
      onParsed(transaction);
      toast.success("Receipt scanned — review and save");
    } catch {
      toast.error("Could not scan receipt. Try a clearer photo.");
    } finally {
      setScanLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleParse()}
            placeholder='e.g. "spent $45 on groceries" or "received $3000 salary"'
            className="pl-9 pr-8"
            disabled={loading}
          />
          {text && (
            <button
              onClick={() => setText("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <Button onClick={handleParse} disabled={!text.trim() || loading} variant="secondary" size="icon">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
        </Button>
        <Button
          onClick={() => fileRef.current?.click()}
          disabled={scanLoading}
          variant="secondary"
          size="icon"
          title="Scan receipt"
        >
          {scanLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>
      <p className="text-xs text-muted-foreground px-1">
        Type naturally or tap <Camera className="w-3 h-3 inline" /> to scan a receipt
      </p>
    </div>
  );
}
