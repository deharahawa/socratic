export type ReviewVerdict = {
  isApproved: boolean;
  feedback: string;
  failedRequirements: string[];
};

export function isReviewVerdict(v: unknown): v is ReviewVerdict {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.isApproved === "boolean" &&
    typeof o.feedback === "string" &&
    Array.isArray(o.failedRequirements) &&
    o.failedRequirements.every((x) => typeof x === "string")
  );
}
