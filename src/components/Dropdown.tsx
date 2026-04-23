import { useState, useRef, useEffect } from "react";

type Option = {
  value: string;
  label: string;
  color: string;
};

type Props = {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  "aria-label"?: string;
  "data-testid"?: string;
  pos: string;
};

function Dropdown({ value, options, pos, onChange, ...props }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  // close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="" {...props}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="cursor-pointer text-xs sm:text-sm outline-none bg-transparent"
        style={{ color: selected?.color ?? "#9ca3af" }}
      >
        {selected?.label ?? "Select"}
      </button>

      {isOpen && (
        <ul
          className={`absolute z-[1002]   mb-1 ${pos}  bg-white rounded-2xl shadow-lg py-1 min-w-[120px] border border-gray-100`}
          role="listbox"
        >
          {options.map((option) => (
            <li
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              className="px-4 py-2 text-xs cursor-pointer hover:bg-gray-50 transition-colors"
              style={{
                color: option.value === value ? option.color : "#9ca3af",
              }}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Dropdown;
