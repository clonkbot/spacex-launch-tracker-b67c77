import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const launches = await ctx.db
      .query("launches")
      .withIndex("by_launch_date")
      .order("asc")
      .collect();
    return launches;
  },
});

export const getById = query({
  args: { id: v.id("launches") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getUpcoming = query({
  args: {},
  handler: async (ctx) => {
    const launches = await ctx.db
      .query("launches")
      .withIndex("by_status", (q) => q.eq("status", "upcoming"))
      .collect();
    return launches.sort((a, b) => a.launchDate - b.launchDate);
  },
});

export const getLive = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("launches")
      .withIndex("by_status", (q) => q.eq("status", "live"))
      .collect();
  },
});

export const getCompleted = query({
  args: {},
  handler: async (ctx) => {
    const launches = await ctx.db
      .query("launches")
      .withIndex("by_status", (q) => q.eq("status", "completed"))
      .collect();
    return launches.sort((a, b) => b.launchDate - a.launchDate);
  },
});

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existingLaunches = await ctx.db.query("launches").collect();
    if (existingLaunches.length > 0) return;

    const now = Date.now();
    const hour = 60 * 60 * 1000;
    const day = 24 * hour;

    // Upcoming launches
    const launch1 = await ctx.db.insert("launches", {
      name: "Starlink Group 9-14",
      rocketName: "Falcon 9",
      rocketType: "Block 5",
      launchSite: "SLC-40, Cape Canaveral",
      launchDate: now + 2 * day + 4 * hour,
      status: "upcoming",
      description: "SpaceX Starlink mission deploying 23 satellites to expand global internet coverage. This flight marks the 15th mission for this particular booster.",
      payloadType: "Starlink Satellites",
      payloadMass: 17400,
      orbitType: "LEO (Low Earth Orbit)",
      createdAt: now,
      updatedAt: now,
    });

    const launch2 = await ctx.db.insert("launches", {
      name: "CRS-31",
      rocketName: "Falcon 9",
      rocketType: "Block 5",
      launchSite: "LC-39A, Kennedy Space Center",
      launchDate: now + 5 * day + 14 * hour,
      status: "upcoming",
      description: "31st Commercial Resupply Services mission to the International Space Station. Cargo Dragon carrying science experiments, crew supplies, and equipment.",
      payloadType: "Dragon Spacecraft",
      payloadMass: 2500,
      orbitType: "ISS Orbit",
      livestreamUrl: "https://youtube.com/spacex",
      createdAt: now,
      updatedAt: now,
    });

    const launch3 = await ctx.db.insert("launches", {
      name: "Starship Flight 7",
      rocketName: "Starship",
      rocketType: "Full Stack",
      launchSite: "Starbase, Boca Chica",
      launchDate: now + 14 * day,
      status: "upcoming",
      description: "Seventh integrated test flight of Starship and Super Heavy. Objectives include booster catch attempt, extended Ship coast phase, and controlled ocean splashdown.",
      payloadType: "Test Flight",
      orbitType: "Suborbital",
      createdAt: now,
      updatedAt: now,
    });

    // Live launch simulation
    const launch4 = await ctx.db.insert("launches", {
      name: "Transporter-12",
      rocketName: "Falcon 9",
      rocketType: "Block 5",
      launchSite: "VSFB SLC-4E",
      launchDate: now - 20 * 60 * 1000,
      status: "live",
      description: "Dedicated rideshare mission carrying multiple small satellites from various commercial and government customers to sun-synchronous orbit.",
      payloadType: "Multiple Satellites",
      payloadMass: 6000,
      orbitType: "SSO (Sun-Synchronous)",
      livestreamUrl: "https://youtube.com/spacex",
      createdAt: now,
      updatedAt: now,
    });

    // Completed launches
    const launch5 = await ctx.db.insert("launches", {
      name: "Crew-9",
      rocketName: "Falcon 9",
      rocketType: "Block 5",
      launchSite: "LC-39A, Kennedy Space Center",
      launchDate: now - 3 * day,
      status: "completed",
      description: "NASA Commercial Crew mission carrying astronauts to the ISS for a six-month expedition. Successful launch and docking achieved.",
      payloadType: "Crew Dragon",
      orbitType: "ISS Orbit",
      createdAt: now - 4 * day,
      updatedAt: now,
    });

    const launch6 = await ctx.db.insert("launches", {
      name: "Bandwagon-2",
      rocketName: "Falcon 9",
      rocketType: "Block 5",
      launchSite: "SLC-40, Cape Canaveral",
      launchDate: now - 7 * day,
      status: "completed",
      description: "Second Bandwagon mission — a new rideshare service for mid-inclination orbits not covered by standard Transporter flights.",
      payloadType: "Multiple Satellites",
      payloadMass: 4500,
      orbitType: "MEO",
      createdAt: now - 8 * day,
      updatedAt: now,
    });

    // Add personnel
    await ctx.db.insert("personnel", {
      launchId: launch2,
      name: "Sarah Chen",
      role: "Mission Director",
      bio: "15 years at SpaceX. Led over 50 successful missions.",
      isAstronaut: false,
    });

    await ctx.db.insert("personnel", {
      launchId: launch5,
      name: "Nick Hague",
      role: "Commander",
      bio: "NASA astronaut, veteran of Expedition 59/60.",
      isAstronaut: true,
    });

    await ctx.db.insert("personnel", {
      launchId: launch5,
      name: "Aleksandr Gorbunov",
      role: "Mission Specialist",
      bio: "Roscosmos cosmonaut on first spaceflight.",
      isAstronaut: true,
    });

    await ctx.db.insert("personnel", {
      launchId: launch3,
      name: "Kate Tice",
      role: "Quality Engineering Manager",
      bio: "Known for hosting Starship webcast coverage.",
      isAstronaut: false,
    });

    // Add events for live launch
    await ctx.db.insert("events", {
      launchId: launch4,
      timestamp: now - 20 * 60 * 1000,
      title: "LIFTOFF",
      description: "Falcon 9 has lifted off from Vandenberg Space Force Base!",
      eventType: "milestone",
      isLive: true,
    });

    await ctx.db.insert("events", {
      launchId: launch4,
      timestamp: now - 18 * 60 * 1000,
      title: "Max-Q",
      description: "Vehicle has passed through maximum aerodynamic pressure.",
      eventType: "milestone",
      isLive: true,
    });

    await ctx.db.insert("events", {
      launchId: launch4,
      timestamp: now - 17 * 60 * 1000,
      title: "MECO",
      description: "Main engine cutoff confirmed. Stage separation successful.",
      eventType: "milestone",
      isLive: true,
    });

    await ctx.db.insert("events", {
      launchId: launch4,
      timestamp: now - 15 * 60 * 1000,
      title: "Second Stage Ignition",
      description: "Merlin Vacuum engine has ignited for orbital insertion.",
      eventType: "milestone",
      isLive: true,
    });

    await ctx.db.insert("events", {
      launchId: launch4,
      timestamp: now - 12 * 60 * 1000,
      title: "Booster Landing Confirmed",
      description: "First stage has landed on Of Course I Still Love You droneship.",
      eventType: "success",
      isLive: true,
    });

    await ctx.db.insert("events", {
      launchId: launch4,
      timestamp: now - 5 * 60 * 1000,
      title: "SECO-1",
      description: "Second engine cutoff. Coast phase initiated.",
      eventType: "milestone",
      isLive: true,
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("launches"),
    status: v.union(v.literal("upcoming"), v.literal("live"), v.literal("completed"), v.literal("scrubbed"))
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});
