"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { mockLeads } from "@/lib/mock-data";
import type { Lead, LeadStatus, LeadTemperature, LeadSource } from "@/lib/types";
import { Search, ArrowUpDown, Mail, ChevronRight, GripVertical } from "lucide-react";
import { formatDateShort } from "@/lib/format-date";

const statusLabels: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  replied: "Replied",
  qualified: "Qualified",
  closed_won: "Won",
  closed_lost: "Lost",
};

const statusColors: Record<LeadStatus, string> = {
  new: "bg-amber-light text-amber",
  contacted: "bg-sage-light text-forest",
  replied: "bg-forest-light text-forest-deep",
  qualified: "bg-forest text-cream",
  closed_won: "bg-forest-deep text-cream",
  closed_lost: "bg-stone-light text-ink-muted",
};

const tempColors: Record<LeadTemperature, string> = {
  hot: "bg-rust-light text-rust",
  medium: "bg-amber-light text-amber",
  cold: "bg-stone-light text-ink-muted",
};

type SortField = "full_name" | "created_at" | "status" | "temperature" | "source" | "manual";
type SortDir = "asc" | "desc";

export function PipelineContent() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [tempFilter, setTempFilter] = useState<LeadTemperature | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<LeadSource | "all">("all");
  const [sortField, setSortField] = useState<SortField>("manual");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Manual order state
  const [manualOrder, setManualOrder] = useState<string[]>(mockLeads.map((l) => l.id));

  // Drag state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<"above" | "below" | null>(null);
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());

  const toggleSort = (field: SortField) => {
    if (field === "manual") {
      setSortField("manual");
      return;
    }
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const isManualMode = sortField === "manual" && !search && statusFilter === "all" && tempFilter === "all" && sourceFilter === "all";

  const filtered = useMemo(() => {
    let leads = [...mockLeads];

    if (search) {
      const q = search.toLowerCase();
      leads = leads.filter(
        (l) =>
          l.full_name.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.phone.includes(q) ||
          l.state.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      leads = leads.filter((l) => l.status === statusFilter);
    }
    if (tempFilter !== "all") {
      leads = leads.filter((l) => l.temperature === tempFilter);
    }
    if (sourceFilter !== "all") {
      leads = leads.filter((l) => l.source === sourceFilter);
    }

    if (sortField === "manual") {
      leads.sort((a, b) => manualOrder.indexOf(a.id) - manualOrder.indexOf(b.id));
    } else {
      leads.sort((a, b) => {
        const av = a[sortField];
        const bv = b[sortField];
        const cmp = typeof av === "string" ? av.localeCompare(bv as string) : 0;
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return leads;
  }, [search, statusFilter, tempFilter, sourceFilter, sortField, sortDir, manualOrder]);

  const handleDragStart = useCallback((e: React.DragEvent, leadId: string) => {
    setDraggedId(leadId);
    e.dataTransfer.effectAllowed = "move";
    // Make the drag image semi-transparent
    const row = rowRefs.current.get(leadId);
    if (row) {
      e.dataTransfer.setDragImage(row, 0, row.offsetHeight / 2);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, leadId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (leadId === draggedId) return;

    const row = rowRefs.current.get(leadId);
    if (!row) return;

    const rect = row.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const pos = e.clientY < midY ? "above" : "below";

    setDragOverId(leadId);
    setDropPosition(pos);
  }, [draggedId]);

  const handleDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    setManualOrder((prev) => {
      const newOrder = [...prev];
      const fromIdx = newOrder.indexOf(draggedId);
      if (fromIdx === -1) return prev;

      // Remove dragged item
      newOrder.splice(fromIdx, 1);

      // Find target position
      let toIdx = newOrder.indexOf(targetId);
      if (toIdx === -1) return prev;

      if (dropPosition === "below") {
        toIdx += 1;
      }

      // Insert at new position
      newOrder.splice(toIdx, 0, draggedId);
      return newOrder;
    });

    // Switch to manual sort mode
    setSortField("manual");

    setDraggedId(null);
    setDragOverId(null);
    setDropPosition(null);
  }, [draggedId, dropPosition]);

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDragOverId(null);
    setDropPosition(null);
  }, []);

  const moveRow = useCallback((leadId: string, direction: "up" | "down") => {
    setSortField("manual");
    setManualOrder((prev) => {
      const newOrder = [...prev];
      const idx = newOrder.indexOf(leadId);
      if (idx === -1) return prev;
      if (direction === "up" && idx === 0) return prev;
      if (direction === "down" && idx === newOrder.length - 1) return prev;

      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];
      return newOrder;
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[var(--font-heading)] text-3xl text-ink">
            Pipeline
          </h1>
          <p className="text-ink-muted text-sm mt-1">
            {filtered.length} lead{filtered.length !== 1 && "s"}
            {isManualMode && " — drag to reorder"}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
          <Input
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value.slice(0, 100))}
            className="pl-9 bg-warm-white border-border"
            maxLength={100}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as LeadStatus | "all")}
        >
          <SelectTrigger className="w-[140px] bg-warm-white border-border">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="replied">Replied</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="closed_won">Won</SelectItem>
            <SelectItem value="closed_lost">Lost</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={tempFilter}
          onValueChange={(v) => setTempFilter(v as LeadTemperature | "all")}
        >
          <SelectTrigger className="w-[140px] bg-warm-white border-border">
            <SelectValue placeholder="Temperature" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Temp</SelectItem>
            <SelectItem value="hot">Hot</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="cold">Cold</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={sourceFilter}
          onValueChange={(v) => setSourceFilter(v as LeadSource | "all")}
        >
          <SelectTrigger className="w-[140px] bg-warm-white border-border">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="website">Website</SelectItem>
            <SelectItem value="ad">Ad</SelectItem>
            <SelectItem value="referral">Referral</SelectItem>
            <SelectItem value="bob">Bob</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-warm-white rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10" />
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => toggleSort("full_name")}
              >
                <div className="flex items-center gap-1">
                  Name
                  <ArrowUpDown className="w-3 h-3 text-ink-muted" />
                </div>
              </TableHead>
              <TableHead>Contact</TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => toggleSort("source")}
              >
                <div className="flex items-center gap-1">
                  Source
                  <ArrowUpDown className="w-3 h-3 text-ink-muted" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => toggleSort("temperature")}
              >
                <div className="flex items-center gap-1">
                  Temp
                  <ArrowUpDown className="w-3 h-3 text-ink-muted" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => toggleSort("status")}
              >
                <div className="flex items-center gap-1">
                  Status
                  <ArrowUpDown className="w-3 h-3 text-ink-muted" />
                </div>
              </TableHead>
              <TableHead>Sequence</TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => toggleSort("created_at")}
              >
                <div className="flex items-center gap-1">
                  Added
                  <ArrowUpDown className="w-3 h-3 text-ink-muted" />
                </div>
              </TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((lead, idx) => {
              const isDragged = draggedId === lead.id;
              const isDragOver = dragOverId === lead.id;

              return (
                <TableRow
                  key={lead.id}
                  ref={(el) => {
                    if (el) rowRefs.current.set(lead.id, el);
                  }}
                  draggable={isManualMode}
                  onDragStart={(e) => handleDragStart(e, lead.id)}
                  onDragOver={(e) => handleDragOver(e, lead.id)}
                  onDrop={(e) => handleDrop(e, lead.id)}
                  onDragEnd={handleDragEnd}
                  className={`group transition-all duration-200 ${
                    isDragged ? "opacity-40 scale-[0.98]" : ""
                  } ${
                    isDragOver && dropPosition === "above"
                      ? "border-t-2 !border-t-forest"
                      : ""
                  } ${
                    isDragOver && dropPosition === "below"
                      ? "border-b-2 !border-b-forest"
                      : ""
                  }`}
                  style={{
                    position: "relative",
                  }}
                >
                  {/* Drag handle */}
                  <TableCell className="w-10 px-2">
                    {isManualMode ? (
                      <div className="flex flex-col items-center">
                        <button
                          onClick={() => moveRow(lead.id, "up")}
                          disabled={idx === 0}
                          className="text-ink-muted/40 hover:text-forest disabled:opacity-20 transition-colors p-0.5"
                          aria-label="Move up"
                        >
                          <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                            <path d="M6 1L1 6.5M6 1L11 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        <GripVertical className="w-4 h-4 text-ink-muted/30 cursor-grab active:cursor-grabbing" />
                        <button
                          onClick={() => moveRow(lead.id, "down")}
                          disabled={idx === filtered.length - 1}
                          className="text-ink-muted/40 hover:text-forest disabled:opacity-20 transition-colors p-0.5"
                          aria-label="Move down"
                        >
                          <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                            <path d="M6 7L1 1.5M6 7L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-ink-muted/30 pl-1">{idx + 1}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/pipeline/${lead.id}`}
                      className="flex items-center gap-3 hover:underline"
                    >
                      <div className="w-8 h-8 rounded-full bg-forest-light flex items-center justify-center text-xs font-semibold text-forest-deep shrink-0">
                        {lead.first_name[0]}
                        {lead.full_name.split(" ")[1]?.[0] || ""}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{lead.full_name}</p>
                        <p className="text-xs text-ink-muted">{lead.state}</p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{lead.email}</p>
                    <p className="text-xs text-ink-muted">{lead.phone}</p>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm capitalize">{lead.source}</span>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs border-0 ${tempColors[lead.temperature]}`}>
                      {lead.temperature}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs border-0 ${statusColors[lead.status]}`}>
                      {statusLabels[lead.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3].map((step) => (
                        <div
                          key={step}
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium ${
                            lead.email_sequence_step >= step
                              ? "bg-forest text-cream"
                              : "bg-stone-light text-ink-muted"
                          }`}
                        >
                          {step}
                        </div>
                      ))}
                      {lead.email_sequence_active && (
                        <Mail className="w-3.5 h-3.5 text-forest ml-1" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-ink-muted">
                      {formatDateShort(lead.created_at)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Link href={`/pipeline/${lead.id}`}>
                      <ChevronRight className="w-4 h-4 text-ink-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-ink-muted">
                  No leads match your filters
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
