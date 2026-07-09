let trips = JSON.parse(localStorage.getItem("trips")) || [];
let selectedTripId = null;
let selectedItemId = null;
let currentPhoto = "";

function toggleSection(contentId, iconId) {
    const content = document.getElementById(contentId);
    const icon = document.getElementById(iconId);

    content.classList.toggle("hidden");
    icon.textContent = content.classList.contains("hidden") ? "+" : "−";
}

function saveData() {
    localStorage.setItem("trips", JSON.stringify(trips));
}

function generateId() {
    return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
}

function showMessage(text) {
    const message = document.getElementById("message");
    message.textContent = text;
    message.style.display = "block";

    setTimeout(() => {
        message.style.display = "none";
    }, 2500);
}

function getSelectedTrip() {
    return trips.find(trip => trip.id === selectedTripId);
}

function getSelectedItem() {
    const trip = getSelectedTrip();
    if (!trip) return null;

    return trip.items.find(item => item.id === selectedItemId);
}

function openTripModal(tripId = "") {
    const modal = document.getElementById("tripModal");

    document.getElementById("tripId").value = "";
    document.getElementById("tripName").value = "";
    document.getElementById("tripDestination").value = "";
    document.getElementById("tripStart").value = "";
    document.getElementById("tripEnd").value = "";
    document.getElementById("tripNotes").value = "";
    document.getElementById("tripModalTitle").textContent = "Cadastrar viagem";

    if (tripId) {
        const trip = trips.find(trip => trip.id === tripId);

        document.getElementById("tripId").value = trip.id;
        document.getElementById("tripName").value = trip.name;
        document.getElementById("tripDestination").value = trip.destination;
        document.getElementById("tripStart").value = trip.start;
        document.getElementById("tripEnd").value = trip.end;
        document.getElementById("tripNotes").value = trip.notes;
        document.getElementById("tripModalTitle").textContent = "Editar viagem";
    }

    modal.showModal();
}

function closeTripModal() {
    document.getElementById("tripModal").close();
}

function saveTrip() {
    const id = document.getElementById("tripId").value;
    const name = document.getElementById("tripName").value.trim();
    const destination = document.getElementById("tripDestination").value.trim();
    const start = document.getElementById("tripStart").value;
    const end = document.getElementById("tripEnd").value;
    const notes = document.getElementById("tripNotes").value.trim();

    if (!name) {
        showMessage("Informe o nome da viagem.");
        return;
    }

    if (id) {
        const trip = trips.find(trip => trip.id === id);

        trip.name = name;
        trip.destination = destination;
        trip.start = start;
        trip.end = end;
        trip.notes = notes;

        showMessage("Viagem atualizada.");
    } else {
        trips.push({
            id: generateId(),
            name,
            destination,
            start,
            end,
            notes,
            locations: [],
            items: []
        });

        showMessage("Viagem cadastrada.");
    }

    saveData();
    closeTripModal();
    renderTrips();

    if (selectedTripId) {
        selectTrip(selectedTripId);
    }
}

function renderTrips() {
    const container = document.getElementById("tripsList");
    container.innerHTML = "";

    if (trips.length === 0) {
        container.innerHTML = "<p class='small'>Nenhuma viagem cadastrada.</p>";
        return;
    }

    trips.forEach(trip => {
        const total = trip.items.length;
        const done = trip.items.filter(item => item.done).length;

        const div = document.createElement("div");
        div.className = "trip-card";

        if (trip.id === selectedTripId) {
            div.classList.add("active");
        }

        div.innerHTML = `
    <strong>${trip.name}</strong>
    <p class="small">${trip.destination || "Sem destino informado"}</p>
    <p class="small">${done}/${total} itens organizados</p>

    <div class="row">
        <button onclick="selectTrip('${trip.id}')">Abrir</button>
        <button class="secondary" onclick="openTripModal('${trip.id}')">Editar</button>
        <button class="danger" onclick="deleteTrip('${trip.id}')">Excluir</button>
    </div>
    `;

        container.appendChild(div);
    });
}

function selectTrip(id) {
    selectedTripId = id;
    selectedItemId = null;

    const trip = getSelectedTrip();

    document.getElementById("tripDetails").classList.remove("hidden");
    document.getElementById("selectedTripTitle").textContent = trip.name;

    let info = trip.destination || "Sem destino";
    if (trip.start || trip.end) {
        info += ` • ${trip.start || "?"} até ${trip.end || "?"}`;
    }

    document.getElementById("selectedTripInfo").textContent = info;

    renderTrips();
    renderLocations();
    renderLocationOptions();
    renderItems();
    updateProgress();
    updateSelectedItemPanel();
}

function deleteTrip(id) {
    const confirmed = confirm("Deseja excluir esta viagem?");

    if (!confirmed) return;

    trips = trips.filter(trip => trip.id !== id);

    if (selectedTripId === id) {
        selectedTripId = null;
        selectedItemId = null;
        document.getElementById("tripDetails").classList.add("hidden");
    }

    saveData();
    renderTrips();
    showMessage("Viagem excluída.");
}

