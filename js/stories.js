/**
 * Stories: open/close fullscreen viewer with progress bar
 */
(function () {
  const overlay = document.getElementById("story-overlay");
  const imgEl = document.getElementById("story-img");
  const capEl = document.getElementById("story-caption");
  const barFill = document.querySelector(".story-viewer .bar-fill");
  const closeBtn = document.getElementById("story-close");

  function openStory(src, caption) {
    if (!overlay) return;
    imgEl.src = src;
    imgEl.alt = caption || "";
    capEl.textContent = caption || "";
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
    if (barFill) {
      barFill.style.animation = "none";
      void barFill.offsetWidth;
      barFill.style.animation = "storyProgress 5s linear forwards";
    }
  }

  function closeStory() {
    if (!overlay) return;
    overlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  document.querySelectorAll("[data-story]").forEach(function (el) {
    el.addEventListener("click", function () {
      openStory(el.dataset.img, el.dataset.caption);
    });
  });

  if (closeBtn) closeBtn.addEventListener("click", closeStory);
  if (overlay) {
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeStory();
    });
  }
})();
