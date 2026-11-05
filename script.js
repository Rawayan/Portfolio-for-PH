document.getElementById("f").addEventListener("submit", function (e) {
  e.preventDefault();
  var d = new FormData(e.target);
  var b =
    "Name: " + d.get("n") + "\nEmail: " + d.get("e") + "\n\n" + d.get("p");
  location.href =
    "mailto:rawfir.ayan@gmail.com?subject=" +
    encodeURIComponent("Portfolio enquiry from " + d.get("n")) +
    "&body=" +
    encodeURIComponent(b);
});

(function () {
  var hero = document.querySelector(".hero");
  if (!hero) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var layer = document.createElement("div");
  layer.className = "hero-trail";
  layer.setAttribute("aria-hidden", "true");
  hero.prepend(layer);

  var count = 14;
  var dots = [];
  for (var i = 0; i < count; i++) {
    var el = document.createElement("span");
    el.className = "trail-dot";
    var scale = 1 - i / count;
    var size = 22 + 60 * scale;
    el.style.width = size + "px";
    el.style.height = size + "px";
    el.style.opacity = (0.3 * scale).toFixed(3);
    layer.appendChild(el);
    dots.push({ el: el, x: 0, y: 0 });
  }

  var mouse = { x: 0, y: 0 };
  var raf = null;

  function tick() {
    var x = mouse.x;
    var y = mouse.y;
    for (var i = 0; i < dots.length; i++) {
      var d = dots[i];
      d.x += (x - d.x) * 0.35;
      d.y += (y - d.y) * 0.35;
      d.el.style.transform =
        "translate(" + d.x + "px," + d.y + "px) translate(-50%,-50%)";
      x = d.x;
      y = d.y;
    }
    raf = requestAnimationFrame(tick);
  }

  function start() {
    if (raf) return;
    layer.classList.add("is-active");
    raf = requestAnimationFrame(tick);
  }

  function stop() {
    layer.classList.remove("is-active");
    if (raf) {
      cancelAnimationFrame(raf);
      raf = null;
    }
  }

  hero.addEventListener("pointermove", function (e) {
    var rect = hero.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    if (!raf) {
      dots.forEach(function (d) {
        d.x = mouse.x;
        d.y = mouse.y;
      });
    }
    start();
  });
  hero.addEventListener("pointerleave", stop);
})();
