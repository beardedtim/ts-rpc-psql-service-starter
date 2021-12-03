import {
  TwirpContext,
  TwirpServer,
  RouterEvents,
  TwirpError,
  TwirpErrorCode,
  Interceptor,
  TwirpContentType,
  chainInterceptors,
} from "twirp-ts";
import { SayHelloRequest, SayHelloResponse } from "./service";

//==================================//
//          Client Code             //
//==================================//

interface Rpc {
  request(
    service: string,
    method: string,
    contentType: "application/json" | "application/protobuf",
    data: object | Uint8Array
  ): Promise<object | Uint8Array>;
}

export interface PlumbAPIClient {
  SayHello(request: SayHelloRequest): Promise<SayHelloResponse>;
}

export class PlumbAPIClientJSON implements PlumbAPIClient {
  private readonly rpc: Rpc;
  constructor(rpc: Rpc) {
    this.rpc = rpc;
    this.SayHello.bind(this);
  }
  SayHello(request: SayHelloRequest): Promise<SayHelloResponse> {
    const data = SayHelloRequest.toJSON(request);
    const promise = this.rpc.request(
      "plumb.api.PlumbAPI",
      "SayHello",
      "application/json",
      data as object
    );
    return promise.then((data) => SayHelloResponse.fromJSON(data as any));
  }
}

export class PlumbAPIClientProtobuf implements PlumbAPIClient {
  private readonly rpc: Rpc;
  constructor(rpc: Rpc) {
    this.rpc = rpc;
    this.SayHello.bind(this);
  }
  SayHello(request: SayHelloRequest): Promise<SayHelloResponse> {
    const data = SayHelloRequest.encode(request).finish();
    const promise = this.rpc.request(
      "plumb.api.PlumbAPI",
      "SayHello",
      "application/protobuf",
      data
    );
    return promise.then((data) => SayHelloResponse.decode(data as Uint8Array));
  }
}

//==================================//
//          Server Code             //
//==================================//

export interface PlumbAPITwirp<T extends TwirpContext = TwirpContext> {
  SayHello(ctx: T, request: SayHelloRequest): Promise<SayHelloResponse>;
}

export enum PlumbAPIMethod {
  SayHello = "SayHello",
}

export const PlumbAPIMethodList = [PlumbAPIMethod.SayHello];

export function createPlumbAPIServer<T extends TwirpContext = TwirpContext>(
  service: PlumbAPITwirp<T>
) {
  return new TwirpServer<PlumbAPITwirp, T>({
    service,
    packageName: "plumb.api",
    serviceName: "PlumbAPI",
    methodList: PlumbAPIMethodList,
    matchRoute: matchPlumbAPIRoute,
  });
}

function matchPlumbAPIRoute<T extends TwirpContext = TwirpContext>(
  method: string,
  events: RouterEvents<T>
) {
  switch (method) {
    case "SayHello":
      return async (
        ctx: T,
        service: PlumbAPITwirp,
        data: Buffer,
        interceptors?: Interceptor<T, SayHelloRequest, SayHelloResponse>[]
      ) => {
        ctx = { ...ctx, methodName: "SayHello" };
        await events.onMatch(ctx);
        return handleSayHelloRequest(ctx, service, data, interceptors);
      };
    default:
      events.onNotFound();
      const msg = `no handler found`;
      throw new TwirpError(TwirpErrorCode.BadRoute, msg);
  }
}

function handleSayHelloRequest<T extends TwirpContext = TwirpContext>(
  ctx: T,
  service: PlumbAPITwirp,
  data: Buffer,
  interceptors?: Interceptor<T, SayHelloRequest, SayHelloResponse>[]
): Promise<string | Uint8Array> {
  switch (ctx.contentType) {
    case TwirpContentType.JSON:
      return handleSayHelloJSON<T>(ctx, service, data, interceptors);
    case TwirpContentType.Protobuf:
      return handleSayHelloProtobuf<T>(ctx, service, data, interceptors);
    default:
      const msg = "unexpected Content-Type";
      throw new TwirpError(TwirpErrorCode.BadRoute, msg);
  }
}
async function handleSayHelloJSON<T extends TwirpContext = TwirpContext>(
  ctx: T,
  service: PlumbAPITwirp,
  data: Buffer,
  interceptors?: Interceptor<T, SayHelloRequest, SayHelloResponse>[]
) {
  let request: SayHelloRequest;
  let response: SayHelloResponse;

  try {
    const body = JSON.parse(data.toString() || "{}");
    request = SayHelloRequest.fromJSON(body);
  } catch (e) {
    if (e instanceof Error) {
      const msg = "the json request could not be decoded";
      throw new TwirpError(TwirpErrorCode.Malformed, msg).withCause(e, true);
    }
  }

  if (interceptors && interceptors.length > 0) {
    const interceptor = chainInterceptors(...interceptors) as Interceptor<
      T,
      SayHelloRequest,
      SayHelloResponse
    >;
    response = await interceptor(ctx, request!, (ctx, inputReq) => {
      return service.SayHello(ctx, inputReq);
    });
  } else {
    response = await service.SayHello(ctx, request!);
  }

  return JSON.stringify(SayHelloResponse.toJSON(response) as string);
}
async function handleSayHelloProtobuf<T extends TwirpContext = TwirpContext>(
  ctx: T,
  service: PlumbAPITwirp,
  data: Buffer,
  interceptors?: Interceptor<T, SayHelloRequest, SayHelloResponse>[]
) {
  let request: SayHelloRequest;
  let response: SayHelloResponse;

  try {
    request = SayHelloRequest.decode(data);
  } catch (e) {
    if (e instanceof Error) {
      const msg = "the protobuf request could not be decoded";
      throw new TwirpError(TwirpErrorCode.Malformed, msg).withCause(e, true);
    }
  }

  if (interceptors && interceptors.length > 0) {
    const interceptor = chainInterceptors(...interceptors) as Interceptor<
      T,
      SayHelloRequest,
      SayHelloResponse
    >;
    response = await interceptor(ctx, request!, (ctx, inputReq) => {
      return service.SayHello(ctx, inputReq);
    });
  } else {
    response = await service.SayHello(ctx, request!);
  }

  return Buffer.from(SayHelloResponse.encode(response).finish());
}
