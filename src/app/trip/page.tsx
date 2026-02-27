"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import MapPanel from "./MapPanel";

type Trip = {
  destination: string;
  startDate: string;
  endDate: string;
  transport: string;
};

type Departure = {
  location: string;
  datetime: string;
  datetimeUndecided: boolean;
};

type Spot = {
  id: string;
  name: string;
  category: string;
  memo: string;
  visitDate: string; // "YYYY-MM-DD" or ""
  visitTime: string; // "HH:mm" or ""
};

type SpotFormState = {
  name: string;
  category: string;
  memo: string;
  visitDate: string;
  visitTime: string;
};

type DayGroup = {
  date: string; // "" means undecided
  spots: Spot[];
};

type TravelMode = "transit" | "driving" | "walking";

type TravelInfo = {
  mode: TravelMode;
  loading: boolean;
  duration?: string;
  distance?: string;
  error?: string;
};

const CATEGORIES = ["観光", "グルメ", "ショッピング", "宿泊", "その他"] as const;

const emptySpotForm: SpotFormState = {
  name: "",
  category: "観光",
  memo: "",
  visitDate: "",
  visitTime: "",
};

const CATEGORY_COLORS: Record<string, string> = {
  観光: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300",
  グルメ: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
  ショッピング: "bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300",
  宿泊: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
  その他: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
};

const TRAVEL_MODES: { value: TravelMode; label: string }[] = [
  { value: "transit", label: "電車" },
  { value: "driving", label: "車" },
  { value: "walking", label: "徒歩" },
];

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("ja-JP");
}

function formatDatetime(datetimeStr: string) {
  if (!datetimeStr) return "";
  return new Date(datetimeStr).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function groupSpots(spots: Spot[]): DayGroup[] {
  const map: Record<string, Spot[]> = {};
  for (const spot of spots) {
    const key = spot.visitDate || "";
    if (!map[key]) map[key] = [];
    map[key].push(spot);
  }
  return Object.entries(map)
    .map(([date, items]) => ({
      date,
      spots: [...items].sort((a, b) => {
        if (!a.visitTime && !b.visitTime) return 0;
        if (!a.visitTime) return 1;
        if (!b.visitTime) return -1;
        return a.visitTime.localeCompare(b.visitTime);
      }),
    }))
    .sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date.localeCompare(b.date);
    });
}

