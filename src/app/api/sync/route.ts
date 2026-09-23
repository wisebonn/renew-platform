import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url) return NextResponse.json({ error: "No URL provided" }, { status: 400 });

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Fetch failed with status ${response.status}`);

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return NextResponse.json({ success: true, data: base64 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Fetch failed" }, { status: 500 });
  }
}