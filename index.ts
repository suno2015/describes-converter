import { concatStringTemplateAndSubscribes } from "./converter";
import { readFileSync } from "fs";

const template = readFileSync("./template.yaml", "utf-8");
const proxies = readFileSync("./test/proxies.txt", "utf-8");

console.log(concatStringTemplateAndSubscribes(proxies, template));
