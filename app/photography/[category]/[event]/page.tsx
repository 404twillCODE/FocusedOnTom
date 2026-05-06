import { notFound } from "next/navigation";
import { loadPhotographyData } from "@/lib/photography-source";
import { EventView } from "./event-view.client";

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ category: string; event: string }>;
}) {
  const { category: categorySlug, event: eventSlug } = await params;
  const data = await loadPhotographyData();
  const direct = data.events.get(`${categorySlug}/${eventSlug}`);
  const decoded = data.events.get(
    `${safeDecode(categorySlug)}/${safeDecode(eventSlug)}`
  );
  const match = direct ?? decoded;
  if (!match) notFound();
  return (
    <EventView
      category={match.category}
      event={match.event}
      useTeVisualsLayout={data.source === "tevisuals"}
    />
  );
}
