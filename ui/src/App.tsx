import { useEffect, useMemo, useState } from 'react';
import { nuiFetch } from './nui';
import { PROP_CATALOG, getPropLabel } from './props';
import { AxisRow } from './AxisRow';

type Vec3 = { x: number; y: number; z: number };
type PropState = {
    id: number;
    model: string;
    position: Vec3;
    rotation: Vec3;
};

type Step = 'coarse' | 'fine';
const STEP_VALUES: Record<Step, number> = { coarse: 0.5, fine: 0.01 };

export function App() {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [props, setProps] = useState<PropState[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [step, setStep] = useState<Step>('coarse');
    const [confirmClear, setConfirmClear] = useState(false);
    const [slots, setSlots] = useState<{ name: string; count: number }[]>([]);
    const [slotName, setSlotName] = useState('');
    const [confirmLoad, setConfirmLoad] = useState<string | null>(null);

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
        if (!confirmClear) return;
        const t = setTimeout(() => setConfirmClear(false), 3000);
        return () => clearTimeout(t);
    }, [confirmClear]);

    useEffect(() => {
        if (!confirmLoad) return;
        const t = setTimeout(() => setConfirmLoad(null), 3000);
        return () => clearTimeout(t);
    }, [confirmLoad]);

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return PROP_CATALOG;
        return PROP_CATALOG.filter(p =>
            p.label.toLowerCase().includes(query) || p.model.toLowerCase().includes(query),
        );
    }, [search]);

    const selected = useMemo(
        () => props.find(p => p.id === selectedId) ?? null,
        [props, selectedId],
    );

    const stepValue = STEP_VALUES[step];

    async function handleSpawn(model: string) {
        const resp = await nuiFetch<{ ok: boolean; id?: number }>('spawn', { model });
        if (resp.ok && resp.id !== undefined) setSelectedId(resp.id);
    }

    function handleNudge(type: 'move' | 'rotate', axis: 'x' | 'y' | 'z', delta: number) {
        if (selectedId === null) return;
        nuiFetch('nudge', { id: selectedId, axis, delta, type });
    }

    function handleObjectSelect(id: number) {
        if (id !== selectedId) { setSelectedId(id) } else { setSelectedId(null); }
    }

    function handleDelete(id: number) {
        nuiFetch('delete', { id });
        if (id === selectedId) setSelectedId(null);
    }

    function handleClearClick() {
        if (!confirmClear) {
            setConfirmClear(true);
            return;
        }
        nuiFetch('clearAll');
        setSelectedId(null);
        setConfirmClear(false);
    }

    function handleSave() {
        const name = slotName.trim();
        if (!name) return;
        nuiFetch('saveSlot', { name });
        setSlotName('');
    }

    function handleLoadClick(name: string) {
        if (props.length === 0 || confirmLoad === name) {
            nuiFetch('loadSlot', { name });
            setSelectedId(null);
            setConfirmLoad(null);
            return;
        }
        setConfirmLoad(name);
    }

    function handleDeleteSlot(name: string) {
        nuiFetch('deleteSlot', { name });
    }

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
                                onClick={() => handleSpawn(p.model)}
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

                {props.length > 0 && (
                    <section className="section">
                        <div className="section__header">
                            <h2 className="section__title">Spawned · {props.length}</h2>
                            <button
                                type="button"
                                className={`section__action ${confirmClear ? 'section__action--danger' : ''}`}
                                onClick={handleClearClick}
                            >
                                {confirmClear ? 'Confirm?' : 'Clear All'}
                            </button>
                        </div>
                        <ul className="spawned-list">
                            {props.map(p => (
                                <li key={p.id} className="spawned-row">
                                    <button
                                        type="button"
                                        className={`spawned-item ${p.id === selectedId ? 'spawned-item--selected' : ''}`}
                                        onClick={() => setSelectedId(p.id)}
                                    >
                                        <span className="spawned-item__label">{getPropLabel(p.model)}</span>
                                        <span className="spawned-item__id">#{p.id}</span>
                                    </button>
                                    <button
                                        type="button"
                                        className="spawned-row__delete"
                                        onClick={() => handleDelete(p.id)}
                                        aria-label={`Delete ${getPropLabel(p.model)}`}
                                    >
                                        ×
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {selected && (
                    <section className="section">
                        <h2 className="section__title">Transform</h2>

                        <div className="transform-info">
                            <code className="transform-info__model">{selected.model}</code>
                        </div>

                        <div className="step-toggle">
                            <button
                                type="button"
                                className={`step-toggle__btn ${step === 'coarse' ? 'step-toggle__btn--active' :
                                    ''}`}
                                onClick={() => setStep('coarse')}
                            >
                                Coarse · 0.5
                            </button>
                            <button
                                type="button"
                                className={`step-toggle__btn ${step === 'fine' ? 'step-toggle__btn--active' :
                                    ''}`}
                                onClick={() => setStep('fine')}
                            >
                                Fine · 0.01
                            </button>
                        </div>

                        <div className="axis-group">
                            <h3 className="axis-group__title">Position</h3>
                            {(['x', 'y', 'z'] as const).map(axis => (
                                <AxisRow
                                    key={`pos-${axis}`}
                                    axis={axis}
                                    value={selected.position[axis]}
                                    step={stepValue}
                                    onNudge={delta => handleNudge('move', axis, delta)}
                                />
                            ))}
                        </div>

                        <div className="axis-group">
                            <h3 className="axis-group__title">Rotation</h3>
                            {(['x', 'y', 'z'] as const).map(axis => (
                                <AxisRow
                                    key={`rot-${axis}`}
                                    axis={axis}
                                    value={selected.rotation[axis]}
                                    step={stepValue}
                                    onNudge={delta => handleNudge('rotate', axis, delta)}
                                />
                            ))}
                        </div>
                    </section>
                )}

                <section className="section">
                    <h2 className="section__title">Saves</h2>

                    <div className="save-input-row">
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Slot name…"
                            value={slotName}
                            onChange={e => setSlotName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
                            maxLength={32}
                        />
                        <button
                            type="button"
                            className="section__action"
                            onClick={handleSave}
                            disabled={!slotName.trim() || props.length === 0}
                        >
                            Save
                        </button>
                    </div>

                    {slots.length > 0 ? (
                        <ul className="slot-list">
                            {slots.map(s => (
                                <li key={s.name} className="spawned-row">
                                    <button
                                        type="button"
                                        className={`slot-item ${confirmLoad === s.name ? 'slot-item--confirm' : ''}`}
                                        onClick={() => handleLoadClick(s.name)}
                                    >
                                        <span className="slot-item__name">{s.name}</span>
                                        <span className="slot-item__meta">
                                            {confirmLoad === s.name ? 'Confirm?' : `${s.count} prop${s.count === 1 ? '' : 's'}`}
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        className="spawned-row__delete"
                                        onClick={() => handleDeleteSlot(s.name)}
                                        aria-label={`Delete slot ${s.name}`}
                                    >
                                        ×
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="slot-list__empty">No saved slots yet</p>
                    )}
                </section>
            </div>

            <footer className="side-panel__footer">
                Spawned: <strong>{props.length}</strong>
            </footer>
        </div>
    );
}