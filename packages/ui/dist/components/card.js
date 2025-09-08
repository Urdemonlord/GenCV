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

// components/card.tsx
var card_exports = {};
__export(card_exports, {
  Card: () => Card,
  CardContent: () => CardContent,
  CardDescription: () => CardDescription,
  CardFooter: () => CardFooter,
  CardHeader: () => CardHeader,
  CardTitle: () => CardTitle
});
module.exports = __toCommonJS(card_exports);
var React = __toESM(require("react"));

// lib/utils.ts
var import_clsx = require("clsx");
var import_tailwind_merge = require("tailwind-merge");
function cn(...inputs) {
  return (0, import_tailwind_merge.twMerge)((0, import_clsx.clsx)(inputs));
}

// components/card.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var Card = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
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
  ({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref, className: cn("flex flex-col space-y-1.5 p-6", className), ...props })
);
CardHeader.displayName = "CardHeader";
var CardTitle = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
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
  ({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { ref, className: cn("text-sm text-muted-foreground", className), ...props })
);
CardDescription.displayName = "CardDescription";
var CardContent = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref, className: cn("p-6 pt-0", className), ...props })
);
CardContent.displayName = "CardContent";
var CardFooter = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref, className: cn("flex items-center p-6 pt-0", className), ...props })
);
CardFooter.displayName = "CardFooter";
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
});
