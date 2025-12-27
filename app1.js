const window1 = client.createWindow(100, 100, 400, 300, 'App 1')

const pixels = window1.createPixelBuffer()

for (let y = 0; y < 300; y++) {
    for (let x = 0; x < 400; x++) {
        const index = (y * 400 + x) * 4
        const isBorder = x === 0 || x === 399 || y === 0 || y === 299
        const isTitleBar = y >= 1 && y < 25 && x >= 1 && x < 399
        
        if (isTitleBar) {
            pixels[index] = 192
            pixels[index + 1] = 192
            pixels[index + 2] = 192
        } else {
            pixels[index] = isBorder ? 0 : 255
            pixels[index + 1] = isBorder ? 0 : 255
            pixels[index + 2] = isBorder ? 0 : 255
        }
        pixels[index + 3] = 255
    }
}

const drawText = (text, startX, startY) => {
    const chars = {
        'M': [[1,0,0,0,1],[1,1,0,1,1],[1,0,1,0,1],[1,0,0,0,1],[1,0,0,0,1]],
        'y': [[0,0,0,0,0],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,1],[0,0,0,0,1]],
        ' ': [[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]],
        'W': [[1,0,0,0,1],[1,0,0,0,1],[1,0,1,0,1],[1,1,0,1,1],[1,0,0,0,1]],
        'i': [[0,0,1,0,0],[0,0,0,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0]],
        'n': [[0,0,0,0,0],[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1]],
        'd': [[0,0,0,0,1],[0,0,0,0,1],[0,1,1,1,1],[1,0,0,0,1],[0,1,1,1,1]],
        'o': [[0,0,0,0,0],[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
        'w': [[0,0,0,0,0],[1,0,0,0,1],[1,0,1,0,1],[1,0,1,0,1],[0,1,0,1,0]]
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
                                const index = (py * 400 + px) * 4
                                pixels[index] = 0
                                pixels[index + 1] = 0
                                pixels[index + 2] = 0
                            }
                        }
                    }
                }
            }
        }
        offsetX += 12
    }
}

drawText('My Window', 10, 10)

const buttonSize = 12
const buttonX = 400 - buttonSize - 5
const buttonY = 5

for (let y = 0; y < buttonSize; y++) {
    for (let x = 0; x < buttonSize; x++) {
        if (x === y || x === buttonSize - 1 - y || x === y - 1 || x === y + 1 || x === buttonSize - y || x === buttonSize - 2 - y) {
            const index = ((buttonY + y) * 400 + (buttonX + x)) * 4
            pixels[index] = 0
            pixels[index + 1] = 0
            pixels[index + 2] = 0
        }
    }
}

window1.draw(pixels)
