import { RequestHandler } from "./application.ts";

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
  constructor(base?: string) {
    this._base = base || "/";
  }

  private _base: string;
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
    const routeWithBase = normalizeRoute(`${this._base}${route}`);

    const parts = routeWithBase.split("/").filter((part) => !!part);
    const root = this._routes[method] ?? { path: "", children: [] };
    let curr = root;
    parts.forEach((part) => {
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
      curr = next;
    });
    curr.handler = handler;
    this._routes[method] = root;
  }

  handle(request: Request) {
    const route = normalizeRoute(request.url);
    const method = request.method as HTTPRequestMethod;

    return this._getResponse(route, method, request);
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
}

export function normalizeRoute(route: string): string {
  route = route.replace(/http(s?):\/\/[^\/]*(?=\/)/, "");
  if (route[route.length - 1] === "/") {
    route = route.substr(0, route.length - 1);
  }
  return route;
}
