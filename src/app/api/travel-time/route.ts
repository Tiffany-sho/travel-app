import { NextRequest, NextResponse } from "next/server";

type DirectionsResponse = {
  status: string;
  routes: Array<{
    legs: Array<{
      duration: { text: string; value: number };
      distance: { text: string };
    }>;
  }>;
};

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const origin = searchParams.get("origin");
  const destination = searchParams.get("destination");
  const mode = searchParams.get("mode") ?? "transit";

  if (!origin || !destination) {
    return NextResponse.json(
      { error: "origin と destination は必須です" },
      { status: 400 }
    );
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GOOGLE_MAPS_API_KEY が設定されていません" },
      { status: 500 }
    );
  }

  const url = `https://maps.googleapis.com/maps/api/directions/json?${new URLSearchParams({
    origin,
    destination,
    mode,
    language: "ja",
    key: apiKey,
  })}`;

  const res = await fetch(url, { next: { revalidate: 300 } }); // 5分キャッシュ
  const data: DirectionsResponse = await res.json();

  if (data.status !== "OK" || !data.routes.length) {
    const msg =
      data.status === "NOT_FOUND"
        ? "場所が見つかりません"
        : data.status === "ZERO_RESULTS"
        ? "このルートは見つかりません"
        : `ルート取得失敗 (${data.status})`;
    return NextResponse.json({ error: msg }, { status: 404 });
  }

  const leg = data.routes[0].legs[0];
  return NextResponse.json({
    duration: leg.duration.text,
    distance: leg.distance.text,
  });
}
