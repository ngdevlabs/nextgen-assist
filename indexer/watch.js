import chokidar from "chokidar";
import { exec } from "child_process";

const REPOS_DIR = "/repos";
let timeout = null;

console.log("Watching for file changes...");

const watcher = chokidar.watch(REPOS_DIR, {
  ignored: ["**/node_modules/**", "**/.git/**"],
  persistent: true,
  ignoreInitial: true
});

function triggerIndex() {
  if (timeout) clearTimeout(timeout);

  timeout = setTimeout(() => {
    console.log("Change detected → reindexing");
    exec("node index.js", (err, stdout, stderr) => {
      if (err) console.error(err);
      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);
    });
  }, 500); // debounce
}

watcher
  .on("add", triggerIndex)
  .on("change", triggerIndex)
  .on("unlink", triggerIndex);
