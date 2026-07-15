interface CheckboxFieldProps {
  label: string
  htmlFor: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export function CheckboxField({
  label,
  htmlFor,
  checked,
  onChange
}: CheckboxFieldProps): React.JSX.Element {
  return (
    <label
      htmlFor={htmlFor}
      className="flex items-center gap-2 rounded-lg border border-input px-3 py-2 text-sm font-medium"
    >
      <input
        id={htmlFor}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 rounded border-input accent-primary"
      />
      {label}
    </label>
  )
}
