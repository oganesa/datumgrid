"use client";

import React, { useMemo } from "react";

import type { SerializedProject } from "@/lib/projects";

function buildAddressQuery(p: SerializedProject): string {
  const parts = [
    p.address1,
    p.address2,
    [p.city, p.state, p.zipCode].filter(Boolean).join(" "),
    p.country,
  ].filter((x) => x && String(x).trim());
  return parts.join(", ");
}

type Props = {
  project: SerializedProject;
};

export default function ProjectMapEmbed({ project }: Props) {
  const q = useMemo(() => buildAddressQuery(project), [project]);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  const searchHref = useMemo(() => {
    const params = new URLSearchParams({ api: "1", query: q || project.name });
    return `https://www.google.com/maps/search/?${params.toString()}`;
  }, [q, project.name]);

  if (!q.trim()) {
    return (
      <div className="flex h-56 items-center justify-center rounded-md border border-dashed border-[#D5D5D5] bg-white text-center text-xs text-gray-500">
        Add a site address to show the map.
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="space-y-2 rounded-md border border-[#D5D5D5] bg-white p-4 text-xs text-gray-600">
        <p>{q}</p>
        <a
          href={searchHref}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-[#0099FF] hover:underline"
        >
          Open in Google Maps
        </a>
        <p className="text-[#808080]">
          Set <code className="rounded bg-gray-100 px-1">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>{" "}
          for an embedded map (Maps Embed API).
        </p>
      </div>
    );
  }

  const src = `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(q)}`;

  return (
    <div className="overflow-hidden rounded-md border border-[#D5D5D5] bg-white shadow-sm">
      <iframe
        title="Project location"
        className="h-64 w-full border-0 sm:h-72"
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        src={src}
      />
    </div>
  );
}
