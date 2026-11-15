(function () {
  "use strict";

  // ---- Lanyard config ------------------------------------------------------
  // Card image (relative, matching the rest of the site's image paths).
  var IMAGE_SRC = "images/create-card.webp";
  // Lanyard strap colour.
  var STRAP_COLOR = "#d62828";
  // Card size in CSS pixels (portrait).
  var CARD_W = 210;
  var CARD_H = 357;
  // Shake strength on fast hover movement. Raise for more shake, lower for less.
  var SHAKE = 0.1;
  // Strap length in CSS pixels. 0 fills the space above the card automatically.
  var STRAP_LENGTH = 0;
  // Wide-screen horizontal anchor (0-1). Narrow screens stay centred.
  var ANCHOR_X = 0.75;
  // Card mass relative to a rope point. Higher feels heavier; lower swings freely.
  var CARD_MASS = 2.2;
  // Physics: heavy card, quick settle.
  var GRAVITY = 0.8;
  var DAMPING = 0.985;
  var ITERATIONS = 10;
  var SEGMENTS = 5;
  // -------------------------------------------------------------------------

  var root = document.getElementById("lanyard");
  if (!root) return;

  var canvas = root.querySelector(".lanyard__canvas");
  if (!canvas) return;

  var host = root.parentElement || root;

  var motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (motionQuery.matches) return;

  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  var image = new Image();
  var imageReady = false;
  image.onload = function () {
    imageReady = true;
    if (!running) draw();
  };
  image.onerror = function () {
    imageReady = false;
  };
  image.src = IMAGE_SRC;

  var width = 0;
  var height = 0;
  var cardW = CARD_W;
  var cardH = CARD_H;
  var anchor = { x: 0, y: 0 };
  var points = [];
  var segmentLength = 40;
  var angle = 0;
  var angleVel = 0;
  var lastPointer = { x: 0, y: 0, time: 0 };
  var running = false;
  var rafId = 0;
  var onScreen = true;

  function layout() {
    var rect = root.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingQuality = "high";

    var scale = Math.min(1, (width - 24) / CARD_W);
    cardW = CARD_W * scale;
    cardH = CARD_H * scale;

    anchor.x = width * (width >= 700 ? ANCHOR_X : 0.5);
    anchor.y = 0;

    var available = Math.max(height - cardH - 18, 40);
    if (STRAP_LENGTH > 0) available = Math.min(STRAP_LENGTH, available);
    segmentLength = available / SEGMENTS;
    reset();
  }

  function reset() {
    points = [
      { x: anchor.x, y: anchor.y, px: anchor.x, py: anchor.y, inv: 0 }
    ];

    for (var i = 1; i <= SEGMENTS; i++) {
      var y = anchor.y + segmentLength * i;
      points.push({
        x: anchor.x,
        y: y,
        px: anchor.x,
        py: y,
        inv: i === SEGMENTS ? 1 / CARD_MASS : 1
      });
    }

    angle = 0;
    angleVel = 0;
    draw();
  }

  function solve(a, b, rest) {
    var dx = b.x - a.x;
    var dy = b.y - a.y;
    var dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
    var diff = (dist - rest) / dist;
    var total = a.inv + b.inv;
    if (!total) return;

    var wa = a.inv / total;
    var wb = b.inv / total;

    a.x += dx * diff * wa;
    a.y += dy * diff * wa;
    b.x -= dx * diff * wb;
    b.y -= dy * diff * wb;
  }

  function step() {
    var i;
    var p;

    for (i = 1; i < points.length; i++) {
      p = points[i];

      var vx = (p.x - p.px) * DAMPING;
      var vy = (p.y - p.py) * DAMPING;
      p.px = p.x;
      p.py = p.y;
      p.x += vx;
      p.y += vy + GRAVITY;
    }

    for (var k = 0; k < ITERATIONS; k++) {
      for (i = 1; i < points.length; i++) {
        solve(points[i - 1], points[i], segmentLength);
      }
    }

    var tip = points[SEGMENTS];
    var above = points[SEGMENTS - 1];
    var target = Math.atan2(-(tip.x - above.x), tip.y - above.y);
    var diff = target - angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;

    angleVel += diff * 0.16;
    angleVel *= 0.9;
    angle += angleVel;
  }

  function roundRect(x, y, w, h, r) {
    var radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function drawStrap() {
    ctx.save();
    roundRect(anchor.x - 24, 1, 48, 8, 4);
    ctx.fillStyle = "rgba(20, 20, 20, 0.9)";
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (var i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = "#a51f1f";
    ctx.lineWidth = 18;
    ctx.stroke();
    ctx.strokeStyle = STRAP_COLOR;
    ctx.lineWidth = 13;
    ctx.stroke();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  function drawClip() {
    var metal = ctx.createLinearGradient(-12, 0, 12, 0);
    metal.addColorStop(0, "#8d9199");
    metal.addColorStop(0.45, "#eef0f3");
    metal.addColorStop(1, "#9aa0a8");

    ctx.fillStyle = metal;
    roundRect(-11, -26, 22, 34, 6);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "rgba(35, 38, 42, 0.55)";
    roundRect(-5, -17, 10, 7, 3);
    ctx.fill();
  }

  function drawCard() {
    ctx.shadowColor = "rgba(0, 0, 0, 0.28)";
    ctx.shadowBlur = 26;
    ctx.shadowOffsetY = 14;
    ctx.fillStyle = "#ffffff";
    roundRect(-cardW / 2, 0, cardW, cardH, 18);
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    var inset = 5;
    var innerW = cardW - inset * 2;
    var innerH = cardH - inset * 2;

    ctx.save();
    roundRect(-cardW / 2 + inset, inset, innerW, innerH, 14);
    ctx.clip();

    if (imageReady) {
      var iw = image.naturalWidth || image.width;
      var ih = image.naturalHeight || image.height;
      var scale = Math.max(innerW / iw, innerH / ih);
      var dw = iw * scale;
      var dh = ih * scale;
      ctx.drawImage(
        image,
        -cardW / 2 + inset + (innerW - dw) / 2,
        inset + (innerH - dh) / 2,
        dw,
        dh
      );
    } else {
      ctx.fillStyle = "#171716";
      ctx.fillRect(-cardW / 2 + inset, inset, innerW, innerH);
    }
    ctx.restore();

    ctx.fillStyle = "rgba(8, 8, 8, 0.6)";
    roundRect(-14, 9, 28, 6, 3);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    roundRect(-14, 9, 28, 2, 1);
    ctx.fill();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    if (!points.length) return;

    drawStrap();

    var tip = points[SEGMENTS];
    ctx.save();
    ctx.translate(tip.x, tip.y);
    ctx.rotate(angle);
    drawClip();
    drawCard();
    ctx.restore();
  }

  function hitTest(x, y) {
    if (!points.length) return false;
    var tip = points[SEGMENTS];
    var dx = x - tip.x;
    var dy = y - tip.y;
    var c = Math.cos(-angle);
    var s = Math.sin(-angle);
    var localX = dx * c - dy * s;
    var localY = dx * s + dy * c;
    return Math.abs(localX) <= cardW / 2 && localY >= 0 && localY <= cardH;
  }

  function pointerPos(e) {
    var rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onPointerMove(e) {
    var pos = pointerPos(e);
    var now = performance.now();

    if (!lastPointer.time) {
      lastPointer.x = pos.x;
      lastPointer.y = pos.y;
      lastPointer.time = now;
    }

    var dt = Math.max(now - lastPointer.time, 8);
    var mdx = pos.x - lastPointer.x;
    var mdy = pos.y - lastPointer.y;
    lastPointer.x = pos.x;
    lastPointer.y = pos.y;
    lastPointer.time = now;

    if (!hitTest(pos.x, pos.y)) return;

    var speed = Math.sqrt(mdx * mdx + mdy * mdy) / dt;
    if (speed < 1.1) return;

    var tip = points[SEGMENTS];
    var nudge = Math.max(-30, Math.min(30, mdx)) * SHAKE;

    tip.x += nudge * 0.6;
    tip.y += Math.max(-12, Math.min(12, mdy)) * SHAKE * 0.2;
    angleVel += nudge * 0.012;
  }

  function start() {
    if (running) return;
    running = true;
    rafId = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  }

  function frame() {
    if (!running) return;
    step();
    draw();
    rafId = requestAnimationFrame(frame);
  }

  root.classList.add("is-live");
  layout();

  host.addEventListener("pointerenter", function () {
    lastPointer.time = 0;
  });
  host.addEventListener("pointermove", onPointerMove);
  host.addEventListener("pointerleave", function () {
    lastPointer.time = 0;
  });

  if ("ResizeObserver" in window) {
    var resizeObserver = new ResizeObserver(function () {
      layout();
      if (!running) draw();
    });
    resizeObserver.observe(root);
  } else {
    window.addEventListener("resize", function () {
      layout();
      if (!running) draw();
    });
  }

  if ("IntersectionObserver" in window) {
    var intersectionObserver = new IntersectionObserver(
      function (entries) {
        onScreen = entries[0].isIntersecting;
        if (onScreen && !document.hidden) start();
        else stop();
      },
      { threshold: 0.01 }
    );
    intersectionObserver.observe(root);
  } else {
    start();
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop();
    else if (onScreen) start();
  });
})();
