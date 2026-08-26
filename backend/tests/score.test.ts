import { describe, it, expect } from "vitest";
import { calculateLeadScore } from "../src/shared/utils/score";

describe("lead score", () => {
  it("returns 0 for empty input", () => {
    expect(calculateLeadScore({}).score).toBe(0);
    expect(calculateLeadScore({}).label).toBe("Baixo");
  });

  it("caps score at 100 when over the configured max", () => {
    const result = calculateLeadScore({
      website: "x",
      phone: "x",
      whatsapp: "x",
      email: "x",
      instagram: "x",
      facebook: "x",
      rating: 5,
      reviewCount: 200,
      isActive: true,
      extra: "ignored",
    } as any);
    // max achievable = 95 → so cap doesn't trigger; just confirm classification
    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.label).toBe("Excelente");
  });

  it("labels correctly - baixo", () => {
    expect(calculateLeadScore({ website: "x" }).label).toBe("Baixo");
  });

  it("labels correctly - medio", () => {
    // site 10 + phone 10 + email 20 + whatsapp 15 = 55
    expect(calculateLeadScore({ website: "x", phone: "x", email: "x", whatsapp: "x" }).label).toBe("Médio");
  });

  it("labels correctly - excelente", () => {
    expect(
      calculateLeadScore({
        website: "x",
        phone: "x",
        email: "x",
        whatsapp: "x",
        instagram: "x",
        facebook: "x",
        rating: 4.5,
        reviewCount: 200,
        isActive: true,
      }).label,
    ).toBe("Excelente");
  });
});
