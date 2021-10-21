import { log } from "./deps.ts";
import { Router } from "./router.ts";

export class Application {
  private router?: Router;

  private handlers: RequestHandlerFunction[] = [];

  async start(options: Deno.ListenOptions) {
    const server = Deno.listen(options);
    log.info("2021.10.20");
    log.info(`Listening on port ${options.port}`);

    for await (const conn of server) {
      this.serveHttp(conn);
    }
  }

  private async serveHttp(conn: Deno.Conn) {
    const httpConn = Deno.serveHttp(conn);

    // TODO: Look for a better way to this.
    while (true) {
      try {
        const requestEvent = await httpConn.nextRequest();
        if (requestEvent === null) {
          return;
        }
        await this._handleRequestEvent(requestEvent);
      } catch (error) {
        log.error(error);
      }
    }
  }

  private async _handleRequestEvent(requestEvent: Deno.RequestEvent) {
    let response: Response | undefined = undefined;
    try {
      for await (const handler of this.handlers) {
        response = (await handler(requestEvent.request)) ?? undefined;
        if (response) {
          requestEvent.respondWith(response);
          break;
        }
      }
    } catch (error) {
      log.error(error);
      requestEvent.respondWith(new Response(null, { status: 500 }));
    }
    if (!response) {
      requestEvent.respondWith(new Response(null, { status: 501 }));
    }
  }

  use(handler: RequestHandler | RequestHandlerFunction) {
    this.handlers.push(
      "handle" in handler ? handler.handle.bind(handler) : handler
    );
  }
}

type RequestHandlerFunction = (
  request: Request
) => void | undefined | Response | Promise<Response | undefined>;
export interface RequestHandler {
  handle: RequestHandlerFunction;
}
