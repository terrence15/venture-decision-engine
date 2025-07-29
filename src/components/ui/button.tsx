import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-primary text-foreground hover:shadow-glow neon-glow",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 neon-glow",
        outline:
          "border border-accent/50 bg-background/20 hover:bg-accent/10 hover:text-accent neon-glow backdrop-blur-sm",
        secondary:
          "bg-secondary/20 text-secondary-foreground hover:bg-secondary/30 backdrop-blur-sm",
        ghost: "hover:bg-accent/10 hover:text-accent transition-all duration-300",
        link: "text-accent underline-offset-4 hover:underline hover:text-accent/80",
        neon: "bg-transparent border border-accent text-accent hover:bg-accent hover:text-background neon-glow",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
