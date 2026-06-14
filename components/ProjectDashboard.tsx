"use client";

import React, { useCallback, useEffect, useState } from "react";

import {
  listCustomersForProjectForm,
  type CustomerOption,
} from "@/actions/customerActions";
import type { SerializedProject } from "@/lib/projects";

import ProjectMapEmbed from "./ProjectMapEmbed";
import { useProjectWorkspace } from "./ProjectWorkspaceContext";

function dash(s: string | null | undefined) {
  return s?.trim() ? s : "—";
}

/** One line: Street, City, ST ZIP, Country (commas only; no line breaks). */
function formatSingleLineSiteAddress(p: SerializedProject): string | null {
  const street = [p.address1, p.address2]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join(" ");
  const city = p.city?.trim();
  const state = p.state?.trim();
  const zip = p.zipCode?.trim();
  const country = p.country?.trim();
  const stateZip = [state, zip].filter(Boolean).join(" ");
  const parts = [street, city, stateZip, country].filter((x) => x && x.length > 0);
  if (parts.length === 0) return null;
  return parts.join(", ");
}

function SiteAddressLineBar({ addressText }: { addressText: string | null }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    if (!addressText) return;
    try {
      await navigator.clipboard.writeText(addressText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Could not copy to clipboard.");
    }
  }

  const display = addressText ?? "No address on file";

  return (
    <div className="mt-2 flex items-stretch gap-2 rounded border border-[#E5EAF2] bg-[#F0F0F0] px-3 py-2.5">
      <p
        className={`min-w-0 flex-1 self-center break-words text-sm leading-snug ${
          addressText ? "text-gray-900" : "text-gray-400"
        }`}
        title={addressText ?? undefined}
      >
        {display}
      </p>
      <button
        type="button"
        onClick={() => void onCopy()}
        disabled={!addressText}
        className="shrink-0 rounded border border-transparent p-1.5 text-gray-500 hover:bg-white/80 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label={copied ? "Copied" : "Copy address"}
        title={copied ? "Copied" : "Copy address"}
      >
        {copied ? (
          <span className="text-xs font-medium text-green-700">Copied</span>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </button>
    </div>
  );
}

export default function ProjectDashboard() {
  const {
    project,
    isEditing,
    draft,
    setDraft,
    saveEdit,
    coverFile,
    setCoverFile,
    removeCover,
    setRemoveCover,
  } = useProjectWorkspace();
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);

  const p = isEditing && draft ? draft : project;

  useEffect(() => {
    if (!coverFile) {
      setFilePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(coverFile);
    setFilePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  useEffect(() => {
    if (!isEditing) return;
    let cancelled = false;
    void listCustomersForProjectForm().then((rows) => {
      if (!cancelled) setCustomers(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [isEditing]);

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const result = await saveEdit();
      if (!result.success) {
        alert(result.error ?? "Could not save.");
      }
    },
    [saveEdit]
  );

  const fieldClass =
    "border-0 border-b border-transparent bg-transparent py-0.5 text-xs text-gray-900 focus:border-[#4A90E2] focus:outline-none";
  const inputClass = `${fieldClass} w-full min-w-0`;
  const selectClass = `${fieldClass} w-full max-w-full`;

  const row = (
    label: string,
    view: React.ReactNode,
    edit: React.ReactNode
  ) => (
    <div className="grid grid-cols-[7.5rem_1fr] gap-x-2 gap-y-0 border-b border-gray-100 py-1.5 text-xs last:border-0">
      <dt className="text-[#6B7280]">{label}</dt>
      <dd className="min-w-0 font-medium text-gray-900">{isEditing ? edit : view}</dd>
    </div>
  );

  const activity = (
    <section className="flex h-full min-h-[28rem] flex-col rounded-md border border-[#E5EAF2] bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
        <h2 className="text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">
          Activity
        </h2>
        <button
          type="button"
          className="text-[10px] font-medium text-[#4A90E2] hover:underline"
        >
          Filter
        </button>
      </div>
      <div className="border-b border-gray-50 px-3 py-2">
        <p className="text-[10px] text-[#6B7280]">
          Posts between your team, customer, and vendors will appear here.
        </p>
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            readOnly
            placeholder="Post a message…"
            className="min-w-0 flex-1 rounded border border-[#E5EAF2] px-2 py-1 text-xs text-gray-400"
          />
          <button
            type="button"
            className="shrink-0 rounded bg-gray-100 px-2 py-1 text-[10px] font-medium text-gray-500"
          >
            Post
          </button>
        </div>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-4 text-center text-xs text-gray-400">
        No activity yet.
      </div>
    </section>
  );

  const projectFields = (
    <div className="rounded-md border border-[#E5EAF2] bg-white p-3">
      <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">
        Project
      </h2>
      <dl>
        {row(
          "Name",
          dash(p.name),
          <input
            className={inputClass}
            value={p.name}
            onChange={(e) => setDraft({ name: e.target.value })}
            name="name"
            required
          />
        )}
        {row(
          "#",
          p.number,
          <input
            className={inputClass}
            value={p.number}
            onChange={(e) => setDraft({ number: e.target.value })}
            name="number"
            required
          />
        )}
        {row(
          "Status",
          <span className="inline-flex rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-800">
            {dash(p.status)}
          </span>,
          <input
            className={inputClass}
            value={p.status ?? ""}
            onChange={(e) => setDraft({ status: e.target.value })}
            name="status"
          />
        )}
        {row(
          "Customer",
          dash(p.customerName),
          <div className="space-y-1">
            <select
              className={selectClass}
              value={p.customerId ?? ""}
              onChange={(e) =>
                setDraft({
                  customerId: e.target.value || null,
                })
              }
              name="customerId"
            >
              <option value="">— None —</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              className={inputClass}
              placeholder="Display name (optional)"
              value={p.customerName ?? ""}
              onChange={(e) => setDraft({ customerName: e.target.value || null })}
              name="customerName"
            />
          </div>
        )}
        {row(
          "Description",
          dash(p.description),
          <textarea
            className="min-h-[3rem] w-full resize-y rounded border border-[#E5EAF2] px-1.5 py-1 text-xs"
            value={p.description ?? ""}
            onChange={(e) => setDraft({ description: e.target.value || null })}
            name="description"
            rows={3}
          />
        )}
        {row(
          "Start",
          p.startDate
            ? new Date(p.startDate).toLocaleDateString()
            : "—",
          <input
            type="date"
            className={inputClass}
            value={p.startDate ? p.startDate.slice(0, 10) : ""}
            onChange={(e) =>
              setDraft({
                startDate: e.target.value
                  ? new Date(e.target.value + "T12:00:00").toISOString()
                  : null,
              })
            }
            name="startDate"
          />
        )}
        {row(
          "End",
          p.endDate ? new Date(p.endDate).toLocaleDateString() : "—",
          <input
            type="date"
            className={inputClass}
            value={p.endDate ? p.endDate.slice(0, 10) : ""}
            onChange={(e) =>
              setDraft({
                endDate: e.target.value
                  ? new Date(e.target.value + "T12:00:00").toISOString()
                  : null,
              })
            }
            name="endDate"
          />
        )}
        {row(
          "Created",
          new Date(project.createdAt).toLocaleDateString(),
          <span className="text-gray-500">{new Date(project.createdAt).toLocaleDateString()}</span>
        )}
      </dl>
    </div>
  );

  const siteAddressFieldsForm = (
    <dl>
      {row(
        "Line 1",
        dash(p.address1),
        <input
          className={inputClass}
          value={p.address1 ?? ""}
          onChange={(e) => setDraft({ address1: e.target.value || null })}
          name="address1"
        />
      )}
      {row(
        "Line 2",
        dash(p.address2),
        <input
          className={inputClass}
          value={p.address2 ?? ""}
          onChange={(e) => setDraft({ address2: e.target.value || null })}
          name="address2"
        />
      )}
      {row(
        "City",
        dash(p.city),
        <input
          className={inputClass}
          value={p.city ?? ""}
          onChange={(e) => setDraft({ city: e.target.value || null })}
          name="city"
        />
      )}
      {row(
        "State",
        dash(p.state),
        <input
          className={inputClass}
          value={p.state ?? ""}
          onChange={(e) => setDraft({ state: e.target.value || null })}
          name="state"
        />
      )}
      {row(
        "ZIP",
        dash(p.zipCode),
        <input
          className={inputClass}
          value={p.zipCode ?? ""}
          onChange={(e) => setDraft({ zipCode: e.target.value || null })}
          name="zipCode"
        />
      )}
      {row(
        "Country",
        dash(p.country),
        <input
          className={inputClass}
          value={p.country ?? ""}
          onChange={(e) => setDraft({ country: e.target.value || null })}
          name="country"
        />
      )}
    </dl>
  );

  const budgetPlaceholder = (
    <div className="rounded-md border border-[#E5EAF2] bg-white p-3">
      <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">
        Budget snapshot
      </h2>
      <p className="mb-2 text-[10px] leading-relaxed text-gray-500">
        Totals will sync from the Budget tab. For now this is a layout preview.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[280px] border-collapse text-left text-[10px]">
          <thead>
            <tr className="border-b border-gray-200 text-[#6B7280]">
              <th className="py-1 pr-2 font-medium">Line</th>
              <th className="py-1 pr-2 font-medium">Budget</th>
              <th className="py-1 pr-2 font-medium">Actual</th>
              <th className="py-1 font-medium">Difference</th>
            </tr>
          </thead>
          <tbody className="text-gray-800">
            <tr className="border-b border-gray-50">
              <td className="py-1 pr-2">—</td>
              <td className="py-1 pr-2">—</td>
              <td className="py-1 pr-2">—</td>
              <td className="py-1">—</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const coverSrc =
    filePreviewUrl ||
    (!removeCover && project.coverImageUrl ? project.coverImageUrl : null);

  const coverPreview = coverSrc ? (
    // eslint-disable-next-line @next/next/no-img-element -- user uploads & blob previews
    <img
      src={coverSrc}
      alt=""
      className="max-h-48 w-full rounded-md border border-[#E5EAF2] bg-gray-50 object-contain"
    />
  ) : (
    <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-[#E5EAF2] bg-gray-50 text-center text-[10px] text-gray-400">
      No project image
    </div>
  );

  const coverBlock = (
    <div className="rounded-md border border-[#E5EAF2] bg-white p-3">
      <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">
        Project image
      </h2>
      {coverPreview}
      {isEditing ? (
        <div className="mt-2 space-y-2 text-[10px]">
          <label className="block">
            <span className="text-gray-600">Upload render or logo (JPEG, PNG, GIF, WebP, max 6 MB)</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="mt-1 block w-full text-xs file:mr-2 file:rounded file:border-0 file:bg-[#4A90E2] file:px-2 file:py-1 file:text-[10px] file:font-medium file:text-white"
              onChange={(e) => {
                const f = e.target.files?.[0];
                setCoverFile(f ?? null);
              }}
            />
          </label>
          {project.coverImageUrl ? (
            <label className="flex cursor-pointer items-center gap-2 text-gray-700">
              <input
                type="checkbox"
                checked={removeCover}
                onChange={(e) => setRemoveCover(e.target.checked)}
              />
              Remove current image
            </label>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  const singleLineAddress = formatSingleLineSiteAddress(p);

  const locationSection = (
    <div className="rounded-md border border-[#E5EAF2] bg-white p-3">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-orange-600">
          Location
        </h2>
        <span className="text-xs font-medium text-gray-600">Tax rate —</span>
      </div>
      <ProjectMapEmbed project={p} />
      {isEditing ? (
        <div className="mt-3 border-t border-gray-100 pt-3">
          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">
            Site address
          </h3>
          {siteAddressFieldsForm}
        </div>
      ) : (
        <SiteAddressLineBar addressText={singleLineAddress} />
      )}
    </div>
  );

  const middleColumn = (
    <div className="flex min-h-0 flex-col gap-3">
      {projectFields}
      {budgetPlaceholder}
    </div>
  );

  const rightColumn = (
    <div className="flex flex-col gap-3">
      {coverBlock}
      {locationSection}
    </div>
  );

  if (isEditing) {
    return (
      <form
        id="project-dashboard-edit-form"
        onSubmit={(e) => void onSubmit(e)}
        className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5"
      >
        <div className="lg:col-span-3">{activity}</div>
        <div className="lg:col-span-5">{middleColumn}</div>
        <div className="lg:col-span-4">{rightColumn}</div>
      </form>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
      <div className="lg:col-span-3">{activity}</div>
      <div className="lg:col-span-5">{middleColumn}</div>
      <div className="lg:col-span-4">{rightColumn}</div>
    </div>
  );
}
