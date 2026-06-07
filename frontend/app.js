const monthCalendar = document.getElementById("monthCalendar");
const addTaskBtn = document.getElementById("addTaskBtn");
const monthTitle = document.getElementById("monthTitle");

const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");

const taskModal = document.getElementById("taskModal");
const closeModal = document.getElementById("closeModal");
const modalDate = document.getElementById("modalDate");
const modalTasks = document.getElementById("modalTasks");

const totalTasks = document.getElementById("totalTasks");
const completedTasks = document.getElementById("completedTasks");
const pendingTasks = document.getElementById("pendingTasks");
const upcomingTasksDiv = document.getElementById("upcomingTasks");

const checkApiBtn = document.getElementById("checkApiBtn");
const apiResult = document.getElementById("apiResult");

let tasks = JSON.parse(localStorage.getItem("tasks")) || {};

let currentDate = new Date();
let currentYear = currentDate.getFullYear();
let currentMonth = currentDate.getMonth();

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function createMonthCalendar() {
    monthCalendar.innerHTML = "";

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    monthTitle.textContent = `${monthNames[currentMonth]} ${currentYear}`;

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement("div");
        emptyCell.className = "day-cell empty";
        monthCalendar.appendChild(emptyCell);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateCell = document.createElement("div");
        dateCell.className = "day-cell";

        const fullDate = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        dateCell.id = fullDate;

        dateCell.innerHTML = `<div class="date-number">${day}</div>`;

        if (tasks[fullDate] && tasks[fullDate].length > 0) {
            const totalTasksForDay = tasks[fullDate].length;
            const completedForDay = tasks[fullDate].filter(task => task.completed).length;

            const count = document.createElement("div");
            count.className = "task-count";
            count.innerHTML = `${completedForDay}/${totalTasksForDay} Completed`;
            dateCell.appendChild(count);
        }

        dateCell.addEventListener("click", function () {
            openTasksModal(fullDate);
        });

        monthCalendar.appendChild(dateCell);
    }

    updateStats();
    updateUpcomingTasks();
}

addTaskBtn.addEventListener("click", function () {
    const taskInput = document.getElementById("taskInput");
    const dateInput = document.getElementById("dateInput");
    const timeInput = document.getElementById("timeInput");
    const categoryInput = document.getElementById("categoryInput");

    const task = taskInput.value;
    const date = dateInput.value;
    const time = timeInput.value;
    const category = categoryInput.value;

    if (task === "" || date === "" || time === "") {
        alert("Please enter task, date and time");
        return;
    }

    if (!tasks[date]) {
        tasks[date] = [];
    }

    tasks[date].push({
        task: task,
        time: time,
        category: category,
        completed: false
    });

    saveTasks();

    taskInput.value = "";
    dateInput.value = "";
    timeInput.value = "";

    createMonthCalendar();
});

function openTasksModal(date) {
    modalDate.textContent = date;
    modalTasks.innerHTML = "";

    if (tasks[date]) {
        tasks[date].sort((a, b) => a.time.localeCompare(b.time));
    }

    if (!tasks[date] || tasks[date].length === 0) {
        modalTasks.innerHTML = "<p>No tasks for this day</p>";
    } else {
        tasks[date].forEach(function (item, index) {
            const taskItem = document.createElement("div");
            taskItem.className = `task-item category-${item.category}`;

            if (item.completed) {
                taskItem.classList.add("completed");
            }

            taskItem.innerHTML = `
                <strong>${item.time}</strong> - ${item.task}<br>
                <small>Category: ${item.category}</small>

                <div class="task-actions">
                    <button class="done-btn" onclick="toggleComplete('${date}', ${index})">Done</button>
                    <button class="edit-btn" onclick="editTask('${date}', ${index})">Edit</button>
                    <button class="delete-btn" onclick="deleteTask('${date}', ${index})">Delete</button>
                </div>
            `;

            modalTasks.appendChild(taskItem);
        });
    }

    taskModal.style.display = "block";
}

function toggleComplete(date, index) {
    tasks[date][index].completed = !tasks[date][index].completed;
    saveTasks();
    openTasksModal(date);
    createMonthCalendar();
}

function editTask(date, index) {
    const newTask = prompt("Edit task:", tasks[date][index].task);

    if (newTask !== null && newTask.trim() !== "") {
        tasks[date][index].task = newTask;
        saveTasks();
        openTasksModal(date);
        createMonthCalendar();
    }
}

function deleteTask(date, index) {
    tasks[date].splice(index, 1);

    if (tasks[date].length === 0) {
        delete tasks[date];
    }

    saveTasks();
    openTasksModal(date);
    createMonthCalendar();
}

function updateStats() {
    let total = 0;
    let completed = 0;

    Object.keys(tasks).forEach(function (date) {
        tasks[date].forEach(function (task) {
            total++;
            if (task.completed) {
                completed++;
            }
        });
    });

    totalTasks.textContent = total;
    completedTasks.textContent = completed;
    pendingTasks.textContent = total - completed;
}

function updateUpcomingTasks() {
    upcomingTasksDiv.innerHTML = "";

    let upcoming = [];

    Object.keys(tasks).forEach(date => {
        tasks[date].forEach(task => {
            if (!task.completed) {
                upcoming.push({
                    date: date,
                    time: task.time,
                    task: task.task
                });
            }
        });
    });

    upcoming.sort((a, b) => {
        return new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`);
    });

    if (upcoming.length === 0) {
        upcomingTasksDiv.innerHTML = "<p>No upcoming tasks</p>";
        return;
    }

    upcoming.slice(0, 5).forEach(item => {
        const div = document.createElement("div");
        div.className = "upcoming-item";
        div.innerHTML = `<strong>${item.date}</strong> ${item.time} - ${item.task}`;
        upcomingTasksDiv.appendChild(div);
    });
}

checkApiBtn.addEventListener("click", function () {
    apiResult.textContent = "Checking serverless API...";

    fetch("https://k0b2fbyyzd.execute-api.il-central-1.amazonaws.com/status")
        .then(response => response.json())
        .then(data => {
            apiResult.textContent = data.message + " (" + data.service + ")";
        })
        .catch(error => {
            apiResult.textContent = "Error connecting to Serverless API";
            console.error(error);
        });
});

prevMonthBtn.addEventListener("click", function () {
    currentMonth--;

    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }

    createMonthCalendar();
});

nextMonthBtn.addEventListener("click", function () {
    currentMonth++;

    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }

    createMonthCalendar();
});

closeModal.addEventListener("click", function () {
    taskModal.style.display = "none";
});

createMonthCalendar();