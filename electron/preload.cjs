const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("padDesktop",{
  isDesktop:true,
  status:()=>ipcRenderer.invoke("companion:status"),
  toggleOverlay:payload=>ipcRenderer.invoke("overlay:toggle",payload)
});
