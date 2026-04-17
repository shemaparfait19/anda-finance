"use client";

import { useEffect, useState } from "react";

export function LiveHeaderInfo() {
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    const update = () =>
      setDateStr(
        new Date().toLocaleDateString("en-GB", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      );
    update();
    const t = setInterval(update, 60_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="hidden lg:flex items-center gap-4 text-xs text-muted-foreground">
      <span className="font-medium">{dateStr}</span>
      <span className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        <span className="text-green-600 dark:text-green-400 font-medium">System Online</span>
      </span>
    </div>
  );
}
