const fileDetails = document.getElementById("file-details");
const originalSizeDisplay = document.getElementById("original-size");
const compressedSizeDisplay = document.getElementById("compressed-size");
const decompressedSizeDisplay = document.getElementById("Decompressed-size");
const downloadButton = document.getElementById("download-button");

let uploadedFile = null;
let compressedFile = null;

// MinHeap class
class MinHeap {
  constructor() {
    this.heap_array = [];
  }

  size() {
    return this.heap_array.length;
  }

  empty() {
    return this.size() === 0;
  }

  push(value) {
    this.heap_array.push(value);
    this.up_heapify();
  }

  up_heapify() {
    let current_index = this.size() - 1;
    while (current_index > 0) {
      let current_element = this.heap_array[current_index];
      let parent_index = Math.trunc((current_index - 1) / 2);
      let parent_element = this.heap_array[parent_index];

      if (parent_element[0] < current_element[0]) break;

      this.heap_array[parent_index] = current_element;
      this.heap_array[current_index] = parent_element;
      current_index = parent_index;
    }
  }

  top() {
    return this.heap_array[0];
  }

  pop() {
    if (!this.empty()) {
      const last_index = this.size() - 1;
      this.heap_array[0] = this.heap_array[last_index];
      this.heap_array.pop();
      this.down_heapify();
    }
  }

  down_heapify() {
    let current_index = 0;
    let current_element = this.heap_array[0];
    while (current_index < this.size()) {
      const child_index1 = current_index * 2 + 1;
      const child_index2 = current_index * 2 + 2;

      if (child_index1 >= this.size() && child_index2 >= this.size()) break;

      let smallerChildIndex =
        child_index2 >= this.size() ||
        this.heap_array[child_index1][0] < this.heap_array[child_index2][0]
          ? child_index1
          : child_index2;

      if (current_element[0] < this.heap_array[smallerChildIndex][0]) break;

      this.heap_array[current_index] = this.heap_array[smallerChildIndex];
      this.heap_array[smallerChildIndex] = current_element;
      current_index = smallerChildIndex;
    }
  }
}

// Codec class
class Codec {
  constructor() {
    this.codes = {};
    this.index = 0; // To handle the tree string index for decompression
  }

  // Helper function to get Huffman codes from the tree
  getCodes(node, curr_code) {
    if (typeof node[1] === "string") {
      this.codes[node[1]] = curr_code;
      return;
    }

    this.getCodes(node[1][0], curr_code + "0");
    this.getCodes(node[1][1], curr_code + "1");
  }

  // Convert Huffman tree to string
  make_string(node) {
    if (typeof node[1] === "string") {
      return "'" + node[1];
    }
    return (
      "0" + this.make_string(node[1][0]) + "1" + this.make_string(node[1][1])
    );
  }

  // Convert tree string back into a Huffman tree
  make_tree(tree_string) {
    let node = [];
    if (tree_string[this.index] === "'") {
      this.index++;
      node.push(tree_string[this.index]);
      this.index++;
      return node;
    }
    this.index++;
    node.push(this.make_tree(tree_string)); // find and push left child
    this.index++;
    node.push(this.make_tree(tree_string)); // find and push right child
    return node;
  }

  // Encoding function to compress data
  encode(data) {
    this.heap = new MinHeap();
    const mp = new Map();

    // Count frequency of each character in the data
    for (const char of data) {
      mp.set(char, (mp.get(char) || 0) + 1);
    }

    // Handle empty file case
    if (mp.size === 0) return ["zer#", "File is empty"];

    // Handle case where only one unique character exists
    if (mp.size === 1) {
      const [key, value] = [...mp][0];
      return [`one#${key}#${value}`, "Compression complete"];
    }

    // Push each character and its frequency into the heap
    for (const [key, value] of mp) {
      this.heap.push([value, key]);
    }

    // Build the Huffman tree
    while (this.heap.size() >= 2) {
      const min_node1 = this.heap.top();
      this.heap.pop();
      const min_node2 = this.heap.top();
      this.heap.pop();
      this.heap.push([min_node1[0] + min_node2[0], [min_node1, min_node2]]);
    }

    const huffman_tree = this.heap.top();
    this.heap.pop();
    this.codes = {};
    this.getCodes(huffman_tree, "");

    // Convert data into binary string
    let binary_string = "";
    for (let i = 0; i < data.length; i++) {
      binary_string += this.codes[data[i]];
    }

    // Add padding to make the binary string a multiple of 8
    const padding_length = (8 - (binary_string.length % 8)) % 8;
    binary_string += "0".repeat(padding_length);

    // Convert binary string into encoded data
    let encoded_data = "";
    for (let i = 0; i < binary_string.length; i += 8) {
      encoded_data += String.fromCharCode(
        parseInt(binary_string.slice(i, i + 8), 2)
      );
    }

    // Create the tree string
    const tree_string = this.make_string(huffman_tree);
    return [
      `${tree_string.length}#${padding_length}#${tree_string}${encoded_data}`,
      "Compression complete",
    ];
  }

