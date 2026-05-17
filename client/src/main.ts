let uiOpen = false;

function chatNotify(color: [number, number, number], title: string, body: string) {
    emit('chat:addMessage', { color, multiline: false, args: [title, body] });
}

function setUiOpen(open: boolean) {
    uiOpen = open;
    SetNuiFocus(open, open);
    SendNuiMessage(JSON.stringify({ type: open ? 'open' : 'close' }));
}

RegisterCommand('props', () => {
    setUiOpen(!uiOpen);
}, false);

RegisterNuiCallbackType('close');
on('__cfx_nui:close', (_data: unknown, cb: (resp: unknown) => void) => {
    setUiOpen(false);
    cb({});
});