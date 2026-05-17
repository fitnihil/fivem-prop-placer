"use strict";

// src/main.ts
var uiOpen = false;
var nextPropId = 1;
var spawnedProps = [];
function chatNotify(color, title, body) {
  emit("chat:addMessage", { color, multiline: false, args: [title, body] });
}
function loadModel(hash) {
  return new Promise(async (resolve) => {
    if (HasModelLoaded(hash))
      return resolve(true);
    RequestModel(hash);
    for (let i = 0; i < 100; i++) {
      if (HasModelLoaded(hash))
        return resolve(true);
      await new Promise((r) => setTimeout(r, 50));
    }
    resolve(false);
  });
}
function raycastFromCamera(maxDistance = 50) {
  const [camX, camY, camZ] = GetGameplayCamCoord();
  const [pitch, _roll, yaw] = GetGameplayCamRot(2);
  const pRad = pitch * Math.PI / 180;
  const yRad = yaw * Math.PI / 180;
  const fx = -Math.sin(yRad) * Math.cos(pRad);
  const fy = Math.cos(yRad) * Math.cos(pRad);
  const fz = Math.sin(pRad);
  const endX = camX + fx * maxDistance;
  const endY = camY + fy * maxDistance;
  const endZ = camZ + fz * maxDistance;
  const handle = StartExpensiveSynchronousShapeTestLosProbe(camX, camY, camZ, endX, endY, endZ, -1, PlayerPedId(), 0);
  const [, hit, hitCoords] = GetShapeTestResult(handle);
  if (hit)
    return [hitCoords[0], hitCoords[1], hitCoords[2]];
  return [endX, endY, endZ];
}
function broadcastState() {
  const props = spawnedProps.map((p) => {
    const [x, y, z] = GetEntityCoords(p.entity, false);
    const [rx, ry, rz] = GetEntityRotation(p.entity, 2);
    return { id: p.id, model: p.model, position: { x, y, z }, rotation: { x: rx, y: ry, z: rz } };
  });
  SendNuiMessage(JSON.stringify({ type: "state", props }));
}
function setUiOpen(open) {
  uiOpen = open;
  SetNuiFocus(open, open);
  SendNuiMessage(JSON.stringify({ type: open ? "open" : "close" }));
}
RegisterCommand("props", () => {
  setUiOpen(!uiOpen);
}, false);
RegisterNuiCallbackType("spawn");
on("__cfx_nui:spawn", async (data, cb) => {
  const modelName = data.model;
  const hash = GetHashKey(modelName);
  if (!IsModelInCdimage(hash)) {
    chatNotify([255, 100, 100], "Prop Placer", `Model not found: ${modelName}`);
    cb({ ok: false });
    return;
  }
  const loaded = await loadModel(hash);
  if (!loaded) {
    chatNotify([255, 100, 100], "Prop Placer", `Failed to load: ${modelName}`);
    cb({ ok: false });
    return;
  }
  const [x, y, z] = raycastFromCamera();
  const entity = CreateObject(hash, x, y, z, true, false, false);
  SetModelAsNoLongerNeeded(hash);
  spawnedProps.push({ id: nextPropId++, entity, model: modelName });
  broadcastState();
  cb({ ok: true });
});
on("onResourceStop", (resource) => {
  if (resource !== GetCurrentResourceName())
    return;
  SetNuiFocus(false, false);
  for (const p of spawnedProps) {
    if (DoesEntityExist(p.entity))
      DeleteEntity(p.entity);
  }
});
RegisterNuiCallbackType("close");
on("__cfx_nui:close", (_data, cb) => {
  setUiOpen(false);
  cb({});
});
