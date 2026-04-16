/** Application module. */
import { GameDashboard } from "@/components";

/** Render the gameplay dashboard route. */
export default function GamePage() {
  return (
    <main className="flex min-h-screen w-full bg-slate-950 px-4 py-8 sm:px-8">
      <GameDashboard />
    </main>
  );
}
