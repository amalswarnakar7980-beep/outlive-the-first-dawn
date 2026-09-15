// touch_controls.js - Autonomous Touch Joystick & Action Switchboard

(function () {
  "use strict";

  const TouchController = {
    joystickContainer: null,
    stick: null,
    activeTouchId: null,
    basePos: { x: 0, y: 0 },
    maxRadius: 45,

    init() {
      this.injectStyles();
      this.createJoystickUI();
      this.createActionPadUI();
      this.bindTouchEvents();
      console.log("🕹️ [TouchController] Virtual Joystick and Action Pad active.");
    },

    injectStyles() {
      if (document.getElementById("touchControlStyles")) return;
      const style = document.createElement("style");
      style.id = "touchControlStyles";
      style.textContent = `
        /* ভার্চুয়াল জয়স্টিক বেস */
        #virtualJoystickBase {
          position: fixed;
          bottom: 30px;
          left: 30px;
          width: 110px;
          height: 110px;
          background: rgba(15, 23, 42, 0.65);
          border: 2px solid #00ffaa;
          border-radius: 50%;
          z-index: 10000;
          touch-action: none;
          box-shadow: 0 0 15px rgba(0, 255, 170, 0.2);
          backdrop-filter: blur(4px);
        }

        /* জয়স্টিক থাম্ব-স্টিক */
        #virtualJoystickThumb {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 44px;
          height: 44px;
          margin-top: -22px;
          margin-left: -22px;
          background: #00ffaa;
          border-radius: 50%;
          box-shadow: 0 0 10px #00ffaa;
          pointer-events: none;
          transform: translate(0px, 0px);
        }

        /* ডানদিকের অ্যাকশন বাটন গ্রুপ */
        #mobileActionCluster {
          position: fixed;
          bottom: 25px;
          right: 20px;
          z-index: 10000;
          display: flex;
          flex-direction: column;
          gap: 10px;
          align-items: flex-end;
          touch-action: none;
        }

        .action-row {
          display: flex;
          gap: 10px;
        }

        .touch-action-btn {
          width: 55px;
          height: 55px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.2);
          color: #fff;
          font-weight: 900;
          font-size: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          user-select: none;
          box-shadow: 0 4px 15px rgba(0,0,0,0.6);
          touch-action: manipulation;
        }

        .touch-action-btn:active {
          transform: scale(0.9);
          border-color: #fff;
        }

        #btnTouchAttack {
          width: 65px;
          height: 65px;
          background: #d63031;
          border-color: #ff7675;
          font-size: 13px;
        }
      `;
      document.head.appendChild(style);
    },

    createJoystickUI() {
      if (document.getElementById("virtualJoystickBase")) return;

      const base = document.createElement("div");
      base.id = "virtualJoystickBase";

      const thumb = document.createElement("div");
      thumb.id = "virtualJoystickThumb";

      base.appendChild(thumb);
      document.body.appendChild(base);

      this.joystickContainer = base;
      this.stick = thumb;
    },

    createActionPadUI() {
      if (document.getElementById("mobileActionCluster")) return;

      const cluster = document.createElement("div");
      cluster.id = "mobileActionCluster";

      cluster.innerHTML = `
        <div class="action-row">
          <button class="touch-action-btn" id="btnTouch5D" style="background: #6c5ce7;">🌀 5D</button>
          <button class="touch-action-btn" id="btnTouchTime" style="background: #e17055;">⏳ T</button>
        </div>
        <div class="action-row">
          <button class="touch-action-btn" id="btnTouchCollect" style="background: #0984e3;">📦</button>
          <button class="touch-action-btn" id="btnTouchCraft" style="background: #00b894;">🔥</button>
          <button class="touch-action-btn" id="btnTouchAttack">⚔️</button>
        </div>
      `;

      document.body.appendChild(cluster);

      // বাটনগুলোর সাথে অ্যাকশন লিঙ্ক করা
      document.getElementById("btnTouchAttack").onclick = () => {
        const legacyBtn = document.getElementById("btnAttack");
        if (legacyBtn) legacyBtn.click();
      };

      document.getElementById("btnTouchCollect").onclick = () => {
        const legacyBtn = document.getElementById("btnCollect");
        if (legacyBtn) legacyBtn.click();
      };

      document.getElementById("btnTouchCraft").onclick = () => {
        const legacyBtn = document.getElementById("btnCamp");
        if (legacyBtn) legacyBtn.click();
      };

      document.getElementById("btnTouch5D").onclick = () => {
        const legacyBtn = document.getElementById("btnShift");
        if (legacyBtn) legacyBtn.click();
      };

      document.getElementById("btnTouchTime").onclick = () => {
        const legacyBtn = document.getElementById("btnTime");
        if (legacyBtn) legacyBtn.click();
      };
    },

    bindTouchEvents() {
      const updateInputs = (dx, dy) => {
        if (typeof window.inputState === "undefined") return;

        // ডেডজোন ফিল্টার
        const threshold = 10;
        window.inputState.w = dy < -threshold;
        window.inputState.s = dy > threshold;
        window.inputState.a = dx < -threshold;
        window.inputState.d = dx > threshold;
      };

      const resetStick = () => {
        this.stick.style.transform = `translate(0px, 0px)`;
        if (typeof window.inputState !== "undefined") {
          window.inputState.w = false;
          window.inputState.s = false;
          window.inputState.a = false;
          window.inputState.d = false;
        }
        this.activeTouchId = null;
      };

      // টাচ হ্যান্ডলার্স
      this.joystickContainer.addEventListener("touchstart", (e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        this.activeTouchId = touch.identifier;
        const rect = this.joystickContainer.getBoundingClientRect();
        this.basePos = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        };
      }, { passive: false });

      window.addEventListener("touchmove", (e) => {
        if (this.activeTouchId === null) return;

        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          if (touch.identifier === this.activeTouchId) {
            let dx = touch.clientX - this.basePos.x;
            let dy = touch.clientY - this.basePos.y;
            const dist = Math.hypot(dx, dy);

            if (dist > this.maxRadius) {
              dx = (dx / dist) * this.maxRadius;
              dy = (dy / dist) * this.maxRadius;
            }

            this.stick.style.transform = `translate(${dx}px, ${dy}px)`;
            updateInputs(dx, dy);
            break;
          }
        }
      }, { passive: false });

      window.addEventListener("touchend", (e) => {
        if (this.activeTouchId === null) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === this.activeTouchId) {
            resetStick();
            break;
          }
        }
      });

      window.addEventListener("touchcancel", () => resetStick());
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => TouchController.init());
  } else {
    TouchController.init();
  }
})();
