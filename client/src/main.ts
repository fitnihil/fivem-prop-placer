type SpawnedProp = {
    id: number;
    entity: number;
    model: string;
}

type SavedProp = {
    model: string;
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
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

async function raycastFromCamera(maxDistance: number = 50): Promise<[number, number, number]> {
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

    const handle = StartShapeTestLosProbe(camX, camY, camZ, endX, endY, endZ, -1, PlayerPedId(), 0);

    let status = 1;
    let hit = false;
    let hitCoords: number[] = [0, 0, 0];
    for (let i = 0; i < 30 && status === 1; i++) {
        await new Promise(r => setTimeout(r, 0));
        [status, hit, hitCoords] = GetShapeTestResult(handle);
    }

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

function sanitizeSlotName(name: string): string {
    return name.trim().replace(/:/g, '').slice(0, 32); // remove colons from string
}

function listSlots(): { name: string; count: number }[] {
    const handle = StartFindKvp('slot:');
    const slots: { name: string; count: number }[] = [];

    while (true) {
        const key = FindKvp(handle);
        if (!key) break;
        const name = key.slice('slot:'.length);
        const raw = GetResourceKvpString(key);
        if (!raw) continue;

        try {
            const parsed: SavedProp[] = JSON.parse(raw);
            slots.push({ name, count: parsed.length });
        } catch {
            // corrupted; skip
        }
    }

    EndFindKvp(handle);
    return slots.sort((a, b) => a.name.localeCompare(b.name));
}

function broadcastSlots() {
    SendNuiMessage(JSON.stringify({ type: 'slots', slots: listSlots() }));
}

function setUiOpen(open: boolean) {
    uiOpen = open;
    SetNuiFocus(open, open);
    SendNuiMessage(JSON.stringify({ type: open ? 'open' : 'close' }));

    if (open) {
        broadcastState();
        broadcastSlots();
    }
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

    const [x, y, z] = await raycastFromCamera();
    const entity = CreateObject(hash, x, y, z, true, false, false);
    SetModelAsNoLongerNeeded(hash);

    spawnedProps.push({ id: nextPropId++, entity, model: modelName });
    broadcastState();
    cb({ ok: true });
})

RegisterNuiCallbackType('select');
on('__cfx_nui:select', (data: { id: number | null }, cb: (resp: unknown) => void) => {
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
on('__cfx_nui:nudge', (data: { id: number; axis: Axis; delta: number; type: NudgeType }, cb: (resp: unknown) => void,) => {
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

RegisterNuiCallbackType('delete');
on('__cfx_nui:delete', (data: { id: number }, cb: (resp: unknown) => void) => {
    const index = spawnedProps.findIndex(p => p.id === data.id);
    if (index === -1) {
        cb({ ok: false });
        return;
    }

    const prop = spawnedProps[index];
    if (DoesEntityExist(prop.entity)) DeleteEntity(prop.entity);
    spawnedProps.splice(index, 1);

    broadcastState();
    cb({ ok: true });
})

RegisterNuiCallbackType('clearAll');
on('__cfx_nui:clearAll', (_data: unknown, cb: (resp: unknown) => void) => {
    for (const p of spawnedProps) {
        if (DoesEntityExist(p.entity)) DeleteEntity(p.entity);
    }

    spawnedProps.length = 0;

    broadcastState();
    cb({ ok: true });
});

RegisterNuiCallbackType('saveSlot');
on('__cfx_nui:saveSlot', (data: { name: string }, cb: (resp: unknown) => void) => {
    const name = sanitizeSlotName(data.name);

    if (!name) {
        cb({ ok: false, error: 'Invalid name' });
        return;
    }

    const snapshot: SavedProp[] = spawnedProps.map(p => {
        const [x, y, z] = GetEntityCoords(p.entity, false);
        const [rx, ry, rz] = GetEntityRotation(p.entity, 2);
        return {
            model: p.model,
            position: { x, y, z },
            rotation: { x: rx, y: ry, z: rz },
        };
    });

    SetResourceKvp(`slot:${name}`, JSON.stringify(snapshot));

    broadcastSlots();
    cb({ ok: true });
});

RegisterNuiCallbackType('loadSlot');
on('__cfx_nui:loadSlot', async (data: { name: string }, cb: (resp: unknown) => void) => {
    const name = sanitizeSlotName(data.name);
    const raw = GetResourceKvpString(`slot:${name}`);

    if (!raw) {
        cb({ ok: false, error: 'Slot not found' });
        return;
    }

    let snapshot: SavedProp[];

    try {
        snapshot = JSON.parse(raw);
    } catch {
        cb({ ok: false, error: 'Corrupted slot' });
        return;
    }

    clearOutline();

    for (const p of spawnedProps) {
        if (DoesEntityExist(p.entity)) DeleteEntity(p.entity);
    }
    
    spawnedProps.length = 0;

    for (const saved of snapshot) {
        const hash = GetHashKey(saved.model);
        if (!IsModelInCdimage(hash)) continue;
        const loaded = await loadModel(hash);
        if (!loaded) continue;
        const entity = CreateObject(
            hash, saved.position.x, saved.position.y, saved.position.z,
            true, false, false,
        );
        SetEntityRotation(entity, saved.rotation.x, saved.rotation.y, saved.rotation.z, 2, true);
        SetModelAsNoLongerNeeded(hash);
        spawnedProps.push({ id: nextPropId++, entity, model: saved.model });
    }

    broadcastState();
    cb({ ok: true, loaded: snapshot.length });
});

RegisterNuiCallbackType('deleteSlot');
on('__cfx_nui:deleteSlot', (data: { name: string }, cb: (resp: unknown) => void) => {
    const name = sanitizeSlotName(data.name);
    DeleteResourceKvp(`slot:${name}`);
    broadcastSlots();
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