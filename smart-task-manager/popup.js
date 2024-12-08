const taskInput = document.getElementById("task-input");
const startTimeInput = document.getElementById("start-time");
const endTimeInput = document.getElementById("end-time");
const addTaskButton = document.getElementById("add-task");
const taskList = document.getElementById("task-list");
const markDoneButton = document.getElementById("mark-done");
const blockStatusButton = document.getElementById("block-status");
const clearTasksButton = document.getElementById("clear-tasks");

// Save task to Chrome storage
addTaskButton.addEventListener("click", () => {
  const taskName = taskInput.value;
  const startTime = startTimeInput.value;
  const endTime = endTimeInput.value;

  if (!taskName || !startTime || !endTime) {
    alert("Please fill out all fields.");
    return;
  }

  const newTask = {
    name: taskName,
    start: startTime,
    end: endTime,
    completed: false,
  };

  chrome.storage.local.get(["tasks"], (result) => {
    const tasks = result.tasks || [];
    tasks.push(newTask);
    chrome.storage.local.set({ tasks }, () => {
      alert("Task added!");
      displayTasks(); // Refresh the task list
    });
  });

  // Clear input fields
  taskInput.value = "";
  startTimeInput.value = "";
  endTimeInput.value = "";
});

// Display tasks
function displayTasks() {
  chrome.storage.local.get(["tasks"], (result) => {
    const tasks = result.tasks || [];
    taskList.innerHTML = "";

    tasks.forEach((task, index) => {
      const li = document.createElement("li");
      li.textContent = `${task.name} (Start: ${task.start}, End: ${task.end}) [${task.completed ? "Done" : "Pending"}]`;
      li.setAttribute("data-index", index);
      taskList.appendChild(li);
    });
  });
}

// Mark a task as done
markDoneButton.addEventListener("click", () => {
  const pendingTask = [...taskList.children].find((li) =>
    li.textContent.includes("Pending")
  );

  if (!pendingTask) {
    alert("No pending tasks to mark as done.");
    return;
  }

  const selectedIndex = parseInt(pendingTask.getAttribute("data-index"));

  chrome.storage.local.get(["tasks"], (result) => {
    const tasks = result.tasks || [];
    if (tasks[selectedIndex]) {
      tasks[selectedIndex].completed = true;

      chrome.storage.local.set({ tasks }, () => {
        alert(`Task "${tasks[selectedIndex].name}" marked as done!`);
        displayTasks(); // Refresh the task list
      });
    }
  });
});

// Clear completed tasks
clearTasksButton.addEventListener("click", () => {
  chrome.storage.local.get(["tasks"], (result) => {
    const tasks = result.tasks || [];
    const remainingTasks = tasks.filter((task) => !task.completed);

    chrome.storage.local.set({ tasks: remainingTasks }, () => {
      alert("Completed tasks cleared!");
      displayTasks(); // Refresh the task list
    });
  });
});

// Check if websites should be blocked
blockStatusButton.addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "checkBlockingStatus" }, (response) => {
    alert(response.message);
  });
});

// Refresh task list on load
document.addEventListener("DOMContentLoaded", displayTasks);
