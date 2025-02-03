function createGrid(size) {
    const grid = document.getElementById("grid");
    grid.innerHTML = ""; // Clear existing grid
  
    // Set grid dimensions
    grid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${size}, 1fr)`;
  
    // Create grid cells
    for (let i = 0; i < size * size; i++) {
      const cell = document.createElement("div");
      cell.classList.add("grid-cell");
      grid.appendChild(cell);
    }
  }
  
  // Initialize with a default grid
  createGrid(3);