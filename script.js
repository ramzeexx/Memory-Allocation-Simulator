var processID = 0;
var memControlBlockSize = 16;
var processes = [];

function Process(size, time) {
    this.size = size;
    this.timeLeft = time;
    this.allocatedBlock = null;
    this.id = processID++;
}

Process.prototype.isAllocated = function () {
    return this.allocatedBlock !== null;
};

Process.prototype.tick = function () {
    this.timeLeft -= 1;
};

function MemControlBlock(size) {
    this.size = size;
    this.process = null;
    this.available = true;
    this.next = null;
    this.prev = null;
    this.fromPartition = false;
}

MemControlBlock.prototype.setProcess = function (process) {
    if (process === null) {
        this.process = null;
        this.available = true;
    } else {
        this.process = process;
        this.available = false;
    }
};

function Heap() {
    this.head = null;
    this.size = 0;
}

Heap.prototype.requestAllocation = function (process) {
    let blockBestFit = this.head;
    while (blockBestFit && (blockBestFit.size < process.size || !blockBestFit.available)) {
        blockBestFit = blockBestFit.next;
    }
    if (!blockBestFit) return false;
    
    let block = blockBestFit.next;
    while (block) {
        if (block.size >= process.size && block.available && block.size < blockBestFit.size) {
            blockBestFit = block;
        }
        block = block.next;
    }
    
    let spaceLeftover = blockBestFit.size - (process.size + memControlBlockSize);
    if (spaceLeftover > 0) {
        let newBlock = new MemControlBlock(spaceLeftover);
        newBlock.next = blockBestFit.next;
        if (newBlock.next) newBlock.next.prev = newBlock;
        blockBestFit.next = newBlock;
        newBlock.prev = blockBestFit;
        blockBestFit.size = process.size;
        newBlock.fromPartition = true;
    }
    
    blockBestFit.setProcess(process);
    process.allocatedBlock = blockBestFit;
    return true;
};

Heap.prototype.deallocateProcess = function (process) {
    if (process.allocatedBlock) {
        process.allocatedBlock.setProcess(null);
        process.allocatedBlock = null;
    }
};

Heap.prototype.add = function (block) {
    if (!this.head) {
        this.head = block;
    } else {
        block.next = this.head;
        this.head.prev = block;
        this.head = block;
    }
    this.size += block.size;
};

Heap.prototype.repaint = function () {
    let block = this.head;
    let memoryDiv = document.getElementById("memory");
    memoryDiv.innerHTML = "";
    
    while (block) {
        let height = ((block.size / this.size) * 100);
        if (block.fromPartition) height += (memControlBlockSize / this.size) * 100;
        
        let divBlock = document.createElement("div");
        divBlock.style.height = height + "%";
        divBlock.setAttribute("id", "block");
        divBlock.className = block.available ? "available" : "unavailable";
        memoryDiv.appendChild(divBlock);
        
        let blockLabel = document.createElement("div");
        blockLabel.setAttribute("id", "blockLabel");
        blockLabel.style.height = height + "%";
        blockLabel.innerHTML = block.size + "K";
        if (height <= 2) blockLabel.style.display = "none";
        
        divBlock.appendChild(blockLabel);
        block = block.next;
    }
};

function log(string) {
    let logBox = document.getElementById("logBox");
    logBox.innerHTML += string + "<br />";
}

function addProcessToTable(process) {
    let row = document.createElement("tr");
    row.setAttribute("id", "process" + process.id);
    
    let colName = document.createElement("td");
    colName.innerHTML = process.id;
    let colSize = document.createElement("td");
    colSize.innerHTML = process.size;
    let colTime = document.createElement("td");
    colTime.setAttribute("id", "process" + process.id + "timeLeft");
    colTime.innerHTML = process.timeLeft;
    
    row.appendChild(colName);
    row.appendChild(colSize);
    row.appendChild(colTime);
    
    document.getElementById("processTable").appendChild(row);
}

function removeProcessFromTable(process) {
    let processRow = document.getElementById("process" + process.id);
    if (processRow) {
        processRow.parentNode.removeChild(processRow);
    }
}

function refreshTable() {
    for (let i = 0; i < processes.length; i++) {
        let process = processes[i];
        document.getElementById("process" + process.id + "timeLeft").innerHTML = process.timeLeft;
    }
}

var heap = new Heap();
var blockSizes = [256, 256, 256, 256];
for (let i = 0; i < blockSizes.length; i++) {
    heap.add(new MemControlBlock(blockSizes[i]));
}
heap.repaint();

var clock = setInterval(function () {
    for (let i = 0; i < processes.length; i++) {
        let process = processes[i];
        if (!process.isAllocated()) {
            heap.requestAllocation(process);
        } else {
            process.tick();
            if (process.timeLeft < 1) {
                heap.deallocateProcess(process);
                processes.splice(i, 1);
                removeProcessFromTable(process);
                refreshTable();
                heap.repaint();
            }
        }
    }
}, 1000);

document.getElementById("processForm").onsubmit = function () {
    let elements = this.elements;
    let inProcessSize = elements.namedItem("processSize");
    let inProcessTime = elements.namedItem("processTime");
    
    let process = new Process(parseInt(inProcessSize.value), parseInt(inProcessTime.value));
    heap.requestAllocation(process);
    heap.repaint();
    processes.push(process);
    addProcessToTable(process);
    
    log("Requesting: " + process.size);
    log(heap.toString() + "<br>");
    
    inProcessSize.value = "";
    inProcessTime.value = "";
    
    return false;
};
