import { useConvexAuth, useQuery, useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../convex/_generated/api";
import { useState, useEffect } from "react";
import { Id } from "../convex/_generated/dataModel";

// Type definitions
type LaunchStatus = "upcoming" | "live" | "completed" | "scrubbed";
type EventType = "milestone" | "update" | "alert" | "success" | "anomaly";

interface Launch {
  _id: Id<"launches">;
  _creationTime: number;
  name: string;
  missionPatch?: string;
  rocketName: string;
  rocketType: string;
  launchSite: string;
  launchDate: number;
  status: LaunchStatus;
  description: string;
  payloadType: string;
  payloadMass?: number;
  orbitType: string;
  livestreamUrl?: string;
  createdAt: number;
  updatedAt: number;
}

interface Personnel {
  _id: Id<"personnel">;
  _creationTime: number;
  launchId: Id<"launches">;
  name: string;
  role: string;
  bio?: string;
  imageUrl?: string;
  isAstronaut: boolean;
}

interface LaunchEvent {
  _id: Id<"events">;
  _creationTime: number;
  launchId: Id<"launches">;
  timestamp: number;
  title: string;
  description: string;
  eventType: EventType;
  isLive: boolean;
}

interface Comment {
  _id: Id<"comments">;
  _creationTime: number;
  launchId: Id<"launches">;
  userId: Id<"users">;
  content: string;
  createdAt: number;
  userName: string;
}

// Utility functions
function formatCountdown(ms: number): string {
  if (ms <= 0) return "T+00:00:00";
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));

  if (days > 0) {
    return `T-${days}d ${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `T-${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Auth Component
function AuthScreen() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await signIn("password", formData);
    } catch {
      setError(flow === "signIn" ? "Invalid credentials" : "Could not create account");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00ff88]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#ffaa00]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00ff88]/30 to-[#ffaa00]/30 rounded-2xl blur opacity-30" />
        <div className="relative bg-[#0f0f18] border border-[#1a1a2e] rounded-2xl p-6 md:p-8 backdrop-blur-xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-3 h-3 bg-[#00ff88] rounded-full animate-pulse shadow-[0_0_10px_#00ff88]" />
              <span className="text-[#00ff88] font-mono text-xs tracking-widest">MISSION CONTROL</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight" style={{ fontFamily: "Orbitron, sans-serif" }}>
              SPACE<span className="text-[#00ff88]">X</span> TRACKER
            </h1>
            <p className="text-[#666] text-sm mt-2">Real-time launch intelligence</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[#666] text-xs font-mono uppercase tracking-wider block mb-2">Email</label>
              <input
                name="email"
                type="email"
                required
                className="w-full bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg px-4 py-3 text-white placeholder-[#333] focus:outline-none focus:border-[#00ff88]/50 focus:shadow-[0_0_10px_rgba(0,255,136,0.1)] transition-all"
                placeholder="astronaut@spacex.com"
              />
            </div>
            <div>
              <label className="text-[#666] text-xs font-mono uppercase tracking-wider block mb-2">Password</label>
              <input
                name="password"
                type="password"
                required
                className="w-full bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg px-4 py-3 text-white placeholder-[#333] focus:outline-none focus:border-[#00ff88]/50 focus:shadow-[0_0_10px_rgba(0,255,136,0.1)] transition-all"
                placeholder="••••••••"
              />
            </div>
            <input name="flow" type="hidden" value={flow} />

            {error && (
              <div className="text-[#ff4444] text-sm bg-[#ff4444]/10 border border-[#ff4444]/30 rounded-lg p-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-black font-bold py-3 rounded-lg hover:shadow-[0_0_20px_rgba(0,255,136,0.3)] transition-all disabled:opacity-50 uppercase tracking-wider text-sm"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              {loading ? "Authenticating..." : flow === "signIn" ? "Access Mission Control" : "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
              className="text-[#666] hover:text-[#00ff88] text-sm transition-colors"
            >
              {flow === "signIn" ? "Need an account? Sign up" : "Already have access? Sign in"}
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#1a1a2e]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#0f0f18] px-4 text-[#444] text-xs font-mono">OR</span>
            </div>
          </div>

          <button
            onClick={() => signIn("anonymous")}
            className="w-full border border-[#1a1a2e] text-[#666] py-3 rounded-lg hover:border-[#ffaa00]/50 hover:text-[#ffaa00] transition-all text-sm"
          >
            Continue as Guest Observer
          </button>
        </div>
      </div>
    </div>
  );
}

// Launch Card Component
function LaunchCard({
  launch,
  isSelected,
  onSelect
}: {
  launch: {
    _id: Id<"launches">;
    name: string;
    rocketName: string;
    rocketType: string;
    launchSite: string;
    launchDate: number;
    status: "upcoming" | "live" | "completed" | "scrubbed";
    payloadType: string;
    orbitType: string;
  };
  isSelected: boolean;
  onSelect: () => void;
}) {
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    if (launch.status !== "upcoming" && launch.status !== "live") return;

    const update = () => {
      const diff = launch.launchDate - Date.now();
      setCountdown(formatCountdown(diff));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [launch.launchDate, launch.status]);

  const statusColors = {
    upcoming: "text-[#00ff88] border-[#00ff88]/30 bg-[#00ff88]/5",
    live: "text-[#ff4444] border-[#ff4444]/30 bg-[#ff4444]/5 animate-pulse",
    completed: "text-[#666] border-[#666]/30 bg-[#666]/5",
    scrubbed: "text-[#ffaa00] border-[#ffaa00]/30 bg-[#ffaa00]/5",
  };

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-4 md:p-5 rounded-xl border transition-all duration-300 ${
        isSelected
          ? "bg-[#0f0f18] border-[#00ff88]/50 shadow-[0_0_20px_rgba(0,255,136,0.1)]"
          : "bg-[#0a0a0f]/50 border-[#1a1a2e] hover:border-[#333]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`text-[10px] md:text-xs font-mono px-2 py-0.5 rounded border ${statusColors[launch.status]}`}>
              {launch.status === "live" ? "● LIVE" : launch.status.toUpperCase()}
            </span>
            <span className="text-[#444] text-[10px] md:text-xs font-mono">{launch.rocketName}</span>
          </div>
          <h3 className="text-white font-semibold text-sm md:text-base mb-1 truncate" style={{ fontFamily: "Orbitron, sans-serif" }}>
            {launch.name}
          </h3>
          <p className="text-[#666] text-xs truncate">{launch.launchSite}</p>
        </div>
        {(launch.status === "upcoming" || launch.status === "live") && (
          <div className="text-right shrink-0">
            <div className="text-[#ffaa00] font-mono text-xs md:text-sm font-bold tracking-wider">
              {countdown}
            </div>
            <div className="text-[#444] text-[10px] mt-1 hidden md:block">{formatDate(launch.launchDate)}</div>
          </div>
        )}
        {launch.status === "completed" && (
          <div className="text-[#666] text-[10px] md:text-xs shrink-0">{formatDate(launch.launchDate)}</div>
        )}
      </div>
    </button>
  );
}

// Launch Detail Component
function LaunchDetail({ launchId, onClose }: { launchId: Id<"launches">; onClose: () => void }) {
  const launch = useQuery(api.launches.getById, { id: launchId });
  const personnel = useQuery(api.personnel.getByLaunch, { launchId });
  const events = useQuery(api.events.getByLaunch, { launchId });
  const comments = useQuery(api.comments.getByLaunch, { launchId });
  const addComment = useMutation(api.comments.add);
  const [newComment, setNewComment] = useState("");
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    if (!launch || (launch.status !== "upcoming" && launch.status !== "live")) return;

    const update = () => {
      const diff = launch.launchDate - Date.now();
      setCountdown(formatCountdown(diff));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [launch]);

  if (!launch) return <div className="text-[#666] p-8">Loading mission data...</div>;

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    addComment({ launchId, content: newComment.trim() });
    setNewComment("");
  };

  const eventTypeStyles = {
    milestone: "border-[#00ff88]/50 bg-[#00ff88]/5",
    update: "border-[#666]/50 bg-[#666]/5",
    alert: "border-[#ffaa00]/50 bg-[#ffaa00]/5",
    success: "border-[#00ff88]/50 bg-[#00ff88]/10",
    anomaly: "border-[#ff4444]/50 bg-[#ff4444]/5",
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0a0f]">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-[#1a1a2e] shrink-0">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onClose}
            className="md:hidden text-[#666] hover:text-white p-2 -ml-2"
          >
            ← Back
          </button>
          {launch.status === "live" && (
            <div className="flex items-center gap-2 text-[#ff4444]">
              <div className="w-2 h-2 bg-[#ff4444] rounded-full animate-pulse" />
              <span className="font-mono text-xs">LIVE TELEMETRY</span>
            </div>
          )}
        </div>

        <h2 className="text-xl md:text-2xl font-bold text-white mb-2" style={{ fontFamily: "Orbitron, sans-serif" }}>
          {launch.name}
        </h2>

        <div className="flex flex-wrap gap-3 text-xs md:text-sm">
          <span className="text-[#00ff88] font-mono">{launch.rocketName} {launch.rocketType}</span>
          <span className="text-[#444]">•</span>
          <span className="text-[#666]">{launch.launchSite}</span>
        </div>

        {(launch.status === "upcoming" || launch.status === "live") && (
          <div className="mt-4 p-4 bg-[#0f0f18] border border-[#1a1a2e] rounded-xl">
            <div className="text-[#ffaa00] font-mono text-2xl md:text-4xl font-bold tracking-wider text-center" style={{ fontFamily: "Orbitron, sans-serif", textShadow: "0 0 20px rgba(255,170,0,0.5)" }}>
              {countdown}
            </div>
            <div className="text-[#666] text-xs text-center mt-2 font-mono">
              {formatDate(launch.launchDate)}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 space-y-6">
          {/* Mission Details */}
          <div>
            <h3 className="text-[#00ff88] font-mono text-xs uppercase tracking-wider mb-3">Mission Overview</h3>
            <p className="text-[#999] text-sm leading-relaxed">{launch.description}</p>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-[#0f0f18] border border-[#1a1a2e] rounded-lg p-3">
                <div className="text-[#666] text-[10px] font-mono uppercase">Payload</div>
                <div className="text-white text-sm mt-1">{launch.payloadType}</div>
              </div>
              <div className="bg-[#0f0f18] border border-[#1a1a2e] rounded-lg p-3">
                <div className="text-[#666] text-[10px] font-mono uppercase">Orbit</div>
                <div className="text-white text-sm mt-1">{launch.orbitType}</div>
              </div>
              {launch.payloadMass && (
                <div className="bg-[#0f0f18] border border-[#1a1a2e] rounded-lg p-3">
                  <div className="text-[#666] text-[10px] font-mono uppercase">Mass</div>
                  <div className="text-white text-sm mt-1">{launch.payloadMass.toLocaleString()} kg</div>
                </div>
              )}
            </div>
          </div>

          {/* Personnel */}
          {personnel && personnel.length > 0 && (
            <div>
              <h3 className="text-[#00ff88] font-mono text-xs uppercase tracking-wider mb-3">Key Personnel</h3>
              <div className="space-y-2">
                {(personnel as Personnel[]).map((person: Personnel) => (
                  <div key={person._id} className="flex items-center gap-3 bg-[#0f0f18] border border-[#1a1a2e] rounded-lg p-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${person.isAstronaut ? "bg-[#ffaa00]/20 text-[#ffaa00]" : "bg-[#00ff88]/20 text-[#00ff88]"}`}>
                      {person.name.split(" ").map((n: string) => n[0]).join("")}
                    </div>
                    <div>
                      <div className="text-white text-sm font-medium">{person.name}</div>
                      <div className="text-[#666] text-xs">{person.role}</div>
                    </div>
                    {person.isAstronaut && (
                      <span className="ml-auto text-[#ffaa00] text-[10px] font-mono border border-[#ffaa00]/30 px-2 py-0.5 rounded">CREW</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Events Timeline */}
          {events && events.length > 0 && (
            <div>
              <h3 className="text-[#00ff88] font-mono text-xs uppercase tracking-wider mb-3">Event Timeline</h3>
              <div className="space-y-2">
                {(events as LaunchEvent[]).map((event: LaunchEvent) => (
                  <div key={event._id} className={`border rounded-lg p-3 ${eventTypeStyles[event.eventType]}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white text-sm font-semibold">{event.title}</span>
                      <span className="text-[#666] text-[10px] font-mono">{timeAgo(event.timestamp)}</span>
                    </div>
                    <p className="text-[#999] text-xs">{event.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div>
            <h3 className="text-[#00ff88] font-mono text-xs uppercase tracking-wider mb-3">Mission Discussion</h3>

            <form onSubmit={handleSubmitComment} className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add to the discussion..."
                  className="flex-1 bg-[#0f0f18] border border-[#1a1a2e] rounded-lg px-4 py-2 text-white placeholder-[#444] text-sm focus:outline-none focus:border-[#00ff88]/50"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="bg-[#00ff88] text-black px-4 py-2 rounded-lg font-semibold text-sm hover:bg-[#00cc6a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Send
                </button>
              </div>
            </form>

            {comments && comments.length > 0 ? (
              <div className="space-y-2">
                {(comments as Comment[]).map((comment: Comment) => (
                  <div key={comment._id} className="bg-[#0f0f18] border border-[#1a1a2e] rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[#00ff88] text-xs font-mono">{comment.userName}</span>
                      <span className="text-[#444] text-[10px]">{timeAgo(comment.createdAt)}</span>
                    </div>
                    <p className="text-[#ccc] text-sm">{comment.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#444] text-sm">No comments yet. Be the first to discuss this mission.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Dashboard Component
function Dashboard() {
  const { signOut } = useAuthActions();
  const launches = useQuery(api.launches.list);
  const seedData = useMutation(api.launches.seed);
  const [selectedLaunchId, setSelectedLaunchId] = useState<Id<"launches"> | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "upcoming" | "live" | "completed">("all");

  useEffect(() => {
    seedData();
  }, [seedData]);

  const filteredLaunches = launches?.filter((l: Launch) => {
    if (activeFilter === "all") return true;
    return l.status === activeFilter;
  });

  const liveLaunches = (launches?.filter((l: Launch) => l.status === "live") || []) as Launch[];

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      {/* Scan line overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.03)_2px,rgba(0,0,0,0.03)_4px)]" />

      {/* Header */}
      <header className="border-b border-[#1a1a2e] p-4 md:px-6 shrink-0">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 md:w-10 md:h-10 border-2 border-[#00ff88] rounded-full flex items-center justify-center">
                <div className="w-3 h-3 md:w-4 md:h-4 bg-[#00ff88] rounded-full shadow-[0_0_10px_#00ff88]" />
              </div>
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-white tracking-tight" style={{ fontFamily: "Orbitron, sans-serif" }}>
                SPACE<span className="text-[#00ff88]">X</span>
              </h1>
              <div className="text-[#666] text-[10px] font-mono tracking-widest hidden md:block">LAUNCH TRACKER</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {liveLaunches.length > 0 && (
              <div className="hidden md:flex items-center gap-2 bg-[#ff4444]/10 border border-[#ff4444]/30 px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 bg-[#ff4444] rounded-full animate-pulse" />
                <span className="text-[#ff4444] text-xs font-mono">{liveLaunches.length} LIVE</span>
              </div>
            )}
            <button
              onClick={() => signOut()}
              className="text-[#666] hover:text-white text-xs font-mono transition-colors px-3 py-2"
            >
              SIGN OUT
            </button>
          </div>
        </div>
      </header>

      {/* Live Alert Banner */}
      {liveLaunches.length > 0 && (
        <div className="bg-gradient-to-r from-[#ff4444]/10 via-[#ff4444]/5 to-[#ff4444]/10 border-b border-[#ff4444]/30 px-4 py-3 md:hidden">
          <button
            onClick={() => setSelectedLaunchId(liveLaunches[0]._id)}
            className="w-full flex items-center justify-center gap-2 text-[#ff4444]"
          >
            <div className="w-2 h-2 bg-[#ff4444] rounded-full animate-pulse" />
            <span className="text-sm font-mono">{liveLaunches[0].name} IS LIVE — TAP TO VIEW</span>
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Launch List */}
        <div className={`${selectedLaunchId ? "hidden md:flex" : "flex"} flex-col w-full md:w-96 lg:w-[420px] border-r border-[#1a1a2e] shrink-0`}>
          {/* Filters */}
          <div className="p-4 border-b border-[#1a1a2e] shrink-0">
            <div className="flex gap-1 bg-[#0f0f18] p-1 rounded-lg">
              {(["all", "upcoming", "live", "completed"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`flex-1 px-3 py-2 rounded-md text-xs font-mono transition-all ${
                    activeFilter === filter
                      ? "bg-[#1a1a2e] text-[#00ff88]"
                      : "text-[#666] hover:text-white"
                  }`}
                >
                  {filter.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Launch List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredLaunches === undefined ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-[#666] text-sm font-mono">Loading mission data...</p>
              </div>
            ) : filteredLaunches.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#666] text-sm">No launches found</p>
              </div>
            ) : (
              (filteredLaunches as Launch[]).map((launch: Launch, index: number) => (
                <div
                  key={launch._id}
                  style={{ animationDelay: `${index * 50}ms` }}
                  className="animate-fade-in"
                >
                  <LaunchCard
                    launch={launch}
                    isSelected={selectedLaunchId === launch._id}
                    onSelect={() => setSelectedLaunchId(launch._id)}
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detail Panel */}
        <div className={`${selectedLaunchId ? "flex" : "hidden md:flex"} flex-1 flex-col`}>
          {selectedLaunchId ? (
            <LaunchDetail
              launchId={selectedLaunchId}
              onClose={() => setSelectedLaunchId(null)}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <div className="w-24 h-24 border border-[#1a1a2e] rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-[#333]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h3 className="text-white font-semibold mb-2" style={{ fontFamily: "Orbitron, sans-serif" }}>Select a Mission</h3>
                <p className="text-[#666] text-sm max-w-xs mx-auto">
                  Choose a launch from the manifest to view detailed telemetry, personnel, and real-time updates.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#1a1a2e] px-4 py-3 text-center shrink-0">
        <p className="text-[#444] text-[10px] font-mono">
          Requested by @launchcodes1337 · Built by @clonkbot
        </p>
      </footer>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}

// Main App
export default function App() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#666] font-mono text-sm">Initializing systems...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return <Dashboard />;
}
