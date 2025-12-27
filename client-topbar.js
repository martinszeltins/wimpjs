const topbarWindow = compositor.createWindow(0, 0, 1280, 30, 'Topbar', true)

const topbarPixels = new Uint8ClampedArray(1280 * 30 * 4)

for (let y = 0; y < 30; y++) {
    for (let x = 0; x < 1280; x++) {
        const index = (y * 1280 + x) * 4
        topbarPixels[index] = 192
        topbarPixels[index + 1] = 192
        topbarPixels[index + 2] = 192
        topbarPixels[index + 3] = 255
    }
}

const drawTimeText = () => {
    const now = new Date()
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const timeStr = hours + ':' + minutes
    
    const chars = {
        '0': [[1,1,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1]],
        '1': [[0,1,0],[1,1,0],[0,1,0],[0,1,0],[1,1,1]],
        '2': [[1,1,1],[0,0,1],[1,1,1],[1,0,0],[1,1,1]],
        '3': [[1,1,1],[0,0,1],[1,1,1],[0,0,1],[1,1,1]],
        '4': [[1,0,1],[1,0,1],[1,1,1],[0,0,1],[0,0,1]],
        '5': [[1,1,1],[1,0,0],[1,1,1],[0,0,1],[1,1,1]],
        '6': [[1,1,1],[1,0,0],[1,1,1],[1,0,1],[1,1,1]],
        '7': [[1,1,1],[0,0,1],[0,0,1],[0,0,1],[0,0,1]],
        '8': [[1,1,1],[1,0,1],[1,1,1],[1,0,1],[1,1,1]],
        '9': [[1,1,1],[1,0,1],[1,1,1],[0,0,1],[1,1,1]],
        ':': [[0,0,0],[0,1,0],[0,0,0],[0,1,0],[0,0,0]]
    }
    
    let startX = 1280 - 80
    let startY = 10
    
    for (const char of timeStr) {
        const pattern = chars[char]
        if (pattern) {
            for (let y = 0; y < 5; y++) {
                for (let x = 0; x < 3; x++) {
                    if (pattern[y][x]) {
                        for (let dy = 0; dy < 2; dy++) {
                            for (let dx = 0; dx < 2; dx++) {
                                const px = startX + x * 2 + dx
                                const py = startY + y * 2 + dy
                                const index = (py * 1280 + px) * 4
                                topbarPixels[index] = 0
                                topbarPixels[index + 1] = 0
                                topbarPixels[index + 2] = 0
                            }
                        }
                    }
                }
            }
        }
        startX += 8
    }
}

setInterval(() => {
    drawTimeText()
    topbarWindow.updatePixels(topbarPixels)
}, 1000)

drawTimeText()
topbarWindow.updatePixels(topbarPixels)