  // Decoding function to decompress data
  decode(data) {
    let k = 0;
    let temp = "";

    // Read the initial part of the compressed data (until '#')
    while (k < data.length && data[k] !== "#") {
      temp += data[k];
      k++;
    }

    // Handle empty file case
    if (temp === "zer") {
      return ["", "Decompression complete"];
    }

    // Handle single-character file case
    if (temp === "one") {
      data = data.slice(k + 1);
      k = 0;
      temp = "";
      while (data[k] !== "#") {
        temp += data[k];
        k++;
      }
      let one_char = temp;
      data = data.slice(k + 1);
      let str_len = parseInt(data);
      let decoded_data = one_char.repeat(str_len);
      return [decoded_data, "Decompression complete"];
    }

    // Parse tree length and padding length
    data = data.slice(k + 1);
    let ts_length = parseInt(temp);
    k = 0;
    temp = "";
    while (data[k] !== "#") {
      temp += data[k];
      k++;
    }
    data = data.slice(k + 1);
    let padding_length = parseInt(temp);
    temp = "";

    // Extract the tree string and the encoded data
    for (k = 0; k < ts_length; k++) {
      temp += data[k];
    }
    data = data.slice(k);
    let tree_string = temp;

    temp = "";
    for (k = 0; k < data.length; k++) {
      temp += data[k];
    }
    let encoded_data = temp;

    // Reconstruct the Huffman tree from the tree string
    this.index = 0;
    const huffman_tree = this.make_tree(tree_string);

    // Convert the encoded data back into a binary string
    let binary_string = "";
    for (let i = 0; i < encoded_data.length; i++) {
      let curr_num = encoded_data.charCodeAt(i);
      let curr_binary = "";
      for (let j = 7; j >= 0; j--) {
        let foo = curr_num >> j;
        curr_binary = curr_binary + (foo & 1);
      }
      binary_string += curr_binary;
    }

    // Remove the padding from the binary string
    binary_string = binary_string.slice(0, -padding_length);

    // Decode the binary string using the Huffman tree
    let decoded_data = "";
    let node = huffman_tree;
    for (let i = 0; i < binary_string.length; i++) {
      node = binary_string[i] === "1" ? node[1] : node[0];

      // When we reach a leaf node, add the character to the decoded data
      if (typeof node[0] === "string") {
        decoded_data += node[0];
        node = huffman_tree;
      }
    }

    return [decoded_data, "Decompression complete"];
  }
}

const codecObj = new Codec();

//Handle File Upload
function handleFileUpload(files) {
  uploadedFile = files[0];
  fileDetails.textContent = `Uploaded File: ${uploadedFile.name} (${uploadedFile.size} bytes)`;
}

//Compress File
function compressFile() {
  if (!uploadedFile) {
    alert("Please upload a file first.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (event) {
    const text = event.target.result;
    const [compressedContent, outputMessage] = codecObj.encode(text);

    const originalSize = uploadedFile.size;
    const compressedSize = new Blob([compressedContent]).size;

    originalSizeDisplay.textContent = `Original Size: ${originalSize} bytes`;
    compressedSizeDisplay.textContent = `Compressed Size: ${compressedSize} bytes`;

    compressedFile = new Blob([compressedContent], { type: "text/plain" });
    downloadButton.style.display = "inline-block";
    downloadButton.onclick = downloadCompressedFile;
  };
  reader.readAsText(uploadedFile, "UTF-8");
}

//decompress File
function decompressFile() {
  if (!uploadedFile) {
    alert("Please upload a compressed file first.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (event) {
    const compressedData = event.target.result;
    const [decompressedContent, outputMessage] =
      codecObj.decode(compressedData);

    // Show message if decompression is complete or any other output message
    alert(outputMessage);

    // Show original and decompressed sizes
    const originalSize = uploadedFile.size;
    const decompressedSize = new Blob([decompressedContent]).size;

    originalSizeDisplay.textContent = `Original Size: ${originalSize} bytes`;
    decompressedSizeDisplay.textContent = `Decompressed Size: ${decompressedSize} bytes`;

    // Create a new Blob from the decompressed content and allow for downloading
    decompressedFile = new Blob([decompressedContent], { type: "text/plain" });
    downloadButton.style.display = "inline-block";
    downloadButton.onclick = downloadDecompressedFile;
  };

  reader.readAsText(uploadedFile, "UTF-8");
}

//Download Compressed File
function downloadCompressedFile() {
  const url = URL.createObjectURL(compressedFile);
  const a = document.createElement("a");
  a.href = url;
  a.download = `compressed_${uploadedFile.name}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function downloadDecompressedFile() {
  if (!decompressedFile) {
    alert("No decompressed file available to download.");
    return;
  }

  const url = URL.createObjectURL(decompressedFile);
  const a = document.createElement("a");
  a.href = url;
  a.download = `decompressed_${uploadedFile.name}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
