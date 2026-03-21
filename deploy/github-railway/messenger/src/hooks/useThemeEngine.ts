"use client";

import { useEffect, useMemo, useState } from "react";

export type FluxThemeMode = "night" | "day";

export const useThemeEngine = () => {
  const [mode, setMode] = useState<FluxThemeMode>("night");
  const [hours, setHours] = useState<number>(new Date().getHours());

  useEffect(() => {
    const update = () => setHours(new Date().getHours());
    update();
    const timer = setInterval(update, 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setMode(hours >= 7 && hours <= 18 ? "day" : "night");
  }, [hours]);

  const variables = useMemo(() => {
    if (mode === "day") {
      return {
        background: "radial-gradient(circle at top, #1d1038 0%, #0f0c1a 60%, #09080d 100%)",
        glow: "rgba(183, 86, 255, 0.52)",
      };
    }
    return {
      background: "radial-gradient(circle at top, #120a2b 0%, #09050f 58%, #040306 100%)",
      glow: "rgba(161, 72, 255, 0.68)",
    };
  }, [mode]);

  return { mode, variables };
};
