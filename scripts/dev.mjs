// Runs the API and the web dev server together, without a task-runner dependency.
import { spawn } from "node:child_process";

const run = (workspace) =>
  spawn("npm", ["run", "dev", "-w", workspace], {
    stdio: "inherit",
    shell: true,
  });

const children = ["@nutrigo/api", "@nutrigo/web"].map(run);
const stop = () => children.forEach((c) => c.kill());
process.on("SIGINT", stop);
children.forEach((c) =>
  c.on("exit", (code) => code && (stop(), process.exit(code))),
);