export default function TripPage() {
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);

  // --- Departure state ---
  const [departureForm, setDepartureForm] = useState({ location: "", datetime: "" });
  const [locationUndecided, setLocationUndecided] = useState(false);
  const [datetimeUndecided, setDatetimeUndecided] = useState(false);
  const [departure, setDeparture] = useState<Departure | null>(null);
  const [isEditingDeparture, setIsEditingDeparture] = useState(true);
  const depDatetimeRef = useRef<HTMLInputElement>(null);

  // --- Spot state ---
  const [spots, setSpots] = useState<Spot[]>([]);
  const [spotForm, setSpotForm] = useState<SpotFormState>(emptySpotForm);
  const [editingSpotId, setEditingSpotId] = useState<string | null>(null);
  const [editingSpotForm, setEditingSpotForm] = useState<SpotFormState>(emptySpotForm);
  const visitDateRef = useRef<HTMLInputElement>(null);
  const editVisitDateRef = useRef<HTMLInputElement>(null);

  // --- Travel time state ---
  const [travelInfos, setTravelInfos] = useState<Record<string, TravelInfo>>({});

  useEffect(() => {
    const data = sessionStorage.getItem("currentTrip");
    if (!data) {
      router.push("/");
      return;
    }
    setTrip(JSON.parse(data) as Trip);
  }, [router]);

  // ---- Departure handlers ----

  const handleDepartureSave = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const loc = locationUndecided ? "未定" : departureForm.location.trim();
    if (!loc) return;
    setDeparture({
      location: loc,
      datetime: datetimeUndecided ? "" : departureForm.datetime,
      datetimeUndecided,
    });
    setIsEditingDeparture(false);
  };

  const handleDepartureEdit = () => {
    if (!departure) return;
    setDepartureForm({
      location: departure.location === "未定" ? "" : departure.location,
      datetime: departure.datetime,
    });
    setLocationUndecided(departure.location === "未定");
    setDatetimeUndecided(departure.datetimeUndecided);
    setIsEditingDeparture(true);
  };

  // ---- Spot handlers ----

  const handleSpotSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!spotForm.name.trim()) return;
    setSpots((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: spotForm.name.trim(),
        category: spotForm.category,
        memo: spotForm.memo.trim(),
        visitDate: spotForm.visitDate,
        visitTime: spotForm.visitTime,
      },
    ]);
    setSpotForm(emptySpotForm);
  };

  const handleSpotEditStart = (spot: Spot) => {
    setEditingSpotId(spot.id);
    setEditingSpotForm({
      name: spot.name,
      category: spot.category,
      memo: spot.memo,
      visitDate: spot.visitDate,
      visitTime: spot.visitTime,
    });
  };

  const handleSpotEditSave = (id: string) => {
    if (!editingSpotForm.name.trim()) return;
    setSpots((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              name: editingSpotForm.name.trim(),
              category: editingSpotForm.category,
              memo: editingSpotForm.memo.trim(),
              visitDate: editingSpotForm.visitDate,
              visitTime: editingSpotForm.visitTime,
            }
          : s
      )
    );
    setEditingSpotId(null);
  };

  const handleDelete = (id: string) => {
    setSpots((prev) => prev.filter((s) => s.id !== id));
  };

  // ---- Travel time handlers ----

  const fetchTravelTime = async (key: string, origin: string, destination: string, mode: TravelMode) => {
    setTravelInfos((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? { mode, loading: false }), mode, loading: true, error: undefined },
    }));
    try {
      const res = await fetch(`/api/travel-time?${new URLSearchParams({ origin, destination, mode })}`);
      const data: { duration?: string; distance?: string; error?: string } = await res.json();
      if (data.error) {
        setTravelInfos((prev) => ({
          ...prev,
          [key]: { ...(prev[key] ?? { mode, loading: false }), loading: false, error: data.error },
        }));
      } else {
        setTravelInfos((prev) => ({
          ...prev,
          [key]: { ...(prev[key] ?? { mode, loading: false }), loading: false, duration: data.duration, distance: data.distance },
        }));
      }
    } catch {
      setTravelInfos((prev) => ({
        ...prev,
        [key]: { ...(prev[key] ?? { mode, loading: false }), loading: false, error: "通信エラー" },
      }));
    }
  };

  if (!trip) return null;

  const departureSaved = departure !== null && !isEditingDeparture;
  const dayGroups = groupSpots(spots);
  const flatOrderedSpots = dayGroups.flatMap((g) => g.spots);

  const getDayNumber = (date: string): number | null => {
    if (!date || !trip.startDate) return null;
    const start = new Date(trip.startDate + "T00:00:00");
    const day = new Date(date + "T00:00:00");
    const diff = Math.round((day.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff + 1;
  };

  // Renders a travel time connector row between two places
  const renderConnector = (key: string, fromName: string, toName: string) => {
    const info = travelInfos[key] ?? { mode: "transit" as TravelMode, loading: false };
    const cannotSearch = info.loading || fromName === "未定" || !toName;
    return (
      <div key={`tc-${key}`} className="flex gap-3">
        <div className="w-12 shrink-0" />
        <div className="flex flex-col items-center">
          <div className="w-0.5 flex-1 bg-indigo-100 dark:bg-indigo-800/60" />
        </div>
        <div className="flex-1 py-1 pb-2">
          <div className="border border-dashed border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-gray-50/80 dark:bg-gray-800/40">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">移動:</span>
              <div className="flex gap-1">
                {TRAVEL_MODES.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() =>
                      setTravelInfos((prev) => ({
                        ...prev,
                        [key]: {
                          ...(prev[key] ?? { mode: "transit" as TravelMode, loading: false }),
                          mode: m.value,
                          duration: undefined,
                          distance: undefined,
                          error: undefined,
                        },
                      }))
                    }
                    className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                      info.mode === m.value
                        ? "bg-indigo-100 border-indigo-300 text-indigo-700 dark:bg-indigo-900/50 dark:border-indigo-600 dark:text-indigo-300"
                        : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => fetchTravelTime(key, fromName, toName, info.mode)}
                disabled={cannotSearch}
                className="ml-auto text-xs px-3 py-0.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {info.loading ? "検索中…" : info.duration ? "再確認" : "ルート確認"}
              </button>
            </div>
            {(info.duration || info.error) && (
              <p className="mt-1.5 text-xs">
                {info.error ? (
                  <span className="text-red-500">{info.error}</span>
                ) : (
                  <>
                    <span className="font-medium text-gray-700 dark:text-gray-200">{info.duration}</span>
                    {info.distance && (
                      <span className="text-gray-400 dark:text-gray-500 ml-1">({info.distance})</span>
                    )}
                  </>
                )}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-gradient-to-br from-sky-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col lg:flex-row">
      {/* Left: Map panel */}
      <div className="h-56 sm:h-72 lg:h-full lg:w-[44%] xl:w-[46%] shrink-0">
        <MapPanel destination={trip.destination} departure={departure} spots={spots} />
      </div>

      {/* Right: Scrollable content */}
      <div className="flex-1 lg:overflow-y-auto py-8 px-4">
      <div className="max-w-xl mx-auto space-y-6">

        {/* Back link */}
        <button
          type="button"
          onClick={() => router.push("/")}
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
        >
          &larr; 旅行先を変更
        </button>

        {/* Trip header */}
        <div className="bg-indigo-600 dark:bg-indigo-700 rounded-2xl p-6 text-white">
          <p className="text-indigo-200 text-xs font-medium uppercase tracking-wider mb-1">Trip</p>
          <h1 className="text-3xl font-bold">{trip.destination}</h1>
          <p className="text-indigo-200 text-sm mt-1">
            {formatDate(trip.startDate)} &ndash; {formatDate(trip.endDate)}
          </p>
          {trip.transport && (
            <p className="text-indigo-200 text-sm mt-0.5">移動手段: {trip.transport}</p>
          )}
        </div>

        {/* ========== 1. 出発情報フォーム ========== */}
        {isEditingDeparture && (
          <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">出発情報</h2>
            <form onSubmit={handleDepartureSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Location */}
                <div>
                  <label htmlFor="dep-location" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                    出発地 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="dep-location"
                      type="text"
                      value={locationUndecided ? "" : departureForm.location}
                      onChange={(e) => {
                        setLocationUndecided(false);
                        setDepartureForm({ ...departureForm, location: e.target.value });
                      }}
                      disabled={locationUndecided}
                      placeholder={locationUndecided ? "未定" : "例: 東京駅、成田空港"}
                      className="flex-1 min-w-0 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-gray-50 dark:disabled:bg-gray-600 disabled:text-gray-400"
                    />
                    <button type="button" onClick={() => setLocationUndecided((v) => !v)}
                      className={`shrink-0 text-xs px-3 py-2 rounded-lg border transition-colors ${locationUndecided ? "bg-amber-100 border-amber-300 text-amber-700 dark:bg-amber-900/40 dark:border-amber-600 dark:text-amber-300" : "border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
                      未定
                    </button>
                  </div>
                </div>

                {/* Datetime */}
                <div className="cursor-pointer" onClick={() => !datetimeUndecided && depDatetimeRef.current?.showPicker()}>
                  <span className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">出発日時</span>
                  <div className="flex gap-2">
                    <input
                      ref={depDatetimeRef}
                      id="dep-datetime"
                      type="datetime-local"
                      aria-label="出発日時"
                      value={datetimeUndecided ? "" : departureForm.datetime}
                      onChange={(e) => { setDatetimeUndecided(false); setDepartureForm({ ...departureForm, datetime: e.target.value }); }}
                      onClick={(e) => e.stopPropagation()}
                      disabled={datetimeUndecided}
                      className="flex-1 min-w-0 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-gray-50 dark:disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-default"
                    />
                    <button type="button" onClick={() => setDatetimeUndecided((v) => !v)}
                      className={`shrink-0 text-xs px-3 py-2 rounded-lg border transition-colors ${datetimeUndecided ? "bg-amber-100 border-amber-300 text-amber-700 dark:bg-amber-900/40 dark:border-amber-600 dark:text-amber-300" : "border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
                      未定
                    </button>
                  </div>
                </div>
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm">
                保存する
              </button>
            </form>
          </section>
        )}

        {/* ========== 2. 目的地フォーム ========== */}
        {departureSaved && (
          <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">目的地を追加</h2>
            <form onSubmit={handleSpotSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="spot-name" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                    目的地名 <span className="text-red-500">*</span>
                  </label>
                  <input id="spot-name" type="text" value={spotForm.name}
                    onChange={(e) => setSpotForm({ ...spotForm, name: e.target.value })}
                    placeholder="例: エッフェル塔" required
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label htmlFor="spot-category" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">カテゴリ</label>
                  <select id="spot-category" value={spotForm.category}
                    onChange={(e) => setSpotForm({ ...spotForm, category: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Visit date */}
                <div className="cursor-pointer" onClick={() => visitDateRef.current?.showPicker()}>
                  <span className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">訪問日</span>
                  <input ref={visitDateRef} id="spot-visit-date" type="date" aria-label="訪問日"
                    value={spotForm.visitDate}
                    onChange={(e) => setSpotForm({ ...spotForm, visitDate: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                    min={trip.startDate} max={trip.endDate}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>

                {/* Visit time */}
                <div>
                  <label htmlFor="spot-visit-time" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">訪問時間</label>
                  <input id="spot-visit-time" type="time" value={spotForm.visitTime}
                    onChange={(e) => setSpotForm({ ...spotForm, visitTime: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="spot-memo" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">メモ</label>
                  <input id="spot-memo" type="text" value={spotForm.memo}
                    onChange={(e) => setSpotForm({ ...spotForm, memo: e.target.value })}
                    placeholder="備考、営業時間など"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm">
                追加する
              </button>
            </form>
          </section>
        )}

        {/* ========== 3. タイムライン ========== */}
        {departureSaved && (
          <section>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
              スケジュール
              {spots.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-400">{spots.length} 件</span>
              )}
            </h2>

            {/* 出発 (固定先頭) */}
            {departure && (
              <div className="flex gap-3 mb-2">
                {/* Time column */}
                <div className="w-12 shrink-0 text-right pt-3">
                  {departure.datetime && !departure.datetimeUndecided && (
                    <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                      {new Date(departure.datetime).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </div>
                {/* Line + dot */}
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 rounded-full bg-indigo-600 dark:bg-indigo-500 shrink-0 mt-2.5 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                  {flatOrderedSpots.length > 0 && <div className="w-0.5 flex-1 bg-indigo-200 dark:bg-indigo-700 mt-1" />}
                </div>
                {/* Card */}
                <div className="flex-1 pb-3">
                  <div className="bg-indigo-50 dark:bg-indigo-900/30 border-2 border-indigo-200 dark:border-indigo-700 rounded-xl p-3 flex items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">出発</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{departure.location}</span>
                      </div>
                      {departure.datetimeUndecided && (
                        <span className="inline-block mt-0.5 text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">日時: 未定</span>
                      )}
                      {!departure.datetimeUndecided && departure.datetime && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{formatDatetime(departure.datetime)}</p>
                      )}
                    </div>
                    <button type="button" onClick={handleDepartureEdit}
                      className="shrink-0 text-xs text-indigo-500 dark:text-indigo-400 hover:underline">
                      編集
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Departure → first spot connector */}
            {departure && flatOrderedSpots.length > 0 &&
              renderConnector(
                `departure->${flatOrderedSpots[0].id}`,
                departure.location,
                flatOrderedSpots[0].name
              )
            }

            {/* スポットなし */}
            {spots.length === 0 && (
              <p className="text-center text-gray-400 dark:text-gray-500 text-sm py-6 pl-15">
                上のフォームから目的地を追加しましょう。
              </p>
            )}

            {/* 日付グループ */}
            {dayGroups.map((group, groupIndex) => {
              const dayNum = getDayNumber(group.date);
              const isLastGroup = groupIndex === dayGroups.length - 1;

              return (
                <div key={group.date || "__undecided__"}>
                  {/* Day header */}
                  <div className="flex gap-3 mb-1">
                    <div className="w-12 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 py-2">
                        <div className="h-px flex-1 bg-gray-300 dark:bg-gray-600" />
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 shrink-0 px-2">
                          {group.date
                            ? `${new Date(group.date + "T00:00:00").toLocaleDateString("ja-JP")}${dayNum !== null ? ` (${dayNum}日目)` : ""}`
                            : "日程未定"}
                        </span>
                        <div className="h-px flex-1 bg-gray-300 dark:bg-gray-600" />
                      </div>
                    </div>
                  </div>

                  {/* Spots in this day */}
                  {group.spots.flatMap((spot, spotIndex) => {
                    const isLastInGroup = spotIndex === group.spots.length - 1;
                    const isAbsoluteLast = isLastGroup && isLastInGroup;
                    const flatIdx = flatOrderedSpots.findIndex((s) => s.id === spot.id);
                    const nextSpot = flatOrderedSpots[flatIdx + 1];

                    const spotEl = (
                      <div key={spot.id} className="flex gap-3">
                        {/* Time column */}
                        <div className="w-12 shrink-0 text-right pt-3">
                          {spot.visitTime ? (
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{spot.visitTime}</span>
                          ) : (
                            <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
                          )}
                        </div>

                        {/* Line + dot */}
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full shrink-0 mt-3.5 ${CATEGORY_DOT_COLORS[spot.category] ?? "bg-gray-400"}`} />
                          {!isAbsoluteLast && (
                            <div className="w-0.5 flex-1 bg-indigo-100 dark:bg-indigo-800/60 mt-1" />
                          )}
                        </div>

                        {/* Card */}
                        <div className="flex-1 pb-3">
                          {editingSpotId === spot.id ? (
                            /* ---- Inline edit form ---- */
                            <div className="bg-white dark:bg-gray-800 border-2 border-indigo-300 dark:border-indigo-600 rounded-xl p-4 space-y-3">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label htmlFor={`edit-name-${spot.id}`} className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    目的地名 <span className="text-red-500">*</span>
                                  </label>
                                  <input id={`edit-name-${spot.id}`} type="text" value={editingSpotForm.name}
                                    onChange={(e) => setEditingSpotForm({ ...editingSpotForm, name: e.target.value })}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                  />
                                </div>
                                <div>
                                  <label htmlFor={`edit-cat-${spot.id}`} className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">カテゴリ</label>
                                  <select id={`edit-cat-${spot.id}`} value={editingSpotForm.category}
                                    onChange={(e) => setEditingSpotForm({ ...editingSpotForm, category: e.target.value })}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400">
                                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                                  </select>
                                </div>
                                <div className="cursor-pointer" onClick={() => editVisitDateRef.current?.showPicker()}>
                                  <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">訪問日</span>
                                  <input ref={editVisitDateRef} id={`edit-date-${spot.id}`} type="date" aria-label="訪問日"
                                    value={editingSpotForm.visitDate}
                                    onChange={(e) => setEditingSpotForm({ ...editingSpotForm, visitDate: e.target.value })}
                                    onClick={(e) => e.stopPropagation()}
                                    min={trip.startDate} max={trip.endDate}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                  />
                                </div>
                                <div>
                                  <label htmlFor={`edit-time-${spot.id}`} className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">訪問時間</label>
                                  <input id={`edit-time-${spot.id}`} type="time" value={editingSpotForm.visitTime}
                                    onChange={(e) => setEditingSpotForm({ ...editingSpotForm, visitTime: e.target.value })}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                  />
                                </div>
                                <div className="sm:col-span-2">
                                  <label htmlFor={`edit-memo-${spot.id}`} className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">メモ</label>
                                  <input id={`edit-memo-${spot.id}`} type="text" value={editingSpotForm.memo}
                                    onChange={(e) => setEditingSpotForm({ ...editingSpotForm, memo: e.target.value })}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button type="button" onClick={() => handleSpotEditSave(spot.id)}
                                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2 rounded-lg transition-colors">
                                  保存
                                </button>
                                <button type="button" onClick={() => setEditingSpotId(null)}
                                  className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                  キャンセル
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* ---- Normal display ---- */
                            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-3 flex items-start gap-2 hover:shadow-md transition-shadow">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{spot.name}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[spot.category] ?? CATEGORY_COLORS["その他"]}`}>
                                    {spot.category}
                                  </span>
                                </div>
                                {spot.memo && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{spot.memo}</p>
                                )}
                              </div>
                              <button type="button" onClick={() => handleSpotEditStart(spot)}
                                className="shrink-0 text-xs text-indigo-500 dark:text-indigo-400 hover:underline px-1"
                                aria-label={`${spot.name}を編集`}>
                                編集
                              </button>
                              <button type="button" onClick={() => handleDelete(spot.id)}
                                className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors text-base leading-none"
                                aria-label={`${spot.name}を削除`}>
                                &times;
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );

                    if (!nextSpot) return [spotEl];
                    return [
                      spotEl,
                      renderConnector(`${spot.id}->${nextSpot.id}`, spot.name, nextSpot.name),
                    ];
                  })}
                </div>
              );
            })}
          </section>
        )}
      </div>
      </div>
    </div>
  );
}

const CATEGORY_DOT_COLORS: Record<string, string> = {
  観光: "bg-sky-400",
  グルメ: "bg-orange-400",
  ショッピング: "bg-pink-400",
  宿泊: "bg-purple-400",
  その他: "bg-gray-400",
};
