import { cn } from "@/shared/utils/utils";

type LoaderProps = {
  className?: string;
  label?: string;
};

export const Loader = ({ className, label = "Loading" }: LoaderProps) => (
  <span
    className={cn("loader", className)}
    role="status"
    aria-label={label}
  />
);
