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

setTimeout(() => {
    const windows = compositor.getWindows()
    windows.forEach(win => {
        const clientWindow = compositor.getWindowById(win.id)
        if (clientWindow) {
            clientWindow.setOnFocus(() => {
                if (focusEffectEnabled) {
                    focusAnimations.set(win.id, {
                        progress: 0,
                        scale: 1.0,
                        flash: 1.0
                    })
                }
            })
        }
    })
}, 100)

const canvas1 = document.getElementById('screen1')
const canvasCtx1 = canvas1.getContext('2d')

const canvas2 = document.getElementById('screen2')
const canvasCtx2 = canvas2.getContext('2d')

const pipCanvas = document.getElementById('pip')
const pipCtx = pipCanvas.getContext('2d')

const magnifierCanvas = document.getElementById('magnifierCanvas')
const magnifierCtx = magnifierCanvas.getContext('2d')
const magnifierDiv = document.getElementById('magnifier')

const asciiOverlay = document.getElementById('asciiOverlay')
const asciiCtx = asciiOverlay.getContext('2d')

let currentEffect = 0
const effects = ['None', 'Grayscale', 'Sepia', 'CRT Scanlines', 'Pixelated']
let effect3DEnabled = false
let cubeEnabled = false
let cubeRotation = 0
let cubeTargetRotation = 0
let currentDesktop = 0
let wobblyEnabled = false
const wobbleData = new Map()
let asciiEnabled = false
let heatmapEnabled = false
const windowHeatMap = new Map()
let drawModeEnabled = false
const drawingLayer = new Uint8ClampedArray(1280 * 720 * 3)
let isDrawing = false
let lastDrawX = -1
let lastDrawY = -1

for (let i = 0; i < drawingLayer.length; i += 3) {
    drawingLayer[i] = 255
    drawingLayer[i + 1] = 255
    drawingLayer[i + 2] = 255
}

let magnifierEnabled = false
let pipEnabled = false
let mousePageX = 0
let mousePageY = 0
const windowAnimations = new Map()
let focusEffectEnabled = false
const focusAnimations = new Map()

const btnEffect = document.getElementById('btnEffect')
const btn3D = document.getElementById('btn3D')
const btnCube = document.getElementById('btnCube')
const btnWobbly = document.getElementById('btnWobbly')
const btnFocus = document.getElementById('btnFocus')
const btnAscii = document.getElementById('btnAscii')
const btnHeatmap = document.getElementById('btnHeatmap')
const btnDraw = document.getElementById('btnDraw')
const btnMagnifier = document.getElementById('btnMagnifier')
const btnPip = document.getElementById('btnPip')
const btnTest = document.getElementById('btnTest')
const btnFramebuffer = document.getElementById('btnFramebuffer')
const testLog = document.getElementById('testLog')
const framebufferModal = document.getElementById('framebufferModal')
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

btn3D.addEventListener('click', () => {
    effect3DEnabled = !effect3DEnabled
    btn3D.textContent = '3D Windows: ' + (effect3DEnabled ? 'ON' : 'OFF')
    btn3D.classList.toggle('active', effect3DEnabled)
    
    if (effect3DEnabled) {
        const windows = compositor.getWindows()
        windows.forEach(win => {
            windowAnimations.set(win.id, {
                wobbleX: 0,
                wobbleY: 0,
                velocityX: (Math.random() - 0.5) * 8,
                velocityY: (Math.random() - 0.5) * 8,
                rotation: 0,
                rotationVel: (Math.random() - 0.5) * 0.5,
                visible: true
            })
        })
    } else {
        windowAnimations.clear()
    }
})

btnCube.addEventListener('click', () => {
    cubeEnabled = !cubeEnabled
    btnCube.textContent = 'Desktop Cube: ' + (cubeEnabled ? 'ON' : 'OFF')
    btnCube.classList.toggle('active', cubeEnabled)
    
    if (cubeEnabled) {
        const windows = compositor.getWindows()
        windows.forEach((win, idx) => {
            if (!win.desktop) {
                win.desktop = idx % 4
            }
        })
    }
})

