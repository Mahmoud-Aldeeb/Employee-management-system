import type { LocationProof } from "@/types";

export function formatDistance(meters: number) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`;
}

export function describeLocationProof(proof: LocationProof | null | undefined) {
  if (!proof) return null;
  if (proof.status === "UNVERIFIED") return "Not verified";

  const place = proof.workplaceName ?? "work location";
  const distance =
    proof.distanceMeters === null
      ? ""
      : ` · ${formatDistance(proof.distanceMeters)}`;

  return proof.status === "INSIDE"
    ? `${place}${distance}`
    : `Away from ${place}${distance}`;
}
