"use client";

import { useState, useCallback } from "react";
import Papa from "papaparse";
import { importLeads } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";

interface ParsedRow {
  full_name: string;
  email: string;
  phone: string;
  state: string;
  riding_goal: string;
  inquiry_type: string;
  [key: string]: string;
}

// HubSpot export column names → our schema
const HUBSPOT_COLUMN_MAP: Record<string, string> = {
  "first name": "first_name",
  "last name": "last_name",
  "firstname": "first_name",
  "lastname": "last_name",
  "email": "email",
  "email address": "email",
  "phone": "phone",
  "phone number": "phone",
  "mobile phone number": "phone",
  "state/region": "state",
  "state": "state",
  "city": "city",
  "lead status": "hubspot_status",
  "lifecycle stage": "hubspot_lifecycle",
  "create date": "created_at",
  "became a lead date": "created_at",
  "contact owner": "assigned_to",
  "company name": "company",
  "associated company": "company",
  "notes": "notes",
  "recent deal amount": "deal_amount",
  "number of times contacted": "times_contacted",
  "last activity date": "last_contacted_at",
};

// Generic column name normalization
const GENERIC_COLUMN_MAP: Record<string, string> = {
  "name": "full_name",
  "full name": "full_name",
  "full_name": "full_name",
  "email": "email",
  "phone": "phone",
  "state": "state",
  "first name": "first_name",
  "first_name": "first_name",
  "last name": "last_name",
  "last_name": "last_name",
  "riding goal": "riding_goal",
  "riding_goal": "riding_goal",
  "height": "height",
  "weight": "weight",
  "notes": "notes",
};

type ImportSource = "auto" | "hubspot" | "generic";

function sanitizeCell(v: string): string {
  if (/^[=+\-@\t\r]/.test(v)) return "'" + v;
  return v;
}

function detectSource(headers: string[]): ImportSource {
  const lower = headers.map((h) => h.toLowerCase().trim());
  const hubspotSignals = ["first name", "last name", "lifecycle stage", "lead status", "contact owner", "create date"];
  const matches = hubspotSignals.filter((s) => lower.includes(s));
  if (matches.length >= 2) return "hubspot";
  return "generic";
}

function normalizeRow(raw: Record<string, string>, source: ImportSource): ParsedRow {
  const map = source === "hubspot" ? { ...GENERIC_COLUMN_MAP, ...HUBSPOT_COLUMN_MAP } : GENERIC_COLUMN_MAP;
  const row: ParsedRow = { full_name: "", email: "", phone: "", state: "", riding_goal: "", inquiry_type: "general" };

  for (const [rawKey, rawVal] of Object.entries(raw)) {
    const key = rawKey.toLowerCase().trim();
    const mapped = map[key] || key.replace(/\s+/g, "_");
    row[mapped] = sanitizeCell((rawVal || "").trim());
  }

  // Build full_name from first + last if needed
  if (!row.full_name && row.first_name) {
    row.full_name = `${row.first_name} ${row.last_name || ""}`.trim();
  }

  return row;
}

