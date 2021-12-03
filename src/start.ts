import Log from "@app/monitoring/log";
import * as Env from "@app/config/env";
import * as HTTPPort from "@app/ports/http";
import * as TwirpPort from "@app/ports/twirp";

const main = async () => {
  await TwirpPort.newInstance(await HTTPPort.newInstance(Env.port));
};

main().catch((err) => {
  Log.fatal({ err }, "System failed to start.");

  process.exit(1);
});
