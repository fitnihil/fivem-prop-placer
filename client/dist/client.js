"use strict";

// src/main.ts
var uiOpen = false;
function setUiOpen(open) {
  uiOpen = open;
  SetNuiFocus(open, open);
  SendNuiMessage(JSON.stringify({ type: open ? "open" : "close" }));
}
RegisterCommand("props", () => {
  setUiOpen(!uiOpen);
}, false);
RegisterNuiCallbackType("close");
on("__cfx_nui:close", (_data, cb) => {
  setUiOpen(false);
  cb({});
});
