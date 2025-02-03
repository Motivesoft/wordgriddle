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
  
  // Function to update word counts
  function updateWordCounts() {
    const lists = ["list1", "list2", "list3"];
    lists.forEach((listId) => {
      const list = document.getElementById(listId).querySelector("ul");
      const countElement = document.getElementById(`count${listId.slice(-1)}`);
      countElement.textContent = list.children.length;
    });
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
  
    // Update word counts
    updateWordCounts();
  }
  
  // Button handlers
  function handleNew() {
    alert("New button clicked");
  }
  
  function handleLoad() {
    alert("Load button clicked");
  }
  
  function handleSave() {
    alert("Save button clicked");
  }
  
  function handleSolve() {
    alert("Solve button clicked");
  }
  
  function handlePublic() {
    alert("Public button clicked");
  }
  
  // Initialize with a default grid
  createGrid(3);
  updateWordCounts(); // Set initial word counts