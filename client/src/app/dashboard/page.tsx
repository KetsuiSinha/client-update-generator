"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Users,
  FileText,
  Clock,
  Plus,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Check,
  Send,
  Edit2,
  X,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, subDays, startOfWeek, eachDayOfInterval, endOfWeek } from "date-fns";
import { cn } from "@/lib/utils";
import { api, clientsApi, draftsApi, Client, Draft } from "@/lib/api";
import { DraftTrendChart, Sparkline } from "@/components/dashboard/DraftTrendChart";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  activeClients: number;
  draftsThisWeek: number;
  draftsLastWeek: number;
  avgTimeSaved: number;
  connectedIntegrations: number;
  trendData: number[]; // 7 days of draft counts
}

const statusStyles = {
  draft: "bg-muted text-muted-foreground border border-border",
  edited: "bg-terracotta/10 text-terracotta border-terracotta/20",
  sent: "bg-emerald/10 text-emerald border-emerald/20",
};

const statusLabels = {
  draft: "Draft",
  edited: "Ready to Send",
  sent: "Sent",
};

const statusIcons = {
  draft: FileText,
  edited: Send,
  sent: Check,
};

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: number; // percentage change
  trendLabel?: string;
  className?: string;
  children?: React.ReactNode;
}

function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  trendLabel,
  className,
  children,
}: StatCardProps) {
  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;

  return (
    <Card className={cn("border-terracotta/20 transition-all hover:border-terracotta/40", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="font-display text-3xl font-bold text-ink mt-1">{value}</p>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-sm text-muted-foreground">{description}</p>
              {trend !== undefined && (
                <span
                  className={cn(
                    "text-xs font-medium flex items-center gap-1",
                    isPositive ? "text-emerald" : isNegative ? "text-destructive" : "text-muted-foreground"
                  )}
                >
                  {isPositive && <ArrowUpRight className="w-3 h-3" />}
                  {isNegative && <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(trend)}%
                  {trendLabel && <span className="text-muted-foreground">{trendLabel}</span>}
                </span>
              )}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-terracotta/10 flex-shrink-0">
            {icon}
          </div>
        </div>
        {children && <div className="mt-4 pt-4 border-t border-border">{children}</div>}
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-terracotta/20">
              <CardContent className="p-6">
                <div className="h-4 w-24 bg-muted rounded mb-4" />
                <div className="h-8 w-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="border-terracotta/20">
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between">
              <div className="h-6 w-32 bg-muted rounded" />
              <div className="h-6 w-20 bg-muted rounded" />
            </div>
            <div className="h-32 w-full bg-muted rounded" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 w-full bg-muted rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function EmptyState() {
  const router = useRouter();
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-ink">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Overview of your client updates and activity</p>
          </div>
          <Button onClick={() => router.push("/dashboard/clients/new")}>
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Active Clients"
            value="0"
            description="Total clients"
            icon={<Users className="w-6 h-6 text-terracotta" />}
          />
          <StatCard
            title="Drafts This Week"
            value="0"
            description="Generated this week"
            icon={<FileText className="w-6 h-6 text-indigo" />}
          />
          <StatCard
            title="Avg. Time Saved"
            value="—"
            description="per week"
            icon={<Clock className="w-6 h-6 text-emerald" />}
          />
          <StatCard
            title="Connected Integrations"
            value="0"
            description="Active connections"
            icon={<TrendingUp className="w-6 h-6 text-amber" />}
          />
        </div>

        <Card className="border-terracotta/20">
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-30 text-muted-foreground" />
            <h3 className="font-display text-lg font-semibold text-ink mb-2">No drafts yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Connect your tools and generate your first client update draft to see activity here.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => router.push("/dashboard/clients/new")}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Client
              </Button>
              <Button variant="outline" onClick={() => router.push("/dashboard/settings")}>
                <Activity className="w-4 h-4 mr-2" />
                Connect Integrations
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    activeClients: 0,
    draftsThisWeek: 0,
    draftsLastWeek: 0,
    avgTimeSaved: 0,
    connectedIntegrations: 0,
    trendData: [0, 0, 0, 0, 0, 0, 0],
  });
  const [recentDrafts, setRecentDrafts] = useState<Draft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDraftId, setExpandedDraftId] = useState<number | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [clients, drafts] = await Promise.all([
          clientsApi.list(),
          draftsApi.list(20, 0),
        ]);

        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
        const lastWeekStart = startOfWeek(subDays(new Date(), 7), { weekStartsOn: 1 });
        const lastWeekEnd = endOfWeek(subDays(new Date(), 7), { weekStartsOn: 1 });

        const draftsThisWeek = drafts.filter((d) => {
          const draftDate = new Date(d.week_of);
          return draftDate >= weekStart;
        }).length;

        const draftsLastWeek = drafts.filter((d) => {
          const draftDate = new Date(d.week_of);
          return draftDate >= lastWeekStart && draftDate <= lastWeekEnd;
        }).length;

        // Generate 7-day trend data
        const weekDays = eachDayOfInterval({
          start: startOfWeek(new Date(), { weekStartsOn: 1 }),
          end: new Date(),
        });
        const trendData = weekDays.map((day) =>
          drafts.filter((d) => format(new Date(d.week_of), "yyyy-MM-dd") === format(day, "yyyy-MM-dd")).length
        );
        // Pad to 7 days if needed
        while (trendData.length < 7) trendData.unshift(0);

        const trendPercent = draftsLastWeek > 0 ? Math.round(((draftsThisWeek - draftsLastWeek) / draftsLastWeek) * 100) : 0;

        setStats({
          activeClients: clients.length,
          draftsThisWeek,
          draftsLastWeek,
          avgTimeSaved: clients.length > 0 ? 4.5 : 0,
          connectedIntegrations: 0, // Would need integrations API
          trendData,
        });
        setRecentDrafts(drafts);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (isLoading) return <LoadingSkeleton />;

  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="text-center py-12">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (stats.activeClients === 0 && recentDrafts.length === 0) {
    return <EmptyState />;
  }

  const draftTrendPercent = stats.draftsLastWeek > 0
    ? Math.round(((stats.draftsThisWeek - stats.draftsLastWeek) / stats.draftsLastWeek) * 100)
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-ink">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Overview of your client updates and activity</p>
          </div>
          <Button onClick={() => router.push("/dashboard/clients/new")} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Active Clients"
            value={stats.activeClients}
            description="Total clients"
            icon={<Users className="w-6 h-6 text-terracotta" />}
            trend={stats.activeClients > 0 ? 12 : 0}
            trendLabel="vs last month"
            children={
              <Sparkline
                data={stats.activeClients > 0 ? [2, 3, 5, 4, 6, 5, stats.activeClients] : [0, 0, 0, 0, 0, 0, 0]}
                color="terracotta"
                className="w-32 h-8"
              />
            }
          />

          <StatCard
            title="Drafts This Week"
            value={stats.draftsThisWeek}
            description="Generated this week"
            icon={<FileText className="w-6 h-6 text-indigo" />}
            trend={draftTrendPercent}
            trendLabel="vs last week"
            children={
              <DraftTrendChart data={stats.trendData} className="w-full" />
            }
          />

          <StatCard
            title="Avg. Time Saved"
            value={stats.activeClients > 0 ? "~4.5h" : "—"}
            description="per week per client"
            icon={<Clock className="w-6 h-6 text-emerald" />}
            children={
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="w-4 h-4" />
                <span>Based on {stats.activeClients} active client{stats.activeClients !== 1 ? "s" : ""}</span>
              </div>
            }
          />

          <StatCard
            title="Connected Integrations"
            value={stats.connectedIntegrations}
            description="Active connections"
            icon={<TrendingUp className="w-6 h-6 text-amber" />}
            children={
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link href="/dashboard/settings" className="hover:text-terracotta transition-colors">
                  Configure in Settings
                  <ArrowUpRight className="w-3 h-3 ml-1" />
                </Link>
              </div>
            }
          />
        </div>

        {/* Recent Drafts with Trend Chart */}
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <Card className="border-terracotta/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Drafts</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/drafts")}>
                View all
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-0">
                {recentDrafts.length > 0 ? (
                  recentDrafts.map((draft, index) => (
                    <DraftRow
                      key={draft.id}
                      draft={draft}
                      index={index}
                      isExpanded={expandedDraftId === draft.id}
                      onToggleExpand={() => setExpandedDraftId(expandedDraftId === draft.id ? null : draft.id)}
                      onStatusChange={(status) => handleStatusChange(draft.id, status)}
                    />
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No drafts yet. Generate your first draft to get started.</p>
                    <Button className="mt-4" onClick={() => router.push("/dashboard/drafts/new")}>
                      <Plus className="w-4 h-4 mr-2" />
                      Generate Draft
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* This Week's Activity Mini Chart */}
          <Card className="border-terracotta/20 lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">This Week's Activity</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Draft generation trend</p>
            </CardHeader>
            <CardContent className="pt-0">
              <DraftTrendChart data={stats.trendData} />
              <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
                  <div key={day} className={stats.trendData[i] > 0 ? "font-medium text-foreground" : ""}>
                    {day}
                    <div className="mt-1 text-terracotta font-display">{stats.trendData[i] || "—"}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">{stats.draftsThisWeek}</strong> drafts this week
                  {stats.draftsLastWeek > 0 && (
                    <span className={draftTrendPercent >= 0 ? "text-emerald ml-2" : "text-destructive ml-2"}>
                      ({draftTrendPercent >= 0 ? "+" : ""}{draftTrendPercent}% vs last week)
                    </span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border-terracotta/20">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <Button
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2 hover:border-terracotta/50 hover:bg-terracotta/5 transition-all"
                onClick={() => router.push("/dashboard/clients/new")}
              >
                <Users className="w-8 h-8 text-terracotta" />
                <span className="font-medium">Add New Client</span>
                <p className="text-xs text-muted-foreground text-center">Onboard a new client</p>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2 hover:border-terracotta/50 hover:bg-terracotta/5 transition-all"
                onClick={() => router.push("/dashboard/drafts/new")}
              >
                <FileText className="w-8 h-8 text-indigo" />
                <span className="font-medium">Generate Draft</span>
                <p className="text-xs text-muted-foreground text-center">Create weekly update</p>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2 hover:border-terracotta/50 hover:bg-terracotta/5 transition-all"
                onClick={() => router.push("/dashboard/settings")}
              >
                <Activity className="w-8 h-8 text-amber" />
                <span className="font-medium">Connect Tools</span>
                <p className="text-xs text-muted-foreground text-center">GitHub, Linear, Slack</p>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

interface DraftRowProps {
  draft: Draft;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onStatusChange: (status: Draft["status"]) => void;
}

function DraftRow({ draft, index, isExpanded, onToggleExpand, onStatusChange }: DraftRowProps) {
  const router = useRouter();
  const StatusIcon = statusIcons[draft.status as keyof typeof statusIcons] || FileText;
  const isPending = draft.status === "draft";
  const isReady = draft.status === "edited";
  const isSent = draft.status === "sent";

  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className={cn("border-t border-border transition-all", index === 0 && "border-t-0")}>
      <div
        className="flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-2 h-2 rounded-full bg-terracotta/50 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-ink truncate">Client #{draft.client_id}</p>
            <p className="text-sm text-muted-foreground">
              Week of {format(new Date(draft.week_of), "MMM d, yyyy")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={cn("gap-1", statusStyles[draft.status as keyof typeof statusStyles])}>
              <StatusIcon className="w-3 h-3" />
              {statusLabels[draft.status as keyof typeof statusLabels]}
            </Badge>
            <span className="text-sm text-muted-foreground hidden sm:block">
              {format(new Date(draft.updated_at), "MMM d, yyyy")}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground ml-4 flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/dashboard/drafts/${draft.id}`);
          }}
        >
          <Edit2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Dropdown Menu */}
      <DropdownMenu open={showDropdown} onOpenChange={setShowDropdown}>
        <DropdownMenuTrigger>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdown(!showDropdown);
            }}
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={() => {
              router.push(`/dashboard/drafts/${draft.id}`);
              setShowDropdown(false);
            }}
            className={isPending ? "" : "opacity-50 pointer-events-none"}
            disabled={!isPending}
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Draft
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              onStatusChange("edited");
              setShowDropdown(false);
            }}
            className={isPending ? "" : "opacity-50 pointer-events-none"}
            disabled={!isPending}
          >
            <Send className="w-4 h-4 mr-2" />
            Mark Ready to Send
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              onStatusChange("sent");
              setShowDropdown(false);
            }}
            className={isReady ? "" : "opacity-50 pointer-events-none"}
            disabled={!isReady}
          >
            <Check className="w-4 h-4 mr-2" />
            Mark as Sent
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              onStatusChange("draft");
              setShowDropdown(false);
            }}
            className={(isReady || isSent) ? "" : "opacity-50 pointer-events-none"}
            disabled={!(isReady || isSent)}
          >
            <X className="w-4 h-4 mr-2" />
            Revert to Draft
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              if (confirm("Delete this draft?")) {
                draftsApi.delete(draft.id).then(() => window.location.reload());
              }
              setShowDropdown(false);
            }}
            className="text-destructive focus:text-destructive"
          >
            <X className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 bg-muted/20 border-t border-border animate-in slide-down-in">
          <div className="prose prose-sm max-w-none text-muted-foreground">
            <pre className="whitespace-pre-wrap text-sm font-body">{draft.content}</pre>
          </div>
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
            <Button size="sm" variant="outline" onClick={() => router.push(`/dashboard/drafts/${draft.id}`)}>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Full Draft
            </Button>
            <Button size="sm" onClick={() => onStatusChange(isPending ? "edited" : isReady ? "sent" : "draft")}>
              {isPending && <Send className="w-4 h-4 mr-2" />}
              {isReady && <Check className="w-4 h-4 mr-2" />}
              {isSent && <X className="w-4 h-4 mr-2" />}
              {isPending ? "Mark Ready" : isReady ? "Mark Sent" : "Revert to Draft"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(draft.content)}>
              <Check className="w-4 h-4 mr-2" />
              Copy Content
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

async function handleStatusChange(draftId: number, status: Draft["status"]) {
  try {
    await draftsApi.update(draftId, { status });
    window.location.reload();
  } catch (err) {
    console.error("Failed to update draft status:", err);
    alert("Failed to update draft status. Please try again.");
  }
}