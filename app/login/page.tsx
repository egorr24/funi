"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/",
      }) as any;

      console.log("Login result:", result);

      if (result?.error) {
        setError("Неверный email или пароль");
        setLoading(false);
      } else {
        console.log("Login success, redirecting...");
        window.location.assign("/");
      }
    } catch (err) {
      console.error("Login catch error:", err);
      setError("Ошибка входа");
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-black px-4 text-zinc-100">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-3xl">
        <h1 className="mb-4 text-2xl font-semibold">Вход в FLUX</h1>
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
          placeholder="Пароль"
          required
        />
        <button 
          type="submit" 
          disabled={loading}
          className="h-11 w-full rounded-xl bg-violet-500/80 text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Входим..." : "Войти"}
        </button>
        <Link
          href="/register"
          className="mt-3 block h-11 w-full rounded-xl border border-white/15 bg-white/5 text-center text-sm leading-[44px]"
        >
          Создать аккаунт
        </Link>
        {error ? <p className="mt-3 text-xs text-red-300">{error}</p> : null}
      </form>
    </div>
  );
}
