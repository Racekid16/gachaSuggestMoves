//functions for helping with analyzing party images

export function getSlot(minX, minY, maxX, maxY, slotName, image) {
    let slot = {
        name: slotName,
        pixels: []
    };
    for (let i = minY; i <= maxY; i++) {
        let rowStartIndex = pixelArrayIndex(minX, i);
        let rowEndIndex = pixelArrayIndex(maxX, i) + 3;
        for (let j = rowStartIndex; j <= rowEndIndex; j++) {
            slot.pixels.push(image.pixels[j]);
        }
    }
    return slot;
}

export function slotDifference(slot1, slot2) {
    if (slot1.pixels.length != slot2.pixels.length) {
        console.log(`Error: ${slot1.name} is ${slot1.pixels.length / 4} pixels but ${slot2.name} is ${slot2.pixels.length / 4} pixels.`);
        return;
    }
    let difference = 0;
    for (let i = 0; i < slot1.pixels.length; ++i) {
        difference += Math.abs(slot1.pixels[i] - slot2.pixels[i]);
    }
    return difference;
}

export function getNumStars(slotName, image) {
    //pixel values are chosen according to 4 star sato
    //except for the fifth star, which is chosen according to 5 star kei
    switch (slotName) {

        case 'slot1':
            if (RGBA_difference(RGBA_at(81, 92, image), [244, 130, 124, 255]) > 55) {
                return 1;
            }
            if (RGBA_difference(RGBA_at(75, 92, image), [213, 80 , 123, 255]) > 55) {
                return 2;
            }
            if (RGBA_difference(RGBA_at(65, 93, image), [243, 141, 136, 255]) > 55) {
                return 3;
            }
            if (RGBA_difference(RGBA_at(59, 94, image), [219, 103, 104, 255]) > 55) {
                return 4;
            }
            return 5;

        case 'slot2':
            if (RGBA_difference(RGBA_at(184, 92, image), [242, 127, 122, 255]) > 55) {
                return 1;
            }
            if (RGBA_difference(RGBA_at(176, 93, image), [235, 116, 111, 255]) > 55) {
                return 2;
            }
            if (RGBA_difference(RGBA_at(168, 94, image), [237, 114, 121, 255]) > 55) {
                return 3;
            }
            if (RGBA_difference(RGBA_at(162, 95, image), [234, 119, 115, 255]) > 55) {
                return 4;
            }
            return 5;

        case 'slot3':
            if (RGBA_difference(RGBA_at(286, 92, image), [246, 121, 121, 255]) > 55) {
                return 1;
            }
            if (RGBA_difference(RGBA_at(279, 93, image), [235, 117, 111, 255]) > 55) {
                return 2;
            }
            if (RGBA_difference(RGBA_at(270, 94, image), [248, 139, 135, 255]) > 55) {
                return 3;
            }
            if (RGBA_difference(RGBA_at(265, 95, image), [235, 120, 115, 255]) > 55) {
                return 4;
            }
            return 5;

        case 'slot4':
            if (RGBA_difference(RGBA_at(81, 210, image), [244, 123, 121, 255]) > 55) {
                return 1;
            }
            if (RGBA_difference(RGBA_at(75, 210, image), [227, 101, 130, 255]) > 55) {
                return 2;
            }
            if (RGBA_difference(RGBA_at(65, 211, image), [246, 154, 144, 255]) > 55) {
                return 3;
            }
            if (RGBA_difference(RGBA_at(59, 213, image), [231, 115, 108, 255]) > 55) {
                return 4;
            }
            return 5;

        case 'slot5':
            if (RGBA_difference(RGBA_at(184, 212, image), [240, 114, 106, 255]) > 55) {
                return 1;
            }
            if (RGBA_difference(RGBA_at(175, 210, image), [246, 153, 133, 255]) > 55) {
                return 2;
            }
            if (RGBA_difference(RGBA_at(167, 212, image), [248, 128, 129, 255]) > 55) {
                return 3;
            }
            if (RGBA_difference(RGBA_at(162, 213, image), [227, 106, 109, 255]) > 55) {
                return 4;
            }
            return 5;

        case 'slot6':
            if (RGBA_difference(RGBA_at(287, 212, image), [240, 113, 106, 255]) > 55) {
                return 1;
            }
            if (RGBA_difference(RGBA_at(281, 210, image), [225, 97 , 128, 255]) > 55) {
                return 2;
            }
            if (RGBA_difference(RGBA_at(270, 212, image), [248, 128, 129, 255]) > 55) {
                return 3;
            }
            if (RGBA_difference(RGBA_at(265, 213, image), [227, 107, 109, 255]) > 55) {
                return 4;
            }
            return 5;
    }
}

export function getAspect(slotName, image) {
    let slotNumber = parseInt(/slot(\d+)/.exec(slotName)[1]);
    // 20, 123, 226
    let pixelValue = RGBA_at(20 + 103 * (slotNumber - 1), 45, image);
    
    if (RGBA_difference(pixelValue, [237, 27, 36, 255]) == 0) {
        return "Infernal ";
    }
    if (RGBA_difference(pixelValue, [255, 255, 255, 255]) == 0) {
        return "Titanium ";
    }
    /*
    if (RGBA_difference(pixelValue, TBD) == 0) {
        return "Tidal ";
    }
    if (RGBA_difference(pixelValue, TBD) == 0) {
        return "Mending ";
    }
    if (RGBA_difference(pixelValue, TBD) == 0) {
        return "Stormy ";
    }
    if (RGBA_difference(pixelValue, TBD) == 0) {
        return "Glacial ";
    }
    */
    return "";
}

function pixelArrayIndex(pixelX, pixelY) {
    const imageWidth = 328;
    return 4 * (imageWidth * pixelY + pixelX);
}

function RGBA_at(pixelX, pixelY, image) {
    let startIndex = pixelArrayIndex(pixelX, pixelY);
    return [image.pixels[startIndex], image.pixels[startIndex + 1], image.pixels[startIndex + 2], image.pixels[startIndex + 3]];
}

function RGBA_difference(pixel1, pixel2) {
    let difference = 0;
    for (let i = 0; i < 4; i++) {
        difference += Math.abs(pixel1[i] - pixel2[i]);
    }
    return difference;
}