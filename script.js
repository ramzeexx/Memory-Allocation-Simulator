// Memory Management Simulator
let processID = 0;
const MEMORY_CONTROL_BLOCK_SIZE = 16;
const MAX_MEMORY_SIZE = 1024; // Total memory size
let processes = [];

// Process Class
class Process {
    constructor(size, time) {
        this.id = processID++;
        this.size = size;
        this.timeLeft = time;
        this.allocatedBlock = null;
    }

    tick() {
        this.timeLeft--;
    }

    isAllocated() {
        return this.allocatedBlock !== null;
    }
}

// Memory Block Class
class MemoryBlock {
    constructor(size) {
        this.size = size;
        this.process = null;
        this.available = true;
        this.next = null;
        this.prev = null;
    }

    allocate(process) {
        if (process === null) {
            this.process = null;
            this.available = true;
        } else {
            this.process = process;
            this.available = false;
        }
    }
}

// Memory Manager
class MemoryManager {
    constructor(totalSize) {
        this.totalSize = totalSize;
        this.head = new MemoryBlock(totalSize);
        this.memoryDiv = document.getElementById('memory');
    }

    allocate(process) {
        let currentBlock = this.head;
        
        // Find first suitable block
        while (currentBlock) {
            if (currentBlock.available && currentBlock.size >= process.size) {
                // Allocate the block
                currentBlock.allocate(process);
                process.allocatedBlock = currentBlock;

                // Split block if significantly larger
                if (currentBlock.size > process.size + MEMORY_CONTROL_BLOCK_SIZE) {
                    const remainingBlock = new MemoryBlock(currentBlock.size - process.size);
                    remainingBlock.next = currentBlock.next;
                    currentBlock.next = remainingBlock;
                    currentBlock.size = process.size;
                }

                this.updateMemoryVisualization();
                return true;
            }
            currentBlock = currentBlock.next;
        }

        return false;
    }

    deallocate(process) {
        if (process.allocatedBlock) {
            process.allocatedBlock.allocate(null);
            process.allocatedBlock = null;
            this.mergeAdjacentFreeBlocks();
            this.updateMemoryVisualization();
        }
    }

    mergeAdjacentFreeBlocks() {
        let currentBlock = this.head;
        while (currentBlock && currentBlock.next) {
            if (currentBlock.available && currentBlock.next.available) {
                currentBlock.size += currentBlock.next.size;
                currentBlock.next = currentBlock.next.next;
            } else {
                currentBlock = currentBlock.next;
            }
        }
    }

    updateMemoryVisualization() {
        this.memoryDiv.innerHTML = '';
        let currentBlock = this.head;
        
        while (currentBlock) {
            const blockDiv = document.createElement('div');
            blockDiv.style.height = `${(currentBlock.size / this.totalSize) * 100}%`;
            blockDiv.classList.add('memory-block');
            blockDiv.classList.add(currentBlock.available ? 'available' : 'unavailable');
            
            const blockLabel = document.createElement('div');
            blockLabel.textContent = `${currentBlock.size}K`;
            blockLabel.classList.add('block-label');
            
            blockDiv.appendChild(blockLabel);
            this.memoryDiv.appendChild(blockDiv);
            
            currentBlock = currentBlock.next;
        }
    }
}

// Initialize Memory Manager
const memoryManager = new MemoryManager(1024);

// Simulation Clock
const simulationClock = setInterval(() => {
    for (let i = processes.length - 1; i >= 0; i--) {
        const process = processes[i];
        
        if (!process.isAllocated()) {
            // Try to allocate if not already allocated
            memoryManager.allocate(process);
        } else {
            // Tick down process time
            process.tick();
            
            // Remove process if time is up
            if (process.timeLeft <= 0) {
                memoryManager.deallocate(process);
                removeProcessFromTable(process);
                processes.splice(i, 1);
                updateProcessTable();
            }
        }
    }
}, 1000);

// Add Process Form Handling
document.getElementById('processForm').addEventListener('submit', (event) => {
    event.preventDefault();
    
    const sizeInput = event.target.elements.processSize;
    const timeInput = event.target.elements.processTime;
    
    const size = parseInt(sizeInput.value);
    const time = parseInt(timeInput.value);
    
    const process = new Process(size, time);
    processes.push(process);
    
    addProcessToTable(process);
    
    // Reset form
    sizeInput.value = '';
    timeInput.value = '';
});

function addProcessToTable(process) {
    const tableBody = document.querySelector('#processTable tbody');
    const row = document.createElement('tr');
    row.id = `process-${process.id}`;
    
    row.innerHTML = `
        <td>${process.id}</td>
        <td>${process.size}K</td>
        <td>${process.timeLeft}</td>
    `;
    
    tableBody.appendChild(row);
}

function removeProcessFromTable(process) {
    const row = document.getElementById(`process-${process.id}`);
    if (row) row.remove();
}

function updateProcessTable() {
    const tableBody = document.querySelector('#processTable tbody');
    tableBody.innerHTML = '';
    
    processes.forEach(addProcessToTable);
}

// Initial memory visualization
memoryManager.updateMemoryVisualization();