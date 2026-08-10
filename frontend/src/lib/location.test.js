import { cityOf, countryOf, shortLocation } from "./location";

// The studio location is typed by hand in Site settings, so the parsing has
// to survive commas, middots, stray spaces and half-filled values.

describe("cityOf", () => {
  it("takes the first segment", () => {
    expect(cityOf("Pune, Maharashtra · India")).toBe("Pune");
    expect(cityOf("Sambhaji Nagar, Maharashtra · India")).toBe("Sambhaji Nagar");
  });

  it("tolerates a stray space before the comma", () => {
    expect(cityOf("Pune , Maharashtra · India")).toBe("Pune");
  });

  it("handles a single-segment location", () => {
    expect(cityOf("Pune")).toBe("Pune");
  });

  it("returns an empty string when unset", () => {
    expect(cityOf(undefined)).toBe("");
    expect(cityOf("")).toBe("");
    expect(cityOf("   ")).toBe("");
  });
});

describe("countryOf", () => {
  it("takes the last segment", () => {
    expect(countryOf("Pune, Maharashtra · India")).toBe("India");
  });

  it("is empty when there is only a city, rather than repeating it", () => {
    expect(countryOf("Pune")).toBe("");
  });
});

describe("shortLocation", () => {
  it("joins city and country", () => {
    expect(shortLocation("Pune, Maharashtra · India")).toBe("Pune · India");
  });

  it("never renders a bare separator when a part is missing", () => {
    expect(shortLocation("Pune")).toBe("Pune");
    expect(shortLocation("")).toBe("");
    expect(shortLocation(undefined)).toBe("");
  });
});
