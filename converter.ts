import { parse, stringify } from "yaml";
const protocols = ["vmess", "trojan"];

interface vmessProxy {
  add: string;
  aid: number;
  host: string;
  id: string;
  net: string;
  path: string;
  port: number;
  ps: string;
  tls: string;
  type: string;
  security: string;
  "skip-cert-verify": boolean;
  shi: string;
}

interface proxy {
  name: string;
  type: string;
  server: string;
  port: number;
  uuid?: string;
  alterId?: number;
  cipher?: string;
  password?: string;
  udp?: boolean;
  tls?: boolean;
  "skip-cert-verify"?: boolean;
  servername?: string;
  network?: string;
  "ws-opts"?: {
    path?: string;
    headers?: { Host?: string };
    "max-early-data"?: number;
    "early-data-header-name"?: string;
  };
}

const base64ToString = (str: string) =>
  Buffer.from(str, "base64").toString("utf-8");

const convertVmess = function (link: string): proxy {
  link = base64ToString(link);
  const jsonLink: vmessProxy = JSON.parse(link);
  const res: proxy = {
    name: jsonLink.ps,
    type: "vmess",
    server: jsonLink.add,
    port: jsonLink.port,
    uuid: jsonLink.id,
    alterId: jsonLink.aid,
    network: jsonLink.net,
    cipher: "auto",
  };
  if (jsonLink.net === "udp") res.udp = true;
  if (jsonLink.tls) res.tls = true;
  if (jsonLink["skip-cert-verify"]) res["skip-cert-verify"] = true;
  if (jsonLink.net === "ws") {
    res["ws-opts"] = {
      path: jsonLink.path,
    };
  }
  return res;
};

const convertTrojan = function (link: string): proxy {
  // format
  // trojan://passwd@host:port#description

  const passwdMatcher = /(.*)(?=@)/;
  const hostMatcher = /(?<=@)(.*)(?=:)/;
  const portMatcher = /(?<=:)(.*)(?=#)/;
  const nameMatcher = /(?<=#)(.*)/;

  // https://stackoverflow.com/a/45859565/15016499
  const passwd = link.match(passwdMatcher)![0];
  const host = link.match(hostMatcher)![0];
  const port = parseInt(link.match(portMatcher)![0]);
  const name = decodeURI(link.match(nameMatcher)![0]);

  const res: proxy = {
    name,
    type: "trojan",
    server: host,
    port,
    password: passwd,
    udp: true,
    "skip-cert-verify": true,
  };
  return res;
};

/**
 * Convert proxy link to clash config
 * @param link Proxy link
 */
export const convert = function (
  link: string = "",
  base64ed = false
): proxy | {} {
  link = link.trim();
  if (link === "") return {};

  const protocol: string = link.match(/(.*)(?=(:\/\/))/)![0]; // example: vmess, trojan
  link = link.match(/(?<=:\/\/)(.*)/)![0];

  let res: proxy;
  switch (protocol) {
    case "vmess":
      res = convertVmess(link);
      break;
    case "trojan":
      res = convertTrojan(link);
      break;

    default:
      res = {
        name: "",
        type: "",
        server: "",
        port: 0,
      };
  }
  return res;
};

/**
 * Convert multiple proxy link to clash config
 * @param links Proxy link
 */
const convertList = function (links: string[]): proxy[] {
  const res: proxy[] = [];
  links.forEach((v) => {
    const _res = convert(v);
    if ((_res as proxy).name) res.push(_res as proxy);
  });
  return res;
};

export const concatTemplateAndSubscribes = function (
  links: string[],
  template: any
) {
  const convertedList = convertList(links);
  template.proxies = convertedList;
  const names: string[] = [];
  convertedList.forEach((v) => names.push(v.name));
  for (const proxies of template["proxy-groups"]) {
    // 深拷贝，若使用引用，则会在 stringify yaml 时产生奇怪的错误
    for (const name of names) {
      proxies.proxies.push(name);
    }
  }
  template["proxy-groups"][0]["proxies"].unshift("AUTO");
  return template;
};

export const concatStringTemplateAndSubscribes = function (
  sLinks: string,
  sTemplate: string,
  _base64ed = false
): string {
  sLinks = sLinks.trim();

  if (!sTemplate) return "";
  if (!sLinks) return sTemplate;
  let matchCount: number = 0;
  for (const protocol of protocols) {
    if (sLinks.startsWith(protocol)) matchCount++;
  }
  if (!matchCount) {
    if (!_base64ed)
      return concatStringTemplateAndSubscribes(
        base64ToString(sLinks),
        sTemplate,
        true
      );
    else {
      throw "Wrong proxy";
    }
  }

  const template = parse(sTemplate);
  const links = sLinks.split("\n").map((v) => v.trim());
  return stringify(concatTemplateAndSubscribes(links, template));
};
