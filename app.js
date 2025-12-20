const canvas = document.getElementById('screen')
const canvasCtx = canvas.getContext('2d')

let mouseX = 0
let mouseY = 0
let lastMouseX = 0
let lastMouseY = 0

const windows = []

let draggingWindow = null
let dragOffsetX = 0
let dragOffsetY = 0

canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect()
    mouseX = event.clientX - rect.left
    mouseY = event.clientY - rect.top
    
    if (draggingWindow) {
        draggingWindow.x = mouseX - dragOffsetX
        draggingWindow.y = mouseY - dragOffsetY
    }
})

canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const clickY = event.clientY - rect.top
    
    const dockItem = typeof getDockItemAtPosition !== 'undefined' ? getDockItemAtPosition(clickX, clickY) : null
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
        const inWindow = clickX >= window.x && clickX <= window.x + window.width &&
                        clickY >= window.y && clickY <= window.y + window.height
        
        if (inWindow) {
            const buttonSize = 12
            const buttonX = window.x + window.width - buttonSize - 5
            const buttonY = window.y + 5
            const inCloseButton = clickX >= buttonX && clickX <= buttonX + buttonSize &&
                                 clickY >= buttonY && clickY <= buttonY + buttonSize
            
            if (inCloseButton) {
                windows.splice(i, 1)
            } else {
                windows.splice(i, 1)
                windows.push(window)
                
                const inTitleBar = clickY <= window.y + 25
                if (inTitleBar) {
                    draggingWindow = window
                    dragOffsetX = clickX - window.x
                    dragOffsetY = clickY - window.y
                }
            }
            break
        }
    }
})

canvas.addEventListener('mouseup', () => {
    draggingWindow = null
})

const drawCursor = () => {
    canvasCtx.fillStyle = 'black'
    canvasCtx.lineWidth = 3
    canvasCtx.strokeStyle = 'white'
    
    canvasCtx.beginPath()
    canvasCtx.moveTo(mouseX, mouseY)
    canvasCtx.lineTo(mouseX, mouseY + 18)
    canvasCtx.lineTo(mouseX + 5, mouseY + 14)
    canvasCtx.lineTo(mouseX + 8, mouseY + 20)
    canvasCtx.lineTo(mouseX + 10, mouseY + 19)
    canvasCtx.lineTo(mouseX + 7, mouseY + 13)
    canvasCtx.lineTo(mouseX + 12, mouseY + 13)
    canvasCtx.closePath()
    canvasCtx.stroke()
    canvasCtx.fill()
}

const createWindow = (x, y, width, height, name = '', noShadow = false) => {
    const window = { x, y, width, height, pixels: null, name, noShadow }
    windows.push(window)

    return window
}

const windowDraw = (window, pixels) => {
    window.pixels = pixels
}

const drawWindows = () => {
    for (const window of windows) {
        if (!window.noShadow) {
            canvasCtx.fillStyle = 'black'
            canvasCtx.fillRect(window.x + 4, window.y + 4, window.width, window.height)
        }
        
        canvasCtx.fillStyle = 'white'
        canvasCtx.fillRect(window.x, window.y, window.width, window.height)
        canvasCtx.strokeStyle = 'black'
        canvasCtx.strokeRect(window.x, window.y, window.width, window.height)
        
        if (window.pixels) {
            const imageData = canvasCtx.createImageData(window.width, window.height)
            imageData.data.set(window.pixels)
            canvasCtx.putImageData(imageData, window.x, window.y)
        }
    }
}

const render = () => {
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height)
    drawWindows()
    drawCursor()

    lastMouseX = mouseX
    lastMouseY = mouseY

    requestAnimationFrame(render)
}

render()
