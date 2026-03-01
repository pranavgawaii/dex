import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    glow?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className, glow = false, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#1F1F1F] rounded-xl p-4 shadow-sm dark:shadow-none",
                    "hover:border-blue-600/40 dark:hover:border-blue-500/40 transition-all duration-200",
                    glow && "shadow-[0_0_0_1px_#2563eb] dark:shadow-[0_0_0_1px_#3B82F6]",
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = "Card";

const CardHeader = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex items-center justify-between mb-3", className)}
        {...props}
    />
));
CardHeader.displayName = "CardHeader";

const CardTitle = forwardRef<
    HTMLHeadingElement,
    HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn(
            "text-sm font-semibold text-gray-900 dark:text-[#F5F5F5] font-geist tracking-tight",
            className
        )}
        {...props}
    />
));
CardTitle.displayName = "CardTitle";

const CardContent = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("shadow-sm dark:shadow-none", className)} {...props} />
));
CardContent.displayName = "CardContent";

export { Card, CardHeader, CardTitle, CardContent };
