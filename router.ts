import * as log from "https://deno.land/std@0.106.0/log/mod.ts";
import * as path from "https://deno.land/std@0.106.0/path/mod.ts";
import { RequestHandler } from "./application.ts";

log.setup({
  handlers: {
    console: new log.handlers.ConsoleHandler("DEBUG", {
      formatter: "{levelName} {datetime} {msg}",
    }),
  },
  loggers: {
    default: {
      handlers: ["console"],
    },
  },
});

type HTTPRequestMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

type Handler = (
  request: Request,
  params: { [name: string]: string }
) => Response | Promise<Response>;
interface Route {
  path: string;
  children: Route[];
  handler?: Handler;
  param?: string;
}

export class Router implements RequestHandler {
  private _routes: { [method in HTTPRequestMethod]?: Route } = {};

  get(route: string, handler: Handler) {
    this.on("GET", route, handler);
  }
  post(route: string, handler: Handler) {
    this.on("POST", route, handler);
  }
  put(route: string, handler: Handler) {
    this.on("PUT", route, handler);
  }
  delete(route: string, handler: Handler) {
    this.on("DELETE", route, handler);
  }
  patch(route: string, handler: Handler) {
    this.on("PATCH", route, handler);
  }
  on(method: HTTPRequestMethod, route: string, handler: Handler) {
    // TODO: Validate route
    const normalizedRoute = this._normalizeRoute(route);

    const parts = normalizedRoute.split("/");
    const root = this._routes[method] ?? { path: "", children: [] };
    let curr = root;
    parts.shift();
    parts.forEach((part, i) => {
      let next = curr.children.find((route) => route.path === part);
      if (!next) {
        next = {
          path: part,
          children: [],
        };
        curr.children.push(next);
      }
      if (part.startsWith(":")) {
        next.param = part.replace(":", "");
      }
      if (i + 1 === parts.length) {
        next.handler = handler;
      }
      curr = next;
    });
    this._routes[method] = root;
  }

  private _normalizeRoute(route: string): string {
    return route.replace("http://localhost:4287", "");
  }

  handle(request: Request) {
    const route = this._normalizeRoute(request.url);
    const method = request.method as HTTPRequestMethod;
    log.info(`${method} ${route}`);
    let response = this._getResponse(route, method, request);
    if (!response && method == "GET") {
      // Attempt to find an asset.
      response = this._getAssetResponse(route);
    }

    return response ?? new Response("", { status: 404 });
  }

  private _getResponse(
    route: string,
    method: HTTPRequestMethod,
    request: Request
  ): Response | Promise<Response> | undefined {
    const { handler, params } = this._getHandler(route, method);
    if (handler) {
      return handler(request, params);
    }
  }

  private _getHandler(route: string, method: HTTPRequestMethod) {
    const root = this._routes[method];
    let curr = root;
    const params: { [name: string]: string } = {};
    if (curr) {
      const parts = route.split("/");
      parts.shift();
      for (const part of parts) {
        curr =
          curr?.children.find((r) => r.path === part) ??
          curr?.children.find((r) => !!r.param);
        if (curr?.param) {
          params[curr.param] = part;
        }
      }
    }
    return {
      handler: curr?.handler,
      params,
    };
  }

  private async _getAssetResponse(route: string): Promise<Response> {
    const filename = path.join(Deno.cwd(), `public/${route}`);
    try {
      const data = await Deno.readFile(filename);
      return new Response(data, { status: 200 });
    } catch {
      return new Response(null, { status: 404 });
    }
  }
}
