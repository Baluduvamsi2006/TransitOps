import { getServerSession } from "../../lib/jwt";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { roleLabels } from "../../lib/rbac";

export default async function SettingsPage() {
    const session = await getServerSession();
    
    if (!session) {
        redirect("/login");
    }

    const initials = session.name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");

    async function handleLogout() {
        "use server";
        const cookieStore = await cookies();
        cookieStore.delete("transitops_session");
        redirect("/login");
    }

    return (
        <div className="mx-auto max-w-4xl space-y-8 animate-fade-up">
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
                <p className="mt-2 text-sm text-(--muted-2)">Manage your account settings, preferences, and view access roles.</p>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                {/* 1. User Profile (Dynamic) */}
                <section className="rounded-4xl border border-white/8 bg-(--panel) p-6 shadow-xl sm:p-8 flex flex-col">
                    <h2 className="text-lg font-semibold text-white mb-6">User Profile</h2>
                    <div className="flex items-center gap-4 mb-8 flex-1">
                        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-(--accent) text-xl font-bold text-(--accent-ink) shadow-[0_12px_30px_rgba(224,138,46,0.25)]">
                            {initials}
                        </div>
                        <div>
                            <p className="text-xl font-semibold text-white">{session.name}</p>
                            <p className="text-sm text-(--muted)">{session.email}</p>
                            <p className="mt-1.5 inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white ring-1 ring-inset ring-white/20">
                                {roleLabels[session.role] ?? session.role}
                            </p>
                        </div>
                    </div>
                    <form action={handleLogout}>
                        <button
                            type="submit"
                            className="w-full rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-500/20 border border-red-500/20 cursor-pointer"
                        >
                            Sign Out
                        </button>
                    </form>
                </section>

                {/* 2. General Depot Configuration (Static / Mocked) */}
                <section className="rounded-4xl border border-white/8 bg-(--panel) p-6 shadow-xl sm:p-8">
                    <h2 className="text-lg font-semibold text-white mb-6">General Configuration</h2>
                    <div className="space-y-4">
                        <label className="block space-y-2 text-sm text-white">
                            <span className="text-xs uppercase tracking-widest text-(--muted)">Depot Name</span>
                            <input
                                type="text"
                                defaultValue="TransitOps Central Hub"
                                className="w-full rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-(--accent-2) focus:bg-white/8"
                            />
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <label className="block space-y-2 text-sm text-white opacity-60">
                                <span className="text-xs uppercase tracking-widest text-(--muted)">Currency</span>
                                <select disabled className="w-full rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-white outline-none appearance-none cursor-not-allowed">
                                    <option>₹ (INR)</option>
                                </select>
                            </label>
                            <label className="block space-y-2 text-sm text-white opacity-60">
                                <span className="text-xs uppercase tracking-widest text-(--muted)">Distance Unit</span>
                                <select disabled className="w-full rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-white outline-none appearance-none cursor-not-allowed">
                                    <option>Kilometers (km)</option>
                                </select>
                            </label>
                        </div>
                        <div className="pt-4 flex items-center justify-between">
                            <span className="text-sm text-white font-medium">Dark Mode</span>
                            <button disabled type="button" className="relative inline-flex h-6 w-11 shrink-0 cursor-not-allowed items-center justify-center rounded-full bg-(--accent) focus:outline-none opacity-80">
                                <span aria-hidden="true" className="translate-x-2.5 pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" />
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            {/* 3. The RBAC Matrix (Read-Only Documentation) */}
            <section className="rounded-4xl border border-white/8 bg-(--panel) overflow-hidden shadow-xl">
                <div className="p-6 sm:p-8 border-b border-white/8">
                    <h2 className="text-lg font-semibold text-white">Role-Based Access Control (RBAC) Matrix</h2>
                    <p className="mt-1 text-sm text-(--muted-2)">Documentation of security architecture and permissions.</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-white/5 text-(--muted) text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 font-medium">Role</th>
                                <th className="px-6 py-4 font-medium">Manage (Write)</th>
                                <th className="px-6 py-4 font-medium">View (Read)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/8 text-white/90">
                            <tr className="hover:bg-white/5 transition">
                                <td className="px-6 py-4 font-semibold text-white">Fleet Manager</td>
                                <td className="px-6 py-4 text-(--accent)">Fleet, Drivers</td>
                                <td className="px-6 py-4 text-(--info)">Trips, Fuel/Exp, Analytics</td>
                            </tr>
                            <tr className="hover:bg-white/5 transition">
                                <td className="px-6 py-4 font-semibold text-white">Dispatcher</td>
                                <td className="px-6 py-4 text-(--accent)">Trips</td>
                                <td className="px-6 py-4 text-(--info)">Fleet, Analytics</td>
                            </tr>
                            <tr className="hover:bg-white/5 transition">
                                <td className="px-6 py-4 font-semibold text-white">Safety Officer</td>
                                <td className="px-6 py-4 text-(--accent)">Drivers</td>
                                <td className="px-6 py-4 text-(--info)">Trips</td>
                            </tr>
                            <tr className="hover:bg-white/5 transition">
                                <td className="px-6 py-4 font-semibold text-white">Financial Analyst</td>
                                <td className="px-6 py-4 text-(--accent)">Fuel/Exp, Analytics</td>
                                <td className="px-6 py-4 text-(--info)">Fleet</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}