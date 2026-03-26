"use client";
import { useMemo } from "react";
export const useWaveform = (seed, bars = 48) => {
    return useMemo(() => {
        const values = [];
        let hash = 0;
        for (let index = 0; index < seed.length; index += 1) {
            hash = (hash << 5) - hash + seed.charCodeAt(index);
            hash |= 0;
        }
        for (let index = 0; index < bars; index += 1) {
            const value = Math.abs(Math.sin(hash + index * 0.42));
            values.push(Math.floor(8 + value * 34));
        }
        return values;
    }, [bars, seed]);
};
