const canvas = document.getElementById('screen')
const canvasCtx = canvas.getContext('2d')

let mouseX = 0
let mouseY = 0
let lastMouseX = 0
let lastMouseY = 0

const windows = []

canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect()
    mouseX = event.clientX - rect.left
    mouseY = event.clientY - rect.top
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

const createWindow = (x, y, width, height) => {
    const window = { x, y, width, height, pixels: null }
    windows.push(window)

    return window
}

const windowDraw = (window, pixels) => {
    window.pixels = pixels
}

const drawWindows = () => {
    for (const window of windows) {
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
