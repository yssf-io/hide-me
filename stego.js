/**
 * Steganography Core Logic
 * Uses Least Significant Bit (LSB) encoding to hide text in images.
 */

const Stego = {
    /**
     * Encodes text into an image.
     * @param {ImageData} imageData - The ImageData object from a canvas.
     * @param {string} text - The text to hide.
     * @returns {ImageData} - The modified ImageData with hidden text.
     */
    encode: (imageData, text) => {
        // Add a magic header to identify our messages
        const MAGIC_HEADER = 'STEGO';
        const fullText = MAGIC_HEADER + text;
        const binaryText = Stego.textToBinary(fullText);
        const data = imageData.data;

        // We need 8 bits per character, plus a delimiter to know when to stop.
        const binaryMessage = binaryText + '00000000';

        if (binaryMessage.length > data.length / 4) {
            throw new Error('Text is too long for this image.');
        }

        let binaryIndex = 0;

        // Iterate through pixels. Each pixel has 4 values: R, G, B, A.
        // We will only use R, G, B channels to store data, leaving Alpha alone.
        for (let i = 0; i < data.length; i += 4) {
            for (let j = 0; j < 3; j++) { // Loop through R, G, B
                if (binaryIndex < binaryMessage.length) {
                    // Get the current pixel value
                    let value = data[i + j];

                    // Clear the least significant bit
                    value = value & 0xFE;

                    // Set the least significant bit to our message bit
                    const bit = parseInt(binaryMessage[binaryIndex], 10);
                    value = value | bit;

                    // Update the pixel data
                    data[i + j] = value;

                    // CRITICAL: Force Alpha to 255 (Opaque) to prevent browser compression/premultiplication data loss
                    data[i + 3] = 255;

                    binaryIndex++;
                } else {
                    break;
                }
            }
            if (binaryIndex >= binaryMessage.length) break;
        }

        return imageData;
    },

    /**
     * Decodes text from an image.
     * @param {ImageData} imageData - The ImageData object from a canvas.
     * @returns {string} - The extracted text.
     */
    decode: (imageData) => {
        const data = imageData.data;
        let binaryMessage = '';
        let currentByte = '';

        console.log('Stego: Starting decode...');

        // We only need to read enough to find the header first
        // But for simplicity, we read until null terminator

        for (let i = 0; i < data.length; i += 4) {
            for (let j = 0; j < 3; j++) { // Loop through R, G, B
                const value = data[i + j];
                const bit = value & 1; // Get the LSB
                currentByte += bit;

                if (currentByte.length === 8) {
                    if (currentByte === '00000000') {
                        // Found the null terminator
                        const fullText = Stego.binaryToText(binaryMessage);
                        console.log('Stego: Found terminator. Raw text:', fullText);
                        if (fullText.startsWith('STEGO')) {
                            return fullText.substring(5); // Remove 'STEGO'
                        }
                        console.error('Stego: Header mismatch. Found:', fullText.substring(0, 10));
                        return null; // Header not found
                    }
                    binaryMessage += currentByte;
                    currentByte = '';
                }
            }
        }

        // If we reach here, we didn't find a null terminator.
        // Return null as the message is incomplete or not properly encoded.
        console.log('Stego: No terminator found.');
        return null;
    },

    // --- Helpers ---

    textToBinary: (text) => {
        return text.split('').map(char => {
            const binary = char.charCodeAt(0).toString(2);
            return binary.padStart(8, '0');
        }).join('');
    },

    binaryToText: (binary) => {
        let text = '';
        for (let i = 0; i < binary.length; i += 8) {
            const byte = binary.slice(i, i + 8);
            text += String.fromCharCode(parseInt(byte, 2));
        }
        return text;
    }
};

// Export for usage in app.js
if (typeof window !== 'undefined') {
    window.Stego = Stego;
}
