import type { Demo } from "../../../playground/types.ts";
import { OfflineBanner } from "./OfflineBanner.tsx";

export default {
  title: "OfflineBanner",
  level: "molecule",
  states: {
    offline: <OfflineBanner state="offline" pending={0} />,
    "offline, 6 pending": <OfflineBanner state="offline" pending={6} />,
    syncing: <OfflineBanner state="syncing" pending={6} />,
    "sync error": (
      <OfflineBanner state="error" pending={6} onRetry={() => {}} />
    ),
  },
} satisfies Demo;
