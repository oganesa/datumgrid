"use client";

import React, { useEffect, useState } from "react";

import { createCustomer, updateCustomer } from "@/actions/customerActions";
import { createContact, updateContact, deleteContact, listContactsByOwner } from "@/actions/contactActions";
import type { SerializedCustomer } from "@/lib/customers";
import type { SerializedContact } from "@/lib/contacts";
import UsAddressFields from "@/components/UsAddressFields";

const PREFIXES = ["", "Mr.", "Mrs.", "Ms.", "Dr.", "Prof."];

const inputCls = "rounded border border-[#D5D5D5] p-2 text-sm outline-none focus:border-[#0099FF]";
const labelCls = "mb-1 text-xs text-[#808080]";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (id?: string) => void;
  editItem?: SerializedCustomer | null;
};

type ContactForm = {
  prefix: string; firstName: string; lastName: string;
  title: string; email: string; phone: string;
};

const emptyForm: ContactForm = { prefix: "", firstName: "", lastName: "", title: "", email: "", phone: "" };

export default function NewCustomerModal({ isOpen, onClose, onSuccess, editItem }: Props) {
  const isEdit = !!editItem;

  const [contacts, setContacts] = useState<SerializedContact[]>([]);
  const [contactForm, setContactForm] = useState<ContactForm | null>(null);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [contactSaving, setContactSaving] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !editItem) { setContacts([]); return; }
    listContactsByOwner("customer", editItem._id).then(setContacts);
  }, [isOpen, editItem]);

  if (!isOpen) return null;

  async function onSubmitForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const result = isEdit
      ? await updateCustomer(editItem!._id, formData)
      : await createCustomer(formData);
    if (result.success) {
      onSuccess?.("id" in result ? (result as { success: true; id: string }).id : undefined);
      onClose();
    } else {
      alert(result.error);
    }
  }

  function startAddContact() {
    setEditingContactId(null);
    setContactForm(emptyForm);
    setContactError(null);
  }

  function startEditContact(c: SerializedContact) {
    setEditingContactId(c._id);
    setContactForm({ prefix: c.prefix, firstName: c.firstName, lastName: c.lastName, title: c.title, email: c.email, phone: c.phone });
    setContactError(null);
  }

  function cancelContactForm() {
    setContactForm(null);
    setEditingContactId(null);
    setContactError(null);
  }

  async function saveContact() {
    if (!contactForm || !editItem) return;
    setContactSaving(true);
    setContactError(null);
    const fd = new FormData();
    Object.entries(contactForm).forEach(([k, v]) => fd.set(k, v));
    const result = editingContactId
      ? await updateContact(editingContactId, fd)
      : await createContact("customer", editItem._id, fd);
    setContactSaving(false);
    if (!result.success) { setContactError(result.error); return; }
    setContacts((prev) =>
      editingContactId
        ? prev.map((c) => (c._id === editingContactId ? result.contact : c))
        : [...prev, result.contact]
    );
    cancelContactForm();
  }

  async function handleDeleteContact(id: string) {
    if (!confirm("Delete this contact?")) return;
    const result = await deleteContact(id);
    if (result.success) setContacts((prev) => prev.filter((c) => c._id !== id));
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="my-8 max-h-[min(92vh,1000px)] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#D5D5D5] px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            {isEdit ? "Edit customer" : "New customer"}
          </h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-gray-500 hover:bg-gray-100" aria-label="Close">✕</button>
        </div>

        <form key={editItem?._id ?? "new"} onSubmit={onSubmitForm} className="space-y-4 p-6">
          <div className="flex flex-col">
            <label className={labelCls}>Customer *</label>
            <input name="name" required type="text" defaultValue={editItem?.name ?? ""}
              className={inputCls} placeholder="Company or contact name" />
          </div>

          <div className="border-t border-[#D5D5D5] pt-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#808080]">Address</h3>
            <UsAddressFields defaultValues={editItem ?? undefined} />
          </div>

          <div className="border-t border-[#D5D5D5] pt-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#808080]">Contact info</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col">
                <label className={labelCls}>Phone number</label>
                <input name="phone" type="tel" defaultValue={editItem?.phone ?? ""} className={inputCls} />
              </div>
              <div className="flex flex-col">
                <label className={labelCls}>Email</label>
                <input name="email" type="email" defaultValue={editItem?.email ?? ""} className={inputCls} />
              </div>
              <div className="flex flex-col sm:col-span-2">
                <label className={labelCls}>Web</label>
                <input name="web" type="text" defaultValue={editItem?.web ?? ""} className={inputCls} placeholder="https://example.com" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-[#D5D5D5] pt-4">
            <button type="button" onClick={onClose}
              className="rounded-md border border-[#D5D5D5] px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit"
              className="rounded-md bg-[#0099FF] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#2AAAFF]">
              {isEdit ? "Save changes" : "Save customer"}
            </button>
          </div>
        </form>

        {/* Contacts section — only when editing */}
        {isEdit && (
          <div className="border-t border-[#D5D5D5] px-6 pb-6 pt-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[#808080]">Contacts</h3>
              {!contactForm && (
                <button type="button" onClick={startAddContact}
                  className="rounded bg-[#0099FF] px-3 py-1 text-xs font-semibold text-white hover:bg-[#2AAAFF]">
                  + Add contact
                </button>
              )}
            </div>

            {contacts.length === 0 && !contactForm && (
              <p className="text-sm text-gray-400">No contacts yet.</p>
            )}

            {contacts.length > 0 && (
              <div className="mb-3 overflow-hidden rounded border border-gray-200">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Title</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Phone</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((c) => (
                      <tr key={c._id} className="border-t border-gray-100">
                        <td className="px-3 py-2 text-gray-900">{c.fullName}</td>
                        <td className="px-3 py-2 text-gray-600">{c.title || "—"}</td>
                        <td className="px-3 py-2 text-gray-600">{c.email || "—"}</td>
                        <td className="px-3 py-2 text-gray-600">{c.phone || "—"}</td>
                        <td className="px-3 py-2">
                          <div className="flex gap-2">
                            <button type="button" onClick={() => startEditContact(c)}
                              className="text-xs text-[#0099FF] hover:underline">Edit</button>
                            <button type="button" onClick={() => handleDeleteContact(c._id)}
                              className="text-xs text-red-500 hover:underline">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {contactForm && (
              <div className="rounded border border-[#D5D5D5] bg-gray-50 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {editingContactId ? "Edit contact" : "New contact"}
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col">
                    <label className={labelCls}>Prefix</label>
                    <select value={contactForm.prefix}
                      onChange={(e) => setContactForm({ ...contactForm, prefix: e.target.value })}
                      className={inputCls}>
                      {PREFIXES.map((p) => <option key={p} value={p}>{p || "—"}</option>)}
                    </select>
                  </div>
                  <div />
                  <div className="flex flex-col">
                    <label className={labelCls}>First name *</label>
                    <input type="text" value={contactForm.firstName}
                      onChange={(e) => setContactForm({ ...contactForm, firstName: e.target.value })}
                      className={inputCls} />
                  </div>
                  <div className="flex flex-col">
                    <label className={labelCls}>Last name *</label>
                    <input type="text" value={contactForm.lastName}
                      onChange={(e) => setContactForm({ ...contactForm, lastName: e.target.value })}
                      className={inputCls} />
                  </div>
                  <div className="flex flex-col sm:col-span-2">
                    <label className={labelCls}>Title</label>
                    <input type="text" value={contactForm.title}
                      onChange={(e) => setContactForm({ ...contactForm, title: e.target.value })}
                      className={inputCls} placeholder="e.g. Project Manager" />
                  </div>
                  <div className="flex flex-col">
                    <label className={labelCls}>Email</label>
                    <input type="email" value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className={inputCls} />
                  </div>
                  <div className="flex flex-col">
                    <label className={labelCls}>Phone number</label>
                    <input type="tel" value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      className={inputCls} />
                  </div>
                </div>
                {contactError && (
                  <p className="mt-2 text-xs text-red-600">{contactError}</p>
                )}
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={saveContact} disabled={contactSaving}
                    className="rounded bg-[#0099FF] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#2AAAFF] disabled:opacity-60">
                    {contactSaving ? "Saving…" : "Save contact"}
                  </button>
                  <button type="button" onClick={cancelContactForm}
                    className="rounded border border-[#D5D5D5] px-4 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
