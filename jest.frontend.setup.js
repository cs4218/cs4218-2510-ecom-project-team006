import { TextEncoder, TextDecoder } from "util";

if (typeof global.TextEncoder === "undefined") {
  Object.assign(global, { TextEncoder });
}

if (typeof global.TextDecoder === "undefined") {
  Object.assign(global, { TextDecoder });
}
