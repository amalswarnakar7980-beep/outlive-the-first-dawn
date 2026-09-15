// control_engine.js - Direct Kinematic Controller & Fallback Render Loop

(function () {
  "use strict";

  const Controller = {
    clock: new THREE.Clock(),
    joyState: { x: 0, y: 0, active: false },
    walkTime: 0,
    speed: 10.0,

    init() {
      this.ensureVisibility();
      this.bindTouchJoystick();
      this.bindFallbackButtons();
      this.startLoop();
    },

    ensureVisibility() {
      if (window.humanoidPlayer && window.masterCamera) {
        // প্লেয়ারকে ক্যামেরার ঠিক চোখের সামনে জিরো পজিশনে সেট করা
        window.humanoidPlayer.position.set(0, 0, 0);
        window.masterCamera.position.set(0, 5, 10);
        window.masterCamera.lookAt(0, 1.2, 0);
      }
    },

    bindTouchJoystick() {
      const base = document.getElementById("joystickBase");
      const thumb = document.getElementById("joystickThumb");
      if (!base || !thumb) return;

      let touchId = null;
      let center = { x: 0, y: 0 };
      const maxRadius = 38;

      base.addEventListener("touchstart", (e) => {
        e.preventDefault();
        const t = e.changedTouches[0];
        touchId = t.identifier;
        const rect = base.getBoundingClientRect();
        center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      }, { passive: false });

      window.addEventListener("touchmove", (e) => {
        if (touchId === null) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (t.identifier === touchId) {
            let dx = t.clientX - center.x;
            let dy = t.clientY - center.y;
            const dist = Math.hypot(dx, dy);

            if (dist > maxRadius) {
              dx = (dx / dist) * maxRadius;
              dy = (dy / dist) * maxRadius;
            }

            thumb.style.transform = `translate(${dx}px, ${dy}px)`;
            this.joyState.x = dx / maxRadius;
            this.joyState.y = dy / maxRadius;
            this.joyState.active = Math.abs(dx) > 4 || Math.abs(dy) > 4;
            break;
          }
        }
      }, { passive: false });

      const resetJoy = () => {
        touchId = null;
        thumb.style.transform = `translate(0px, 0px)`;
        this.joyState.x = 0;
        this.joyState.y = 0;
        this.joyState.active = false;
      };

      window.addEventListener("touchend", resetJoy);
      window.addEventListener("touchcancel", resetJoy);
    },

    bindFallbackButtons() {
      const btnAtk = document.getElementById("btnAttack");
      if (btnAtk) {
        btnAtk.onclick = () => {
          if (window.humanoidLimbs) {
            window.humanoidLimbs.rightArm.rotation.x = -Math.PI / 2;
            setTimeout(() => {
              if (window.humanoidLimbs) window.humanoidLimbs.rightArm.rotation.x = 0;
            }, 180);
          }
          if (window.AudioEngine && window.AudioEngine.playHitSound) {
            window.AudioEngine.playHitSound(true);
          }
        };
      }
    },

    startLoop() {
      const animate = () => {
        requestAnimationFrame(animate);

        const delta = Math.min(this.clock.getDelta(), 0.1);
        const player = window.humanoidPlayer;
        const limbs = window.humanoidLimbs;
        const cam = window.masterCamera;
        const renderer = window.masterRenderer;
        const scene = window.masterScene;

        // ১. সরাসরি মুভমেন্ট ও লিম্ব সুইং
        if (player && limbs) {
          if (this.joyState.active) {
            const moveX = this.joyState.x;
            const moveZ = this.joyState.y;

            player.position.x += moveX * this.speed * delta;
            player.position.z += moveZ * this.speed * delta;

            player.rotation.y = Math.atan2(moveX, moveZ);

            this.walkTime += delta * 12;
            const swing = Math.sin(this.walkTime) * 0.7;

            limbs.leftLeg.rotation.x = swing;
            limbs.rightLeg.rotation.x = -swing;
            limbs.leftArm.rotation.x = -swing;
            limbs.rightArm.rotation.x = swing;
            limbs.torso.position.y = 1.4 + Math.abs(Math.sin(this.walkTime * 2)) * 0.08;
          } else {
            limbs.leftLeg.rotation.x = 0;
            limbs.rightLeg.rotation.x = 0;
            limbs.leftArm.rotation.x = 0;
            limbs.rightArm.rotation.x = 0;
            limbs.torso.position.y = 1.4;
          }

          // ২. ক্যামেরা ট্র্যাকিং
          if (cam) {
            cam.position.x = player.position.x;
            cam.position.z = player.position.z + 10;
            cam.position.y = player.position.y + 5;
            cam.lookAt(player.position.x, player.position.y + 1.2, player.position.z);
          }
        }

        // ৩. এক্সটার্নাল ইফেক্ট সিঙ্ক
        if (typeof window.updateWorld5D === "function") window.updateWorld5D(delta);

        // ৪. রেন্ডার কল
        if (renderer && scene && cam) {
          renderer.render(scene, cam);
        }
      };

      animate();
    }
  };

  window.addEventListener("DOMContentLoaded", () => Controller.init());
})();
