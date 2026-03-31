/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend, Cell, PieChart, Pie, LabelList
} from 'recharts';
import { 
  Activity, Users, Calendar, Settings, RefreshCw, 
  ChevronRight, AlertCircle, BarChart3, PieChart as PieChartIcon,
  Database, CheckCircle2, Zap, TrendingUp, Plus, Trash2, Edit2, ChevronDown,
  BookOpen, Code, Terminal, Globe, Copy, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// --- Types ---

const CodeBlock = ({ code, language }: { code: string, language: string }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={copyToClipboard}
          className="p-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors flex items-center gap-2 text-xs font-bold"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="bg-zinc-900 text-zinc-300 p-6 rounded-2xl overflow-x-auto font-mono text-sm leading-relaxed border border-zinc-800">
        <code>{code}</code>
      </pre>
    </div>
  );
};

const SetupGuide = () => {
  return (
    <div className="space-y-12 pb-20">
      <div className="max-w-3xl">
        <h2 className="text-4xl font-black text-zinc-900 tracking-tight mb-4">Implementation Guide</h2>
        <p className="text-zinc-500 text-lg leading-relaxed">
          Follow these steps to implement the same Cloudflare-based tracking in your other applications. 
          This architecture consists of a frontend service, a Cloudflare Pages Function for ingestion, and a report endpoint.
        </p>
      </div>

      {/* Step 1 */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-zinc-900 text-white rounded-full flex items-center justify-center font-black">1</div>
          <h3 className="text-2xl font-bold text-zinc-900">Frontend Service</h3>
        </div>
        <p className="text-zinc-600 max-w-2xl">
          Create a tracking service in your frontend. This handles event sanitization, session management, and data transmission using <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-900 font-mono text-sm">sendBeacon</code> or <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-900 font-mono text-sm">fetch</code>.
        </p>
        <CodeBlock 
          language="typescript"
          code={`type Primitive = string | number | boolean | null;
export type AnalyticsProps = Record<string, Primitive>;

const ANALYTICS_ENDPOINT = "/api/analytics";
const ANON_ID_KEY = "service_anon_id";
const SESSION_ID_KEY = "service_session_id";
const MAX_EVENT_NAME_LENGTH = 64;

function randomId(prefix: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const token = Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
  return \`\${prefix}_\${token}\`;
}

function getAnonId(): string {
  try {
    const existing = localStorage.getItem(ANON_ID_KEY);
    if (existing) return existing;
    const created = randomId("u");
    localStorage.setItem(ANON_ID_KEY, created);
    return created;
  } catch {
    return randomId("u");
  }
}

function getSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_ID_KEY);
    if (existing) return existing;
    const created = randomId("s");
    sessionStorage.setItem(SESSION_ID_KEY, created);
    return created;
  } catch {
    return randomId("s");
  }
}

function sanitizeEventName(name: string): string {
  const normalized = name
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .slice(0, MAX_EVENT_NAME_LENGTH);

  return normalized || "unknown_event";
}

function sanitizeProps(props: AnalyticsProps = {}): AnalyticsProps {
  const out: AnalyticsProps = {};
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined) continue;
    const safeKey = key.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 64);
    if (!safeKey) continue;

    if (typeof value === "string") out[safeKey] = value.slice(0, 200);
    else if (typeof value === "number" || typeof value === "boolean" || value === null) out[safeKey] = value;
  }
  return out;
}

export function trackEvent(event: string, props?: AnalyticsProps): void {
  if (typeof window === "undefined") return;

  const payload = {
    event: sanitizeEventName(event),
    properties: sanitizeProps(props),
    ts: Date.now(),
    path: window.location.pathname,
    anonId: getAnonId(),
    sessionId: getSessionId(),
  };

  const json = JSON.stringify(payload);

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([json], { type: "application/json" });
      navigator.sendBeacon(ANALYTICS_ENDPOINT, blob);
      return;
    }
  } catch {}

  fetch(ANALYTICS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: json,
    keepalive: true,
  }).catch(() => {});
}

export function trackPageView(pageName = "home"): void {
  trackEvent("page_view", { page: pageName });
}`}
        />
      </section>

      {/* Step 2 */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-zinc-900 text-white rounded-full flex items-center justify-center font-black">2</div>
          <h3 className="text-2xl font-bold text-zinc-900">Ingestion Function</h3>
        </div>
        <p className="text-zinc-600 max-w-2xl">
          Create a Cloudflare Pages Function at <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-900 font-mono text-sm">functions/api/analytics.js</code> to receive and store events in KV.
        </p>
        <CodeBlock 
          language="javascript"
          code={`const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const MAX_PAYLOAD_BYTES = 3000;
const TTL_SECONDS = 60 * 60 * 24 * 90; // 90 days

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function generateId() {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  let id = "";
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  for (const b of bytes) id += chars[b % chars.length];
  return id;
}

function sanitizeString(value, maxLength = 200) {
  return String(value ?? "").slice(0, maxLength);
}

function sanitizeProps(properties) {
  if (!properties || typeof properties !== "object" || Array.isArray(properties)) return {};
  const out = {};
  const entries = Object.entries(properties).slice(0, 20);

  for (const [key, value] of entries) {
    const safeKey = sanitizeString(key, 64).replace(/[^a-zA-Z0-9_]/g, "_");
    if (!safeKey) continue;

    if (typeof value === "string") out[safeKey] = sanitizeString(value, 200);
    else if (typeof value === "number" || typeof value === "boolean" || value === null) out[safeKey] = value;
  }
  return out;
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const kv = env.ANALYTICS_KV;
  if (!kv) return json({ error: "KV binding ANALYTICS_KV not configured" }, 500);

  const contentLength = parseInt(request.headers.get("content-length") || "0", 10);
  if (contentLength > MAX_PAYLOAD_BYTES) return json({ error: "Payload too large" }, 413);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const event = sanitizeString(body?.event, 64).toLowerCase();
  if (!/^[a-z0-9_]{2,64}$/.test(event)) return json({ error: "Invalid event name" }, 400);

  const timestamp = Number.isFinite(body?.ts) ? body.ts : Date.now();
  const day = new Date(timestamp).toISOString().slice(0, 10);
  const id = generateId();

  const record = {
    event,
    ts: timestamp,
    day,
    path: sanitizeString(body?.path, 120),
    anonId: sanitizeString(body?.anonId, 40),
    sessionId: sanitizeString(body?.sessionId, 40),
    properties: sanitizeProps(body?.properties),
  };

  await kv.put(\`evt:\${day}:\${id}\`, JSON.stringify(record), { expirationTtl: TTL_SECONDS });

  return json({ ok: true }, 202);
}`}
        />
      </section>

      {/* Step 3 */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-zinc-900 text-white rounded-full flex items-center justify-center font-black">3</div>
          <h3 className="text-2xl font-bold text-zinc-900">Report Endpoint</h3>
        </div>
        <p className="text-zinc-600 max-w-2xl">
          Create a protected report endpoint at <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-900 font-mono text-sm">functions/api/analytics/report.js</code> to aggregate data for this dashboard.
        </p>
        <CodeBlock 
          language="javascript"
          code={`const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const MAX_KEYS_PER_DAY = 10000;
const MAX_DAYS = 30;

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function isoDay(date) {
  return date.toISOString().slice(0, 10);
}

function daysRange(endDay, count) {
  const days = [];
  const end = new Date(endDay + "T00:00:00Z");
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setUTCDate(d.getUTCDate() - i);
    days.push(isoDay(d));
  }
  return days;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const expectedToken = env.ANALYTICS_REPORT_TOKEN;
  const providedToken = url.searchParams.get("token");
  if (!expectedToken || providedToken !== expectedToken) {
    return json({ error: "Unauthorized" }, 401);
  }

  const kv = env.ANALYTICS_KV;
  if (!kv) return json({ error: "KV binding ANALYTICS_KV not configured" }, 500);

  const today = isoDay(new Date());
  const endDay = url.searchParams.get("day") || today;
  const rawDays = parseInt(url.searchParams.get("days") || "1", 10);
  const numDays = Math.min(Math.max(rawDays, 1), MAX_DAYS);
  const days = daysRange(endDay, numDays);

  const eventCounts = {};
  const dailyCounts = {};
  const anonUsers = new Set();
  let totalEvents = 0;

  for (const day of days) {
    dailyCounts[day] = {};
    let cursor = undefined;
    let fetched = 0;

    while (fetched < MAX_KEYS_PER_DAY) {
      const listResult = await kv.list({ prefix: \`evt:\${day}:\`, limit: 1000, cursor });
      const keys = listResult.keys || [];
      fetched += keys.length;

      const values = await Promise.all(keys.map(k => kv.get(k.name, { type: "text" })));
      for (const raw of values) {
        if (!raw) continue;
        let record;
        try { record = JSON.parse(raw); } catch { continue; }

        const evt = record.event || "unknown";
        eventCounts[evt] = (eventCounts[evt] || 0) + 1;
        dailyCounts[day][evt] = (dailyCounts[day][evt] || 0) + 1;
        totalEvents++;
        if (record.anonId) anonUsers.add(record.anonId);
      }

      if (listResult.list_complete) break;
      cursor = listResult.cursor;
    }
  }

  const sortedEvents = Object.entries(eventCounts)
    .sort((a, b) => b[1] - a[1])
    .reduce((acc, [k, v]) => { acc[k] = v; return acc; }, {});

  return json({
    period: { from: days[0], to: days[days.length - 1], days: numDays },
    summary: { total_events: totalEvents, unique_users: anonUsers.size },
    events: sortedEvents,
    by_day: dailyCounts,
  });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}`}
        />
      </section>

      {/* Step 4 */}
      <section className="bg-zinc-900 text-white p-10 rounded-[2.5rem] space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white text-zinc-900 rounded-full flex items-center justify-center font-black">4</div>
          <h3 className="text-2xl font-bold">Cloudflare Configuration</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-zinc-400 font-bold uppercase tracking-widest text-xs">
              <Database className="w-4 h-4" />
              KV Namespace
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Create a KV namespace in your Cloudflare dashboard and bind it to your Pages project with the name <code className="text-white font-mono">ANALYTICS_KV</code>.
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-zinc-400 font-bold uppercase tracking-widest text-xs">
              <Settings className="w-4 h-4" />
              Environment Variables
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Add <code className="text-white font-mono">ANALYTICS_REPORT_TOKEN</code> as an environment variable with a long, random secret value.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

interface SavedProject {
  id: string;
  name: string;
  url: string;
}

interface AnalyticsData {
  project?: string;
  period: {
    from: string;
    to: string;
    days: number;
  };
  summary: {
    total_events: number;
    unique_users: number;
    new_users?: number;
    returning_users?: number;
  };
  events: Record<string, number>;
  by_day: Record<string, Record<string, number>>;
  users_by_day?: Record<string, {
    unique_users: number;
    new_users: number;
    returning_users: number;
  }>;
}

// --- Components ---

const Card = ({ children, className, title, icon: Icon, extra }: { children: React.ReactNode, className?: string, title?: string, icon?: any, extra?: React.ReactNode }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn("bg-white border border-zinc-200 rounded-xl p-6 shadow-sm", className)}
  >
    {title && (
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-zinc-400" />}
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{title}</h3>
        </div>
        {extra}
      </div>
    )}
    {children}
  </motion.div>
);

const StatCard = ({ title, value, icon: Icon, trend }: { title: string, value: string | number, icon: any, trend?: string }) => (
  <Card className="flex flex-col justify-between">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-zinc-500 uppercase tracking-wider">{title}</p>
        <h2 className="text-4xl font-bold mt-1 text-zinc-900 tracking-tight">{value}</h2>
      </div>
      <div className="p-2 bg-zinc-50 rounded-lg border border-zinc-100">
        <Icon className="w-6 h-6 text-zinc-600" />
      </div>
    </div>
    {trend && (
      <div className="mt-4 flex items-center gap-1 text-sm font-medium text-emerald-600">
        <span>{trend}</span>
      </div>
    )}
  </Card>
);

export default function App() {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [tempUrl, setTempUrl] = useState('');
  const [tempName, setTempName] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'guide'>('dashboard');
  
  const [showSettings, setShowSettings] = useState(false);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');

  const activeProject = useMemo(() => 
    projects.find(p => p.id === activeProjectId) || null
  , [projects, activeProjectId]);

  const apiUrl = activeProject?.url || '';
  const isConfigured = projects.length > 0;

  useEffect(() => {
    const savedProjects = localStorage.getItem('analytics_projects');
    const lastActiveId = localStorage.getItem('analytics_active_project_id');
    
    if (savedProjects) {
      const parsed = JSON.parse(savedProjects);
      setProjects(parsed);
      if (lastActiveId && parsed.find((p: SavedProject) => p.id === lastActiveId)) {
        setActiveProjectId(lastActiveId);
      } else if (parsed.length > 0) {
        setActiveProjectId(parsed[0].id);
      }
    } else {
      // Migration from old single URL format
      const oldUrl = localStorage.getItem('analytics_api_url');
      if (oldUrl) {
        const newProject = { id: crypto.randomUUID(), name: 'Default Project', url: oldUrl };
        const initialProjects = [newProject];
        setProjects(initialProjects);
        setActiveProjectId(newProject.id);
        localStorage.setItem('analytics_projects', JSON.stringify(initialProjects));
        localStorage.setItem('analytics_active_project_id', newProject.id);
        localStorage.removeItem('analytics_api_url');
      }
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!apiUrl) return;
    setLoading(true);
    setFetchError('');
    try {
      // Proxy route exists only in local Express dev server.
      const isLocalHost = typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      const requestUrl = isLocalHost ? `/api/proxy?url=${encodeURIComponent(apiUrl)}` : apiUrl;

      const response = await fetch(requestUrl);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch analytics data. Check your API URL and network connection.');
      }
      const json: AnalyticsData = await response.json();
      setData(json);
      
      // Initialize visibility for all keys
      const keys = Object.keys(json.events);
      setVisibleKeys(prev => {
        const next = { ...prev };
        keys.forEach(key => {
          if (next[key] === undefined) next[key] = true;
        });
        // Also initialize user stats if present (hidden by default)
        ['unique_users', 'new_users', 'returning_users'].forEach(key => {
          if (json.summary[key as keyof typeof json.summary] !== undefined && next[key] === undefined) {
            next[key] = false;
          }
        });
        return next;
      });
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    if (activeProjectId) {
      localStorage.setItem('analytics_active_project_id', activeProjectId);
      fetchData();
    }
  }, [activeProjectId, fetchData]);

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempUrl.trim() || !tempName.trim()) return;

    let newProjects;
    if (editingProjectId) {
      newProjects = projects.map(p => 
        p.id === editingProjectId ? { ...p, name: tempName, url: tempUrl } : p
      );
    } else {
      const newProject = {
        id: crypto.randomUUID(),
        name: tempName,
        url: tempUrl
      };
      newProjects = [...projects, newProject];
      if (!activeProjectId) setActiveProjectId(newProject.id);
    }

    setProjects(newProjects);
    localStorage.setItem('analytics_projects', JSON.stringify(newProjects));
    setTempUrl('');
    setTempName('');
    setEditingProjectId(null);
    if (!editingProjectId && newProjects.length === 1) {
      setActiveProjectId(newProjects[0].id);
    }
  };

  const handleDeleteProject = (id: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      const newProjects = projects.filter(p => p.id !== id);
      setProjects(newProjects);
      localStorage.setItem('analytics_projects', JSON.stringify(newProjects));
      if (activeProjectId === id) {
        setActiveProjectId(newProjects.length > 0 ? newProjects[0].id : null);
      }
    }
  };

  const handleResetConfig = () => {
    if (window.confirm('Are you sure you want to clear ALL local settings and projects?')) {
      localStorage.removeItem('analytics_projects');
      localStorage.removeItem('analytics_active_project_id');
      setProjects([]);
      setActiveProjectId(null);
      setData(null);
    }
  };

  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({ total: true });

  const isPageView = (name: string) => {
    const n = name.toLowerCase().replace(/_/g, ' ').trim();
    return n === 'page view' || n === 'pageview';
  };

  const nonPageViewEvents = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.events)
      .filter(([k]) => !isPageView(k))
      .sort((a, b) => (b[1] as number) - (a[1] as number));
  }, [data]);

  const topEvent = nonPageViewEvents[0] || null;

  const eventKeys = useMemo(() => {
    if (!data) return [];
    const keys = Object.keys(data.events);
    // Move 'page_view' (or 'page view') to the front if it exists
    return keys.sort((a, b) => {
      const isA = isPageView(a);
      const isB = isPageView(b);
      if (isA) return -1;
      if (isB) return 1;
      return 0;
    });
  }, [data]);

  const handleLegendClick = (o: any) => {
    const { dataKey } = o;
    setVisibleKeys(prev => ({
      ...prev,
      [dataKey]: !prev[dataKey]
    }));
  };

  const toggleAll = (visible: boolean) => {
    const next: Record<string, boolean> = { total: visible };
    eventKeys.forEach(key => {
      next[key] = visible;
    });
    // Also toggle user stats if present
    ['unique_users', 'new_users', 'returning_users'].forEach(key => {
      if (data?.summary[key as keyof typeof data.summary] !== undefined) {
        next[key] = visible;
      }
    });
    setVisibleKeys(next);
  };

  const chartData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.by_day).map(([date, events]) => {
      const total = Object.values(events).reduce((sum, val) => sum + val, 0);
      const userStats = data.users_by_day?.[date] || {};
      return Object.assign({
        date: date.split('-').slice(1).join('/'), // MM/DD
        total,
        ...userStats
      }, events);
    });
  }, [data]);

  const eventBreakdownData = useMemo(() => {
    if (!data) return [];
    const entries = Object.entries(data.events).map(([name, value]) => ({ name, value }));
    // Move 'page_view' (or 'page view') to the front if it exists
    return entries.sort((a, b) => {
      const isA = isPageView(a.name);
      const isB = isPageView(b.name);
      if (isA) return -1;
      if (isB) return 1;
      return 0;
    });
  }, [data]);

  const COLORS = ['#18181b', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (!isConfigured || showSettings) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden"
        >
          <div className="p-8 md:p-12">
            <div className="flex flex-col items-center mb-10">
              <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <Database className="text-white w-8 h-8" />
              </div>
              <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Project Hub</h1>
              <p className="text-zinc-500 text-lg mt-2 text-center max-w-md">
                Manage your analytics endpoints. Switch between projects seamlessly.
              </p>
            </div>

            {/* Project List */}
            {projects.length > 0 && (
              <div className="mb-10 space-y-3">
                <label className="block text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Saved Projects</label>
                {projects.map(project => (
                  <div 
                    key={project.id}
                    className={cn(
                      "group flex items-center justify-between p-4 rounded-2xl border transition-all",
                      activeProjectId === project.id 
                        ? "bg-zinc-900 border-zinc-900 text-white shadow-md" 
                        : "bg-zinc-50 border-zinc-100 text-zinc-900 hover:border-zinc-300"
                    )}
                  >
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => {
                        setActiveProjectId(project.id);
                        setShowSettings(false);
                      }}
                    >
                      <p className="font-bold text-lg">{project.name}</p>
                      <p className={cn(
                        "text-xs font-mono truncate max-w-[300px] opacity-50",
                        activeProjectId === project.id ? "text-zinc-300" : "text-zinc-500"
                      )}>
                        {project.url}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          setEditingProjectId(project.id);
                          setTempName(project.name);
                          setTempUrl(project.url);
                        }}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          activeProjectId === project.id ? "hover:bg-zinc-800" : "hover:bg-zinc-200"
                        )}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteProject(project.id)}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          activeProjectId === project.id ? "hover:bg-red-900 text-red-300" : "hover:bg-red-50 text-red-500"
                        )}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add/Edit Form */}
            <form onSubmit={handleSaveProject} className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100 space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-zinc-900">{editingProjectId ? 'Edit Project' : 'Add New Project'}</h3>
                {editingProjectId && (
                  <button 
                    type="button"
                    onClick={() => {
                      setEditingProjectId(null);
                      setTempName('');
                      setTempUrl('');
                    }}
                    className="text-xs font-bold text-zinc-400 hover:text-zinc-900 uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Project Name</label>
                  <input 
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
                    placeholder="e.g. My Service"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">API Endpoint URL</label>
                  <input 
                    type="text"
                    value={tempUrl}
                    onChange={(e) => setTempUrl(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all font-mono text-sm"
                    placeholder="https://api.com/report?..."
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={!tempUrl.trim() || !tempName.trim()}
                className="w-full bg-zinc-900 text-white font-bold py-4 rounded-xl hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
              >
                {editingProjectId ? 'Update Project' : 'Add Project'}
                <Plus className="w-5 h-5" />
              </button>
            </form>

            {isConfigured && (
              <div className="mt-10 pt-8 border-t border-zinc-100 flex flex-col items-center gap-4">
                <button 
                  onClick={() => setShowSettings(false)}
                  className="text-zinc-900 font-bold hover:underline"
                >
                  Back to Dashboard
                </button>
                <button 
                  onClick={handleResetConfig}
                  className="text-red-500 text-xs font-bold uppercase tracking-widest hover:opacity-70"
                >
                  Clear All Data
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
                <BarChart3 className="text-white w-5 h-5" />
              </div>
              <div className="relative group">
                <button 
                  className="flex items-center gap-2 text-left"
                  onClick={() => setShowSettings(true)}
                >
                  <div>
                    <h1 className="font-bold text-lg tracking-tight leading-none">{activeProject?.name || 'Service Analytics'}</h1>
                    {data?.project && data.project !== 'all' && (
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">
                        ID: {data.project}
                      </p>
                    )}
                  </div>
                  <ChevronDown className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-zinc-100 p-1 rounded-xl mr-4">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
                  activeTab === 'dashboard' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                )}
              >
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </button>
              <button 
                onClick={() => setActiveTab('guide')}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
                  activeTab === 'guide' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                )}
              >
                <BookOpen className="w-4 h-4" />
                Setup Guide
              </button>
            </div>
            <button 
              onClick={fetchData}
              disabled={loading}
              className="p-2 text-zinc-500 hover:bg-zinc-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
            </button>
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2 text-zinc-500 hover:bg-zinc-100 rounded-lg transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'guide' ? (
          <SetupGuide />
        ) : fetchError ? (
          <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-red-600 flex items-center gap-3">
            <AlertCircle className="w-6 h-6" />
            <div>
              <p className="font-semibold">Failed to load data</p>
              <p className="text-sm opacity-90">{fetchError}</p>
            </div>
          </div>
        ) : !data ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
            <RefreshCw className="w-12 h-12 animate-spin mb-4 opacity-20" />
            <p>Loading analytics data...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Period Info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Dashboard Overview</h2>
                <div className="flex items-center gap-2 text-zinc-500 text-sm mt-1">
                  <Calendar className="w-4 h-4" />
                  <span>{data.period.from} — {data.period.to}</span>
                  <span className="px-2 py-0.5 bg-zinc-100 rounded text-[10px] font-bold uppercase tracking-wider">
                    {data.period.days} Days
                  </span>
                </div>
              </div>
            </div>            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              <StatCard 
                title="Total Events" 
                value={data.summary.total_events.toLocaleString()} 
                icon={Activity}
              />
              <StatCard 
                title="Unique Users" 
                value={data.summary.unique_users.toLocaleString()} 
                icon={Users}
              />
              {data.summary.new_users !== undefined && (
                <StatCard 
                  title="New Users" 
                  value={data.summary.new_users.toLocaleString()} 
                  icon={Users}
                />
              )}
              {data.summary.returning_users !== undefined && (
                <StatCard 
                  title="Returning Users" 
                  value={data.summary.returning_users.toLocaleString()} 
                  icon={RefreshCw}
                />
              )}
              <StatCard 
                title="Avg Events/User" 
                value={data.summary.unique_users > 0 ? (data.summary.total_events / data.summary.unique_users).toFixed(1) : '0'} 
                icon={BarChart3}
              />
              {topEvent && (
                <StatCard 
                  title="Top Event" 
                  value={topEvent[0].replace(/_/g, ' ')} 
                  icon={TrendingUp}
                  trend={`${topEvent[1]} occurrences`}
                />
              )}
              <StatCard 
                title="Active Days" 
                value={Object.keys(data.by_day).length} 
                icon={Calendar}
              />
            </div>
            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Activity Chart */}
              <Card 
                className="lg:col-span-2" 
                title="Activity Trends" 
                icon={Activity}
                extra={
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => toggleAll(true)}
                      className="text-[12px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors"
                    >
                      Select All
                    </button>
                    <div className="w-px h-2 bg-zinc-200" />
                    <button 
                      onClick={() => toggleAll(false)}
                      className="text-[12px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                }
              >
                <div className="h-[450px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 12, fill: '#71717a' }}
                        dy={10}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 12, fill: '#71717a' }}
                        width={40}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e4e4e7', 
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                      />
                      <Legend 
                        verticalAlign="top" 
                        height={80} 
                        iconType="circle" 
                        onClick={handleLegendClick}
                        wrapperStyle={{ cursor: 'pointer', paddingBottom: '20px' }}
                        formatter={(value: string, entry: any) => {
                          const { dataKey } = entry;
                          const isVisible = visibleKeys[dataKey];
                          const total = eventBreakdownData.find(e => e.name === dataKey)?.value || 
                                        (dataKey === 'total' ? data.summary.total_events : 0);
                          return (
                            <span style={{ 
                              color: isVisible ? '#18181b' : '#a1a1aa',
                              fontSize: '13px',
                              fontWeight: isVisible ? '700' : '400',
                              opacity: isVisible ? 1 : 0.5
                            }}>
                              {value} <span style={{ opacity: 0.5, marginLeft: '4px' }}>({total})</span>
                            </span>
                          );
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="total" 
                        name="Total Activity"
                        stroke={COLORS[0]} 
                        strokeWidth={3} 
                        strokeDasharray="5 5"
                        dot={{ r: 4, fill: COLORS[0], strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                        hide={!visibleKeys.total}
                      >
                        <LabelList dataKey="total" position="top" offset={10} style={{ fontSize: '12px', fontWeight: 'bold', fill: COLORS[0] }} />
                      </Line>

                      {/* Render events in sorted order (page view will be first in eventKeys, so second in chart) */}
                      {eventKeys.map((key, index) => {
                        const colorIndex = (index + 1) % COLORS.length;
                        const displayName = isPageView(key) ? 'Page View' : key.replace(/_/g, ' ');
                        return (
                          <Line 
                            key={key}
                            type="monotone" 
                            dataKey={key} 
                            name={displayName}
                            stroke={COLORS[colorIndex]} 
                            strokeWidth={2} 
                            dot={{ r: 3 }}
                            hide={!visibleKeys[key]}
                          >
                            {visibleKeys[key] && eventKeys.length < 4 && (
                               <LabelList dataKey={key} position="top" offset={10} style={{ fontSize: '10px', fill: COLORS[colorIndex] }} />
                            )}
                          </Line>
                        );
                      })}

                      {/* Render user stats if available */}
                      {['unique_users', 'new_users', 'returning_users'].map((key, idx) => {
                        if (data.summary[key as keyof typeof data.summary] === undefined) return null;
                        const colorIndex = (eventKeys.length + idx + 1) % COLORS.length;
                        const names: Record<string, string> = {
                          unique_users: 'Unique Users',
                          new_users: 'New Users',
                          returning_users: 'Returning Users'
                        };
                        return (
                          <Line 
                            key={key}
                            type="monotone" 
                            dataKey={key} 
                            name={names[key]}
                            stroke={COLORS[colorIndex]} 
                            strokeWidth={2} 
                            strokeDasharray="3 3"
                            dot={{ r: 3 }}
                            hide={!visibleKeys[key]}
                          />
                        );
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Event Breakdown (Pie Chart) */}
              <Card title="Event Distribution" icon={PieChartIcon}>
                <div className="h-[450px] w-full flex flex-col">
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={eventBreakdownData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {eventBreakdownData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-3">
                    {eventBreakdownData.map((event, index) => (
                      <div key={event.name} className="flex items-center justify-between text-base">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS[(index + 1) % COLORS.length] }} />
                          <span className="text-zinc-600 capitalize">{isPageView(event.name) ? 'Page View' : event.name.replace(/_/g, ' ')}</span>
                        </div>
                        <span className="font-bold text-zinc-900">{event.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* Event Breakdown Grid */}
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-px flex-1 bg-zinc-100" />
                <h3 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em]">Event Breakdown</h3>
                <div className="h-px flex-1 bg-zinc-100" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {eventBreakdownData.map((event, index) => (
                  <motion.div
                    key={event.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm flex flex-col items-center text-center group hover:border-zinc-300 transition-all"
                  >
                    <div className="w-1.5 h-1.5 rounded-full mb-2" style={{ backgroundColor: COLORS[(index + 1) % COLORS.length] }} />
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider truncate w-full mb-1 group-hover:text-zinc-600 transition-colors">
                      {isPageView(event.name) ? 'Page View' : event.name.replace(/_/g, ' ')}
                    </p>
                    <p className="text-2xl font-black text-zinc-900 tracking-tight">{event.value.toLocaleString()}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Raw Data Table (Simplified) */}
            <Card title="Recent Daily Breakdown" icon={BarChart3}>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-zinc-100">
                      <th className="pb-4 text-sm font-semibold text-zinc-400 uppercase tracking-wider">Date</th>
                      <th className="pb-4 text-sm font-semibold text-zinc-400 uppercase tracking-wider">Total Events</th>
                      <th className="pb-4 text-sm font-semibold text-zinc-400 uppercase tracking-wider">Top Event</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {Object.entries(data.by_day).reverse().map(([date, events]) => {
                      const total = Object.values(events).reduce((sum, val) => sum + val, 0);
                      const topEvent = Object.entries(events).sort((a, b) => b[1] - a[1])[0];
                      
                      return (
                        <tr key={date} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="py-4 text-base font-medium text-zinc-900">{date}</td>
                          <td className="py-4 text-base text-zinc-600">
                            <span className={cn(
                              "px-3 py-1.5 rounded-md text-sm font-bold",
                              total > 0 ? "bg-zinc-100 text-zinc-900" : "bg-zinc-50 text-zinc-400"
                            )}>
                              {total}
                            </span>
                          </td>
                          <td className="py-4 text-base text-zinc-500 italic">
                            {topEvent ? `${topEvent[0].replace(/_/g, ' ')} (${topEvent[1]})` : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-zinc-200 mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-zinc-400 text-xs font-medium uppercase tracking-widest">
          <p>© 2026 Service Analytics</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-zinc-900 transition-colors">Privacy</a>
            <a href="#" className="hover:text-zinc-900 transition-colors">Terms</a>
            <a href="#" className="hover:text-zinc-900 transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
