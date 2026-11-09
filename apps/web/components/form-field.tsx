import type { ComponentProps } from "react";

type FormFieldProps = ComponentProps<"input"> & {
  label: string;
  name: string;
};

export function FormField({ label, name, ...inputProps }: FormFieldProps) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium">
      {label}
      <input
        name={name}
        required
        className="rounded-lg border border-foreground/20 bg-transparent px-3 py-2 font-normal outline-none focus:border-foreground"
        {...inputProps}
      />
    </label>
  );
}
