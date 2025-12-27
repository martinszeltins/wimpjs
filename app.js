const canvas = document.getElementById('screen')
const canvasCtx = canvas.getContext('2d')

const server = WIMPServer()
const client = WIMPClient(server)

canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    server.handleMouseMove(x, y)
})

canvas.addEventListener('mouseenter', (event) => {
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    server.handleMouseMove(x, y)
})

canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    server.handleMouseDown(x, y, typeof getDockItemAtPosition !== 'undefined' ? getDockItemAtPosition : null)
})

canvas.addEventListener('mouseup', () => {
    server.handleMouseUp()
})

const render = () => {
    server.composite()
    
    const framebuffer = server.getFramebuffer()
    const imageData = canvasCtx.createImageData(server.width, server.height)
    imageData.data.set(framebuffer)
    canvasCtx.putImageData(imageData, 0, 0)

    requestAnimationFrame(render)
}

render()
