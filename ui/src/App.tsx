import { useEffect, useState } from 'react';
import { nuiFetch } from './nui';
import { LibraryPanel } from './panels/LibraryPanel';
import { EditorPanel } from './panels/EditorPanel';
import type { PropState, Slot } from './types';

export function App() {
    const [open, setOpen] = useState(false);
    const [props, setProps] = useState<PropState[]>([]);
    const [slots, setSlots] = useState<Slot[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    useEffect(() => {
        const handler = (e: MessageEvent) => {
            const msg = e.data;
            if (msg?.type === 'open') setOpen(true);
            else if (msg?.type === 'close') setOpen(false);
            else if (msg?.type === 'state') setProps(msg.props);
            else if (msg?.type === 'slots') setSlots(msg.slots);
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, []);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') nuiFetch('close');
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    useEffect(() => {
        nuiFetch('select', { id: selectedId });
    }, [selectedId]);

    useEffect(() => {
        if (!open) setSelectedId(null);
    }, [open]);

    const selected = props.find(p => p.id === selectedId) ?? null;

    return (
        <>
            <EditorPanel
                open={open && props.length > 0}
                props={props}
                selectedId={selectedId}
                onSelectId={setSelectedId}
                selected={selected}
            />
            <LibraryPanel
                open={open}
                props={props}
                slots={slots}
                onSelectId={setSelectedId}
                onClose={() => nuiFetch('close')}
            />
        </>
    );
}
