const Compositor = () => {
    const width = 1280
    const height = 720
    const framebuffer = new Uint8ClampedArray(width * height * 3)
    const windows = []
    
    let mouseX = 0
    let mouseY = 0
    let draggingWindow = null
    let dragOffsetX = 0
    let dragOffsetY = 0
    
    const clearFramebuffer = () => {
        for (let i = 0; i < framebuffer.length; i += 3) {
            framebuffer[i] = 255
            framebuffer[i + 1] = 255
            framebuffer[i + 2] = 255
        }
    }
    
    const drawPixels = (x, y, w, h, pixels, transform) => {
        if (!transform || !transform.visible) {
            if (!transform) {
                for (let py = 0; py < h; py++) {
                    for (let px = 0; px < w; px++) {
                        const fbX = x + px
                        const fbY = y + py
                        
                        if (fbX >= 0 && fbX < width && fbY >= 0 && fbY < height) {
                            const srcIndex = (py * w + px) * 4
                            const dstIndex = (fbY * width + fbX) * 3
                            
                            framebuffer[dstIndex] = pixels[srcIndex]
                            framebuffer[dstIndex + 1] = pixels[srcIndex + 1]
                            framebuffer[dstIndex + 2] = pixels[srcIndex + 2]
                        }
                    }
                }
            }
        } else {
            const centerX = x + w / 2
            const centerY = y + h / 2
            const cos = Math.cos(transform.rotation)
            const sin = Math.sin(transform.rotation)
            const scale = transform.scale || (1 - Math.abs(transform.rotation) * 0.3)
            const opacity = transform.opacity !== undefined ? transform.opacity : 1
            
            for (let py = 0; py < h; py++) {
                for (let px = 0; px < w; px++) {
                    const dx = px - w / 2
                    const dy = py - h / 2
                    
                    const rotX = dx * cos - dy * sin
                    const rotY = dx * sin + dy * cos
                    
                    const fbX = Math.floor(centerX + rotX * scale + transform.wobbleX)
                    const fbY = Math.floor(centerY + rotY * scale + transform.wobbleY)
                    
                    if (fbX >= 0 && fbX < width && fbY >= 0 && fbY < height) {
                        const srcIndex = (py * w + px) * 4
                        const dstIndex = (fbY * width + fbX) * 3
                        
                        framebuffer[dstIndex] = pixels[srcIndex] * opacity
                        framebuffer[dstIndex + 1] = pixels[srcIndex + 1] * opacity
                        framebuffer[dstIndex + 2] = pixels[srcIndex + 2] * opacity
                    }
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
                    const dstIndex = (fbY * width + fbX) * 3
                    framebuffer[dstIndex] = 0
                    framebuffer[dstIndex + 1] = 0
                    framebuffer[dstIndex + 2] = 0
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
                                const outlineIndex = ((fbY + dy) * width + (fbX + dx)) * 3
                                framebuffer[outlineIndex] = 255
                                framebuffer[outlineIndex + 1] = 255
                                framebuffer[outlineIndex + 2] = 255
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
                        const dstIndex = (fbY * width + fbX) * 3
                        framebuffer[dstIndex] = 0
                        framebuffer[dstIndex + 1] = 0
                        framebuffer[dstIndex + 2] = 0
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
            noShadow,
            onFocus: null
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
            },
            setOnFocus: (callback) => {
                window.onFocus = callback
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
    
    const handleMouseDown = (x, y, getDockItemAtPosition, transforms) => {
        x = Math.floor(x)
        y = Math.floor(y)
        
        const dockItem = getDockItemAtPosition ? getDockItemAtPosition(x, y) : null
        if (dockItem) {
            const index = windows.indexOf(dockItem)
            if (index !== -1) {
                windows.splice(index, 1)
                windows.push(dockItem)
                if (dockItem.onFocus) dockItem.onFocus()
            }
            return
        }
        
        for (let i = windows.length - 1; i >= 0; i--) {
            const window = windows[i]
            const transform = transforms ? transforms.get(window.id) : null
            
            let hitX = x
            let hitY = y
            
            if (transform) {
                const centerX = window.x + window.width / 2
                const centerY = window.y + window.height / 2
                
                hitX = x - transform.wobbleX
                hitY = y - transform.wobbleY
                
                const dx = hitX - centerX
                const dy = hitY - centerY
                
                const cos = Math.cos(-transform.rotation)
                const sin = Math.sin(-transform.rotation)
                const scale = 1 - Math.abs(transform.rotation) * 0.3
                
                const rotX = (dx * cos - dy * sin) / scale
                const rotY = (dx * sin + dy * cos) / scale
                
                hitX = centerX + rotX
                hitY = centerY + rotY
            }
            
            const inWindow = hitX >= window.x && hitX <= window.x + window.width &&
                            hitY >= window.y && hitY <= window.y + window.height
            
            if (inWindow) {
                const buttonSize = 12
                const buttonX = window.x + window.width - buttonSize - 5
                const buttonY = window.y + 5
                const inCloseButton = hitX >= buttonX && hitX <= buttonX + buttonSize &&
                                     hitY >= buttonY && hitY <= buttonY + buttonSize
                
                if (inCloseButton) {
                    windows.splice(i, 1)
                } else {
                    windows.splice(i, 1)
                    windows.push(window)
                    if (window.onFocus) window.onFocus()
                    
                    const inTitleBar = hitY <= window.y + 25
                    if (inTitleBar) {
                        draggingWindow = window
                        dragOffsetX = hitX - window.x
                        dragOffsetY = hitY - window.y
                    }
                }
                break
            }
        }
    }
    
    const handleMouseUp = () => {
        draggingWindow = null
    }
    
    const composite = (transforms) => {
        clearFramebuffer()
        
        for (const window of windows) {
            const transform = transforms ? transforms.get(window.id) : null
            if (!window.noShadow && !transform) {
                drawShadow(window.x, window.y, window.width, window.height)
            }
            if (window.pixels) {
                drawPixels(window.x, window.y, window.width, window.height, window.pixels, transform)
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
        getDraggingWindow: () => draggingWindow,
        getWindowById: (id) => {
            const win = windows.find(w => w.id === id)
            if (!win) return null
            return {
                id: win.id,
                updatePixels: (pixels) => {
                    win.pixels = pixels
                },
                close: () => {
                    const index = windows.indexOf(win)
                    if (index !== -1) {
                        windows.splice(index, 1)
                    }
                },
                setOnFocus: (callback) => {
                    win.onFocus = callback
                }
            }
        },
        width,
        height
    }
}
