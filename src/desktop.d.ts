interface Window { padDesktop?: { isDesktop:boolean; status:()=>Promise<{ok:boolean;port:number}>; toggleOverlay:(payload:unknown)=>Promise<boolean> } }
