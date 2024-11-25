// Function to handle the compression process
async function compressFiles() {
    const fileInput = document.getElementById("file-input");
    const quality = document.getElementById("quality").value;
    const files = fileInput.files;

    if (files.length === 0) {
        alert("Please upload a file to compress.");
        return;
    }

    const file = files[0]; // Currently handling a single file
    const originalText = await file.text(); // Read file content as text

    // Step 1: Build Huffman Tree
    const charFrequency = calculateFrequency(originalText); // Frequency of each character
    const huffmanTree = buildHuffmanTree(charFrequency); // Generate Huffman tree
    const huffmanCodes = generateCodes(huffmanTree); // Get Huffman codes for each character

    // Step 2: Encode the original text
    const encodedText = originalText
        .split("")
        .map(char => huffmanCodes[char])
        .join("");

    // Step 3: Prepare binary file content
    const binaryContent = prepareBinaryFile(encodedText, huffmanCodes, charFrequency);

    // Step 4: Trigger file download
    downloadBinaryFile(binaryContent, file.name.replace(/\.[^/.]+$/, ".bin"));
}

// Function to calculate character frequency
function calculateFrequency(text) {
    const frequency = {};
    for (const char of text) {
        frequency[char] = (frequency[char] || 0) + 1;
    }
    return frequency;
}

// Function to build Huffman tree
function buildHuffmanTree(frequency) {
    const priorityQueue = Object.entries(frequency).map(([char, freq]) => ({ char, freq, left: null, right: null }));

    while (priorityQueue.length > 1) {
        priorityQueue.sort((a, b) => a.freq - b.freq); // Sort by frequency
        const left = priorityQueue.shift(); // Smallest frequency
        const right = priorityQueue.shift(); // Second smallest frequency
        priorityQueue.push({ char: null, freq: left.freq + right.freq, left, right });
    }
    return priorityQueue[0]; // Root of the tree
}

// Function to generate Huffman codes
function generateCodes(tree, prefix = "", codes = {}) {
    if (tree.char !== null) {
        codes[tree.char] = prefix; // Leaf node
    } else {
        generateCodes(tree.left, prefix + "0", codes); // Left subtree
        generateCodes(tree.right, prefix + "1", codes); // Right subtree
    }
    return codes;
}

// Function to prepare binary file content
function prepareBinaryFile(encodedText, codes, frequency) {
    // Header contains Huffman tree info for decompression
    const header = JSON.stringify({ codes, frequency });

    // Padding to make the binary content a multiple of 8
    const padding = 8 - (encodedText.length % 8);
    const paddedText = encodedText + "0".repeat(padding);

    // Add padding information to the header
    const finalHeader = JSON.stringify({ header, padding });

    // Convert encoded text to binary data
    const binaryArray = new Uint8Array(Math.ceil(paddedText.length / 8));
    for (let i = 0; i < paddedText.length; i += 8) {
        binaryArray[i / 8] = parseInt(paddedText.slice(i, i + 8), 2);
    }

    // Combine header and binary data
    const encoder = new TextEncoder();
    const headerBytes = encoder.encode(finalHeader);
    const finalBinary = new Uint8Array(headerBytes.length + binaryArray.length);
    finalBinary.set(headerBytes);
    finalBinary.set(binaryArray, headerBytes.length);

    return finalBinary;
}

// Function to download binary file
function downloadBinaryFile(content, filename) {
    const blob = new Blob([content], { type: "application/octet-stream" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Helper function to read binary data as an array of bits
function readBinaryFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function (event) {
            const arrayBuffer = event.target.result;
            const byteArray = new Uint8Array(arrayBuffer);
            let bits = '';
            byteArray.forEach(byte => {
                bits += byte.toString(2).padStart(8, '0');
            });
            resolve(bits);
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

// Decompress the binary file back into a text file
async function decompressFile(file) {
    try {
        const binaryData = await readBinaryFile(file); // Read the binary file asynchronously
        let index = 0;

        // Step 1: Read the number of unique characters (symbol count)
        const symbolCount = parseInt(binaryData.substring(index, index + 32), 2);
        index += 32;

        // Step 2: Rebuild the frequency table (mapping each symbol to its frequency)
        const frequencyTable = {};
        for (let i = 0; i < symbolCount; i++) {
            const charLength = parseInt(binaryData.substring(index, index + 8), 2);  // Length of character in bits
            index += 8;
            const char = String.fromCharCode(parseInt(binaryData.substring(index, index + charLength * 8), 2));
            index += charLength * 8;
            const frequency = parseInt(binaryData.substring(index, index + 32), 2);  // Frequency of character
            index += 32;
            frequencyTable[char] = frequency;
        }

        // Step 3: Rebuild the Huffman Tree from the frequency table
        const huffmanTree = buildHuffmanTree(frequencyTable);

        // Step 4: Decode the bitstream using the Huffman tree
        let decodedText = '';
        let currentNode = huffmanTree;

        // Process bits in chunks (don't block UI)
        await new Promise((resolve) => {
            const interval = setInterval(() => {
                if (index < binaryData.length) {
                    const bit = binaryData[index++];
                    currentNode = bit === '0' ? currentNode.left : currentNode.right;

                    // If leaf node is reached, add decoded character to result
                    if (currentNode.left === null && currentNode.right === null) {
                        decodedText += currentNode.symbol;
                        currentNode = huffmanTree; // Reset to root after decoding a symbol
                    }
                } else {
                    clearInterval(interval);
                    resolve();
                }
            }, 0); // Small delay for UI to update
        });

        // Step 5: Create a downloadable .txt file with the decoded text
        const blob = new Blob([decodedText], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = file.name.replace('.bin', '.txt');  // Download with the original name but .txt extension
        link.click();
    } catch (error) {
        console.error('Error during decompression:', error);
    }
}

// Helper function to read binary data as an array of bits (asynchronously)
function readBinaryFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function (event) {
            const arrayBuffer = event.target.result;
            const byteArray = new Uint8Array(arrayBuffer);
            let bits = '';
            byteArray.forEach(byte => {
                bits += byte.toString(2).padStart(8, '0');
            });
            resolve(bits); // Resolve the binary string
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

// Decompression button click handler
function decompressFiles() {
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];

    if (file && file.name.endsWith('.bin')) {
        decompressFile(file);
    } else {
        alert('Please upload a valid .bin file for decompression.');
    }
}

// Function to trigger file download
function decompress() {
    const filePath = "folder/sample.txt"; // Path to the file in your app
    const fileName = "sample.txt"; // File name for download

    // Create a temporary link element
    const link = document.createElement("a");
    link.href = filePath;
    link.download = fileName;

    // Append the link to the document, trigger the download, and remove the link
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}