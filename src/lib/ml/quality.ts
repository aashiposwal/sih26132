export interface QualityInput {
  sizeUniformity: number; // 0-1
  moisture: number; // 0 dry … 1 wet
  sprouting: boolean;
  discoloration: number; // 0-1
}

export interface QualityResult {
  grade: "A" | "B" | "C";
  confidence: number;
  attributes: {
    sizeUniformity: string;
    sproutingDetected: boolean;
    moistureEstimate: string;
  };
  method: "heuristic_v1";
  notes: string;
}

export function gradeQuality(input: QualityInput): QualityResult {
  let score = 0.35 * input.sizeUniformity + 0.35 * (1 - input.moisture) + 0.3 * (1 - input.discoloration);
  if (input.sprouting) score -= 0.25;
  score = Math.max(0, Math.min(1, score));
  const grade: "A" | "B" | "C" = score >= 0.72 ? "A" : score >= 0.45 ? "B" : "C";
  const moistureEstimate = input.moisture < 0.33 ? "low" : input.moisture < 0.66 ? "medium" : "high";
  const size = input.sizeUniformity > 0.7 ? "high" : input.sizeUniformity > 0.4 ? "medium" : "low";
  return {
    grade,
    confidence: Math.round((0.55 + score * 0.4) * 100) / 100,
    attributes: {
      sizeUniformity: size,
      sproutingDetected: input.sprouting,
      moistureEstimate,
    },
    method: "heuristic_v1",
    notes:
      "Placeholder for the CV grader. Same response shape as a trained image model so listings and offers stay stable.",
  };
}
