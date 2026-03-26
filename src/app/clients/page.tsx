"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Users, Plus, Edit2, Trash2, ArrowLeft, Loader2, Cloud, X } from "lucide-react";
import { getClients, saveClient, deleteClient, type Client } from "@/lib/store";
import { getAuthUserId, mergeLocalAndCloudClients, deleteClientFromCloud, syncClientToCloud } from "@/lib/supabase/sync";
import Navbar from "@/components/Navbar";
import { useToast } from "@/components/Toast";
import { INDIAN_STATES } from "@/lib/constants";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>(() => {
    if (typeof window === "undefined") return [];
    return getClients();
  });
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    address: "",
    gstin: "",
    state_code: "",
  });

  const syncCloud = useCallback(async () => {
    const userId = await getAuthUserId();
    if (!userId) return;

    setSyncing(true);
    try {
      const merged = await mergeLocalAndCloudClients(userId, getClients());
      setClients(merged);
      if (typeof window !== "undefined") {
        localStorage.setItem("invosmith_clients", JSON.stringify(merged));
      }
    } catch (e) {
      console.error("Cloud sync error:", e);
    }
    setSyncing(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    syncCloud();
  }, [syncCloud]);

  const handleOpenModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        company: client.company || "",
        email: client.email || "",
        phone: client.phone || "",
        address: client.address || "",
        gstin: client.gstin || "",
        state_code: client.state_code || "",
      });
    } else {
      setEditingClient(null);
      setFormData({
        name: "",
        company: "",
        email: "",
        phone: "",
        address: "",
        gstin: "",
        state_code: "",
      });
    }
    setShowModal(true);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    setLoading(true);

    const client: Client = {
      id: editingClient?.id || crypto.randomUUID(),
      ...formData,
      created_at: editingClient?.created_at || new Date().toISOString(),
    };

    saveClient(client);
    setClients(getClients());

    // Cloud sync
    const userId = await getAuthUserId();
    if (userId) {
      await syncClientToCloud(userId, client);
    }

    toast(editingClient ? "Client updated" : "Client added", "success");
    setLoading(false);
    setShowModal(false);
  };

  const handleDeleteClient = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    deleteClient(id);
    setClients(getClients());
    toast("Client deleted", "success");

    const userId = await getAuthUserId();
    if (userId) {
      await deleteClientFromCloud(id);
    }
  };

  return (
    <main className="min-h-screen bg-dark-900 pb-20">
      <Navbar />

      <div className="pt-32 px-6 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors mb-4">
              <ArrowLeft className="w-4 h-4" /> Back to dashboard
            </Link>
            <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
              <Users className="w-6 h-6 text-amber-500" />
              Client Directory
            </h1>
            <p className="text-sm text-gray-500">
              Manage your saved clients for quick invoicing
              {syncing && (
                <span className="ml-2 inline-flex items-center gap-1 text-amber-400">
                  <Cloud className="w-3.5 h-3.5 animate-pulse" />
                  Syncing...
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="btn-primary inline-flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Client
          </button>
        </div>

        {clients.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No clients yet</h3>
            <p className="text-gray-400 mb-6 max-w-sm mx-auto">
              Save your clients here to avoid re-typing their details every time you create an invoice.
            </p>
            <button onClick={() => handleOpenModal()} className="btn-primary inline-flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> Add First Client
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((client) => (
              <div key={client.id} className="glass-card p-5 group flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-white truncate max-w-[200px]" title={client.name}>
                      {client.name}
                    </h3>
                    {client.company && (
                      <p className="text-xs text-gray-400 truncate max-w-[200px]" title={client.company}>
                        {client.company}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenModal(client)}
                      className="p-1.5 bg-dark-700 text-gray-400 hover:text-white rounded-lg transition-colors"
                      title="Edit client"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClient(client.id, client.name)}
                      className="p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors"
                      title="Delete client"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-400 flex-1">
                  {client.email && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Email:</span>
                      <span className="truncate ml-2 text-gray-300">{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Phone:</span>
                      <span className="text-gray-300">{client.phone}</span>
                    </div>
                  )}
                  {client.gstin && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">GSTIN:</span>
                      <span className="text-gray-300 font-mono text-xs mt-0.5">{client.gstin}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingClient ? "Edit Client" : "Add New Client"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                   <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                     Contact Name *
                   </label>
                   <input
                     type="text"
                     required
                     value={formData.name}
                     onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                     className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/40"
                     placeholder="John Doe"
                   />
                </div>
                <div>
                   <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                     Company Name
                   </label>
                   <input
                     type="text"
                     value={formData.company}
                     onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                     className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/40"
                     placeholder="Acme Corp"
                   />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                   <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                     Email
                   </label>
                   <input
                     type="email"
                     value={formData.email}
                     onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                     className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/40"
                     placeholder="client@example.com"
                   />
                </div>
                <div>
                   <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                     Phone
                   </label>
                   <input
                     type="text"
                     value={formData.phone}
                     onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                     className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/40"
                     placeholder="+91..."
                   />
                </div>
              </div>

              <div>
                 <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                   Billing Address
                 </label>
                 <textarea
                   value={formData.address}
                   onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                   className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/40 min-h-[80px]"
                   placeholder="123 Business Street"
                 />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                   <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                     GSTIN
                   </label>
                   <input
                     type="text"
                     value={formData.gstin}
                     onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                     className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/40 uppercase"
                     placeholder="27AADCB22..."
                   />
                </div>
                <div>
                   <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                     State Code (For GST)
                   </label>
                   <select
                     value={formData.state_code}
                     onChange={(e) => setFormData({ ...formData, state_code: e.target.value })}
                     className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/40"
                   >
                     <option value="">Select State</option>
                     {INDIAN_STATES.map((s) => (
                       <option key={s.code} value={s.code}>
                         {s.code} - {s.name}
                       </option>
                     ))}
                   </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl font-semibold text-sm border border-white/10 hover:bg-white/5 transition-colors text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.name}
                  className="btn-primary min-w-[120px] flex justify-center"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
