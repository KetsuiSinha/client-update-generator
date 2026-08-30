"use client";

import { Suspense, useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, FileText, Zap, AlertCircle, Calendar } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format, startOfWeek, addDays, subDays } from "date-fns";
import { clientsApi, Client } from "@/lib/api";

interface GenerateDraftState {
  clientId: number | null;
  weekOf: Date;
  autoIngest: boolean;
  isGenerating: boolean;
  error: string | null;
  generatedDraft: any | null;
}

function NewDraftPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<GenerateDraftState>({
    clientId: null,
    weekOf: startOfWeek(new Date(), { weekStartsOn: 1 }),
    autoIngest: true,
    isGenerating: false,
    error: null,
    generatedDraft: null,
  });
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);

  useEffect(() => {
    async function fetchClients() {
      try {
        const data = await clientsApi.list();
        setClients(data);
        const clientIdParam = searchParams.get("client");
        if (clientIdParam) {
          const clientId = parseInt(clientIdParam, 10);
          if (data.some((c) => c.id === clientId)) {
            setState((prev) => ({ ...prev, clientId }));
          }
        } else if (data.length > 0) {
          setState((prev) => ({ ...prev, clientId: data[0].id }));
        }
      } catch (err) {
        console.error("Failed to load clients:", err);
      } finally {
        setIsLoadingClients(false);
      }
    }

    fetchClients();
  }, [searchParams]);

  const handleGenerate = async () => {
    if (!state.clientId) {
      setState((prev) => ({ ...prev, error: "Please select a client" }));
      return;
    }

    setState((prev) => ({ ...prev, isGenerating: true, error: null, generatedDraft: null }));

    try {
      const weekOf = format(state.weekOf, "yyyy-MM-dd'T'HH:mm:ssXXX");
      const draft = await clientsApi.generateDraft(state.clientId, {
        week_of: weekOf,
        auto_ingest: state.autoIngest,
      });

      setState((prev) => ({ ...prev, generatedDraft: draft, isGenerating: false }));

      router.push(`/dashboard/drafts?draft=${draft.id}`);
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isGenerating: false,
        error: err instanceof Error ? err.message : "Failed to generate draft",
      }));
    }
  };

  const handleWeekChange = (dateString: string) => {
    const date = new Date(dateString + "T00:00:00");
    if (!isNaN(date.getTime())) {
      setState((prev) => ({ ...prev, weekOf: startOfWeek(date, { weekStartsOn: 1 }) }));
    }
  };

  const weekStart = startOfWeek(state.weekOf, { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);
  const weekInputValue = format(weekStart, "yyyy-MM-dd");

  if (isLoadingClients) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-terracotta" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/drafts")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="font-display text-3xl font-bold text-ink">Generate Draft</h1>
            <p className="text-muted-foreground mt-1">Create a new client update from recent activity</p>
          </div>
        </div>

        {/* Client Selection */}
        <Card className="border-terracotta/20">
          <CardHeader>
            <CardTitle>Select Client</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={state.clientId?.toString() || ""}
              onValueChange={(value) => setState((prev) => ({ ...prev, clientId: value ? parseInt(value, 10) : null }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a client..." />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id.toString()}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {clients.length === 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                No clients found. <Link href="/dashboard/clients/new" className="text-terracotta hover:underline">Add a client first</Link>.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Week Selection */}
        <Card className="border-terracotta/20">
          <CardHeader>
            <CardTitle>Week to Generate For</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="date"
                value={weekInputValue}
                onChange={(e) => handleWeekChange(e.target.value)}
                className="pl-10"
                min={format(subDays(new Date(), 365), "yyyy-MM-dd")}
                max={format(new Date(), "yyyy-MM-dd")}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              Week of <strong>{format(weekStart, "MMMM d, yyyy")}</strong> to <strong>{format(weekEnd, "MMMM d, yyyy")}</strong>
            </p>
          </CardContent>
        </Card>

        {/* Options */}
        <Card className="border-terracotta/20">
          <CardHeader>
            <CardTitle>Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="auto-ingest"
                checked={state.autoIngest}
                onChange={(e) => setState((prev) => ({ ...prev, autoIngest: e.target.checked }))}
                className="w-4 h-4 rounded border-border text-terracotta focus:ring-terracotta"
              />
              <Label htmlFor="auto-ingest" className="cursor-pointer">
                <span className="font-medium text-ink">Auto-ingest activity</span>
                <p className="text-sm text-muted-foreground">Fetch latest activity from connected integrations before generating</p>
              </Label>
            </div>

            <div className="flex items-center gap-3 p-4 bg-amber/5 border border-amber/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber flex-shrink-0" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Note:</strong> This will pull activity from GitHub and other connected integrations for the selected week,
                filter for relevance, and generate a draft using AI. The draft will be saved and ready for review.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generate Button */}
        <div className="flex gap-4">
          <Button
            size="lg"
            className="flex-1 py-4"
            onClick={handleGenerate}
            disabled={state.isGenerating || !state.clientId || clients.length === 0}
          >
            {state.isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating Draft...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 mr-2" />
                Generate Draft
              </>
            )}
          </Button>
          <Button variant="outline" size="lg" className="py-4" onClick={() => router.push("/dashboard/drafts")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Drafts
          </Button>
        </div>

        {state.error && (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{state.error}</span>
          </div>
        )}

        {/* Help Text */}
        <Card className="border-terracotta/20 bg-terracotta/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-terracotta mt-0.5 flex-shrink-0" />
              <div className="text-sm text-ink/80">
                <h4 className="font-medium text-ink mb-2">How it works</h4>
                <ol className="space-y-1 list-decimal list-inside">
                  <li>Select a client and the week you want to generate for</li>
                  <li>Enable auto-ingest to fetch latest activity from GitHub/other integrations</li>
                  <li>Pulse filters activity by relevance (score ≥ 30)</li>
                  <li>AI generates a structured update matching the client's tone profile</li>
                  <li>Review, edit, and send the draft from the Drafts page</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default function NewDraftPage() {
  return (
    <Suspense fallback={<DashboardLayout><div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-terracotta" /></div></DashboardLayout>}>
      <NewDraftPageContent />
    </Suspense>
  );
}