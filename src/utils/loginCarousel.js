export const getNextLoginImageIndex = (currentIndex, imageCount) =>
  (currentIndex + 1) % imageCount;