btnWobbly.addEventListener('click', () => {
    wobblyEnabled = !wobblyEnabled
    btnWobbly.textContent = 'Wobbly Drag: ' + (wobblyEnabled ? 'ON' : 'OFF')
    btnWobbly.classList.toggle('active', wobblyEnabled)
    if (!wobblyEnabled) {
        wobbleData.clear()
    }
})

btnFocus.addEventListener('click', () => {
    focusEffectEnabled = !focusEffectEnabled
    btnFocus.textContent = 'Focus Effect: ' + (focusEffectEnabled ? 'ON' : 'OFF')
    btnFocus.classList.toggle('active', focusEffectEnabled)
    if (!focusEffectEnabled) {
        focusAnimations.clear()
    }
})

btnAscii.addEventListener('click', () => {
    asciiEnabled = !asciiEnabled
    btnAscii.textContent = 'ASCII Mode: ' + (asciiEnabled ? 'ON' : 'OFF')
    btnAscii.classList.toggle('active', asciiEnabled)
    asciiOverlay.style.display = asciiEnabled ? 'block' : 'none'
})

btnHeatmap.addEventListener('click', () => {
    heatmapEnabled = !heatmapEnabled
    btnHeatmap.textContent = 'Heat Map: ' + (heatmapEnabled ? 'ON' : 'OFF')
    btnHeatmap.classList.toggle('active', heatmapEnabled)
    if (!heatmapEnabled) {
        windowHeatMap.clear()
    }
})

