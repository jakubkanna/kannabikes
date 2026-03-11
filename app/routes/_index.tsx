import type { Route } from "./+types/_index";
import { SITE_NAME } from "~/root";

export function meta({}: Route.MetaArgs) {
  return [{ title: SITE_NAME }];
}

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <img
        src="/kannabikes_logotype.svg"
        alt={SITE_NAME}
        className="h-16 w-auto max-w-full md:h-24"
      />
    </main>
  );
}
