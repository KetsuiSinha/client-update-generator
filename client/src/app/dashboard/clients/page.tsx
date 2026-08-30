"use client";

import { useEffect, useState, FormEvent } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, GitBranch, Settings, Trash2, Edit, ExternalLink, FileText, Loader2, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clientsApi, Client, ClientCreate } from "@/lib/api";
import { format } from "date-fns";

export default function ClientsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [newClientDialog, setNewClientDialog] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClients() {
      try {
        const data = await clientsApi.list();
        setClients(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load clients");
      } finally {
        setIsLoading(false);
      }
    }

    fetchClients();
  }, []);

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddClient = async (e: FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    setIsCreating(true);
    setError(null);

    try {
      const newClient: ClientCreate = { name: newClientName.trim() };
      const created = await clientsApi.create(newClient);
      setClients([created, ...clients]);
      setNewClientDialog(false);
      setNewClientName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create client");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteClient = async (clientId: number) => {
    if (!confirm("Are you sure you want to delete this client?")) return;

    try {
      await clientsApi.delete(clientId);
      setClients(clients.filter((c) => c.id !== clientId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete client");
    }
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
            <h1 className="font-display text-3xl font-bold text-ink">Clients</h1>
            <p className="text-muted-foreground mt-1">Manage your clients and their project connections</p>
          </div>
          <Dialog open={newClientDialog} onOpenChange={setNewClientDialog}>
            <DialogTrigger>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Client
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Client</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddClient} className="space-y-4 py-4">
                {error && (
                  <div className="text-sm text-destructive text-center">{error}</div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="client-name">Client Name</Label>
                  <Input
                    id="client-name"
                    placeholder="e.g., Acme Corp"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    required
                    autoFocus
                    disabled={isCreating}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setNewClientDialog(false)} disabled={isCreating}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? "Creating..." : "Create Client"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Clients Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => (
            <Card key={client.id} className="border-terracotta/20 hover:border-terracotta/40 transition-colors">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <CardTitle className="font-display text-xl">{client.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Created {format(new Date(client.created_at), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push(`/dashboard/clients/${client.id}`)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push(`/dashboard/drafts?client=${client.id}`)}>
                    <FileText className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteClient(client.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Integrations - placeholder until API is connected */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Integrations</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                      No integrations yet
                    </span>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => router.push(`/dashboard/clients/${client.id}/integrations`)}>
                      <Plus className="w-3 h-3 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>

                {/* Tone Profile - placeholder */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Tone Profile</p>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 text-sm rounded-full bg-indigo/10 text-indigo border border-indigo/20">
                      Default
                    </span>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => router.push(`/dashboard/clients/${client.id}/tone`)}>
                      <Settings className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2 border-t border-terracotta/10">
                  <Button variant="outline" className="flex-1" onClick={() => router.push(`/dashboard/drafts/new?client=${client.id}`)}>
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Draft
                  </Button>
                  <Button variant="ghost" className="h-10" onClick={() => router.push(`/dashboard/clients/${client.id}`)}>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredClients.length === 0 && (
            <Card className="border-terracotta/20 text-center py-12">
              <CardContent>
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-display text-lg font-semibold text-ink mb-2">
                  {search ? "No clients found" : "No clients yet"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {search ? "Try adjusting your search" : "Get started by adding your first client"}
                </p>
                <Button onClick={() => setNewClientDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Client
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}