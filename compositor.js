const Compositor = () => {
    const width = 1280
    const height = 720
    const framebuffer = new Uint8ClampedArray(width * height * 4)
    const windows = []
    
    let mouseX = 0
    let mouseY = 0
    let draggingWindow = null
    let dragOffsetX = 0
    let dragOffsetY = 0
    
    const clearFramebuffer = () => {
        for (let i = 0; i < framebuffer.length; i += 4) {
            framebuffer[i] = 255
            framebuffer[i + 1] = 255
            framebuffer[i + 2] = 255
            framebuffer[i + 3] = 255
        }
    }
    
    const drawPixels = (x, y, w, h, pixels) => {
        for (let py = 0; py < h; py++) {
            for (let px = 0; px < w; px++) {
                const fbX = x + px
                const fbY = y + py
                
                if (fbX >= 0 && fbX < width && fbY >= 0 && fbY < height) {
                    const srcIndex = (py * w + px) * 4
                    const dstIndex = (fbY * width + fbX) * 4
                    
                    framebuffer[dstIndex] = pixels[srcIndex]
                    framebuffer[dstIndex + 1] = pixels[srcIndex + 1]
                    framebuffer[dstIndex + 2] = pixels[srcIndex + 2]
                    framebuffer[dstIndex + 3] = pixels[srcIndex + 3]
                }
            }
        }
    }
    
    const drawShadow = (x, y, w, h) => {
        for (let py = 0; py < h; py++) {
            for (let px = 0; px < w; px++) {
                const fbX = x + px + 4
                const fbY = y + py + 4
                
                if (fbX >= 0 && fbX < width && fbY >= 0 && fbY < height) {
                    const dstIndex = (fbY * width + fbX) * 4
                    framebuffer[dstIndex] = 0
                    framebuffer[dstIndex + 1] = 0
                    framebuffer[dstIndex + 2] = 0
                    framebuffer[dstIndex + 3] = 255
                }
            }
        }
    }
    
    const drawCursor = () => {
        const cursorShape = [
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
            [1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
            [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
            [1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
            [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
            [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
            [1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0],
            [1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0],
            [1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0]
        ]
        
        for (let y = 0; y < cursorShape.length; y++) {
            for (let x = 0; x < cursorShape[y].length; x++) {
                if (cursorShape[y][x]) {
                    const fbX = mouseX + x
                    const fbY = mouseY + y
                    
                    if (fbX >= 1 && fbX < width - 1 && fbY >= 1 && fbY < height - 1) {
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                if (dx === 0 && dy === 0) continue
                                const outlineIndex = ((fbY + dy) * width + (fbX + dx)) * 4
                                framebuffer[outlineIndex] = 255
                                framebuffer[outlineIndex + 1] = 255
                                framebuffer[outlineIndex + 2] = 255
                                framebuffer[outlineIndex + 3] = 255
                            }
                        }
                    }
                }
            }
        }
        
        for (let y = 0; y < cursorShape.length; y++) {
            for (let x = 0; x < cursorShape[y].length; x++) {
                if (cursorShape[y][x]) {
                    const fbX = mouseX + x
                    const fbY = mouseY + y
                    
                    if (fbX >= 0 && fbX < width && fbY >= 0 && fbY < height) {
                        const dstIndex = (fbY * width + fbX) * 4
                        framebuffer[dstIndex] = 0
                        framebuffer[dstIndex + 1] = 0
                        framebuffer[dstIndex + 2] = 0
                        framebuffer[dstIndex + 3] = 255
                    }
                }
            }
        }
    }
    
    const createWindow = (x, y, w, h, name = '', noShadow = false) => {
        const window = {
            id: Math.random().toString(36).substr(2, 9),
            x,
            y,
            width: w,
            height: h,
            pixels: null,
            name,
            noShadow
        }
        windows.push(window)
        
        return {
            id: window.id,
            updatePixels: (pixels) => {
                window.pixels = pixels
            },
            close: () => {
                const index = windows.findIndex(w => w.id === window.id)
                if (index !== -1) {
                    windows.splice(index, 1)
                }
            }
        }
    }
    
    const handleMouseMove = (x, y) => {
        mouseX = Math.floor(x)
        mouseY = Math.floor(y)
        
        if (draggingWindow) {
            draggingWindow.x = mouseX - dragOffsetX
            draggingWindow.y = mouseY - dragOffsetY
        }
    }
    
    const handleMouseDown = (x, y, getDockItemAtPosition) => {
        x = Math.floor(x)
        y = Math.floor(y)
        
        const dockItem = getDockItemAtPosition ? getDockItemAtPosition(x, y) : null
        if (dockItem) {
            const index = windows.indexOf(dockItem)
            if (index !== -1) {
                windows.splice(index, 1)
                windows.push(dockItem)
            }
            return
        }
        
        for (let i = windows.length - 1; i >= 0; i--) {
            const window = windows[i]
            const inWindow = x >= window.x && x <= window.x + window.width &&
                            y >= window.y && y <= window.y + window.height
            
            if (inWindow) {
                const buttonSize = 12
                const buttonX = window.x + window.width - buttonSize - 5
                const buttonY = window.y + 5
                const inCloseButton = x >= buttonX && x <= buttonX + buttonSize &&
                                     y >= buttonY && y <= buttonY + buttonSize
                
                if (inCloseButton) {
                    windows.splice(i, 1)
                } else {
                    windows.splice(i, 1)
                    windows.push(window)
                    
                    const inTitleBar = y <= window.y + 25
                    if (inTitleBar) {
                        draggingWindow = window
                        dragOffsetX = x - window.x
                        dragOffsetY = y - window.y
                    }
                }
                break
            }
        }
    }
    
    const handleMouseUp = () => {
        draggingWindow = null
    }
    
    const composite = () => {
        clearFramebuffer()
        
        for (const window of windows) {
            if (!window.noShadow) {
                drawShadow(window.x, window.y, window.width, window.height)
            }
            if (window.pixels) {
                drawPixels(window.x, window.y, window.width, window.height, window.pixels)
            }
        }
        
        drawCursor()
    }
    
    return {
        createWindow,
        handleMouseMove,
        handleMouseDown,
        handleMouseUp,
        composite,
        getFramebuffer: () => framebuffer,
        getWindows: () => windows,
        getMousePosition: () => ({ x: mouseX, y: mouseY }),
        width,
        height
    }
}
