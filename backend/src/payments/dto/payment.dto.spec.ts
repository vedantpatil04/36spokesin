import { UPI_ID_PATTERN } from "./payment.dto.js";

describe("UPI_ID_PATTERN", () => {
  it.each(["36spokes@okhdfcbank", "rider.name-1@ybl", "9876543210@upi", "a_b@axl"])(
    "accepts %s",
    (value) => {
      expect(UPI_ID_PATTERN.test(value)).toBe(true);
    },
  );

  it.each(["", "no-at-sign", "@okaxis", "name@", "name@1bank", "two@at@signs", "has space@upi"])(
    "rejects %j",
    (value) => {
      expect(UPI_ID_PATTERN.test(value)).toBe(false);
    },
  );
});
