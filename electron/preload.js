const { contextBridge } = require("electron");

// Expose safe APIs to renderer process if needed in the future
contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
});

window.addEventListener("DOMContentLoaded", () => {
  console.log("GeoTech preload ready — platform:", process.platform);
});
