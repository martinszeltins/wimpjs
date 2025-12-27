const WIMPClient = (server) => {
    const createWindow = (x, y, width, height, name = '', noShadow = false) => {
        const windowId = server.createWindow(x, y, width, height, name, noShadow)
        
        const createPixelBuffer = () => {
            return new Uint8ClampedArray(width * height * 4)
        }
        
        const draw = (pixels) => {
            server.updateWindowPixels(windowId, pixels)
        }
        
        const close = () => {
            server.closeWindow(windowId)
        }
        
        return {
            id: windowId,
            x,
            y,
            width,
            height,
            name,
            createPixelBuffer,
            draw,
            close
        }
    }
    
    return {
        createWindow
    }
}
