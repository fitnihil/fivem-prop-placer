import { useEffect, useState } from 'react';
import { nuiFetch } from './nui';

export function App() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const handler = (e: MessageEvent) => {
            if (e.data?.type === 'open') setOpen(true);
            if (e.data?.type === 'close') setOpen(false);
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

    return (
        <div className={`side-panel ${open ? 'side-panel--open' : ''}`}>
            <header className="side-panel__header">
                <h1 className="side-panel__title">Prop Placer</h1>
                <button
                    type="button"
                    className="side-panel__close"
                    onClick={() => nuiFetch('close')}
                    aria-label="Close"
                >
                    ×
                </button>
            </header>
            <div className="side-panel__body">
                Content will be here
            </div>
        </div>
    );
}