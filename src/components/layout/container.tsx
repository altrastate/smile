import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ContainerProps = {
  children: ReactNode;
  className?: string;
  as?: "div" | "section";
  id?: string;
};

export function Container({ children, className, as: Tag = "div", id }: ContainerProps) {
  return (
    <Tag id={id} className={cn("mx-auto w-full max-w-[76rem] px-[clamp(1rem,4vw,2.25rem)]", className)}>
      {children}
    </Tag>
  );
}
