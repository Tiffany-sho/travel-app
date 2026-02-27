import { NextRequest, NextResponse } from "next/server";

type NominatimResult = { lat: string; lon: string };

type OsrmResponse = {
  code: string;
  routes: Array<{ duration: number; distance: number }>;
};

async function geocode(query: string): Promise<{ lat: number; lng: number }> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "travel-planner-app/1.0",
      "Accept-Language": "ja,en",
    },
    next: { revalidate: 3600 }, // 場所の座標は1時間キャッシュ
  });
  const data: NominatimResult[] = await res.json();
  if (!data.length) throw new Error(`場所が見つかりません: ${query}`);
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}時間${m}分`;
  return `${m}分`;
}

function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const origin = searchParams.get("origin");
  const destination = searchParams.get("destination");
  const mode = searchParams.get("mode") ?? "driving"; // driving | walking | cycling

  if (!origin || !destination) {
    return NextResponse.json(
      { error: "origin と destination は必須です" },
      { status: 400 }
    );
  }

  try {
    // Nominatim で出発地・目的地を座標に変換（APIキー不要）
    const [originCoord, destCoord] = await Promise.all([
      geocode(origin),
      geocode(destination),
    ]);

    // OSRM でルート検索（APIキー不要）
    const profile =
      mode === "walking" ? "walking" : mode === "cycling" ? "cycling" : "driving";
    const osrmUrl =
      `https://router.project-osrm.org/route/v1/${profile}/` +
      `${originCoord.lng},${originCoord.lat};${destCoord.lng},${destCoord.lat}` +
      `?overview=false`;

    const routeRes = await fetch(osrmUrl, { next: { revalidate: 300 } });
    const routeData: OsrmResponse = await routeRes.json();

    if (routeData.code !== "Ok" || !routeData.routes?.length) {
      return NextResponse.json({ error: "ルートが見つかりません" }, { status: 404 });
    }

    const { duration, distance } = routeData.routes[0];
    return NextResponse.json({
      duration: formatDuration(Math.round(duration)),
      distance: formatDistance(Math.round(distance)),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "ルート取得に失敗しました";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
