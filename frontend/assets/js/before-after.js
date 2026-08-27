// Drag-to-compare before/after slider. Driven by a native range input
// layered over the media (gives touch, mouse, and keyboard support for free).
(function () {
  "use strict";

  function wireSlider(slider) {
    const range = slider.querySelector(".ba-range");
    if (!range) return;

    function setPos(value) {
      slider.style.setProperty("--pos", value + "%");
    }

    setPos(range.value);
    range.addEventListener("input", () => setPos(range.value));
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".ba-slider").forEach(wireSlider);
  });
})();
