declare const GetParentResourceName: () => string;

export function nuiFetch<T = unknown>(event: string, data: object = {}): Promise<T> {
    return fetch(`https://${GetParentResourceName()}/${event}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }).then(r => r.json() as Promise<T>);
}