import type { InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/input";

type SearchFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  hint?: string;
  error?: string;
};

export function SearchField(props: SearchFieldProps) {
  return <Input type="search" autoComplete="off" {...props} />;
}
