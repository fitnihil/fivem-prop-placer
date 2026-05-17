import { CatalogSection } from '../sections/CatalogSection';
import { SavesSection } from '../sections/SavesSection';
import type { PropState, Slot } from '../types';

type Props = {
    open: boolean;
    props: PropState[];
    slots: Slot[];
    onSelectId: (id: number | null) => void;
    onClose: () => void;
};

export function LibraryPanel({ open, props, slots, onSelectId, onClose }: Props) {
    return (
        <aside className={`panel panel--right ${open ? 'panel--open' : ''}`}>
            <header className="panel__header">
                <h1 className="panel__title">Prop Placer</h1>
                <button
                    type="button"
                    className="panel__close"
                    onClick={onClose}
                    aria-label="Close"
                >
                    ×
                </button>
            </header>
            <div className="panel__body">
                <CatalogSection onSelectId={onSelectId} />
                <SavesSection
                    props={props}
                    slots={slots}
                    onSelectId={onSelectId}
                />
            </div>
        </aside>
    );
}
