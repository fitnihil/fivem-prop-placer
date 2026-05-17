import { useEffect, useState } from 'react';

export function useConfirm<T>(resetMs: number = 3000) {
    const [armed, setArmed] = useState<T | null>(null);

    useEffect(() => {
        if (armed === null) return;
        const t = setTimeout(() => setArmed(null), resetMs);
        return () => clearTimeout(t);
    }, [armed, resetMs]);

    return [armed, setArmed] as const;
}
