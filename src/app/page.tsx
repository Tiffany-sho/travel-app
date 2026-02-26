"use client";

import { useState } from "react";

type Destination = {
  id: string;
  name: string;
  country: string;
  date: string;
  notes: string;
};

type FormState = {
  name: string;
  country: string;
  date: string;
  notes: string;
};

const emptyForm: FormState = { name: "", country: "", date: "", notes: "" };

export default function Home() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const newDest: Destination = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      country: form.country.trim(),
      date: form.date,
      notes: form.notes.trim(),
    };
    setDestinations((prev) => [...prev, newDest]);
    setForm(emptyForm);
  };

  const handleDelete = (id: string) => {
    setDestinations((prev) => prev.filter((d) => d.id !== id));
  };

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverIndex !== index) setDragOverIndex(index);
  };

  const handleDrop = (index: number) => {
    if (dragIndex === null || dragIndex === index) return;
    setDestinations((prev) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <header className="text-center">
          <h1 className="text-4xl font-bold text-indigo-700 dark:text-indigo-300 tracking-tight">
            旅行プランナー
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            行き先を追加してドラッグで順番を変えられます
          </p>
        </header>

        {/* Form */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
            行き先を追加
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                  都市名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="例: パリ"
                  required
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                  国
                </label>
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  placeholder="例: フランス"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label
                  htmlFor="field-date"
                  className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1"
                >
                  旅行日
                </label>
                <input
                  id="field-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                  メモ
                </label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="観光スポット、やりたいことなど"
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

        {/* Destination List */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
            旅行リスト
            {destinations.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                {destinations.length} 件
              </span>
            )}
          </h2>

          {destinations.length === 0 ? (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">
              <p>まだ行き先が登録されていません。</p>
              <p>上のフォームから追加してみましょう。</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {destinations.map((dest, index) => (
                <li
                  key={dest.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={() => handleDrop(index)}
                  onDragEnd={handleDragEnd}
                  className={[
                    "flex items-center gap-3 p-4 rounded-xl border-2 select-none transition-all duration-150",
                    "cursor-grab active:cursor-grabbing",
                    dragIndex === index
                      ? "opacity-40 border-indigo-300 bg-indigo-50 dark:bg-indigo-900/20"
                      : dragOverIndex === index
                      ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 scale-[1.01]"
                      : "border-transparent bg-gray-50 dark:bg-gray-700/50 hover:border-gray-200 dark:hover:border-gray-600",
                  ].join(" ")}
                >
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
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                        {dest.name}
                      </span>
                      {dest.country && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {dest.country}
                        </span>
                      )}
                      {dest.date && (
                        <span className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                          {new Date(dest.date + "T00:00:00").toLocaleDateString("ja-JP")}
                        </span>
                      )}
                    </div>
                    {dest.notes && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                        {dest.notes}
                      </p>
                    )}
                  </div>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleDelete(dest.id)}
                    className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors text-lg leading-none"
                    aria-label={`${dest.name}を削除`}
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
