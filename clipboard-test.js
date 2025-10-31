const { app, clipboard } = require('electron');

app.whenReady().then(() => {
  const text = clipboard.readText();
  console.log("Clipboard content is:", text || "(empty)");
  app.quit();
});

