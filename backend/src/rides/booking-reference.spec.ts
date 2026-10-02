import { bookingReference } from "./booking-reference.js";

describe("bookingReference", () => {
  it("pads the booking number to six digits", () => {
    expect(bookingReference(3)).toBe("36S-000003");
    expect(bookingReference(42_017)).toBe("36S-042017");
  });

  it("keeps numbers longer than six digits whole", () => {
    expect(bookingReference(1_234_567)).toBe("36S-1234567");
  });
});
