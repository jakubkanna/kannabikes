import { index, prefix, route, type RouteConfig } from "@react-router/dev/routes";
import { LOCALIZED_ROUTE_DEFINITIONS } from "../route-manifest";

function buildLocalizedRoutes(idPrefix = "") {
  return LOCALIZED_ROUTE_DEFINITIONS.map((routeDefinition) => {
    const id = `${idPrefix}${routeDefinition.id}`;

    if ("index" in routeDefinition && routeDefinition.index) {
      return index(routeDefinition.file, { id });
    }

    return route(routeDefinition.path, routeDefinition.file, { id });
  });
}

const localizedRoutes = buildLocalizedRoutes();
const polishRoutes = buildLocalizedRoutes("pl-");

export default [
  ...localizedRoutes,
  ...prefix("pl", polishRoutes),
  route("blog/download-gpx", "routes/blog.download-gpx.ts", {
    id: "blog-download-gpx",
  }),
  route("pl/blog/download-gpx", "routes/blog.download-gpx.ts", {
    id: "pl-blog-download-gpx",
  }),
  route("robots.txt", "routes/robots[.]txt.ts", { id: "robots" }),
  route("sitemap.xml", "routes/sitemap[.]xml.ts", { id: "sitemap" }),
] satisfies RouteConfig;
