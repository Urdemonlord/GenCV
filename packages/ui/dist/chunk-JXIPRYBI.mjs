import {
  cn
} from "./chunk-HXRDH5V2.mjs";

// components/card.tsx
import * as React from "react";
import { jsx } from "react/jsx-runtime";
var Card = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx(
    "div",
    {
      ref,
      className: cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        className
      ),
      ...props
    }
  )
);
Card.displayName = "Card";
var CardHeader = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", { ref, className: cn("flex flex-col space-y-1.5 p-6", className), ...props })
);
CardHeader.displayName = "CardHeader";
var CardTitle = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx(
    "h3",
    {
      ref,
      className: cn("text-2xl font-semibold leading-none tracking-tight", className),
      ...props
    }
  )
);
CardTitle.displayName = "CardTitle";
var CardDescription = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx("p", { ref, className: cn("text-sm text-muted-foreground", className), ...props })
);
CardDescription.displayName = "CardDescription";
var CardContent = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", { ref, className: cn("p-6 pt-0", className), ...props })
);
CardContent.displayName = "CardContent";
var CardFooter = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", { ref, className: cn("flex items-center p-6 pt-0", className), ...props })
);
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
};
