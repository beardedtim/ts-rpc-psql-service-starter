import { Gateway, Pattern } from "twirp-ts";
import { match } from "path-to-regexp";

export function createGateway() {
  return new Gateway({
    post: [
      {
        packageName: "plumb.api",
        methodName: "SayHello",
        serviceName: "PlumbAPI",
        httpMethod: "post" as Pattern,
        matchingPath: "/hello{:query_string(\\?.*)}?",
        matcher: match("/hello{:query_string(\\?.*)}?"),
        bodyKey: "*",
        responseBodyKey: "",
      },
    ],
    get: [],
    put: [],
    patch: [],
    delete: [],
  });
}
