import { NextResponse } from "next/server";
import { requireExploreAdmin } from "@/lib/explore/auth";
import { importDecBackcountry } from "@/lib/explore/importers/dec/backcountry";
import type { DecImportDataset } from "@/lib/explore/importers/dec/types";

export const maxDuration = 300;

export async function POST(request: Request) {
  const admin = await requireExploreAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { dataset?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const dataset = body.dataset;
  if (dataset !== "primitive_campsites" && dataset !== "lean_tos") {
    return NextResponse.json({ error: "Unknown dataset" }, { status: 400 });
  }

  const result = await importDecBackcountry(dataset as DecImportDataset, {
    adirondackOnly: true,
  });
  return NextResponse.json(result);
}
