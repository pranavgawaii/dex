import DashboardClient from "@/components/home/DashboardClient";
import { getTodayLog, getQuickLinks, getMetrics } from "@/lib/supabase/queries";

export const revalidate = 0; // Ensures fresh data load on request

export default async function HomePage() {
  const [log, links, metrics] = await Promise.all([
    getTodayLog(),
    getQuickLinks(),
    getMetrics()
  ]);

  return <DashboardClient initialLog={log} quickLinks={links} metrics={metrics} />;
}