btnDraw.addEventListener('click', () => {
    drawModeEnabled = !drawModeEnabled
    btnDraw.textContent = 'Draw Mode: ' + (drawModeEnabled ? 'ON' : 'OFF')
    btnDraw.classList.toggle('active', drawModeEnabled)
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
    const framebuffer = compositor.getFramebuffer()
    const totalBytes = framebuffer.length
    document.getElementById('fbTotalBytes').textContent = totalBytes.toLocaleString()
    
    let output = ''
    const bytesPerRow = 48
    const pixelsPerRow = bytesPerRow / 3
    
    for (let i = 0; i < framebuffer.length; i += bytesPerRow) {
        const offset = i.toString(16).padStart(8, '0').toUpperCase()
        output += offset + '  '
        
        for (let j = 0; j < bytesPerRow && i + j < framebuffer.length; j++) {
            const byte = framebuffer[i + j].toString(16).padStart(2, '0').toUpperCase()
            output += byte + ' '
            if ((j + 1) % 3 === 0) output += ' '
        }
        
        output += ' │ '
        
        for (let j = 0; j < bytesPerRow && i + j < framebuffer.length; j += 3) {
            const r = framebuffer[i + j]
            const g = framebuffer[i + j + 1]
            const b = framebuffer[i + j + 2]
            output += `RGB(${r.toString().padStart(3)},${g.toString().padStart(3)},${b.toString().padStart(3)}) `
        }
        
        output += '\n'
    }
    
    document.getElementById('framebufferData').textContent = output
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

document.addEventListener('keydown', (event) => {
    if (cubeEnabled) {
        if (event.key === 'ArrowLeft' || event.key === 'a') {
            currentDesktop = (currentDesktop + 1) % 4
            cubeTargetRotation = currentDesktop * Math.PI / 2
        } else if (event.key === 'ArrowRight' || event.key === 'd') {
            currentDesktop = (currentDesktop + 3) % 4
            cubeTargetRotation = currentDesktop * Math.PI / 2
        }
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
    
    if (drawModeEnabled && isDrawing) {
        const drawX = Math.floor(x)
        const drawY = Math.floor(y)
        
        if (lastDrawX !== -1 && lastDrawY !== -1) {
            const dx = drawX - lastDrawX
            const dy = drawY - lastDrawY
            const steps = Math.max(Math.abs(dx), Math.abs(dy))
            
            for (let i = 0; i <= steps; i++) {
                const t = steps > 0 ? i / steps : 0
                const px = Math.floor(lastDrawX + dx * t)
                const py = Math.floor(lastDrawY + dy * t)
                
                for (let dy = -2; dy <= 2; dy++) {
                    for (let dx = -2; dx <= 2; dx++) {
                        const dpx = px + dx
                        const dpy = py + dy
                        if (dpx >= 0 && dpx < 1280 && dpy >= 0 && dpy < 720) {
                            const idx = (dpy * 1280 + dpx) * 3
                            drawingLayer[idx] = 255
                            drawingLayer[idx + 1] = 0
                            drawingLayer[idx + 2] = 0
                        }
                    }
                }
            }
        }
        
        lastDrawX = drawX
        lastDrawY = drawY
    } else {
        compositor.handleMouseMove(x, y)
    }
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
    
    if (drawModeEnabled) {
        isDrawing = true
        lastDrawX = Math.floor(x)
        lastDrawY = Math.floor(y)
    } else {
        const transforms = effect3DEnabled ? windowAnimations : null
        compositor.handleMouseDown(x, y, typeof getDockItemAtPosition !== 'undefined' ? getDockItemAtPosition : null, transforms)
    }
})

canvas1.addEventListener('mouseup', () => {
    if (drawModeEnabled) {
        isDrawing = false
        lastDrawX = -1
        lastDrawY = -1
    } else {
        compositor.handleMouseUp()
    }
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
    const transforms = effect3DEnabled ? windowAnimations : null
    compositor.handleMouseDown(x, y, typeof getDockItemAtPosition !== 'undefined' ? getDockItemAtPosition : null, transforms)
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
    let transforms = null
    
    if (wobblyEnabled) {
        const draggingWin = compositor.getDraggingWindow()
        const windows = compositor.getWindows()
        
        windows.forEach(win => {
            let wobble = wobbleData.get(win.id)
            
            if (win === draggingWin) {
                if (!wobble) {
                    const gridSize = 5
                    wobble = {
                        grid: [],
                        velocities: []
                    }
                    
                    for (let i = 0; i < gridSize; i++) {
                        wobble.grid[i] = []
                        wobble.velocities[i] = []
                        for (let j = 0; j < gridSize; j++) {
                            wobble.grid[i][j] = { x: 0, y: 0 }
                            wobble.velocities[i][j] = { x: 0, y: 0 }
                        }
                    }
                    wobbleData.set(win.id, wobble)
                }
                
                const gridSize = wobble.grid.length
                const stiffness = 0.3
                const damping = 0.85
                const spread = 0.4
                
                for (let i = 0; i < gridSize; i++) {
                    for (let j = 0; j < gridSize; j++) {
                        const point = wobble.grid[i][j]
                        const vel = wobble.velocities[i][j]
                        
                        let forceX = -point.x * stiffness
                        let forceY = -point.y * stiffness
                        
                        if (i > 0) {
                            forceX += (wobble.grid[i-1][j].x - point.x) * spread
                            forceY += (wobble.grid[i-1][j].y - point.y) * spread
                        }
                        if (i < gridSize - 1) {
                            forceX += (wobble.grid[i+1][j].x - point.x) * spread
                            forceY += (wobble.grid[i+1][j].y - point.y) * spread
                        }
                        if (j > 0) {
                            forceX += (wobble.grid[i][j-1].x - point.x) * spread
                            forceY += (wobble.grid[i][j-1].y - point.y) * spread
                        }
                        if (j < gridSize - 1) {
                            forceX += (wobble.grid[i][j+1].x - point.x) * spread
                            forceY += (wobble.grid[i][j+1].y - point.y) * spread
                        }
                        
                        vel.x = (vel.x + forceX) * damping
                        vel.y = (vel.y + forceY) * damping
                        
                        point.x += vel.x
                        point.y += vel.y
                    }
                }
                
                const topCenter = Math.floor(gridSize / 2)
                const mousePos = compositor.getMousePosition()
                const dragStrength = 15
                wobble.grid[0][topCenter].x += (Math.random() - 0.5) * dragStrength
                wobble.grid[0][topCenter].y += (Math.random() - 0.5) * dragStrength
                
            } else if (wobble) {
                const gridSize = wobble.grid.length
                let hasMovement = false
                
                for (let i = 0; i < gridSize; i++) {
                    for (let j = 0; j < gridSize; j++) {
                        const point = wobble.grid[i][j]
                        const vel = wobble.velocities[i][j]
                        
                        if (Math.abs(point.x) > 0.1 || Math.abs(point.y) > 0.1 || 
                            Math.abs(vel.x) > 0.1 || Math.abs(vel.y) > 0.1) {
                            hasMovement = true
                            
                            const stiffness = 0.3
                            const damping = 0.85
                            
                            vel.x = (vel.x - point.x * stiffness) * damping
                            vel.y = (vel.y - point.y * stiffness) * damping
                            
                            point.x += vel.x
                            point.y += vel.y
                        } else {
                            point.x = 0
                            point.y = 0
                            vel.x = 0
                            vel.y = 0
                        }
                    }
                }
                
                if (!hasMovement) {
                    wobbleData.delete(win.id)
                }
            }
        })
    }
    
    if (cubeEnabled) {
        cubeRotation += (cubeTargetRotation - cubeRotation) * 0.1
        
        const windows = compositor.getWindows()
        transforms = new Map()
        
        windows.forEach(win => {
            const desktop = win.desktop || 0
            const faceAngle = desktop * Math.PI / 2
            const relativeAngle = faceAngle - cubeRotation
            
            const radius = 600
            const centerX = 640
            const centerY = 360
            
            const windowCenterX = win.x + win.width / 2
            const windowCenterY = win.y + win.height / 2
            
            const localX = windowCenterX - centerX
            const localY = windowCenterY - centerY
            
            const x3D = Math.sin(relativeAngle) * radius + localX * Math.cos(relativeAngle)
            const z3D = Math.cos(relativeAngle) * radius - localX * Math.sin(relativeAngle)
            
            const perspective = 800
            const scale = perspective / (perspective + z3D)
            
            const screenX = x3D * scale
            const offsetX = screenX - localX
            const offsetY = 0
            
            const visible = z3D > -200
            const opacity = Math.max(0, Math.min(1, 1 - Math.abs(relativeAngle) / Math.PI))
            
            transforms.set(win.id, {
                wobbleX: offsetX,
                wobbleY: offsetY,
                rotation: -relativeAngle * 0.3,
                scale: scale,
                opacity: opacity,
                visible: visible && opacity > 0.05
            })
        })
        
        compositor.composite(transforms)
    } else if (effect3DEnabled) {
        const windows = compositor.getWindows()
        windows.forEach(win => {
            let anim = windowAnimations.get(win.id)
            if (!anim) {
                anim = {
                    wobbleX: 0,
                    wobbleY: 0,
                    velocityX: (Math.random() - 0.5) * 8,
                    velocityY: (Math.random() - 0.5) * 8,
                    rotation: 0,
                    rotationVel: (Math.random() - 0.5) * 0.5,
                    visible: true
                }
                windowAnimations.set(win.id, anim)
            }
            
            anim.wobbleX += anim.velocityX
            anim.wobbleY += anim.velocityY
            anim.rotation += anim.rotationVel
            
            const damping = 0.95
            const spring = 0.05
            anim.velocityX = (anim.velocityX - anim.wobbleX * spring) * damping
            anim.velocityY = (anim.velocityY - anim.wobbleY * spring) * damping
            anim.rotationVel *= 0.98
            
            if (Math.abs(anim.wobbleX) < 0.01 && Math.abs(anim.velocityX) < 0.01) {
                anim.wobbleX = 0
                anim.velocityX = 0
            }
            if (Math.abs(anim.wobbleY) < 0.01 && Math.abs(anim.velocityY) < 0.01) {
                anim.wobbleY = 0
                anim.velocityY = 0
            }
            if (Math.abs(anim.rotation) < 0.001 && Math.abs(anim.rotationVel) < 0.001) {
                anim.rotation = 0
                anim.rotationVel = 0
            }
        })
        
        compositor.composite(windowAnimations)
    } else {
        const transforms = wobblyEnabled && wobbleData.size > 0 ? wobbleData : null
        if (transforms) {
            const wobbleTransforms = new Map()
            wobbleData.forEach((wobble, winId) => {
                const avgX = wobble.grid.reduce((sum, row) => 
                    sum + row.reduce((s, p) => s + p.x, 0), 0) / (wobble.grid.length * wobble.grid[0].length)
                const avgY = wobble.grid.reduce((sum, row) => 
                    sum + row.reduce((s, p) => s + p.y, 0), 0) / (wobble.grid.length * wobble.grid[0].length)
                
                wobbleTransforms.set(winId, {
                    wobbleX: avgX * 0.5,
                    wobbleY: avgY * 0.5,
                    rotation: (wobble.grid[0][2].x - wobble.grid[4][2].x) * 0.002,
                    visible: true
                })
            })
            compositor.composite(wobbleTransforms)
        } else {
            compositor.composite()
        }
    }
    
    if (focusEffectEnabled) {
        focusAnimations.forEach((anim, winId) => {
            anim.progress += 0.08
            
            if (anim.progress <= 0.5) {
                anim.scale = 1.0 + (anim.progress * 0.2)
                anim.flash = 1.0 + (anim.progress * 1.5)
            } else {
                const t = (anim.progress - 0.5) * 2
                anim.scale = 1.1 - (t * 0.1)
                anim.flash = 1.75 - (t * 0.75)
            }
            
            if (anim.progress >= 1.0) {
                focusAnimations.delete(winId)
            }
        })
    }
    
    const framebuffer = compositor.getFramebuffer()
    
    if (heatmapEnabled) {
        const windows = compositor.getWindows()
        windows.forEach(win => {
            const heat = windowHeatMap.get(win.id) || 0
            windowHeatMap.set(win.id, Math.min(heat + 0.5, 100))
        })
        
        windowHeatMap.forEach((heat, winId) => {
            if (heat > 0) {
                windowHeatMap.set(winId, heat * 0.98)
            }
        })
        
        const topWindow = windows[windows.length - 1]
        if (topWindow) {
            const heat = windowHeatMap.get(topWindow.id) || 0
            windowHeatMap.set(topWindow.id, Math.min(heat + 2, 100))
        }
        
        for (let i = 0; i < framebuffer.length; i += 3) {
            const x = (i / 3) % 1280
            const y = Math.floor((i / 3) / 1280)
            
            let maxHeat = 0
            windows.forEach(win => {
                if (x >= win.x && x < win.x + win.width && y >= win.y && y < win.y + win.height) {
                    const heat = windowHeatMap.get(win.id) || 0
                    maxHeat = Math.max(maxHeat, heat)
                }
            })
            
            if (maxHeat > 0) {
                const intensity = maxHeat / 100
                framebuffer[i] = Math.min(255, framebuffer[i] + intensity * 100)
                framebuffer[i + 1] = Math.max(0, framebuffer[i + 1] - intensity * 50)
                framebuffer[i + 2] = Math.max(0, framebuffer[i + 2] - intensity * 50)
            }
        }
    }
    
    for (let i = 0; i < framebuffer.length; i += 3) {
        if (drawingLayer[i] !== 255 || drawingLayer[i + 1] !== 255 || drawingLayer[i + 2] !== 255) {
            framebuffer[i] = drawingLayer[i]
            framebuffer[i + 1] = drawingLayer[i + 1]
            framebuffer[i + 2] = drawingLayer[i + 2]
        }
    }
    
    if (focusEffectEnabled && focusAnimations.size > 0) {
        const windows = compositor.getWindows()
        focusAnimations.forEach((anim, winId) => {
            const win = windows.find(w => w.id === winId)
            if (!win) return
            
            const centerX = win.x + win.width / 2
            const centerY = win.y + win.height / 2
            
            for (let y = Math.max(0, win.y); y < Math.min(720, win.y + win.height); y++) {
                for (let x = Math.max(0, win.x); x < Math.min(1280, win.x + win.width); x++) {
                    const dx = x - centerX
                    const dy = y - centerY
                    
                    const srcX = Math.floor(centerX + dx / anim.scale)
                    const srcY = Math.floor(centerY + dy / anim.scale)
                    
                    if (srcX >= win.x && srcX < win.x + win.width && srcY >= win.y && srcY < win.y + win.height) {
                        const srcIdx = (srcY * 1280 + srcX) * 3
                        const dstIdx = (y * 1280 + x) * 3
                        
                        framebuffer[dstIdx] = Math.min(255, framebuffer[srcIdx] * anim.flash)
                        framebuffer[dstIdx + 1] = Math.min(255, framebuffer[srcIdx + 1] * anim.flash)
                        framebuffer[dstIdx + 2] = Math.min(255, framebuffer[srcIdx + 2] * anim.flash)
                    }
                }
            }
        })
    }
    
    const imageData1 = canvasCtx1.createImageData(compositor.width, compositor.height)
    for (let i = 0, j = 0; i < framebuffer.length; i += 3, j += 4) {
        imageData1.data[j] = framebuffer[i]
        imageData1.data[j + 1] = framebuffer[i + 1]
        imageData1.data[j + 2] = framebuffer[i + 2]
        imageData1.data[j + 3] = 255
    }
    canvasCtx1.putImageData(imageData1, 0, 0)
    
    const imageData2 = canvasCtx2.createImageData(compositor.width, compositor.height)
    for (let i = 0, j = 0; i < framebuffer.length; i += 3, j += 4) {
        imageData2.data[j] = framebuffer[i]
        imageData2.data[j + 1] = framebuffer[i + 1]
        imageData2.data[j + 2] = framebuffer[i + 2]
        imageData2.data[j + 3] = 255
    }
    applyEffect(imageData2)
    canvasCtx2.putImageData(imageData2, 0, 0)
    
    if (asciiEnabled) {
        asciiCtx.fillStyle = 'black'
        asciiCtx.fillRect(0, 0, 1280, 720)
        asciiCtx.font = '8px monospace'
        asciiCtx.fillStyle = 'lime'
        
        const chars = ' .:-=+*#%@'
        const cellWidth = 6
        const cellHeight = 10
        
        for (let y = 0; y < 720; y += cellHeight) {
            for (let x = 0; x < 1280; x += cellWidth) {
                let brightness = 0
                let samples = 0
                
                for (let dy = 0; dy < cellHeight && y + dy < 720; dy++) {
                    for (let dx = 0; dx < cellWidth && x + dx < 1280; dx++) {
                        const idx = ((y + dy) * 1280 + (x + dx)) * 3
                        const r = framebuffer[idx]
                        const g = framebuffer[idx + 1]
                        const b = framebuffer[idx + 2]
                        brightness += (r + g + b) / 3
                        samples++
                    }
                }
                
                brightness /= samples
                const charIndex = Math.floor((brightness / 255) * (chars.length - 1))
                const char = chars[charIndex]
                
                asciiCtx.fillText(char, x, y + 8)
            }
        }
    }
    
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
