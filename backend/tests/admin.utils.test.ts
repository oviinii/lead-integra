import { describe, expect, it } from "vitest";
import {
  maskProviderKey,
  parsePagination,
  slugifyWorkspace,
  generateTempPassword,
  bucketizeDaily,
} from "@/modules/admin/admin.utils";

describe("maskProviderKey", () => {
  it("masks keeping prefix and last 4 chars", () => {
    expect(maskProviderKey("sk-live-1234abcd")).toBe("sk-****-****-****-abcd");
  });

  it("handles keys without dashes", () => {
    expect(maskProviderKey("abcdefgh")).toBe("****-****-****-efgh");
  });

  it("handles null/undefined/empty", () => {
    expect(maskProviderKey(null)).toBe("—");
    expect(maskProviderKey(undefined)).toBe("—");
    expect(maskProviderKey("")).toBe("—");
  });
});

describe("parsePagination", () => {
  it("parses valid page/pageSize", () => {
    expect(parsePagination({ page: "2", pageSize: "10" })).toEqual({
      page: 2,
      pageSize: 10,
      skip: 10,
      take: 10,
    });
  });

  it("defaults on missing/invalid values", () => {
    expect(parsePagination({})).toEqual({ page: 1, pageSize: 20, skip: 0, take: 20 });
    expect(parsePagination({ page: "-3", pageSize: "abc" })).toEqual({
      page: 1,
      pageSize: 20,
      skip: 0,
      take: 20,
    });
  });

  it("caps pageSize at 100", () => {
    expect(parsePagination({ pageSize: "500" }).pageSize).toBe(100);
  });
});

describe("slugifyWorkspace", () => {
  it("slugifies accents, spaces and appends random suffix", () => {
    const slug = slugifyWorkspace("Agência São Paulo!");
    expect(slug).toMatch(/^agencia-sao-paulo-[0-9a-f]{4}$/);
  });

  it("generates unique slugs for the same name", () => {
    const a = slugifyWorkspace("Teste");
    const b = slugifyWorkspace("Teste");
    expect(a).not.toBe(b);
  });
});

describe("generateTempPassword", () => {
  it("generates a 12-char alphanumeric password", () => {
    const pwd = generateTempPassword();
    expect(pwd).toMatch(/^[a-zA-Z0-9]{12}$/);
  });

  it("generates different passwords", () => {
    expect(generateTempPassword()).not.toBe(generateTempPassword());
  });
});

describe("bucketizeDaily", () => {
  it("buckets timestamps into a zero-filled series", () => {
    const now = new Date("2026-09-15T12:00:00Z");
    const dates = [
      new Date("2026-09-15T08:00:00Z"),
      new Date("2026-09-15T09:00:00Z"),
      new Date("2026-09-13T10:00:00Z"),
    ];
    const series = bucketizeDaily(dates, 3, now);
    expect(series).toEqual([
      { date: "2026-09-13", count: 1 },
      { date: "2026-09-14", count: 0 },
      { date: "2026-09-15", count: 2 },
    ]);
  });

  it("returns all zeros when empty", () => {
    const now = new Date("2026-09-15T12:00:00Z");
    const series = bucketizeDaily([], 2, now);
    expect(series).toEqual([
      { date: "2026-09-14", count: 0 },
      { date: "2026-09-15", count: 0 },
    ]);
  });
});
