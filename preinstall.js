const exec = require("child_process").exec;
const npm_argv = JSON.parse(process.env.npm_config_argv || "{}");
if (!(npm_argv && npm_argv.original instanceof Array)) {
	throw TypeError("npm argv Error");
}
if (npm_argv.original.indexOf("--server") !== -1) {
	console.log("install dependencies: mongodb.")
	const child = exec(`cd ${__dirname} && npm install mongodb`);
	child.stdout.pipe(process.stdout);
	child.stderr.pipe(process.stderr);
}