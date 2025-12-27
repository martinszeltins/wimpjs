const compositor = Compositor()

const loadClients = () => {
    const clients = [
        'client-topbar.js',
        'client-app1.js',
        'client-app2.js',
        'client-dock.js'
    ]
    
    clients.forEach(client => {
        const script = document.createElement('script')
        script.src = client
        document.body.appendChild(script)
    })
}

loadClients()

const canvas1 = document.getElementById('screen1')
const canvasCtx1 = canvas1.getContext('2d')

const canvas2 = document.getElementById('screen2')
const canvasCtx2 = canvas2.getContext('2d')

const pipCanvas = document.getElementById('pip')
const pipCtx = pipCanvas.getContext('2d')

const magnifierCanvas = document.getElementById('magnifierCanvas')
const magnifierCtx = magnifierCanvas.getContext('2d')
const magnifierDiv = document.getElementById('magnifier')

let currentEffect = 0
const effects = ['None', 'Grayscale', 'Sepia', 'CRT Scanlines', 'Pixelated']
let magnifierEnabled = false
let pipEnabled = false
let mousePageX = 0
let mousePageY = 0

const btnEffect = document.getElementById('btnEffect')
const btnMagnifier = document.getElementById('btnMagnifier')
const btnPip = document.getElementById('btnPip')
const btnTest = document.getElementById('btnTest')
const btnFramebuffer = document.getElementById('btnFramebuffer')
const testLog = document.getElementById('testLog')
const framebufferModal = document.getElementById('framebufferModal')
const framebufferCanvas = document.getElementById('framebufferCanvas')
const closeModal = document.getElementById('closeModal')

function log(message, type = 'info') {
    const entry = document.createElement('div')
    entry.className = 'log-entry log-' + type
    entry.textContent = message
    testLog.appendChild(entry)
    testLog.scrollTop = testLog.scrollHeight
}

