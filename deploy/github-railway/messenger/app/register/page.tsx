"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Ошибка регистрации");
      setLoading(false);
      return;
    }

    router.push("/login");
  };

  return (
    <div className="grid min-h-screen place-items-center bg-black px-4 text-zinc-100">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-3xl">
        <h1 className="mb-4 text-2xl font-semibold">Регистрация в FLUX</h1>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mb-3 h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none"
          placeholder="Имя"
          required
        />
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          className="mb-3 h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none"
          placeholder="Email"
          required
        />
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          className="mb-4 h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none"
          placeholder="Пароль (минимум 8 символов)"
          minLength={8}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="h-11 w-full rounded-xl bg-violet-500/80 text-sm font-medium disabled:opacity-60"
        >
          {loading ? "Создаём..." : "Создать аккаунт"}
        </button>
        <Link
          href="/login"
          className="mt-3 block h-11 w-full rounded-xl border border-white/15 bg-white/5 text-center text-sm leading-[44px]"
        >
          Уже есть аккаунт
        </Link>
        {error ? <p className="mt-3 text-xs text-red-300">{error}</p> : null}
      </form>
    </div>
  );
}
