"use client";

import { useState } from "react";

export function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? "Something went wrong");
        setStatus("error");
      } else {
        setStatus("success");
        setEmail("");
      }
    } catch {
      setError("Network error. Please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Check your inbox — verification email sent.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-center flex-wrap">
      <input
        type="email"
        required
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={status === "loading"}
        className="border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-1.5 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 px-3 py-1.5 rounded-md text-sm font-medium hover:opacity-80 disabled:opacity-50 transition-opacity"
      >
        {status === "loading" ? "Sending…" : "Subscribe"}
      </button>
      {error && <p className="text-sm text-red-500 w-full">{error}</p>}
    </form>
  );
}
