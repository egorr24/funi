"use client";
import { useMemo, useState } from "react";
export const useThemeEngine = () => {
    const [accentColor, setAccentColor] = useState("#8b5cf6"); // violet-500
    const [blurIntensity, setBlurIntensity] = useState(20);
    const [glowIntensity, setGlowIntensity] = useState(0.5);
    const variables = useMemo(() => {
        return {
            accent: accentColor,
            background: `radial-gradient(circle at top, ${accentColor}15 0%, #09050f 58%, #040306 100%)`,
            glow: `${accentColor}${Math.floor(glowIntensity * 255).toString(16).padStart(2, '0')}`,
            blur: `${blurIntensity}px`,
        };
    }, [accentColor, blurIntensity, glowIntensity]);
    return { variables, accentColor, setAccentColor, blurIntensity, setBlurIntensity, glowIntensity, setGlowIntensity };
};
