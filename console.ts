#! /usr/bin/env node
// https://github.com/freefq/free
import { concatStringTemplateAndSubscribes } from "./converter";
import { readFileSync } from "fs";

let proxiesDir = "",
  templateDir = "";
// 从倒数第二个参数开始即可
for (let i = process.argv.length - 2; i + 1; i--) {
  const arg = (x: number = i) => process.argv[x];
  if (arg().startsWith("-")) {
    if (arg() === "-p") {
      proxiesDir = arg(i + 1);
    }
    if (arg() === "-t") {
      templateDir = arg(i + 1);
    }
  }
}
const proxies = readFileSync(proxiesDir, "utf-8");
const template = readFileSync(templateDir, "utf-8");
console.log(concatStringTemplateAndSubscribes(proxies, template));
