type Props = {
    axis: 'x' | 'y' | 'z';
    value: number;
    step: number;
    onNudge: (delta: number) => void;
};

export function AxisRow({ axis, value, step, onNudge }: Props) {
    return (
        <div className="axis-row">
            <span className="axis-row__label">{axis.toUpperCase()}</span>
            <button
                type="button"
                className="axis-row__btn"
                onClick={() => onNudge(-step)}
                aria-label={`Decrease ${axis}`}
            >
                −
            </button>
            <span className="axis-row__value">{value.toFixed(2)}</span>
            <button
                type="button"
                className="axis-row__btn"
                onClick={() => onNudge(step)}
                aria-label={`Increase ${axis}`}
            >
                +
            </button>
        </div>
    );
}