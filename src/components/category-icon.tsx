"use client";

import * as Icons from "lucide-react";
import { LucideProps } from "lucide-react";

interface IconProps extends LucideProps {
  name: string;
}

export function CategoryIcon({ name, ...props }: IconProps) {
  const IconComponent = (Icons as unknown as Record<string, React.ComponentType<LucideProps>>)[name];
  if (!IconComponent) {
    const Fallback = Icons.Circle;
    return <Fallback {...props} />;
  }
  return <IconComponent {...props} />;
}
