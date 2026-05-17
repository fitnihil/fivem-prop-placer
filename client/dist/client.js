"use strict";

// src/main.ts
var chatNotify = (color, title, body) => {
  emit("chat:addMessage", { color, multiline: false, args: [title, body] });
};
RegisterCommand("props", () => {
  chatNotify([100, 255, 255], "Prop Placer", "Command registered");
}, false);
