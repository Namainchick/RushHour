"use client";
import { useEffect, useState } from "react";
import type { BusinessProfile, MatchResult, TrafficLight, Weights } from "./types";

const RES_KEY = "rushhour:reservations";
const CTX_KEY = "rushhour:matchctx";
const EVT = "rushhour:reservations-changed";

export type ReservationStatus = "angefragt" | "bestaetigt";

export type Reservation = {
  creatorId: string;
  handle: string;
  avatarUrl: string;
  coverUrl?: string;
  city: string;
  score?: number;
  light?: TrafficLight;
  priceFrom?: number;
  status: ReservationStatus;
  createdAtLabel: string;
  businessName?: string;
};

function read(): Reservation[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RES_KEY) || "[]") as Reservation[];
  } catch {
    return [];
  }
}

function write(list: Reservation[]) {
  localStorage.setItem(RES_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EVT));
}

export function addReservation(r: Reservation) {
  const list = read().filter((x) => x.creatorId !== r.creatorId);
  write([r, ...list]);
}

export function removeReservation(creatorId: string) {
  write(read().filter((x) => x.creatorId !== creatorId));
}

export function hasReservation(creatorId: string): boolean {
  return read().some((x) => x.creatorId === creatorId);
}

/** Live list of reservations that re-renders when bookings change in any tab/component. */
export function useReservations(): Reservation[] {
  const [list, setList] = useState<Reservation[]>([]);
  useEffect(() => {
    const sync = () => setList(read());
    sync();
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return list;
}

// --- Match context: lets a creator profile explain *why* it matched ---
export type MatchContext = { business: BusinessProfile; weights: Weights; results: MatchResult[] };

export function saveMatchContext(ctx: MatchContext) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(CTX_KEY, JSON.stringify(ctx));
  } catch {
    /* ignore quota errors in the demo */
  }
}

export function getMatchContext(): MatchContext | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(sessionStorage.getItem(CTX_KEY) || "null") as MatchContext | null;
  } catch {
    return null;
  }
}