export function ImportContent() {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [imported, setImported] = useState(false);
  const [error, setError] = useState("");
  const [source, setSource] = useState<ImportSource>("auto");
  const [detectedSource, setDetectedSource] = useState<ImportSource>("generic");

  const activeSource = source === "auto" ? detectedSource : source;

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    if (f.size > 10 * 1024 * 1024) {
      setError("File too large. Maximum size is 10 MB.");
      return;
    }

    setFile(f);
    setImported(false);
    setError("");

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;

      const result = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h: string) => h.trim(),
      });

      if (result.errors.length > 0 && result.data.length === 0) {
        setError(`CSV parse error: ${result.errors[0].message}`);
        return;
      }

      if (result.data.length === 0) {
        setError("CSV has no data rows.");
        return;
      }

      const csvHeaders = result.meta.fields || [];
      setHeaders(csvHeaders);

      const detected = detectSource(csvHeaders);
      setDetectedSource(detected);

      const effectiveSource = source === "auto" ? detected : source;

      const parsed: ParsedRow[] = [];
      for (const rawRow of result.data as Record<string, string>[]) {
        const row = normalizeRow(rawRow, effectiveSource);
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (row.email && emailRegex.test(row.email)) {
          parsed.push(row);
        }
      }

      if (parsed.length === 0) {
        setError("No rows with valid email addresses found.");
        return;
      }

      setRows(parsed);
    };
    reader.readAsText(f);
  }, [source]);

  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  const handleImport = async () => {
    setImporting(true);
    setError("");
    const leadsToImport = rows
      .filter((r) => r.email)
      .map((r) => ({
        full_name: r.full_name || r.email.split("@")[0],
        first_name: r.first_name || r.full_name?.split(" ")[0] || "",
        email: r.email,
        phone: r.phone,
        state: r.state,
        riding_goal: r.riding_goal,
        inquiry_type: (r.inquiry_type === "veteran" ? "veteran" : "general") as "general" | "veteran",
      }));

    const result = await importLeads(leadsToImport);
    setImporting(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setImportedCount(result.count || 0);
    setImported(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[var(--font-heading)] text-3xl text-ink">Import Leads</h1>
        <p className="text-ink-muted text-sm mt-1">
          Upload a CSV from HubSpot, ad platforms, or any spreadsheet. Leads are auto-tagged as &ldquo;ad leads.&rdquo;
        </p>
      </div>

      {/* Source selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-ink-muted">Import from:</span>
        <Select value={source} onValueChange={(v) => setSource(v as ImportSource)}>
          <SelectTrigger className="w-[200px] bg-warm-white border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Auto-detect</SelectItem>
            <SelectItem value="hubspot">HubSpot Export</SelectItem>
            <SelectItem value="generic">Generic CSV</SelectItem>
          </SelectContent>
        </Select>
        {file && detectedSource === "hubspot" && source === "auto" && (
          <Badge className="bg-forest-light text-forest-deep text-xs border-0">
            Detected: HubSpot
          </Badge>
        )}
      </div>

      {/* Upload area */}
      <Card className="bg-warm-white border-border shadow-none">
        <CardContent className="pt-6">
          <label className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-stone rounded-xl cursor-pointer hover:border-forest hover:bg-forest-light/30 transition-colors">
            <Upload className="w-10 h-10 text-ink-muted mb-3" />
            <p className="text-sm font-medium text-ink">
              {file ? file.name : "Click to upload CSV"}
            </p>
            <p className="text-xs text-ink-muted mt-1">
              {activeSource === "hubspot"
                ? "HubSpot columns: First Name, Last Name, Email, Phone, State/Region, Lead Status"
                : "Expected columns: Name, Email, Phone, State"}
            </p>
            <p className="text-xs text-ink-muted/60 mt-0.5">Max 10 MB</p>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-center gap-2 text-sm text-rust bg-rust-light px-4 py-3 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Preview */}
      {rows.length > 0 && !imported && (
        <Card className="bg-warm-white border-border shadow-none">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-ink-light uppercase tracking-wider flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Preview — {rows.length} lead{rows.length !== 1 && "s"}
            </CardTitle>
            <div className="flex items-center gap-2">
              {activeSource === "hubspot" && (
                <Badge className="bg-forest-light text-forest-deep text-xs border-0">
                  HubSpot format
                </Badge>
              )}
              <Badge className="bg-amber-light text-amber text-xs border-0">
                Will be tagged: ad lead
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>State</TableHead>
                    {activeSource === "hubspot" && <TableHead>HubSpot Status</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 10).map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-ink-muted text-xs">{i + 1}</TableCell>
                      <TableCell className="text-sm">{row.full_name || "—"}</TableCell>
                      <TableCell className="text-sm">{row.email || "—"}</TableCell>
                      <TableCell className="text-sm">{row.phone || "—"}</TableCell>
                      <TableCell className="text-sm">{row.state || "—"}</TableCell>
                      {activeSource === "hubspot" && (
                        <TableCell className="text-sm">{row.hubspot_status || "—"}</TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {rows.length > 10 && (
              <p className="text-xs text-ink-muted mt-2">
                Showing first 10 of {rows.length} rows
              </p>
            )}
            <div className="mt-4 flex gap-3">
              <Button
                onClick={handleImport}
                disabled={importing}
                className="bg-forest text-cream hover:bg-forest-deep"
              >
                {importing ? "Importing..." : `Import ${rows.length} Lead${rows.length !== 1 ? "s" : ""}`}
              </Button>
              <Button
                variant="outline"
                onClick={() => { setFile(null); setRows([]); setHeaders([]); setError(""); }}
                className="border-border"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success */}
      {imported && (
        <Card className="bg-forest-light border-forest/20 shadow-none">
          <CardContent className="pt-6 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-forest" />
            <div>
              <p className="text-sm font-medium text-forest-deep">
                Successfully imported {importedCount} lead{importedCount !== 1 && "s"}
                {importedCount < rows.length && ` (${rows.length - importedCount} skipped as duplicates)`}
              </p>
              <p className="text-xs text-forest">
                All leads tagged as &ldquo;ad lead&rdquo; and added to the pipeline.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
