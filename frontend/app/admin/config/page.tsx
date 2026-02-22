"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface ConfigParam {
  name: string;
  value: string;
  category: string;
  lastModified: string | null;
  version: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  pricing: "Pricing",
  session: "Session Settings",
  mythology: "Mythology",
  ai: "AI Configuration",
  shipping: "Shipping",
};

const CATEGORY_COLORS: Record<string, string> = {
  pricing: "bg-green-100 text-green-800",
  session: "bg-blue-100 text-blue-800",
  mythology: "bg-purple-100 text-purple-800",
  ai: "bg-orange-100 text-orange-800",
  shipping: "bg-yellow-100 text-yellow-800",
};

export default function AdminConfigPage() {
  const [grouped, setGrouped] = useState<Record<string, ConfigParam[]>>({});
  const [loading, setLoading] = useState(true);
  const [editingParam, setEditingParam] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  const apiEndpoint =
    process.env.NEXT_PUBLIC_API_ENDPOINT || "http://localhost:3001";

  const fetchConfig = useCallback(async () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("idToken") : "";
    try {
      const res = await fetch(`${apiEndpoint}/admin/config`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch config");
      const data = await res.json();
      setGrouped(data.grouped || {});
    } catch (error) {
      console.error("Error fetching config:", error);
      toast.error("Failed to load configuration");
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const startEdit = (param: ConfigParam) => {
    setEditingParam(param.name);
    setEditValue(param.value);
  };

  const cancelEdit = () => {
    setEditingParam(null);
    setEditValue("");
  };

  const saveParam = async (paramName: string) => {
    setSaving(true);
    try {
      const res = await fetch(`${apiEndpoint}/admin/config`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("idToken") : ""}`,
        },
        body: JSON.stringify({ parameter: paramName, value: editValue }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to update");
        return;
      }

      const data = await res.json();
      toast.success(`Updated: ${data.previousValue} → ${data.newValue}`);
      setEditingParam(null);
      fetchConfig();
    } catch (error) {
      console.error("Error saving config:", error);
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const getParamLabel = (name: string) => {
    return (
      name
        .split("/")
        .pop()
        ?.replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()) || name
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">Loading configuration...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Platform Configuration</h1>
        <Badge variant="outline">Parameter Store</Badge>
      </div>

      <p className="text-muted-foreground mb-8">
        Manage pricing, session limits, and platform settings. Changes take
        effect immediately.
      </p>

      <div className="space-y-6">
        {Object.entries(CATEGORY_LABELS).map(([cat, label]) => {
          const params = grouped[cat] || [];
          if (params.length === 0) return null;

          return (
            <Card key={cat}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>{label}</CardTitle>
                  <Badge className={CATEGORY_COLORS[cat] || ""}>
                    {params.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {params.map((param) => (
                    <div
                      key={param.name}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">
                          {getParamLabel(param.name)}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {param.name}
                        </p>
                        {param.lastModified && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Last modified:{" "}
                            {new Date(param.lastModified).toLocaleString()}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 ml-4">
                        {editingParam === param.name ? (
                          <>
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-40"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              onClick={() => saveParam(param.name)}
                              disabled={saving}
                            >
                              {saving ? "..." : "Save"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={cancelEdit}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <code className="bg-background px-3 py-1 rounded border text-sm">
                              {param.value}
                            </code>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEdit(param)}
                            >
                              Edit
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
