"use client";

import { useEffect, useState, FormEvent } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, FileText, Download, Send, Edit, Trash2, ChevronLeft, ChevronRight, Copy, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { draftsApi, clientsApi, Draft, DraftUpdate, Client } from "@/lib/api";
import { format } from "date-fns";

const statusStyles = {
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  ready: "bg-terracotta/10 text-terracotta",
  sent: "bg-emerald/10 text-emerald",
};

const statusLabels = {
  draft: "Draft",
  ready: "Ready to Send",
  sent: "Sent",
};

const sectionIcons = {
  done: "✅",
  in_progress: "🔄",
  blocked: "🚫",
  next: "📅",
};

const sectionLabels = {
  done: "Done",
  in_progress: "In Progress",
  blocked: "Blocked",
  next: "Next Week",
};

interface DraftWithClient extends Draft {
  client_name?: string;
  client?: Client;
  parsedContent?: {
    done: string[];
    in_progress: string[];
    blocked: string[];
    next: string[];
  };
}

export default function DraftsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedDraft, setSelectedDraft] = useState<DraftWithClient | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [activeTab, setActiveTab] = useState<string | null>("all");
  const [drafts, setDrafts] = useState<DraftWithClient[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [draftsData, clientsData] = await Promise.all([
          draftsApi.list(50, 0),
          clientsApi.list(),
        ]);

        const draftsWithClients = draftsData.map((draft) => {
          const client = clientsData.find((c) => c.id === draft.client_id);
          let parsedContent = {
            done: ["No significant updates this week."],
            in_progress: ["No active work in progress."],
            blocked: ["No blockers reported."],
            next: ["Planning next sprint priorities."],
          };
          try {
            parsedContent = JSON.parse(draft.content);
          } catch {
            // Keep defaults
          }
          return {
            ...draft,
            client_name: client?.name || `Client ${draft.client_id}`,
            client,
            parsedContent,
          };
        });

        setDrafts(draftsWithClients);
        setClients(clientsData);
      } catch (err) {
        console.error("Failed to load drafts:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const filteredDrafts = drafts.filter((d) =>
    (d.client_name || "").toLowerCase().includes(search.toLowerCase()) &&
    (!activeTab || activeTab === "all" || d.status === activeTab)
  );

  useEffect(() => {
    if (!selectedDraft && filteredDrafts.length > 0) {
      setSelectedDraft(filteredDrafts[0]);
    }
  }, [filteredDrafts, selectedDraft]);

  const handleSaveEdit = async (section: string) => {
    if (!selectedDraft || !selectedDraft.parsedContent) return;

    setIsSaving(true);
    try {
      const updatedContent = {
        ...selectedDraft.parsedContent,
        [section]: editContent.split("\n").filter((line) => line.trim() !== ""),
      };

      const draftUpdate: DraftUpdate = {
        content: JSON.stringify(updatedContent, null, 2),
        status: "edited",
      };

      await draftsApi.update(selectedDraft.id, draftUpdate);

      setDrafts(
        drafts.map((d) =>
          d.id === selectedDraft.id
            ? { ...d, content: JSON.stringify(updatedContent), status: "edited", parsedContent: updatedContent }
            : d
        )
      );

      setEditingSection(null);
    } catch (err) {
      console.error("Failed to save edit:", err);
      alert("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyDraft = () => {
    if (selectedDraft && selectedDraft.parsedContent) {
      const formatted = formatDraftForClipboard(selectedDraft.parsedContent);
      navigator.clipboard.writeText(formatted);
      // TODO: Show toast notification
    }
  };

  const handleFinalize = async () => {
    if (!selectedDraft) return;

    try {
      await draftsApi.finalize(selectedDraft.id);
      setDrafts(
        drafts.map((d) =>
          d.id === selectedDraft.id ? { ...d, status: "sent" as const } : d
        )
      );
      setSelectedDraft((d) => (d ? { ...d, status: "sent" as const } : null));
    } catch (err) {
      console.error("Failed to finalize draft:", err);
      alert("Failed to finalize draft");
    }
  };

  const handleDeleteDraft = async (draftId: number) => {
    if (!confirm("Are you sure you want to delete this draft?")) return;

    try {
      await draftsApi.delete(draftId);
      setDrafts(drafts.filter((d) => d.id !== draftId));
      if (selectedDraft?.id === draftId) {
        setSelectedDraft(null);
      }
    } catch (err) {
      console.error("Failed to delete draft:", err);
      alert("Failed to delete draft");
    }
  };

  const formatDraftForClipboard = (content: any) => {
    let text = "";
    for (const [key, items] of Object.entries(content)) {
      text += `${sectionIcons[key as keyof typeof sectionIcons]} ${sectionLabels[key as keyof typeof sectionLabels]}\n`;
      text += `${"-".repeat(20)}\n`;
      for (const item of items as string[]) {
        text += `  • ${item}\n`;
      }
      text += "\n";
    }
    return text;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-terracotta" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-ink">Drafts</h1>
            <p className="text-muted-foreground mt-1">Review, edit, and send client updates</p>
          </div>
          <Button onClick={() => router.push("/dashboard/drafts/new")}>
            <Plus className="w-4 h-4 mr-2" />
            Generate Draft
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search drafts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={activeTab} onValueChange={(v) => setActiveTab(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="ready">Ready to Send</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Main Content - Split View */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Draft List */}
          <Card className="border-terracotta/20 lg:col-span-1">
            <CardHeader>
              <CardTitle>Your Drafts</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1 p-2 max-h-[600px] overflow-y-auto">
                {filteredDrafts.map((draft) => (
                  <Button
                    key={draft.id}
                    variant={selectedDraft?.id === draft.id ? "default" : "ghost"}
                    className="w-full justify-start gap-3 px-3 py-2 text-left hover:bg-terracotta/5"
                    onClick={() => setSelectedDraft(draft)}
                  >
                    <FileText className="w-4 h-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="font-medium text-sm truncate">{draft.client_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Week of {format(new Date(draft.week_of), "MMM d, yyyy")}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${statusStyles[draft.status as keyof typeof statusStyles]}`}
                    >
                      {statusLabels[draft.status as keyof typeof statusLabels]}
                    </span>
                  </Button>
                ))}
              </div>
              {filteredDrafts.length === 0 && (
                <div className="p-6 text-center text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3" />
                  <p>No drafts found</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Draft Editor */}
          {selectedDraft && selectedDraft.parsedContent && (
            <Card className="border-terracotta/20 lg:col-span-2 flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="font-display text-xl">{selectedDraft.client_name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Week of {format(new Date(selectedDraft.week_of), "MMM d, yyyy")} • Updated {format(new Date(selectedDraft.updated_at), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopyDraft}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    const content = formatDraftForClipboard(selectedDraft.parsedContent!);
                    const blob = new Blob([content], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${selectedDraft.client_name}-${format(new Date(selectedDraft.week_of), "yyyy-MM-dd")}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  {selectedDraft.status !== "sent" && (
                    <>
                      <Button variant="outline" size="sm" onClick={handleFinalize}>
                        <Send className="w-4 h-4 mr-2" />
                        Send
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteDraft(selectedDraft.id)} className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto p-0">
                <Tabs value={editingSection ? "edit" : "view"} onValueChange={() => {}} className="h-full">
                  <TabsList className="border-b border-terracotta/20 px-4">
                    <TabsTrigger value="view" disabled={!!editingSection}>Preview</TabsTrigger>
                    <TabsTrigger value="edit" disabled={!editingSection}>Edit</TabsTrigger>
                  </TabsList>

                  <TabsContent value="view" className="p-4 h-[500px] overflow-y-auto">
                    <div className="space-y-6 max-w-3xl">
                      {Object.entries(selectedDraft.parsedContent).map(([section, items]) => (
                        <div key={section} className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{sectionIcons[section as keyof typeof sectionIcons]}</span>
                            <h3 className="font-display font-semibold text-ink">{sectionLabels[section as keyof typeof sectionLabels]}</h3>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 ml-auto"
                              onClick={() => {
                                setEditContent((items as string[]).join("\n"));
                                setEditingSection(section);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                          <ul className="space-y-2 ml-6">
                            {(items as string[]).map((item, index) => (
                              <li key={index} className="text-sm text-ink/90 leading-relaxed">
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="edit" className="p-4 h-[500px] overflow-y-auto">
                    {editingSection && (
                      <div className="space-y-4 max-w-3xl">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-display font-semibold text-ink">
                            Editing {sectionLabels[editingSection as keyof typeof sectionLabels]}
                          </h3>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setEditingSection(null)}>
                              <ChevronLeft className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                            <Button size="sm" onClick={() => handleSaveEdit(editingSection)} disabled={isSaving}>
                              {isSaving ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Check className="w-4 h-4 mr-1" />
                                  Save
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                        <Label className="block text-sm font-medium mb-1">One item per line</Label>
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="min-h-[300px] font-mono text-sm"
                          placeholder="Enter items, one per line..."
                        />
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!selectedDraft && filteredDrafts.length === 0 && (
            <Card className="border-terracotta/20 lg:col-span-2 text-center py-12">
              <CardContent>
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-display text-lg font-semibold text-ink mb-2">No drafts to display</h3>
                <p className="text-muted-foreground mb-4">
                  {search ? "Try adjusting your search or filters" : "Generate your first draft to get started"}
                </p>
                <Button onClick={() => router.push("/dashboard/drafts/new")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Generate Draft
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}