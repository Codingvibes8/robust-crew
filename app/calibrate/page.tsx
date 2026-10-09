import { getServerProfile, getAnonId } from "@/lib/anon";
import { CalibrationFlow } from "@/components/CalibrationFlow";
import { CALIBRATION_ROUNDS } from "@/lib/calibration";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Calibration — Plainread",
  description: "Find the reading settings that suit your visual comfort in 6 quick comparisons.",
};

export default async function CalibratePage() {
  const [profile, anonId] = await Promise.all([
    getServerProfile(),
    getAnonId(),
  ]);

  // Generate randomized order per visitor deterministically for hydration parity and pure rendering
  const roundOrders = CALIBRATION_ROUNDS.map((_, i) => {
    const charCode = anonId.charCodeAt(i % Math.max(1, anonId.length));
    return (charCode + i) % 2 === 0;
  });

  return (
    <main className="main-content">
      <CalibrationFlow initialProfile={profile} roundOrders={roundOrders} />
    </main>
  );
}
