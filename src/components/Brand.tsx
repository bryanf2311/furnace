import { Flame } from "lucide-react";

export function BrandMark({ size = 22 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="relative grid place-items-center rounded-sm"
        style={{
          width: size + 8,
          height: size + 8,
          background: "linear-gradient(135deg, #D9542B, #F26B3D 60%, #F2A65A)",
          boxShadow: "0 0 18px rgba(242,107,61,0.35), inset 0 0 12px rgba(255,203,122,0.3)",
        }}
        aria-hidden="true"
      >
        <Flame size={size} strokeWidth={2.25} color="#0E0E10" />
      </div>
      <span className="display text-xl font-semibold tracking-tight">Furnace</span>
    </div>
  );
}
