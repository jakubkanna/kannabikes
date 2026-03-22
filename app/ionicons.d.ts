import type { HTMLAttributes } from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "ion-icon": HTMLAttributes<HTMLElement> & {
        icon?: string;
        name?: string;
      };
    }
  }
}