function assert(condition, message) {
    if (condition) {
        log('✓ PASS: ' + message, 'pass')
        return true
    } else {
        log('✗ FAIL: ' + message, 'fail')
        return false
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function smoothMoveMouse(fromX, fromY, toX, toY, duration = 500) {
    const steps = 30
    const stepTime = duration / steps
    
    for (let i = 0; i <= steps; i++) {
        const t = i / steps
        const x = fromX + (toX - fromX) * t
        const y = fromY + (toY - fromY) * t
        compositor.handleMouseMove(x, y)
        await sleep(stepTime)
    }
}

async function test_window_focus() {
    log('--- Test: Window Focus ---', 'info')
    
    const windows = compositor.getWindows()
    const appWindows = windows.filter(w => w.name === 'App 1' || w.name === 'App 2')
    
    if (appWindows.length < 2) {
        log('Not enough windows to test', 'info')
        return
    }
    
    const win1 = appWindows[0]
    const win2 = appWindows[1]
    
    const currentPos = compositor.getMousePosition()
    const targetX = win1.x + 50
    const targetY = win1.y + 50
    
    log(`Action: Move mouse to ${win1.name} and click`, 'action')
    await smoothMoveMouse(currentPos.x, currentPos.y, targetX, targetY, 800)
    
    compositor.handleMouseDown(targetX, targetY)
    await sleep(100)
    compositor.handleMouseUp()
    await sleep(100)
    
    const windowsAfter = compositor.getWindows()
    assert(windowsAfter[windowsAfter.length - 1].name === win1.name, 
           `${win1.name} is now focused`)
}

async function test_window_dragging() {
    log('--- Test: Window Dragging ---', 'info')
    
    const windows = compositor.getWindows()
    const win = windows.find(w => w.name === 'App 1')
    
    if (!win) {
        log('App 1 not found', 'info')
        return
    }
    
    const initialX = win.x
    const initialY = win.y
    
    const currentPos = compositor.getMousePosition()
    const startX = win.x + 50
    const startY = win.y + 10
    const endX = startX + 150
    const endY = startY + 80
    
    log('Action: Move to title bar', 'action')
    await smoothMoveMouse(currentPos.x, currentPos.y, startX, startY, 600)
    
    log('Action: Click and drag window', 'action')
    compositor.handleMouseDown(startX, startY)
    await sleep(100)
    
    await smoothMoveMouse(startX, startY, endX, endY, 1000)
    
    compositor.handleMouseUp()
    await sleep(100)
    
    assert(Math.abs(win.x - initialX) > 100, 'Window X position changed')
    assert(Math.abs(win.y - initialY) > 50, 'Window Y position changed')
}

async function test_mouse_tracking() {
    log('--- Test: Mouse Position Tracking ---', 'info')
    
    const currentPos = compositor.getMousePosition()
    
    log('Action: Move mouse to (640, 360)', 'action')
    await smoothMoveMouse(currentPos.x, currentPos.y, 640, 360, 800)
    
    const pos = compositor.getMousePosition()
    assert(pos.x === 640 && pos.y === 360, 'Mouse position correctly tracked')
}

async function runTests() {
    btnTest.disabled = true
    testLog.innerHTML = ''
    testLog.classList.add('active')
    
    log('🚀 Starting automated tests...', 'info')
    log('', 'info')
    
    try {
        await test_window_focus()
        await sleep(300)
        
        await test_window_dragging()
        await sleep(300)
        
        await test_mouse_tracking()
        
        log('', 'info')
        log('✅ All tests completed!', 'pass')
    } catch (e) {
        log('❌ Test failed: ' + e.message, 'fail')
    }
    
    btnTest.disabled = false
}

btnEffect.addEventListener('click', () => {
    currentEffect = (currentEffect + 1) % effects.length
    btnEffect.textContent = 'Effect: ' + effects[currentEffect]
})

btnMagnifier.addEventListener('click', () => {
    magnifierEnabled = !magnifierEnabled
    btnMagnifier.textContent = 'Magnifier: ' + (magnifierEnabled ? 'ON' : 'OFF')
    btnMagnifier.classList.toggle('active', magnifierEnabled)
    magnifierDiv.classList.toggle('active', magnifierEnabled)
})

btnPip.addEventListener('click', () => {
    pipEnabled = !pipEnabled
    btnPip.textContent = 'Picture-in-Picture: ' + (pipEnabled ? 'ON' : 'OFF')
    btnPip.classList.toggle('active', pipEnabled)
    pipCanvas.classList.toggle('active', pipEnabled)
})

btnTest.addEventListener('click', runTests)

btnFramebuffer.addEventListener('click', () => {
    const fbCtx = framebufferCanvas.getContext('2d')
    const framebuffer = compositor.getFramebuffer()
    const imageData = fbCtx.createImageData(compositor.width, compositor.height)
    imageData.data.set(framebuffer)
    fbCtx.putImageData(imageData, 0, 0)
    framebufferModal.classList.add('active')
})

closeModal.addEventListener('click', () => {
    framebufferModal.classList.remove('active')
})

framebufferModal.addEventListener('click', (event) => {
    if (event.target === framebufferModal) {
        framebufferModal.classList.remove('active')
    }
})

document.addEventListener('mousemove', (event) => {
    mousePageX = event.pageX
    mousePageY = event.pageY
    
    if (magnifierEnabled) {
        magnifierDiv.style.left = (mousePageX + 20) + 'px'
        magnifierDiv.style.top = (mousePageY + 20) + 'px'
    }
})

canvas1.addEventListener('mousemove', (event) => {
    const rect = canvas1.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    compositor.handleMouseMove(x, y)
})

canvas1.addEventListener('mouseenter', (event) => {
    const rect = canvas1.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    compositor.handleMouseMove(x, y)
})

canvas1.addEventListener('mousedown', (event) => {
    const rect = canvas1.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    compositor.handleMouseDown(x, y, typeof getDockItemAtPosition !== 'undefined' ? getDockItemAtPosition : null)
})

canvas1.addEventListener('mouseup', () => {
    compositor.handleMouseUp()
})

pipCanvas.addEventListener('mousemove', (event) => {
    if (!pipEnabled) return
    const rect = pipCanvas.getBoundingClientRect()
    const pipX = event.clientX - rect.left
    const pipY = event.clientY - rect.top
    const x = (pipX / 320) * 1280
    const y = (pipY / 180) * 720
    compositor.handleMouseMove(x, y)
})

pipCanvas.addEventListener('mousedown', (event) => {
    if (!pipEnabled) return
    const rect = pipCanvas.getBoundingClientRect()
    const pipX = event.clientX - rect.left
    const pipY = event.clientY - rect.top
    const x = (pipX / 320) * 1280
    const y = (pipY / 180) * 720
    compositor.handleMouseDown(x, y, typeof getDockItemAtPosition !== 'undefined' ? getDockItemAtPosition : null)
})

pipCanvas.addEventListener('mouseup', () => {
    if (!pipEnabled) return
    compositor.handleMouseUp()
})

const applyEffect = (imageData) => {
    const data = imageData.data
    
    if (currentEffect === 1) {
        for (let i = 0; i < data.length; i += 4) {
            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
            data[i] = data[i + 1] = data[i + 2] = gray
        }
    } else if (currentEffect === 2) {
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2]
            data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189)
            data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168)
            data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131)
        }
    } else if (currentEffect === 3) {
        for (let y = 0; y < 720; y += 2) {
            for (let x = 0; x < 1280; x++) {
                const i = (y * 1280 + x) * 4
                data[i] *= 0.7
                data[i + 1] *= 0.7
                data[i + 2] *= 0.7
            }
        }
    } else if (currentEffect === 4) {
        const pixelSize = 4
        for (let y = 0; y < 720; y += pixelSize) {
            for (let x = 0; x < 1280; x += pixelSize) {
                const i = (y * 1280 + x) * 4
                const r = data[i], g = data[i + 1], b = data[i + 2]
                
                for (let py = 0; py < pixelSize && y + py < 720; py++) {
                    for (let px = 0; px < pixelSize && x + px < 1280; px++) {
                        const pi = ((y + py) * 1280 + (x + px)) * 4
                        data[pi] = r
                        data[pi + 1] = g
                        data[pi + 2] = b
                    }
                }
            }
        }
    }
    
    return imageData
}

const render = () => {
    compositor.composite()
    
    const framebuffer = compositor.getFramebuffer()
    
    const imageData1 = canvasCtx1.createImageData(compositor.width, compositor.height)
    imageData1.data.set(framebuffer)
    canvasCtx1.putImageData(imageData1, 0, 0)
    
    const imageData2 = canvasCtx2.createImageData(compositor.width, compositor.height)
    imageData2.data.set(framebuffer)
    applyEffect(imageData2)
    canvasCtx2.putImageData(imageData2, 0, 0)
    
    if (pipEnabled) {
        pipCtx.drawImage(canvas1, 0, 0, 1280, 720, 0, 0, 320, 180)
    }
    
    if (magnifierEnabled) {
        const mousePos = compositor.getMousePosition()
        const zoomLevel = 3
        const sourceSize = 200 / zoomLevel
        const sx = Math.max(0, Math.min(1280 - sourceSize, mousePos.x - sourceSize / 2))
        const sy = Math.max(0, Math.min(720 - sourceSize, mousePos.y - sourceSize / 2))
        
        magnifierCtx.drawImage(canvas1, sx, sy, sourceSize, sourceSize, 0, 0, 200, 200)
    }

    requestAnimationFrame(render)
}

render()
