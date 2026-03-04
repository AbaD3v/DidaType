// src/components/CaretStyleBar.tsx
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

  const handleSelect = (option: CaretStyle) => {
    localStorage.setItem("caretStyle", option);
    onChange(option);
  };

  return (
    <div className="flex items-center gap-2 font-mono">
      <div className="flex items-center gap-1.5 mr-2 text-[rgb(var(--sub))]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-4 h-4"
        >
          <path d="M10 12.5a.5.5 0 0 1-.5-.5V4.707L7.854 6.354a.5.5 0 1 1-.708-.708l2.5-2.5a.5.5 0 0 1 .708 0l2.5 2.5a.5.5 0 0 1-.708.708L10.5 4.707V12a.5.5 0 0 1-.5.5Z" />
          <path d="M3.5 15.5a.5.5 0 0 1 .5-.5h12a.5.5 0 0 1 0 1H4a.5.5 0 0 1-.5-.5Z" />
        </svg>
        <span className="text-sm lowercase">caret</span>
      </div>

      <div className="flex bg-[rgb(var(--bg))] p-1 rounded-md">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => handleSelect(option)}
            className={`
              px-3 py-1 text-sm lowercase transition-all duration-200 rounded-sm
              ${
                value === option
                  ? "text-[rgb(var(--accent))]"
                  : "text-[rgb(var(--sub))] hover:text-[rgb(var(--text))]"
              }
            `}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}