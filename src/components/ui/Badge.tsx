import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { HTMLAttributes, forwardRef } from "react";

const badgeVariants = cva(
    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors duration-200",
    {
        variants: {
            variant: {
                default:
                    "bg-[#1F1F1F] text-[#71717A] border border-[#1F1F1F]",
                success:
                    "bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20",
                warning:
                    "bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20",
                error:
                    "bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20",
                accent:
                    "bg-blue-500/10 text-blue-500 border border-blue-500/20",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

interface BadgeProps
    extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> { }

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
    ({ className, variant, ...props }, ref) => {
        return (
            <span
                ref={ref}
                className={cn(badgeVariants({ variant }), className)}
                {...props}
            />
        );
    }
);

Badge.displayName = "Badge";

export { Badge, badgeVariants };
