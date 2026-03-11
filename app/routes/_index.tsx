import type { Route } from "./+types/_index";
import { HomeGrid } from "../components/HomeGrid";
import { SITE_NAME } from "~/root";

export function meta({}: Route.MetaArgs) {
  return [{ title: SITE_NAME }];
}

export default function Home() {
  return <HomeGrid />;
}
