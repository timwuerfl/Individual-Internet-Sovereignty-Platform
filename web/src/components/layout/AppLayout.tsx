import { Outlet, ScrollRestoration } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-paper text-ink">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-content px-8 py-10 lg:px-12">
          <Outlet />
        </div>
      </main>
      <ScrollRestoration />
    </div>
  );
}
