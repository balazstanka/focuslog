import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormFieldProps = ComponentProps<"input"> & {
  label: string;
  name: string;
};

export function FormField({ label, name, ...inputProps }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name} className="text-muted-foreground">
        {label}
      </Label>
      <Input id={name} name={name} required {...inputProps} />
    </div>
  );
}
