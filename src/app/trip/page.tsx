"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Trip = {
  destination: string;
  startDate: string;
  endDate: string;
  transport: string;
};

type Departure = {
  location: string;
  datetime: string;
};

type Spot = {
  id: string;
  name: string;
  category: string;
  memo: string;
};

type SpotFormState = {
  name: string;
  category: string;
  memo: string;
};

const CATEGORIES = ["観光", "グルメ", "ショッピング", "宿泊", "その他"] as const;

const emptySpotForm: SpotFormState = { name: "", category: "観光", memo: "" };

const CATEGORY_COLORS: Record<string, string> = {
  観光: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300",
  グルメ: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
  ショッピング: "bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300",
  宿泊: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
  その他: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
};

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

export default function TripPage() {
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);

  // Departure state
  const [departureForm, setDepartureForm] = useState<Departure>({ location: "", datetime: "" });
  const [departure, setDeparture] = useState<Departure | null>(null);
  const [isEditingDeparture, setIsEditingDeparture] = useState(true);

  // Spot state
  const [spots, setSpots] = useState<Spot[]>([]);
  const [spotForm, setSpotForm] = useState<SpotFormState>(emptySpotForm);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    const data = sessionStorage.getItem("currentTrip");
    if (!data) {
      router.push("/");
      return;
    }
    setTrip(JSON.parse(data) as Trip);
  }, [router]);

  const handleDepartureSave = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!departureForm.location.trim()) return;
    setDeparture({ ...departureForm, location: departureForm.location.trim() });
    setIsEditingDeparture(false);
  };

  const handleSpotSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!spotForm.name.trim()) return;
    const newSpot: Spot = {
      id: crypto.randomUUID(),
      name: spotForm.name.trim(),
      category: spotForm.category,
      memo: spotForm.memo.trim(),
    };
    setSpots((prev) => [...prev, newSpot]);
    setSpotForm(emptySpotForm);
  };

  const handleDelete = (id: string) => {
    setSpots((prev) => prev.filter((s) => s.id !== id));
  };

  const handleDragStart = (index: number) => setDragIndex(index);

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverIndex !== index) setDragOverIndex(index);
  };

  const handleDrop = (index: number) => {
    if (dragIndex === null || dragIndex === index) return;
    setSpots((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  if (!trip) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

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

        {/* --- 1. 出発情報 --- */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              出発情報
            </h2>
            {departure && !isEditingDeparture && (
              <button
                type="button"
                onClick={() => {
                  setDepartureForm({ ...departure });
                  setIsEditingDeparture(true);
                }}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                編集
              </button>
            )}
          </div>

          {/* Saved summary */}
          {departure && !isEditingDeparture ? (
            <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <p>
                <span className="font-medium text-gray-500 dark:text-gray-400 w-20 inline-block">出発地</span>
                {departure.location}
              </p>
              {departure.datetime && (
                <p>
                  <span className="font-medium text-gray-500 dark:text-gray-400 w-20 inline-block">出発日時</span>
                  {formatDatetime(departure.datetime)}
                </p>
              )}
            </div>
          ) : (
            /* Departure form */
            <form onSubmit={handleDepartureSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="dep-location"
                    className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1"
                  >
                    出発地 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="dep-location"
                    type="text"
                    value={departureForm.location}
                    onChange={(e) =>
                      setDepartureForm({ ...departureForm, location: e.target.value })
                    }
                    placeholder="例: 東京駅、成田空港"
                    required
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label
                    htmlFor="dep-datetime"
                    className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1"
                  >
                    出発日時
                  </label>
                  <input
                    id="dep-datetime"
                    type="datetime-local"
                    value={departureForm.datetime}
                    onChange={(e) =>
                      setDepartureForm({ ...departureForm, datetime: e.target.value })
                    }
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
              >
                保存する
              </button>
            </form>
          )}
        </section>

        {/* --- 2. 目的地フォーム --- */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
            目的地を追加
          </h2>
          <form onSubmit={handleSpotSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="spot-name"
                  className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1"
                >
                  目的地名 <span className="text-red-500">*</span>
                </label>
                <input
                  id="spot-name"
                  type="text"
                  value={spotForm.name}
                  onChange={(e) => setSpotForm({ ...spotForm, name: e.target.value })}
                  placeholder="例: エッフェル塔"
                  required
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label
                  htmlFor="spot-category"
                  className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1"
                >
                  カテゴリ
                </label>
                <select
                  id="spot-category"
                  value={spotForm.category}
                  onChange={(e) => setSpotForm({ ...spotForm, category: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label
                  htmlFor="spot-memo"
                  className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1"
                >
                  メモ
                </label>
                <input
                  id="spot-memo"
                  type="text"
                  value={spotForm.memo}
                  onChange={(e) => setSpotForm({ ...spotForm, memo: e.target.value })}
                  placeholder="備考、営業時間など"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
            >
              追加する
            </button>
          </form>
        </section>

        {/* --- 3. 目的地リスト（縦並び） --- */}
        {spots.length === 0 ? (
          <p className="text-center text-gray-400 dark:text-gray-500 text-sm py-4">
            まだ目的地が登録されていません。上のフォームから追加しましょう。
          </p>
        ) : (
          <section>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
              目的地リスト
              <span className="ml-2 text-sm font-normal text-gray-400">{spots.length} 件</span>
              <span className="ml-2 text-xs font-normal text-gray-400">ドラッグで並び替え可能</span>
            </h2>
            <ul className="space-y-2">
              {spots.map((spot, index) => (
                <li
                  key={spot.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={() => handleDrop(index)}
                  onDragEnd={handleDragEnd}
                  className={[
                    "flex items-center gap-3 p-4 rounded-xl border-2 cursor-grab active:cursor-grabbing select-none bg-white dark:bg-gray-800 transition-all duration-150",
                    dragIndex === index
                      ? "opacity-40 border-indigo-300 dark:border-indigo-600"
                      : dragOverIndex === index
                      ? "border-indigo-400 shadow-md"
                      : "border-transparent shadow-sm hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600",
                  ].join(" ")}
                >
                  {/* Drag handle */}
                  <span className="text-gray-300 dark:text-gray-500 shrink-0 text-xl leading-none" aria-hidden>
                    &#8942;&#8942;
                  </span>

                  {/* Order badge */}
                  <span className="shrink-0 w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-200 text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                        {spot.name}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          CATEGORY_COLORS[spot.category] ?? CATEGORY_COLORS["その他"]
                        }`}
                      >
                        {spot.category}
                      </span>
                    </div>
                    {spot.memo && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                        {spot.memo}
                      </p>
                    )}
                  </div>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleDelete(spot.id)}
                    className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors text-lg leading-none"
                    aria-label={`${spot.name}を削除`}
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
