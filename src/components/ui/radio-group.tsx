type RadioOption = {
  value: string;
  label: string;
};

type RadioGroupProps = {
  name: string;
  legend: string;
  options: readonly RadioOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

export function RadioGroup({ name, legend, options, value, onChange, error }: RadioGroupProps) {
  const errorId = `${name}-error`;

  return (
    <fieldset aria-describedby={error ? errorId : undefined}>
      <legend className="text-sm font-semibold text-charcoal-900">{legend}</legend>
      <div className="mt-2 flex flex-col gap-2">
        {options.map((option) => (
          <label key={option.value} className="flex min-h-11 items-center gap-3 text-base">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="size-4 accent-forest-800"
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      {error ? (
        <p id={errorId} className="mt-1 text-sm text-danger-700">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
