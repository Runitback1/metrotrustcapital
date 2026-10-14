import { getNextLoginImageIndex } from "./loginCarousel";

test("cycles through only the two images displayed on mobile", () => {
  expect(getNextLoginImageIndex(0, 2)).toBe(1);
  expect(getNextLoginImageIndex(1, 2)).toBe(0);
});

test("continues cycling through all four images displayed on desktop", () => {
  expect(getNextLoginImageIndex(3, 4)).toBe(0);
});
