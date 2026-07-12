const metrics = [
  { label: "Active Vehicles", value: "24" },
  { label: "Available Vehicles", value: "18" },
  { label: "Vehicles in Maintenance", value: "4" },
  { label: "Active Trips", value: "9" }
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-16">
        <div className="mb-10 max-w-3xl space-y-5">
          <p className="text-sm font-medium uppercase tracking-[0.28em] text-cyan-300">
            TransitOps
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            Smart transport operations, built for dispatch, maintenance, and control.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            A Next.js foundation for managing fleet assets, drivers, trips, fuel, expenses,
            and reporting with business rules baked in.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <article
              key={metric.label}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-cyan-950/10 backdrop-blur"
            >
              <p className="text-sm text-slate-400">{metric.label}</p>
              <p className="mt-3 text-3xl font-semibold text-white">{metric.value}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}