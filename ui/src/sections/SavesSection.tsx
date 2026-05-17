import { useState } from 'react';
import { nuiFetch } from '../nui';
import { useConfirm } from '../useConfirm';
import type { PropState, Slot } from '../types';

type Props = {
    props: PropState[];
    slots: Slot[];
    onSelectId: (id: number | null) => void;
};

export function SavesSection({ props, slots, onSelectId }: Props) {
    const [slotName, setSlotName] = useState('');
    const [confirmLoad, setConfirmLoad] = useConfirm<string>();

    function handleSave() {
        const name = slotName.trim();
        if (!name) return;
        nuiFetch('saveSlot', { name });
        setSlotName('');
    }

    function handleLoadClick(name: string) {
        if (props.length === 0 || confirmLoad === name) {
            nuiFetch('loadSlot', { name });
            onSelectId(null);
            setConfirmLoad(null);
            return;
        }
        setConfirmLoad(name);
    }

    function handleDeleteSlot(name: string) {
        nuiFetch('deleteSlot', { name });
    }

    return (
        <section className="section">
            <h2 className="section__title">Saves</h2>
            <div className="input-row">
                <input
                    type="text"
                    className="input"
                    placeholder="Slot name…"
                    value={slotName}
                    onChange={e => setSlotName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
                    maxLength={32}
                />
                <button
                    type="button"
                    className="action"
                    onClick={handleSave}
                    disabled={!slotName.trim() || props.length === 0}
                >
                    Save
                </button>
            </div>
            {slots.length > 0 ? (
                <ul className="list">
                    {slots.map(s => (
                        <li key={s.name} className="list-row">
                            <button
                                type="button"
                                className={`list-item ${confirmLoad === s.name ? 'list-item--confirm' : ''}`}
                                onClick={() => handleLoadClick(s.name)}
                            >
                                <span className="list-item__primary">{s.name}</span>
                                <span className="list-item__secondary">
                                    {confirmLoad === s.name ? 'Confirm?' : `${s.count} prop${s.count === 1 ? '' : 's'}`}
                                </span>
                            </button>
                            <button
                                type="button"
                                className="list-row__delete"
                                onClick={() => handleDeleteSlot(s.name)}
                                aria-label={`Delete slot ${s.name}`}
                            >
                                ×
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="list__empty">No saved slots yet</p>
            )}
        </section>
    );
}
