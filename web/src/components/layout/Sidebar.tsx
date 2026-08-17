import { NavLink } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { NAV, GROUP_LABELS, type NavItem } from "@/lib/nav";
import { cn } from "@/lib/format";

const groups: NavItem["group"][] = ["core", "protection", "system"];

export function Sidebar() {
  return (
    <aside className="flex h-full w-[264px] shrink-0 flex-col border-r border-line bg-paper">
      {/* Wordmark */}
      <div className="flex items-center gap-2.5 px-6 py-6">
        <ShieldCheck size={22} strokeWidth={1.6} className="text-accent" />
        <div className="leading-tight">
          <div className="font-display text-[17px] text-ink">Identity</div>
          <div className="-mt-1 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-mute">
            Control Plane
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-7 overflow-y-auto px-3 py-2">
        {groups.map((group) => {
          const items = NAV.filter((n) => n.group === group);
          return (
            <div key={group}>
              <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-mute">
                {GROUP_LABELS[group]}
              </div>
              <ul className="space-y-0.5">
                {items.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.path === "/"}
                      className={({ isActive }) =>
                        cn(
                          "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors duration-150",
                          isActive
                            ? "bg-sunken font-medium text-ink"
                            : "text-ink-soft hover:bg-sunken/60 hover:text-ink",
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon
                            size={17}
                            strokeWidth={1.6}
                            className={cn(
                              "shrink-0",
                              isActive ? "text-accent" : "text-ink-mute group-hover:text-ink-soft",
                            )}
                          />
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.maturity === "preview" && (
                            <span className="rounded border border-line-strong px-1 py-px text-[9px] font-semibold uppercase tracking-wide text-ink-mute">
                              Soon
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Account footer */}
      <div className="border-t border-line px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft font-display text-sm text-accent-ink">
            LK
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-medium text-ink">Lena Kessler</div>
            <div className="truncate text-xs text-ink-mute">Verifizierter Kern · aktiv</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
