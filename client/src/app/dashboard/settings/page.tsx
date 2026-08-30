"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { GitBranch, MessageSquare, LayoutDashboard, Plus, Settings, Key, Trash2, Check, AlertCircle, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { integrationsApi, toneApi, Integration, ToneProfile, User } from "@/lib/api";
import { authApi } from "@/lib/api";

const integrationConfigs = [
  { id: "github", name: "GitHub", icon: GitBranch, color: "text-gray-900 dark:text-gray-100", bg: "bg-gray-100 dark:bg-gray-800" },
  { id: "linear", name: "Linear", icon: GitBranch, color: "text-indigo-600", bg: "bg-indigo-100" },
  { id: "slack", name: "Slack", icon: MessageSquare, color: "text-purple-600", bg: "bg-purple-100" },
  { id: "trello", name: "Trello", icon: LayoutDashboard, color: "text-blue-600", bg: "bg-blue-100" },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState("integrations");
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoadingIntegrations, setIsLoadingIntegrations] = useState(true);
  const [toneProfile, setToneProfile] = useState<ToneProfile | null>(null);
  const [isLoadingTone, setIsLoadingTone] = useState(true);
  const [formality, setFormality] = useState(6);
  const [verbosity, setVerbosity] = useState(5);
  const [styleNotes, setStyleNotes] = useState("Professional, clear, and concise. Technical details explained simply. Bullet points for readability.");
  const [toneExamples, setToneExamples] = useState("");
  const [isSavingTone, setIsSavingTone] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    async function fetchIntegrations() {
      try {
        const data = await integrationsApi.list();
        setIntegrations(data);
      } catch (err) {
        console.error("Failed to load integrations:", err);
      } finally {
        setIsLoadingIntegrations(false);
      }
    }
    fetchIntegrations();
  }, []);

  useEffect(() => {
    // In a real app, you'd fetch the default tone profile
    // For now, we'll just use local state
    setIsLoadingTone(false);
  }, []);

  useEffect(() => {
    if (user) {
      setName(user.full_name || "");
      setEmail(user.email);
    }
  }, [user]);

  const handleConnectGitHub = () => {
    window.location.href = authApi.githubOAuth();
  };

  const handleDisconnect = async (integrationId: number) => {
    if (!confirm("Are you sure you want to disconnect this integration?")) return;
    try {
      await integrationsApi.delete(integrationId);
      setIntegrations(integrations.filter((i) => i.id !== integrationId));
    } catch (err) {
      alert("Failed to disconnect integration");
    }
  };

  const handleSaveTone = async () => {
    setIsSavingTone(true);
    try {
      // This would need a default client ID or global tone profile endpoint
      // For now, just show success
      alert("Tone profile saved! (API endpoint needed)");
    } catch (err) {
      alert("Failed to save tone profile");
    } finally {
      setIsSavingTone(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      // This would need a user update endpoint
      alert("Profile saved! (API endpoint needed)");
      await refreshUser();
    } catch (err) {
      alert("Failed to save profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage integrations, tone preferences, and account settings</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="tone">Tone Profiles</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            <div>
              <h2 className="font-display text-xl font-semibold text-ink mb-4">Connected Integrations</h2>
              <p className="text-muted-foreground mb-6">Connect your tools to automatically pull project activity for draft generation.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {integrationConfigs.map((config) => {
                const integration = integrations.find((i) => i.provider === config.id);
                const isConnected = !!integration;
                return (
                  <Card key={config.id} className={`border-terracotta/20 ${isConnected ? "border-terracotta/40 bg-terracotta/5" : ""}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${config.bg}`}>
                            <config.icon className={`w-5 h-5 ${config.color}`} />
                          </div>
                          <div>
                            <h3 className="font-medium text-ink">{config.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {isConnected
                                ? `Connected • ${integration?.is_active ? "Active" : "Inactive"}`
                                : "Not connected"}
                            </p>
                          </div>
                        </div>
                        {isConnected ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-emerald/10 text-emerald border border-emerald/20">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                            Inactive
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {isConnected ? (
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1" disabled>
                              <Settings className="w-4 h-4 mr-2" />
                              Manage
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => integration && handleDisconnect(integration.id)}>
                              <Trash2 className="w-4 h-4 mr-1" />
                              Disconnect
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Last synced: {integration?.last_sync ? new Date(integration.last_sync).toLocaleString() : "Never"}
                          </p>
                        </div>
                      ) : config.id === "github" ? (
                        <Button className="w-full" variant="outline" onClick={handleConnectGitHub} disabled={isLoadingIntegrations}>
                          <Plus className="w-4 h-4 mr-2" />
                          Connect GitHub
                        </Button>
                      ) : (
                        <Button className="w-full" variant="outline" disabled>
                          <Plus className="w-4 h-4 mr-2" />
                          Connect {config.name} (Coming Soon)
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {isLoadingIntegrations && (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-terracotta" />
              </div>
            )}
          </TabsContent>

          {/* Tone Profiles Tab */}
          <TabsContent value="tone" className="space-y-6">
            <div>
              <h2 className="font-display text-xl font-semibold text-ink mb-2">Tone Profiles</h2>
              <p className="text-muted-foreground mb-6">
                Define how your updates sound. Provide examples of past updates you've sent to help AI match your voice.
              </p>
            </div>

            <Card className="border-terracotta/20">
              <CardHeader>
                <CardTitle>Default Tone Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="formality">Formality</Label>
                    <Select value={String(formality)} onValueChange={(v) => setFormality(parseInt(v || "6", 10))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select formality" />
                      </SelectTrigger>
                      <SelectContent>
                        {[...Array(10)].map((_, i) => (
                          <SelectItem key={i + 1} value={String(i + 1)}>
                            {i + 1} - {i < 3 ? "Very Casual" : i < 6 ? "Casual" : i < 8 ? "Professional" : "Very Formal"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="verbosity">Verbosity</Label>
                    <Select value={String(verbosity)} onValueChange={(v) => setVerbosity(parseInt(v || "5", 10))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select verbosity" />
                      </SelectTrigger>
                      <SelectContent>
                        {[...Array(10)].map((_, i) => (
                          <SelectItem key={i + 1} value={String(i + 1)}>
                            {i + 1} - {i < 3 ? "Terse" : i < 6 ? "Concise" : i < 8 ? "Detailed" : "Comprehensive"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="style-notes">Style Notes</Label>
                  <Textarea
                    id="style-notes"
                    placeholder="e.g., Use friendly but professional tone. Avoid jargon. Bullet points preferred. Keep under 300 words."
                    value={styleNotes}
                    onChange={(e) => setStyleNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tone-examples">Example Updates (one per paragraph, max 3)</Label>
                  <Textarea
                    id="tone-examples"
                    value={toneExamples}
                    onChange={(e) => setToneExamples(e.target.value)}
                    placeholder="Paste 1-3 examples of past updates you've sent to this client..."
                    rows={12}
                    className="font-mono text-sm"
                  />
                  <p className="text-sm text-muted-foreground">
                    The AI will learn your writing style from these examples. More examples = better matching.
                  </p>
                </div>

                <div className="flex justify-end pt-4 border-t border-terracotta/10">
                  <Button variant="outline" className="mr-2" disabled={isSavingTone}>Cancel</Button>
                  <Button onClick={handleSaveTone} disabled={isSavingTone}>
                    {isSavingTone ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Save Tone Profile
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-terracotta/20 bg-terracotta/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-terracotta mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-ink">Tip: Client-specific tones</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Each client can have their own tone profile. Go to Clients → select a client → Tone tab to customize per client.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="border-terracotta/20">
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-ink">Draft Ready</p>
                    <p className="text-sm text-muted-foreground">Get notified when a new draft is generated</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-ink">Weekly Reminder</p>
                    <p className="text-sm text-muted-foreground">Reminder to review drafts every Monday</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-ink">Delivery Confirmation</p>
                    <p className="text-sm text-muted-foreground">Confirmation when update is sent to client</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card className="border-terracotta/20">
              <CardHeader>
                <CardTitle>Delivery Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Default Delivery Method</Label>
                  <Select defaultValue="manual" onValueChange={(v) => console.log("Delivery:", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Copy to clipboard / Manual send</SelectItem>
                      <SelectItem value="email">Send via email (coming soon)</SelectItem>
                      <SelectItem value="slack">Post to Slack channel (coming soon)</SelectItem>
                      <SelectItem value="notion">Push to Notion (coming soon)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <Card className="border-terracotta/20">
              <CardHeader>
                <CardTitle>Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={isSavingProfile} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSavingProfile} />
                </div>
                <div className="flex justify-end pt-4 border-t border-terracotta/10">
                  <Button variant="outline" className="mr-2" disabled={isSavingProfile}>Cancel</Button>
                  <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                    {isSavingProfile ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-terracotta/20">
              <CardHeader>
                <CardTitle>API Keys</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">Generate API keys for programmatic access to your Pulse data.</p>
                <Button variant="outline" onClick={() => router.push("/dashboard/settings/api-keys")}>
                    <Key className="w-4 h-4 mr-2" />
                    Manage API Keys
                  </Button>
              </CardContent>
            </Card>

            <Card className="border-terracotta/20 border-destructive/20">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">Once deleted, your account and all data cannot be recovered.</p>
                <Button variant="destructive" className="w-full">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}