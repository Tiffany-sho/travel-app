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
  datetimeUndecided: boolean;
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

const SAMPLE_SPOTS: Spot[] = [
  { id: "sample-1", name: "空港到着・荷物受け取り", category: "その他", memo: "預け荷物あり" },
  { id: "sample-2", name: "ホテルチェックイン", category: "宿泊", memo: "チェックイン 15:00〜" },
  { id: "sample-3", name: "市内観光スポット巡り", category: "観光", memo: "主要スポットをまわる" },
  { id: "sample-4", name: "ランチ（現地グルメ）", category: "グルメ", memo: "名物料理を食べる" },
  { id: "sample-5", name: "博物館・美術館見学", category: "観光", memo: "午後からじっくり見学" },
  { id: "sample-6", name: "お土産ショッピング", category: "ショッピング", memo: "地元のマーケットへ" },
  { id: "sample-7", name: "ディナー（予約済み）", category: "グルメ", memo: "19:00〜 予約確認済み" },
  { id: "sample-8", name: "ホテルチェックアウト・帰国", category: "その他", memo: "空港には2時間前を目安に" },
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

export default function TripPage() {
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);

  // --- Departure state ---
  const [departureForm, setDepartureForm] = useState({ location: "", datetime: "" });
  const [locationUndecided, setLocationUndecided] = useState(false);
  const [datetimeUndecided, setDatetimeUndecided] = useState(false);
  const [departure, setDeparture] = useState<Departure | null>(null);
  const [isEditingDeparture, setIsEditingDeparture] = useState(true);

  // --- Spot state ---
  const [spots, setSpots] = useState<Spot[]>(SAMPLE_SPOTS);
  const [spotForm, setSpotForm] = useState<SpotFormState>(emptySpotForm);
  const [editingSpotId, setEditingSpotId] = useState<string | null>(null);
  const [editingSpotForm, setEditingSpotForm] = useState<SpotFormState>(emptySpotForm);
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
      },
    ]);
    setSpotForm(emptySpotForm);
  };

  const handleSpotEditStart = (spot: Spot) => {
    setEditingSpotId(spot.id);
    setEditingSpotForm({ name: spot.name, category: spot.category, memo: spot.memo });
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
            }
          : s
      )
    );
    setEditingSpotId(null);
  };

  const handleDelete = (id: string) => {
    setSpots((prev) => prev.filter((s) => s.id !== id));
  };

  // ---- Drag handlers (disabled while editing a spot) ----

  const handleDragStart = (index: number) => {
    if (editingSpotId) return;
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (editingSpotId) return;
    if (dragOverIndex !== index) setDragOverIndex(index);
  };

  const handleDrop = (index: number) => {
    if (dragIndex === null || dragIndex === index || editingSpotId) return;
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

  const departureSaved = departure !== null && !isEditingDeparture;

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

        {/* ========== 1. 出発情報 ========== */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">出発情報</h2>
            {departureSaved && (
              <button
                type="button"
                onClick={handleDepartureEdit}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                編集
              </button>
            )}
          </div>

          {/* Saved summary */}
          {departureSaved && departure ? (
            <div className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex gap-3">
                <span className="shrink-0 w-16 text-gray-400 dark:text-gray-500 text-xs pt-0.5">出発地</span>
                <span>{departure.location}</span>
              </div>
              <div className="flex gap-3">
                <span className="shrink-0 w-16 text-gray-400 dark:text-gray-500 text-xs pt-0.5">出発日時</span>
                {departure.datetimeUndecided ? (
                  <span className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
                    未定
                  </span>
                ) : departure.datetime ? (
                  <span>{formatDatetime(departure.datetime)}</span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </div>
            </div>
          ) : (
            /* Departure form */
            <form onSubmit={handleDepartureSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Location */}
                <div>
                  <label
                    htmlFor="dep-location"
                    className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1"
                  >
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
                    <button
                      type="button"
                      onClick={() => setLocationUndecided((v) => !v)}
                      className={`shrink-0 text-xs px-3 py-2 rounded-lg border transition-colors ${
                        locationUndecided
                          ? "bg-amber-100 border-amber-300 text-amber-700 dark:bg-amber-900/40 dark:border-amber-600 dark:text-amber-300"
                          : "border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      未定
                    </button>
                  </div>
                </div>

                {/* Datetime */}
                <div>
                  <label
                    htmlFor="dep-datetime"
                    className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1"
                  >
                    出発日時
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="dep-datetime"
                      type="datetime-local"
                      value={datetimeUndecided ? "" : departureForm.datetime}
                      onChange={(e) => {
                        setDatetimeUndecided(false);
                        setDepartureForm({ ...departureForm, datetime: e.target.value });
                      }}
                      disabled={datetimeUndecided}
                      className="flex-1 min-w-0 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-gray-50 dark:disabled:bg-gray-600 disabled:text-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => setDatetimeUndecided((v) => !v)}
                      className={`shrink-0 text-xs px-3 py-2 rounded-lg border transition-colors ${
                        datetimeUndecided
                          ? "bg-amber-100 border-amber-300 text-amber-700 dark:bg-amber-900/40 dark:border-amber-600 dark:text-amber-300"
                          : "border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      未定
                    </button>
                  </div>
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

        {/* ========== 2. 目的地フォーム（出発情報保存後のみ表示）========== */}
        {departureSaved && (
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
                      <option key={c} value={c}>{c}</option>
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
        )}

        {/* ========== 3. 目的地リスト ========== */}
        {spots.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
              目的地リスト
              <span className="ml-2 text-sm font-normal text-gray-400">{spots.length} 件</span>
              {departureSaved && !editingSpotId && (
                <span className="ml-2 text-xs font-normal text-gray-400">ドラッグで並び替え可能</span>
              )}
            </h2>
            <ul className="space-y-2">
              {spots.map((spot, index) => (
                <li
                  key={spot.id}
                  draggable={!editingSpotId}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={() => handleDrop(index)}
                  onDragEnd={handleDragEnd}
                  className={[
                    "rounded-xl border-2 bg-white dark:bg-gray-800 p-4 transition-all duration-150",
                    editingSpotId === spot.id
                      ? "border-indigo-300 dark:border-indigo-600"
                      : dragIndex === index
                      ? "opacity-40 border-indigo-300 dark:border-indigo-600"
                      : dragOverIndex === index
                      ? "border-indigo-400 shadow-md"
                      : `border-transparent shadow-sm hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 ${
                          !editingSpotId ? "cursor-grab active:cursor-grabbing" : ""
                        }`,
                  ].join(" ")}
                >
                  {editingSpotId === spot.id ? (
                    /* ---- Inline edit form ---- */
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label
                            htmlFor={`edit-name-${spot.id}`}
                            className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1"
                          >
                            目的地名 <span className="text-red-500">*</span>
                          </label>
                          <input
                            id={`edit-name-${spot.id}`}
                            type="text"
                            value={editingSpotForm.name}
                            onChange={(e) =>
                              setEditingSpotForm({ ...editingSpotForm, name: e.target.value })
                            }
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={`edit-cat-${spot.id}`}
                            className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1"
                          >
                            カテゴリ
                          </label>
                          <select
                            id={`edit-cat-${spot.id}`}
                            value={editingSpotForm.category}
                            onChange={(e) =>
                              setEditingSpotForm({ ...editingSpotForm, category: e.target.value })
                            }
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          >
                            {CATEGORIES.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label
                            htmlFor={`edit-memo-${spot.id}`}
                            className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1"
                          >
                            メモ
                          </label>
                          <input
                            id={`edit-memo-${spot.id}`}
                            type="text"
                            value={editingSpotForm.memo}
                            onChange={(e) =>
                              setEditingSpotForm({ ...editingSpotForm, memo: e.target.value })
                            }
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleSpotEditSave(spot.id)}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
                        >
                          保存
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingSpotId(null)}
                          className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ---- Normal display ---- */
                    <div className="flex items-center gap-3 select-none">
                      {/* Drag handle */}
                      <span
                        className="text-gray-300 dark:text-gray-500 shrink-0 text-xl leading-none"
                        aria-hidden
                      >
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
                      {/* Edit button */}
                      <button
                        type="button"
                        onClick={() => handleSpotEditStart(spot)}
                        className="shrink-0 text-xs text-indigo-500 dark:text-indigo-400 hover:underline px-1"
                        aria-label={`${spot.name}を編集`}
                      >
                        編集
                      </button>
                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => handleDelete(spot.id)}
                        className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors text-lg leading-none"
                        aria-label={`${spot.name}を削除`}
                      >
                        &times;
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
