import Link from "next/link";
import { guides } from "@/lib/guides";

export default function GuidesIndex() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 px-6 py-5">
        <nav className="mx-auto flex max-w-6xl items-center gap-6">
          <Link href="/" className="text-lg font-bold tracking-tight hover:text-violet-400">
            ← Platform Docs
          </Link>
          <span className="text-sm text-gray-400">/ Guides</span>
        </nav>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-extrabold tracking-tight">Guides</h1>
        <p className="mt-2 text-gray-400">
          Long-form tutorials with embedded API examples. Written in MDX — writers
          can mix prose, code, and live schema references.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {guides.map((g) => (
            <Link
              key={g.slug}
              href={`/guides/${g.slug}`}
              className="group rounded-xl border border-gray-800 bg-gray-900 p-6 transition hover:border-gray-600"
            >
              <span className="text-xs font-mono text-violet-400">{g.category}</span>
              <h2 className="mt-2 text-lg font-semibold group-hover:text-violet-400">
                {g.title}
              </h2>
              <p className="mt-1 text-sm text-gray-400 line-clamp-2">{g.description}</p>
              {g.tags && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {g.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded bg-gray-800 px-2 py-0.5 text-[11px] text-gray-400"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}