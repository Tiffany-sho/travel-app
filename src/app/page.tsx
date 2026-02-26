"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

type FormState = {
  destination: string;
  startDate: string;
  endDate: string;
  transport: string;
};

const TRANSPORT_OPTIONS = [
  "飛行機",
  "新幹線",
  "電車",
  "バス",
  "車",
  "フェリー",
  "その他",
] as const;

const emptyForm: FormState = {
  destination: "",
  startDate: "",
  endDate: "",
  transport: "",
};

export default function Home() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(emptyForm);
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.destination.trim() || !form.startDate || !form.endDate) return;
    sessionStorage.setItem(
      "currentTrip",
      JSON.stringify({
        destination: form.destination.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        transport: form.transport,
      })
    );
    router.push("/trip");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-indigo-700 dark:text-indigo-300 tracking-tight">
            旅行プランナー
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
            旅先と期間を入力して、旅行プランを作りましょう
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4"
        >
          {/* 旅行先 */}
          <div>
            <label
              htmlFor="field-destination"
              className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1"
            >
              旅行先 <span className="text-red-500">*</span>
            </label>
            <input
              id="field-destination"
              type="text"
              value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value })}
              placeholder="例: バリ島、パリ、京都"
              required
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* 旅行期間 */}
          <div className="grid grid-cols-2 gap-4">
            <div
              className="cursor-pointer"
              onClick={() => startDateRef.current?.showPicker()}
            >
              <span className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                出発日 <span className="text-red-500">*</span>
              </span>
              <input
                ref={startDateRef}
                id="field-start"
                type="date"
                aria-label="出発日"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                onClick={(e) => e.stopPropagation()}
                required
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div
              className="cursor-pointer"
              onClick={() => endDateRef.current?.showPicker()}
            >
              <span className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                帰着日 <span className="text-red-500">*</span>
              </span>
              <input
                ref={endDateRef}
                id="field-end"
                type="date"
                aria-label="帰着日"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                onClick={(e) => e.stopPropagation()}
                required
                min={form.startDate}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>

          {/* 主な移動手段 */}
          <div>
            <label
              htmlFor="field-transport"
              className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1"
            >
              主な移動手段
            </label>
            <select
              id="field-transport"
              value={form.transport}
              onChange={(e) => setForm({ ...form, transport: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">選択してください</option>
              {TRANSPORT_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
          >
            プランを作成する
          </button>
        </form>
      </div>
    </div>
  );
}
