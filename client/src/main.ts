type SpawnedProp = {
    id: number;
    entity: number;
    model: string;
}

type Axis = 'x' | 'y' | 'z';
type NudgeType = 'move' | 'rotate';

let uiOpen = false;
let nextPropId = 1;
let selectedEntity: number | null = null;
const spawnedProps: SpawnedProp[] = [];

function chatNotify(color: [number, number, number], title: string, body: string) {
    emit('chat:addMessage', { color, multiline: false, args: [title, body] });
}

function loadModel(hash: number): Promise<boolean> {
    return new Promise(async (resolve) => {
        if (HasModelLoaded(hash)) return resolve(true);
        RequestModel(hash);
        for (let i = 0; i < 100; i++) {
            if (HasModelLoaded(hash)) return resolve(true);
            await new Promise(r => setTimeout(r, 50));
        }
        resolve(false);
    });
}

function raycastFromCamera(maxDistance: number = 50): [number, number, number] {
    const [camX, camY, camZ] = GetGameplayCamCoord();
    const [pitch, _roll, yaw] = GetGameplayCamRot(2);

    const pRad = (pitch * Math.PI) / 180;
    const yRad = (yaw * Math.PI) / 180;

    const fx = -Math.sin(yRad) * Math.cos(pRad);
    const fy = Math.cos(yRad) * Math.cos(pRad);
    const fz = Math.sin(pRad);

    const endX = camX + fx * maxDistance;
    const endY = camY + fy * maxDistance;
    const endZ = camZ + fz * maxDistance;

    const handle = StartExpensiveSynchronousShapeTestLosProbe(camX, camY, camZ, endX, endY, endZ, -1, PlayerPedId(), 0);

    const [, hit, hitCoords] = GetShapeTestResult(handle);

    if (hit) return [hitCoords[0], hitCoords[1], hitCoords[2]];
    return [endX, endY, endZ];
}

function broadcastState() {
    const props = spawnedProps.map(p => {
        const [x, y, z] = GetEntityCoords(p.entity, false);
        const [rx, ry, rz] = GetEntityRotation(p.entity, 2);
        return { id: p.id, model: p.model, position: { x, y, z }, rotation: { x: rx, y: ry, z: rz } }
    });
    SendNuiMessage(JSON.stringify({ type: 'state', props }));
}

function setUiOpen(open: boolean) {
    uiOpen = open;
    SetNuiFocus(open, open);
    SendNuiMessage(JSON.stringify({ type: open ? 'open' : 'close' }));
}

function clearOutline() {
    if (selectedEntity !== null && DoesEntityExist(selectedEntity)) {
        SetEntityDrawOutline(selectedEntity, false);
    }
}

RegisterCommand('props', () => {
    setUiOpen(!uiOpen);
}, false);

RegisterNuiCallbackType('spawn');
on('__cfx_nui:spawn', async (data: { model: string }, cb: (resp: unknown) => void) => {
    const modelName = data.model;
    const hash = GetHashKey(modelName);

    if (!IsModelInCdimage(hash)) {
        chatNotify([255, 100, 100], 'Prop Placer', `Model not found: ${modelName}`);
        cb({ ok: false });
        return;
    }

    const loaded = await loadModel(hash);
    if (!loaded) {
        chatNotify([255, 100, 100], 'Prop Placer', `Failed to load: ${modelName}`);
        cb({ ok: false });
        return;
    }

    const [x, y, z] = raycastFromCamera();
    const entity = CreateObject(hash, x, y, z, true, false, false);
    SetModelAsNoLongerNeeded(hash);

    spawnedProps.push({ id: nextPropId++, entity, model: modelName });
    broadcastState();
    cb({ ok: true });
})

RegisterNuiCallbackType('select');
on('__cfx_nui:select', (data: {id: number | null}, cb: (resp: unknown) => void) => {
    clearOutline();
    SetEntityDrawOutlineColor(255, 255, 255, 0);
    SetEntityDrawOutlineShader(1);
    if (data.id !== null) {
        const prop = spawnedProps.find(p => p.id === data.id);
        if (prop && DoesEntityExist(prop.entity)) {
            selectedEntity = prop.entity;
            SetEntityDrawOutline(prop.entity, true);
        }
    }
    cb({ ok: true });
})

RegisterNuiCallbackType('nudge');
on('__cfx_nui:nudge', (data: { id: number; axis: Axis; delta: number; type: NudgeType }, cb: (resp: unknown) => void, ) => {
    const prop = spawnedProps.find(p => p.id === data.id);
    if (!prop || !DoesEntityExist(prop.entity)) {
        cb({ ok: false });
        return;
    }

    if (data.type === 'move') {
        const [x, y, z] = GetEntityCoords(prop.entity, false);
        const next = { x, y, z };
        next[data.axis] += data.delta;
        SetEntityCoords(prop.entity, next.x, next.y, next.z, false, false, false, false);
    } else {
        const [rx, ry, rz] = GetEntityRotation(prop.entity, 2);
        const next = { x: rx, y: ry, z: rz };
        next[data.axis] += data.delta;
        SetEntityRotation(prop.entity, next.x, next.y, next.z, 2, true);
    }

    broadcastState();
    cb({ ok: true });
});

on('onResourceStop', (resource: string) => {
    if (resource !== GetCurrentResourceName()) return;
    SetNuiFocus(false, false);
    for (const p of spawnedProps) {
        if (DoesEntityExist(p.entity)) DeleteEntity(p.entity);
    }
})

RegisterNuiCallbackType('close');
on('__cfx_nui:close', (_data: unknown, cb: (resp: unknown) => void) => {
    setUiOpen(false);
    cb({});
});