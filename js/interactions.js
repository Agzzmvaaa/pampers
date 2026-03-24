/**
 * Scroll reveals, mobile nav, reduced motion support
 */
(function () {
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) {
    document.documentElement.classList.add("reduce-motion");
  }

  /* Mobile nav */
  var burger = document.getElementById("nav-burger");
  var navPanel = document.getElementById("nav-panel");
  if (burger && navPanel) {
    function closeNav() {
      burger.setAttribute("aria-expanded", "false");
      navPanel.classList.remove("nav-panel--open");
      burger.classList.remove("is-open");
    }
    function toggleNav() {
      var open = navPanel.classList.toggle("nav-panel--open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.classList.toggle("is-open", open);
    }
    burger.addEventListener("click", toggleNav);
    navPanel.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeNav);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeNav();
    });
  }

  /* Scroll reveal */
  if (!reduceMotion) {
    var reveals = document.querySelectorAll("[data-reveal]");
    if (reveals.length && "IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (en) {
            if (!en.isIntersecting) return;
            var el = en.target;
            var delay = parseInt(el.getAttribute("data-reveal-delay"), 10) || 0;
            setTimeout(function () {
              el.classList.add("reveal--visible");
            }, delay);
            io.unobserve(el);
          });
        },
        { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
      );
      reveals.forEach(function (el) {
        io.observe(el);
      });
    } else {
      reveals.forEach(function (el) {
        el.classList.add("reveal--visible");
      });
    }
  } else {
    document.querySelectorAll("[data-reveal]").forEach(function (el) {
      el.classList.add("reveal--visible");
    });
  }

})();
