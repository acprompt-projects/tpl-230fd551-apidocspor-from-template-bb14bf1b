import Link from "next/link";

const services = [
  {
    name: "Auth",
    desc: "OAuth2 & API key authentication",
    icon: "🔐",
    href: "/guides/authentication",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    name: "Metrics",
    desc: "Time-series data ingestion & querying",
    icon: "📊",
    href: "/guides/metrics",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    name: "Monitoring",
    desc: "Alerts, health checks & uptime",
    icon: "🛡️",
    href: "/guides/monitoring",
    gradient: "from-amber-500 to-orange-600",
  },
  {
    name: "Dashboards",
    desc: "Custom widgets & shared views",
    icon: "📈",
    href: "/guides/dashboards",
    gradient: "from-sky-500 to-blue-600",
  },
];

const steps = [
  { n: "1", title: "Get an API key", text: "Sign up & generate a key from the console." },
  { n: "2", title: "Install the SDK", text: "npm i @platform/sdk — zero config." },
  { n: "3", title: "Make your first call", text: "Auth, then query — see the guide." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Hero */}
      <header className="border-b border-gray-800 px-6 py-5">
        <nav className="mx-auto flex max-w-6xl items-center justify-between">
          <span className="text-lg font-bold tracking-tight">Platform Docs</span>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link href="/guides" className="hover:text-white">Guides</Link>
            <a href="/api-reference" className="hover:text-white">API Reference</a>
            <a href="/runbooks" className="hover:text-white">Runbooks</a>
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-20 pb-16 text-center">
        <h1 className="text-5xl font-extrabold leading-tight tracking-tight">
          Build on the Platform&nbsp;
          <span className="bg-gradient-to-r from-violet-400 to-sky-400 bg-clip-text text-transparent">
            in minutes
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-400">
          API specs, integration guides, and runbooks for every service — wired
          to live OpenAPI schemas so examples never go stale.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/guides/getting-started"
            className="rounded-lg bg-violet-600 px-6 py-3 text-sm font-semibold hover:bg-violet-500"
          >
            Quick Start →
          </Link>
          <Link
            href="/guides/authentication"
            className="rounded-lg border border-gray-700 px-6 py-3 text-sm font-semibold hover:border-gray-500"
          >
            Auth Guide
          </Link>
        </div>
      </section>

      {/* Quick-start steps */}
      <section className="mx-auto max-w-4xl px-6 pb-16">
        <h2 className="mb-8 text-center text-2xl font-bold">Get started in 3 steps</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="rounded-xl border border-gray-800 bg-gray-900 p-6">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-sm font-bold">
                {s.n}
              </span>
              <h3 className="mt-3 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-gray-400">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Service cards */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <h2 className="mb-8 text-center text-2xl font-bold">Services</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s) => (
            <Link
              key={s.name}
              href={s.href}
              className="group rounded-xl border border-gray-800 bg-gray-900 p-6 transition hover:border-gray-600"
            >
              <span className="text-3xl">{s.icon}</span>
              <h3 className="mt-3 font-semibold group-hover:text-violet-400">{s.name}</h3>
              <p className="mt-1 text-sm text-gray-400">{s.desc}</p>
              <span
                className={`mt-4 inline-block h-1 w-8 rounded bg-gradient-to-r ${s.gradient} transition-all group-hover:w-12`}
              />
            </Link>
          ))}
        </div>
      </section>

      <footer className="border-t border-gray-800 py-8 text-center text-xs text-gray-600">
        © {new Date().getFullYear()} Platform Docs — Powered by OpenAPI &amp; MDX
      </footer>
    </div>
  );
}