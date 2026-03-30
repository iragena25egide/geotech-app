import { app, BrowserWindow,Menu } from "electron";
import path from "path";
import { fileURLToPath } from "url";

let mainWindow;


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


app.disableHardwareAcceleration();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, "../public/icon.jpeg"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(
  Menu.setApplicationMenu(null),
  createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});