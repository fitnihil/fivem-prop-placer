const chatNotify = (color: [number, number, number], title: string, body: string) => {
    emit('chat:addMessage', {color, multiline: false, args: [title, body]})
}

RegisterCommand('props', () => {
    
}, false)