function openLocationModal() {
    if (!selectedTripId) {
        showMessage("Selecione uma viagem primeiro.");
        return;
    }

    document.getElementById("locationName").value = "";
    document.getElementById("locationModal").showModal();
}

function closeLocationModal() {
    document.getElementById("locationModal").close();
}

function saveLocation() {
    const trip = getSelectedTrip();
    const name = document.getElementById("locationName").value.trim();

    if (!name) {
        showMessage("Informe o nome do local.");
        return;
    }

    trip.locations.push({
        id: generateId(),
        name
    });

    saveData();
    closeLocationModal();

    renderLocations();
    renderLocationOptions();

    showMessage("Local cadastrado.");
}

function renderLocations() {
    const trip = getSelectedTrip();
    const container = document.getElementById("locationsList");

    container.innerHTML = "";

    if (!trip || trip.locations.length === 0) {
        container.innerHTML = "<p class='small'>Nenhum local cadastrado.</p>";
        return;
    }

    trip.locations.forEach(location => {
        const count = trip.items.filter(item => item.locationId === location.id).length;

        const div = document.createElement("div");
        div.className = "location-pill";

        div.innerHTML = `
    <strong>${location.name}</strong>
    <p class="small">${count} item(ns)</p>
    <button class="danger" onclick="deleteLocation('${location.id}')">
        Excluir
    </button>
    `;

        container.appendChild(div);
    });
}

function deleteLocation(locationId) {
    const trip = getSelectedTrip();
    const confirmed = confirm("Excluir este local? Os itens ficarão sem local definido.");

    if (!confirmed) return;

    trip.locations = trip.locations.filter(location => location.id !== locationId);

    trip.items.forEach(item => {
        if (item.locationId === locationId) {
            item.locationId = "";
        }
    });

    saveData();
    renderLocations();
    renderLocationOptions();
    renderItems();
    updateSelectedItemPanel();

    showMessage("Local excluído.");
}

function renderLocationOptions() {
    const trip = getSelectedTrip();
    const select = document.getElementById("itemLocation");

    select.innerHTML = `<option value="">Sem local definido</option>`;

    if (!trip) return;

    trip.locations.forEach(location => {
        const option = document.createElement("option");
        option.value = location.id;
        option.textContent = location.name;
        select.appendChild(option);
    });
}

function openItemModal(itemId = "") {
    if (!selectedTripId) {
        showMessage("Selecione uma viagem primeiro.");
        return;
    }

    currentPhoto = "";

    document.getElementById("itemId").value = "";
    document.getElementById("itemName").value = "";
    document.getElementById("itemQuantity").value = 1;
    document.getElementById("itemCategory").value = "Vestuário";
    document.getElementById("itemLocation").value = "";
    document.getElementById("itemPriority").value = "Normal";
    document.getElementById("itemNotes").value = "";
    document.getElementById("itemPhoto").value = "";
    document.getElementById("photoPreview").innerHTML = "";
    document.getElementById("itemModalTitle").textContent = "Cadastrar item";

    renderLocationOptions();

    if (itemId) {
        const trip = getSelectedTrip();
        const item = trip.items.find(item => item.id === itemId);

        document.getElementById("itemId").value = item.id;
        document.getElementById("itemName").value = item.name;
        document.getElementById("itemQuantity").value = item.quantity;
        document.getElementById("itemCategory").value = item.category;
        document.getElementById("itemLocation").value = item.locationId;
        document.getElementById("itemPriority").value = item.priority;
        document.getElementById("itemNotes").value = item.notes;
        document.getElementById("itemModalTitle").textContent = "Editar item";

        currentPhoto = item.photo || "";

        if (currentPhoto) {
            document.getElementById("photoPreview").innerHTML = `
            <img src="${currentPhoto}" class="preview" />
          `;
        }
    }

    document.getElementById("itemModal").showModal();
}

function closeItemModal() {
    document.getElementById("itemModal").close();
}

function saveItem() {
    const trip = getSelectedTrip();

    const id = document.getElementById("itemId").value;
    const name = document.getElementById("itemName").value.trim();
    const quantity = document.getElementById("itemQuantity").value || 1;
    const category = document.getElementById("itemCategory").value;
    const locationId = document.getElementById("itemLocation").value;
    const priority = document.getElementById("itemPriority").value;
    const notes = document.getElementById("itemNotes").value.trim();
    const photoInput = document.getElementById("itemPhoto");

    if (!name) {
        showMessage("Informe o nome do item.");
        return;
    }

    if (photoInput.files && photoInput.files[0]) {
        const reader = new FileReader();

        reader.onload = function (event) {
            saveItemData(event.target.result);
        };

        reader.readAsDataURL(photoInput.files[0]);
    } else {
        saveItemData(currentPhoto);
    }

    function saveItemData(photo) {
        if (id) {
            const item = trip.items.find(item => item.id === id);

            item.name = name;
            item.quantity = quantity;
            item.category = category;
            item.locationId = locationId;
            item.priority = priority;
            item.notes = notes;
            item.photo = photo;

            showMessage("Item atualizado.");
        } else {
            trip.items.push({
                id: generateId(),
                name,
                quantity,
                category,
                locationId,
                priority,
                notes,
                photo,
                done: false
            });

            showMessage("Item cadastrado.");
        }

        saveData();
        closeItemModal();

        renderItems();
        renderTrips();
        renderLocations();
        updateProgress();
        updateSelectedItemPanel();
    }
}

