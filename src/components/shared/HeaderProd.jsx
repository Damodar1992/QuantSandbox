import React, { memo, useCallback, useMemo } from "react";
import { cx, ui } from "../../constants/ui";
import { Logo, MenuIcon } from "../common";
import { PillTabs, ProdButton } from "../prod";
import { QueueIcon, ReleaseNotesIcon } from "./Icons";
import { FeatureFlagsDropdown } from "./FeatureFlagsDropdown";
import { StorageUsageBarCompact } from "../storage/StorageUsageBar";
import { QueuePanel } from "./QueuePanel";
import { AppSelect } from "../common/AppSelect";

export const HeaderProd = memo(function HeaderProd({
  onLogout,
  sections,
  activeSection,
  onSectionChange,
  settingsSubSection,
  onSettingsSubChange,
  strategiesCount,
  disabledSections,
  queueOpen,
  onQueueToggle,
  onQueueClose,
  queueItemsByTab = { hyperopt: [], postProcessing: [] },
  onQueueReorder,
  onQueueRemove,
  hyperoptRun = "Admin run",
  onHyperoptRunChange,
  formulasEnabled = false,
  featureFlags = {},
  onFeatureFlagChange,
  releaseNotesActive = false,
  onOpenReleaseNotes,
  storageTotals,
  storageActive = false,
  onOpenStorage,
}) {
  const navItems = useMemo(() => {
    const items = [];
    for (const item of sections) {
      if (item === "Users" && hyperoptRun === "Pipeline") continue;
      if (item === "Mini Backtest" && !featureFlags.miniBacktest) continue;
      if (item === "Settings") {
        items.push({ id: "indicators", label: "Indicators", section: "Settings", sub: "indicators" });
        if (hyperoptRun !== "Pipeline" && formulasEnabled) {
          items.push({ id: "formulas", label: "Formulas", section: "Settings", sub: "formulas" });
        }
        continue;
      }
      items.push({ id: item, label: item, section: item });
    }
    return items;
  }, [sections, hyperoptRun, formulasEnabled, featureFlags.miniBacktest]);

  const activeNavId = useMemo(() => {
    if (activeSection === "Settings") {
      return settingsSubSection === "formulas" ? "formulas" : "indicators";
    }
    return activeSection;
  }, [activeSection, settingsSubSection]);

  const disabledIds = useMemo(() => {
    const set = new Set();
    for (const item of navItems) {
      if (disabledSections.has(item.section)) set.add(item.id);
    }
    return set;
  }, [navItems, disabledSections]);

  const handleNavChange = useCallback(
    (id) => {
      const item = navItems.find((n) => n.id === id);
      if (!item) return;
      if (item.sub) {
        onSectionChange("Settings");
        onSettingsSubChange?.(item.sub);
      } else {
        onSectionChange(item.section);
      }
    },
    [navItems, onSectionChange, onSettingsSubChange],
  );

  return (
    <header
      className={cx(
        "h-[65px] sticky top-0 z-40 border-b",
        ui.divider,
        "bg-[var(--crm-header)]",
      )}
    >
      <div className="grid h-full min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 sm:px-5">
        <div className="flex shrink-0 items-center gap-2.5">
          <Logo className="h-9 w-auto max-w-[140px] shrink-0" />
          <span className="hidden whitespace-nowrap text-[16px] font-semibold tracking-tight text-foreground xl:inline">
            QuantSandbox
          </span>
        </div>

        <div className="relative hidden min-w-0 md:block">
          <nav
            className="flex overflow-x-auto [justify-content:safe_center] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Primary"
          >
            <PillTabs
              className="shrink-0"
              items={navItems.map((item) => ({
                id: item.id,
                label: item.label,
                icon: <MenuIcon name={item.label} active={activeNavId === item.id} />,
              }))}
              activeId={activeNavId}
              onChange={handleNavChange}
              disabledIds={disabledIds}
              renderBadge={(item) =>
                item.id === "Strategies" ? (
                  <span className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {strategiesCount}
                  </span>
                ) : null
              }
            />
          </nav>
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-7 bg-gradient-to-l from-[var(--crm-header)] to-transparent"
            aria-hidden="true"
          />
        </div>

        <div className="relative flex shrink-0 items-center gap-2">
          <AppSelect
            value={hyperoptRun}
            onValueChange={(v) => onHyperoptRunChange?.(v)}
            options={[
              { value: "Pipeline", label: "Quant" },
              { value: "Admin run", label: "Admin" },
            ]}
            className="w-[140px]"
            triggerClassName="h-10 text-[12px]"
          />
          <FeatureFlagsDropdown flags={featureFlags} onFlagChange={onFeatureFlagChange} />
          {storageTotals && onOpenStorage && (
            <StorageUsageBarCompact
              usedGb={storageTotals.usedGb}
              quotaGb={storageTotals.quotaGb}
              pct={storageTotals.pct}
              onClick={onOpenStorage}
              isActive={storageActive}
            />
          )}
          <ProdButton
            variant="headerControl"
            size="lg"
            onClick={onOpenReleaseNotes}
            title="Release notes"
            aria-label="Release notes"
            className={cx(
              "px-2.5",
              releaseNotesActive && "ring-1 ring-violet-500/50 text-[#ddd6fe]",
            )}
          >
            <ReleaseNotesIcon />
          </ProdButton>
          <span className="hidden xl:inline-flex items-center gap-2 text-[12px] text-muted-foreground">
            User: <span className="font-medium text-foreground">bogdan</span>
          </span>
          <ProdButton variant="headerControl" size="lg" onClick={onQueueToggle} title="Queue" aria-label="Open queue">
            <QueueIcon />
          </ProdButton>
          <QueuePanel
            open={queueOpen}
            onClose={onQueueClose}
            itemsByTab={queueItemsByTab}
            onReorder={onQueueReorder}
            onRemove={onQueueRemove}
          />
          <ProdButton variant="ghost" size="lg" onClick={onLogout}>
            Logout
          </ProdButton>
        </div>
      </div>
    </header>
  );
});
