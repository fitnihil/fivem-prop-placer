import { nuiFetch } from '../nui';
import { getPropLabel } from '../props';
import { useConfirm } from '../useConfirm';
import type { PropState } from '../types';

type Props = {
    props: PropState[];
    selectedId: number | null;
    onSelectId: (id: number | null) => void;
};

export function SpawnedSection({ props, selectedId, onSelectId }: Props) {
    const [confirmClear, setConfirmClear] = useConfirm<true>();

    if (props.length === 0) return null;

    function handleClearClick() {
        if (!confirmClear) {
            setConfirmClear(true);
            return;
        }
        nuiFetch('clearAll');
        onSelectId(null);
        setConfirmClear(null);
    }

    function handleDelete(id: number) {
        nuiFetch('delete', { id });
        if (id === selectedId) onSelectId(null);
    }

    return (
        <section className="section">
            <div className="section__header">
                <h2 className="section__title">Spawned</h2>
                <button
                    type="button"
                    className={`action ${confirmClear ? 'action--danger' : ''}`}
                    onClick={handleClearClick}
                >
                    {confirmClear ? 'Confirm?' : 'Clear All'}
                </button>
            </div>
            <ul className="list">
                {props.map(p => (
                    <li key={p.id} className="list-row">
                        <button
                            type="button"
                            className={`list-item ${p.id === selectedId ? 'list-item--selected' : ''}`}
                            onClick={() => onSelectId(p.id === selectedId ? null : p.id)}
                        >
                            <span className="list-item__primary">{getPropLabel(p.model)}</span>
                            <span className="list-item__secondary">#{p.id}</span>
                        </button>
                        <button
                            type="button"
                            className="list-row__delete"
                            onClick={() => handleDelete(p.id)}
                            aria-label={`Delete ${getPropLabel(p.model)}`}
                        >
                            ×
                        </button>
                    </li>
                ))}
            </ul>
        </section>
    );
}