function renderItems() {
    const trip = getSelectedTrip();
    const container = document.getElementById("itemsList");

    container.innerHTML = "";

    if (!trip) return;

    const search = document.getElementById("searchInput").value.toLowerCase();
    const filter = document.getElementById("filterStatus").value;

    let items = trip.items.filter(item => {
        const location = trip.locations.find(location => location.id === item.locationId);
        const locationName = location ? location.name.toLowerCase() : "";

        const matchesSearch =
            item.name.toLowerCase().includes(search) ||
            item.category.toLowerCase().includes(search) ||
            locationName.includes(search);

        if (!matchesSearch) return false;

        if (filter === "pendentes") return !item.done;
        if (filter === "organizados") return item.done;
        if (filter === "sem-local") return !item.locationId;

        return true;
    });

    if (items.length === 0) {
        container.innerHTML = "<p class='small'>Nenhum item encontrado.</p>";
        return;
    }

    items.forEach(item => {
        const location = trip.locations.find(location => location.id === item.locationId);

        const div = document.createElement("div");
        div.className = "item-row";

        if (item.id === selectedItemId) {
            div.classList.add("selected");
        }

        const priorityClass = item.priority === "Alta" ? "high" : "";
        const locationClass = location ? "" : "warning";

        div.innerHTML = `
    <input
        type="checkbox"
        ${item.done ? "checked" : ""}
        onclick="event.stopPropagation(); toggleItem('${item.id}')"
    />

    <div class="item-main">
        <div class="item-line">
            <div class="item-title ${item.done ? " done" : ""}">
            ${item.name}
        </div>

        <div class="item-meta">
            <span class="badge">Qtd: ${item.quantity}</span>
            <span class="badge">${item.category}</span>
            <span class="badge ${locationClass}">
                ${location ? location.name : "Sem local"}
            </span>
            <span class="badge ${priorityClass}">
                ${item.priority}
            </span>
        </div>
    </div>

    ${item.notes ? `<div class="item-notes">${item.notes}</div>` : ""}
</div>
`;

        div.onclick = function () {
            selectItem(item.id);
        };

        container.appendChild(div);
    });
}

function selectItem(itemId) {
    selectedItemId = itemId;

    renderItems();
    updateSelectedItemPanel();
}

function clearSelectedItem() {
    selectedItemId = null;

    renderItems();
    updateSelectedItemPanel();
}

function updateSelectedItemPanel() {
    const item = getSelectedItem();

    const text = document.getElementById("selectedItemText");
    const editButton = document.getElementById("editItemButton");
    const deleteButton = document.getElementById("deleteItemButton");
    const clearButton = document.getElementById("clearItemButton");

    if (!item) {
        text.textContent = "Nenhum item selecionado.";
        editButton.disabled = true;
        deleteButton.disabled = true;
        clearButton.disabled = true;
        return;
    }

    text.textContent = `Selecionado: ${item.name} `;
    editButton.disabled = false;
    deleteButton.disabled = false;
    clearButton.disabled = false;
}

function editSelectedItem() {
    if (!selectedItemId) {
        showMessage("Selecione um item primeiro.");
        return;
    }

    openItemModal(selectedItemId);
}

function deleteSelectedItem() {
    const trip = getSelectedTrip();

    if (!selectedItemId) {
        showMessage("Selecione um item primeiro.");
        return;
    }

    const confirmed = confirm("Deseja excluir o item selecionado?");

    if (!confirmed) return;

    trip.items = trip.items.filter(item => item.id !== selectedItemId);
    selectedItemId = null;

    saveData();

    renderItems();
    renderTrips();
    renderLocations();
    updateProgress();
    updateSelectedItemPanel();

    showMessage("Item excluído.");
}

function toggleItem(itemId) {
    const trip = getSelectedTrip();
    const item = trip.items.find(item => item.id === itemId);

    item.done = !item.done;

    saveData();

    renderItems();
    renderTrips();
    updateProgress();
    updateSelectedItemPanel();
}

function updateProgress() {
    const trip = getSelectedTrip();

    if (!trip) return;

    const total = trip.items.length;
    const done = trip.items.filter(item => item.done).length;
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);

    document.getElementById("progressText").textContent = `${done} de ${total} itens organizados`;
    document.getElementById("progressBar").style.width = `${percent}% `;
}

renderTrips();