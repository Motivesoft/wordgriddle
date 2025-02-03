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
  
  // Function to move selected words to another list
  function moveSelected(fromListId, toListId) {
    const fromList = document.getElementById(fromListId).querySelector("ul");
    const toList = document.getElementById(toListId).querySelector("ul");
  
    // Get all checked items
    const checkedItems = fromList.querySelectorAll("input[type='checkbox']:checked");
  
    checkedItems.forEach((checkbox) => {
      const listItem = checkbox.closest("li"); // Get the parent <li> element
      toList.appendChild(listItem); // Move to the target list
      checkbox.checked = false; // Uncheck the checkbox
    });
  }
  
  // Initialize with a default grid
  createGrid(3);