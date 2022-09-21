import type { PropsWithChildren } from "react";

interface ButtonProps {
  className?: string;
}

export default function Button({
  className,
  ...props
}: PropsWithChildren<ButtonProps>) {
  return (
    <button {...props} className={"button " + className}>
      {props.children}
    </button>
  );
}
