import { useMemo, useState } from 'react';
import { nuiFetch } from '../nui';
import { PROP_CATALOG } from '../props';

type Props = {
    onSelectId: (id: number | null) => void;
};

export function CatalogSection({ onSelectId }: Props) {
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return PROP_CATALOG;
        return PROP_CATALOG.filter(p =>
            p.label.toLowerCase().includes(q) || p.model.toLowerCase().includes(q),
        );
    }, [search]);

    async function handleSpawn(model: string) {
        const resp = await nuiFetch<{ ok: boolean; id?: number }>('spawn', { model });
        if (resp.ok && resp.id !== undefined) onSelectId(resp.id);
    }

    return (
        <section className="section">
            <input
                type="text"
                className="input"
                placeholder="Search props…"
                value={search}
                onChange={e => setSearch(e.target.value)}
            />
            <ul className="list list--catalog">
                {filtered.map(p => (
                    <li key={p.model}>
                        <button
                            type="button"
                            className="list-item list-item--catalog"
                            onClick={() => handleSpawn(p.model)}
                        >
                            <span className="list-item__primary">{p.label}</span>
                            <span className="list-item__secondary">{p.model}</span>
                        </button>
                    </li>
                ))}
                {filtered.length === 0 && (
                    <li className="list__empty">No matches</li>
                )}
            </ul>
        </section>
    );
}
