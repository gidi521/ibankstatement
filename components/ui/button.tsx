import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils" // 工具函数，用于合并class

// 按钮组件样式变量
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90", // 默认样式
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90", // 危险操作样式
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground", // 轮廓样式
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80", // 次要样式
        ghost: "hover:bg-accent hover:text-accent-foreground", // 幽灵样式
        link: "text-primary underline-offset-4 hover:underline", // 链接样式
      },
      size: {
        default: "h-9 px-4 py-2", // 默认大小
        sm: "h-8 rounded-md px-3 text-xs", // 小号
        lg: "h-10 rounded-md px-8", // 大号
        icon: "h-9 w-9", // 图标按钮
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
