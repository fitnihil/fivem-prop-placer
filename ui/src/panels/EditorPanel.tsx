import { useState } from 'react';
import { AxisRow } from '../AxisRow';
import { nuiFetch } from '../nui';
import { SpawnedSection } from '../sections/SpawnedSection';
import type { PropState } from '../types';

type Step = 'coarse' | 'fine';
const STEP_VALUES: Record<Step, number> = { coarse: 0.5, fine: 0.01 };

type Props = {
    open: boolean;
    props: PropState[];
    selectedId: number | null;
    onSelectId: (id: number | null) => void;
    selected: PropState | null;
};

export function EditorPanel({ open, props, selectedId, onSelectId, selected }: Props) {
    const [step, setStep] = useState<Step>('coarse');

    const stepValue = STEP_VALUES[step];

    function handleNudge(type: 'move' | 'rotate', axis: 'x' | 'y' | 'z', delta: number) {
        if (!selected) return;
        nuiFetch('nudge', { id: selected.id, axis, delta, type });
    }

    return (
        <aside className={`panel panel--left ${open ? 'panel--open' : ''}`}>
            <header className="panel__header">
                <h1 className="panel__title">
                    Editor
                    <span className="chip">{props.length}</span>
                </h1>
            </header>
            <div className="panel__body">
                <SpawnedSection
                    props={props}
                    selectedId={selectedId}
                    onSelectId={onSelectId}
                />

                {selected && (
                    <section className="section">
                        <h2 className="section__title">Transform</h2>

                        <code className="transform-model">{selected.model}</code>

                        <div className="step-toggle">
                            <button
                                type="button"
                                className={`step-toggle__btn ${step === 'coarse' ? 'step-toggle__btn--active' : ''}`}
                                onClick={() => setStep('coarse')}
                            >
                                Coarse · 0.5
                            </button>
                            <button
                                type="button"
                                className={`step-toggle__btn ${step === 'fine' ? 'step-toggle__btn--active' : ''}`}
                                onClick={() => setStep('fine')}
                            >
                                Fine · 0.01
                            </button>
                        </div>

                        <div className="axis-group">
                            <h2 className="axis-group__title">Position</h2>
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
                            <h2 className="axis-group__title">Rotation</h2>
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
            </div>
        </aside>
    );
}
