import * as React from "react";
import { Settings, Network, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ─── Category registry ────────────────────────────────────────────────────────
// To add a new category: push an entry here and add a case in <CategoryContent>.
const CATEGORIES = [
  {
    id: "protocols",
    label: "Protocols",
    icon: Network,
    description: "Communication protocol settings for connected devices",
  },
];

// ─── Per-category content components ─────────────────────────────────────────

function ProtocolsContent({ open, onSave, savedKeys }) {
  const [knxProtocol, setKnxProtocol] = React.useState("new");

  React.useEffect(() => {
    if (!open) return;
    window.electronAPI.settings.get("knx_protocol_version", "new").then((val) => {
      setKnxProtocol(val ?? "new");
    });
  }, [open]);

  const handleKnxChange = async (value) => {
    setKnxProtocol(value);
    await onSave("knx_protocol_version", value);
  };

  return (
    <div className="flex flex-col gap-6">
      <SettingSection title="KNX" saved={savedKeys.has("knx_protocol_version")}>
        <SettingRow label="Protocol Version" description="Select the KNX protocol version that matches your hardware firmware.">
          <RadioGroup value={knxProtocol} onValueChange={handleKnxChange} className="gap-2 mt-1">
            <ProtocolRadioCard
              value="new"
              id="knx-new"
              current={knxProtocol}
              title="New Protocol (v2)"
              subtitle="15-byte packet · Supports KNX Status Group"
            />
            <ProtocolRadioCard
              value="old"
              id="knx-old"
              current={knxProtocol}
              title="Old Protocol (v1)"
              subtitle="14-byte packet · KNX Status Group not used"
            />
          </RadioGroup>
        </SettingRow>
      </SettingSection>
    </div>
  );
}

// ─── Shared layout primitives ─────────────────────────────────────────────────

function SettingSection({ title, saved, children }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</span>
        <span className={cn("flex items-center gap-1 text-xs text-emerald-500 transition-opacity duration-300", saved ? "opacity-100" : "opacity-0")}>
          <CheckCircle2 className="size-3" />
          Saved
        </span>
      </div>
      <Separator />
      <div className="flex flex-col gap-5">{children}</div>
    </div>
  );
}

function SettingRow({ label, description, children }) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <Label className="text-sm font-medium">{label}</Label>
        {description && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function ProtocolRadioCard({ value, id, current, title, subtitle }) {
  const isSelected = current === value;
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex items-start gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-all",
        isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-muted-foreground/40 hover:bg-muted/40",
      )}
    >
      <RadioGroupItem value={value} id={id} className="mt-0.5 shrink-0" />
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium leading-none">{title}</span>
        <span className="text-xs text-muted-foreground mt-1">{subtitle}</span>
      </div>
    </label>
  );
}

// ─── Category dispatcher ───────────────────────────────────────────────────────

function CategoryContent({ categoryId, open, onSave, savedKeys }) {
  switch (categoryId) {
    case "protocols":
      return <ProtocolsContent open={open} onSave={onSave} savedKeys={savedKeys} />;
    default:
      return null;
  }
}

// ─── Main dialog ───────────────────────────────────────────────────────────────

export function SettingsDialog({ trigger }) {
  const [open, setOpen] = React.useState(false);
  const [activeId, setActiveId] = React.useState(CATEGORIES[0].id);
  const [savedKeys, setSavedKeys] = React.useState(new Set());

  const handleSave = React.useCallback(async (key, value) => {
    await window.electronAPI.settings.set(key, value);
    setSavedKeys((prev) => new Set(prev).add(key));
    setTimeout(() => {
      setSavedKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }, 2000);
  }, []);

  const activeCategory = CATEGORIES.find((c) => c.id === activeId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="p-0 gap-0 max-w-[660px]! h-[460px] overflow-hidden [&>button]:hidden">
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <DialogDescription className="sr-only">Application settings</DialogDescription>

        <div className="flex h-full">
          {/* ── Sidebar ── */}
          <aside className="w-52 shrink-0 border-r bg-muted/20 flex flex-col">
            {/* Sidebar header */}
            <div className="flex items-center gap-2.5 px-4 h-12 border-b shrink-0">
              <div className="flex items-center justify-center size-6 rounded-md bg-primary/10">
                <Settings className="size-3.5 text-primary" />
              </div>
              <span className="font-semibold text-sm">Settings</span>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-2 overflow-y-auto">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = cat.id === activeId;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveId(cat.id)}
                    className={cn(
                      "flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-sm transition-colors text-left select-none",
                      isActive ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* ── Content ── */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Content header */}
            <div className="flex flex-col justify-center px-6 h-12 border-b shrink-0">
              <h2 className="text-sm font-semibold leading-none">{activeCategory?.label}</h2>
              {activeCategory?.description && (
                <p className="text-xs text-muted-foreground mt-1 leading-none truncate">{activeCategory.description}</p>
              )}
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-6">
              <CategoryContent categoryId={activeId} open={open} onSave={handleSave} savedKeys={savedKeys} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
