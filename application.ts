import * as log from "https://deno.land/std@0.106.0/log/mod.ts";
import { Router } from "./router.ts";

export class Application {
  private router?: Router;

  async start(options: Deno.ListenOptions) {
    const server = Deno.listen(options);
    log.info(`Listening on port ${options.port}`);

    for await (const conn of server) {
      this.serveHttp(conn);
    }
  }

  private async serveHttp(conn: Deno.Conn) {
    const httpConn = Deno.serveHttp(conn);

    for await (const requestEvent of httpConn) {
      this.router?.handle(requestEvent);
    }
  }

  withRouter(router: Router) {
    this.router = router;
  }
}
