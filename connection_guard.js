// connection_guard.js - Safe Network Recovery

const ConnectionGuard = {
  isOnline: true,

  init() {
    window.addEventListener("online", () => {
      this.isOnline = true;
      window.dispatchEvent(new CustomEvent("connection_restored"));
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
    });
  }
};

ConnectionGuard.init();

