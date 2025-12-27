const window2 = compositor.createWindow(300, 200, 350, 250, 'App 2')

const pixels2 = new Uint8ClampedArray(350 * 250 * 4)

for (let y = 0; y < 250; y++) {
    for (let x = 0; x < 350; x++) {
        const index = (y * 350 + x) * 4
        const isBorder = x === 0 || x === 349 || y === 0 || y === 249
        const isTitleBar = y >= 1 && y < 25 && x >= 1 && x < 349
        
        if (isTitleBar) {
            pixels2[index] = 192
            pixels2[index + 1] = 192
            pixels2[index + 2] = 192
        } else {
            pixels2[index] = isBorder ? 0 : 255
            pixels2[index + 1] = isBorder ? 0 : 255
            pixels2[index + 2] = isBorder ? 0 : 255
        }
        pixels2[index + 3] = 255
    }
}

const drawText2 = (text, startX, startY) => {
    const chars = {
        'A': [[0,1,1,1,0],[1,0,0,0,1],[1,1,1,1,1],[1,0,0,0,1],[1,0,0,0,1]],
        'p': [[0,0,0,0,0],[1,1,1,1,0],[1,0,0,0,1],[1,1,1,1,0],[1,0,0,0,0]],
        ' ': [[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]],
        'T': [[1,1,1,1,1],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0]],
        'w': [[0,0,0,0,0],[1,0,0,0,1],[1,0,1,0,1],[1,0,1,0,1],[0,1,0,1,0]],
        'o': [[0,0,0,0,0],[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]]
    }
    
    let offsetX = 0
    for (const char of text) {
        const pattern = chars[char]
        if (pattern) {
            for (let y = 0; y < 5; y++) {
                for (let x = 0; x < 5; x++) {
                    if (pattern[y][x]) {
                        for (let dy = 0; dy < 2; dy++) {
                            for (let dx = 0; dx < 2; dx++) {
                                const px = startX + offsetX + x * 2 + dx
                                const py = startY + y * 2 + dy
                                const index = (py * 350 + px) * 4
                                pixels2[index] = 0
                                pixels2[index + 1] = 0
                                pixels2[index + 2] = 0
                            }
                        }
                    }
                }
            }
        }
        offsetX += 12
    }
}

drawText2('App Two', 10, 10)

const buttonSize2 = 12
const buttonX2 = 350 - buttonSize2 - 5
const buttonY2 = 5

for (let y = 0; y < buttonSize2; y++) {
    for (let x = 0; x < buttonSize2; x++) {
        if (x === y || x === buttonSize2 - 1 - y || x === y - 1 || x === y + 1 || x === buttonSize2 - y || x === buttonSize2 - 2 - y) {
            const index = ((buttonY2 + y) * 350 + (buttonX2 + x)) * 4
            pixels2[index] = 0
            pixels2[index + 1] = 0
            pixels2[index + 2] = 0
        }
    }
}

for (let i = 0; i < 20; i++) {
    const rectX = 10 + i * 16
    const rectY = 40
    const rectSize = 12
    
    for (let y = 0; y < rectSize; y++) {
        for (let x = 0; x < rectSize; x++) {
            const isBorder = x === 0 || x === rectSize - 1 || y === 0 || y === rectSize - 1
            const px = rectX + x
            const py = rectY + y
            const index = (py * 350 + px) * 4
            pixels2[index] = isBorder ? 0 : 255
            pixels2[index + 1] = isBorder ? 0 : 255
            pixels2[index + 2] = isBorder ? 0 : 255
        }
    }
}

window2.updatePixels(pixels2)
