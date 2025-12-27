const dockWidth = 400
const dockX = (1280 - dockWidth) / 2
const dockWindow = client.createWindow(dockX, 665, dockWidth, 40, 'Dock', true)

const dockPixels = dockWindow.createPixelBuffer()
let hoveredDockItem = null

const getDockItemAtPosition = (x, y) => {
    const serverWindows = server.getWindows()
    if (x < dockX || x > dockX + dockWidth ||
        y < 665 || y > 665 + 40) {
        return null
    }
    
    const itemWidth = 50
    const totalWidth = serverWindows.length * itemWidth
    let startX = dockX + (dockWidth - totalWidth) / 2
    
    for (const window of serverWindows) {
        if (x >= startX && x < startX + itemWidth) {
            return window
        }
        startX += itemWidth
    }
    return null
}

const updateDock = () => {
    for (let y = 0; y < 40; y++) {
        for (let x = 0; x < dockWidth; x++) {
            const index = (y * dockWidth + x) * 4
            dockPixels[index] = 192
            dockPixels[index + 1] = 192
            dockPixels[index + 2] = 192
            dockPixels[index + 3] = 255
        }
    }
    
    const appWindows = server.getWindows()
    const itemWidth = 50
    const totalWidth = appWindows.length * itemWidth
    let startX = (dockWidth - totalWidth) / 2
    
    const mousePos = server.getMousePosition()
    hoveredDockItem = getDockItemAtPosition(mousePos.x, mousePos.y)
    
    for (const window of appWindows) {
        const isHovered = window === hoveredDockItem
        const iconSize = 20
        for (let y = 0; y < iconSize; y++) {
            for (let x = 0; x < iconSize; x++) {
                const isBorder = x === 0 || x === iconSize - 1 || y === 0 || y === iconSize - 1
                const px = startX + x
                const py = 5 + y
                const index = (py * dockWidth + px) * 4
                if (isHovered && !isBorder) {
                    dockPixels[index] = 220
                    dockPixels[index + 1] = 220
                    dockPixels[index + 2] = 220
                } else {
                    dockPixels[index] = isBorder ? 0 : 255
                    dockPixels[index + 1] = isBorder ? 0 : 255
                    dockPixels[index + 2] = isBorder ? 0 : 255
                }
            }
        }
        
        if (window.name) {
            const chars = {
                'A': [[0,1,1,1,0],[1,0,0,0,1],[1,1,1,1,1],[1,0,0,0,1],[1,0,0,0,1]],
                'p': [[0,0,0,0,0],[1,1,1,1,0],[1,0,0,0,1],[1,1,1,1,0],[1,0,0,0,0]],
                ' ': [[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]],
                '1': [[0,1,0],[1,1,0],[0,1,0],[0,1,0],[1,1,1]],
                '2': [[1,1,1],[0,0,1],[1,1,1],[1,0,0],[1,1,1]],
                'T': [[1,1,1,1,1],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0]],
                'o': [[0,0,0,0,0],[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
                'b': [[1,0,0,0,0],[1,0,0,0,0],[1,1,1,1,0],[1,0,0,0,1],[1,1,1,1,0]],
                'a': [[0,0,0,0,0],[0,1,1,1,0],[1,0,0,0,1],[1,0,0,1,1],[0,1,1,0,1]],
                'r': [[0,0,0,0,0],[1,0,1,1,0],[1,1,0,0,1],[1,0,0,0,0],[1,0,0,0,0]],
                'D': [[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,0]],
                'c': [[0,0,0,0,0],[0,1,1,1,0],[1,0,0,0,0],[1,0,0,0,0],[0,1,1,1,0]],
                'k': [[1,0,0,0,0],[1,0,0,1,0],[1,1,1,0,0],[1,0,0,1,0],[1,0,0,0,1]]
            }
            let textX = startX + 2
            for (const char of window.name) {
                const pattern = chars[char]
                if (pattern) {
                    const charWidth = pattern[0].length
                    for (let y = 0; y < 5; y++) {
                        for (let x = 0; x < charWidth; x++) {
                            if (pattern[y][x]) {
                                const px = textX + x
                                const py = 27 + y
                                if (px < dockWidth && py < 40) {
                                    const index = (py * dockWidth + px) * 4
                                    dockPixels[index] = 0
                                    dockPixels[index + 1] = 0
                                    dockPixels[index + 2] = 0
                                }
                            }
                        }
                    }
                    textX += charWidth + 1
                }
            }
        }
        
        startX += itemWidth
    }
    
    dockWindow.draw(dockPixels)
}

setInterval(updateDock, 100)
updateDock()
