import { useEffect, useState, useMemo } from 'react';
import { nuiFetch } from './nui';
import { PROP_CATALOG } from './props';

type PropState = {
    id: number;
    model: string;
    position: { x: number, y: number, z: number };
    rotation: { x: number, y: number, z: number };
}

export function App() {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [props, setProps] = useState<PropState[]>([]);

    useEffect(() => {
        const handler = (e: MessageEvent) => {
            const msg = e.data;
            if (msg?.type === 'open') setOpen(true);
            else if (msg?.type === 'close') setOpen(false);
            else if (msg?.type === 'state') setProps(msg.props);
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

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return PROP_CATALOG;
        return PROP_CATALOG.filter(p => p.label.toLowerCase().includes(query) || p.model.toLowerCase().includes(query));
    }, [search]);

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
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search props…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />

                <ul className="prop-list">
                    {filtered.map(p => (
                        <li key={p.model}>
                            <button
                                type="button"
                                className="prop-item"
                                onClick={() => nuiFetch('spawn', { model: p.model })}
                            >
                                <span className="prop-item__label">{p.label}</span>
                                <span className="prop-item__model">{p.model}</span>
                            </button>
                        </li>
                    ))}
                    {filtered.length === 0 && (
                        <li className="prop-list__empty">No matches</li>
                    )}
                </ul>
            </div>

            <footer className="side-panel__footer">
                Spawned: <strong>{props.length}</strong>
            </footer>
        </div>
    );
}