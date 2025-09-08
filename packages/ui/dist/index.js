"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// index.tsx
var index_exports = {};
__export(index_exports, {
  Badge: () => Badge,
  Button: () => Button,
  Card: () => Card,
  CardContent: () => CardContent,
  CardDescription: () => CardDescription,
  CardFooter: () => CardFooter,
  CardHeader: () => CardHeader,
  CardTitle: () => CardTitle,
  Input: () => Input,
  Progress: () => Progress,
  Textarea: () => Textarea,
  badgeVariants: () => badgeVariants,
  buttonVariants: () => buttonVariants,
  cn: () => cn
});
module.exports = __toCommonJS(index_exports);

// components/button.tsx
var React = __toESM(require("react"));
var import_react_slot = require("@radix-ui/react-slot");
var import_class_variance_authority = require("class-variance-authority");

// lib/utils.ts
var import_clsx = require("clsx");
var import_tailwind_merge = require("tailwind-merge");
function cn(...inputs) {
  return (0, import_tailwind_merge.twMerge)((0, import_clsx.clsx)(inputs));
}

// components/button.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var buttonVariants = (0, import_class_variance_authority.cva)(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
var Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? import_react_slot.Slot : "button";
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      Comp,
      {
        className: cn(buttonVariants({ variant, size, className })),
        ref,
        ...props
      }
    );
  }
);
Button.displayName = "Button";

// components/input.tsx
var React2 = __toESM(require("react"));
var import_jsx_runtime2 = require("react/jsx-runtime");
var Input = React2.forwardRef(
  ({ className, type, ...props }, ref) => {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      "input",
      {
        type,
        className: cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        ),
        ref,
        ...props
      }
    );
  }
);
Input.displayName = "Input";

// components/textarea.tsx
var React3 = __toESM(require("react"));
var import_jsx_runtime3 = require("react/jsx-runtime");
var Textarea = React3.forwardRef(
  ({ className, ...props }, ref) => {
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      "textarea",
      {
        className: cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        ),
        ref,
        ...props
      }
    );
  }
);
Textarea.displayName = "Textarea";

// components/card.tsx
var React4 = __toESM(require("react"));
var import_jsx_runtime4 = require("react/jsx-runtime");
var Card = React4.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
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
var CardHeader = React4.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { ref, className: cn("flex flex-col space-y-1.5 p-6", className), ...props })
);
CardHeader.displayName = "CardHeader";
var CardTitle = React4.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
    "h3",
    {
      ref,
      className: cn("text-2xl font-semibold leading-none tracking-tight", className),
      ...props
    }
  )
);
CardTitle.displayName = "CardTitle";
var CardDescription = React4.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { ref, className: cn("text-sm text-muted-foreground", className), ...props })
);
CardDescription.displayName = "CardDescription";
var CardContent = React4.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { ref, className: cn("p-6 pt-0", className), ...props })
);
CardContent.displayName = "CardContent";
var CardFooter = React4.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { ref, className: cn("flex items-center p-6 pt-0", className), ...props })
);
CardFooter.displayName = "CardFooter";

// components/badge.tsx
var import_class_variance_authority2 = require("class-variance-authority");
var import_jsx_runtime5 = require("react/jsx-runtime");
var badgeVariants = (0, import_class_variance_authority2.cva)(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
function Badge({ className, variant, ...props }) {
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: cn(badgeVariants({ variant }), className), ...props });
}

// components/progress.tsx
var React5 = __toESM(require("react"));
var import_jsx_runtime6 = require("react/jsx-runtime");
var Progress = React5.forwardRef(
  ({ className, value, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
    "div",
    {
      ref,
      className: cn("relative h-4 w-full overflow-hidden rounded-full bg-secondary", className),
      ...props,
      children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
        "div",
        {
          className: "h-full w-full flex-1 bg-primary transition-all",
          style: { transform: `translateX(-${100 - (value || 0)}%)` }
        }
      )
    }
  )
);
Progress.displayName = "Progress";
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Progress,
  Textarea,
  badgeVariants,
  buttonVariants,
  cn
});
