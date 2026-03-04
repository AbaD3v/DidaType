"use client";

type CaretStyle = "line" | "block" | "underline";

export default function CaretStyleBar({
  value,
  onChange,
}: {
  value: CaretStyle;
  onChange: (v: CaretStyle) => void;
}) {
  const options: CaretStyle[] = ["line", "block", "underline"];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[rgb(var(--muted))] text-sm mr-2">caret</span>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => {
            localStorage.setItem("caretStyle", o);
            onChange(o);
          }}
          className={[
            "px-3 py-1 rounded text-sm",
            value === o ? "bg-white text-black" : "bg-white/10 hover:bg-white/15",
          ].join(" ")}
        >
          {o}
        </button>
      ))}
    </div>
  );
}