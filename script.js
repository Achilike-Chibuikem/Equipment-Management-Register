// ---------- 1. CONNECT TO THE DATABASE ----------
// Paste YOUR values from Supabase (Project Settings -> API)
var SUPABASE_URL = "https://rdoadzqxtkuptdmtcsqr.supabase.co";
var SUPABASE_KEY = "sb_publishable_qbWWmBGlQbJ0f2_zQOABUw_pFIr5hCd";

var db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// If this is null we are adding a new record.
// If it holds an id, we are editing that record.
var editingId = null;

// ---------- 2. VIEW + SEARCH RECORDS  (SQL: SELECT) ----------
// "async" and "await" mean: wait here until the database replies.
async function loadRecords() {
  var searchText = document.getElementById("search").value.trim();

  // select * from equipment order by maintenance_date desc
  var query = db.from("equipment").select("*").order("maintenance_date", { ascending: false });

  // ... where name ilike '%searchText%'   (ilike = case-insensitive LIKE)
  if (searchText !== "") {
    query = query.ilike("name", "%" + searchText + "%");
  }

  var result = await query;

  if (result.error) {
    showMessage("Could not load records: " + result.error.message);
    return;
  }

  showTable(result.data);
}

// Build the table rows on the page
function showTable(records) {
  var body = document.getElementById("tableBody");
  body.innerHTML = "";

  if (records.length === 0) {
    body.innerHTML = "<tr><td colspan='5'>No records found.</td></tr>";
    return;
  }

  for (var i = 0; i < records.length; i++) {
    var record = records[i];
    var row = document.createElement("tr");

    row.appendChild(makeCell(record.name));
    row.appendChild(makeCell(record.location));
    row.appendChild(makeCell(record.status));
    row.appendChild(makeCell(formatDate(record.maintenance_date)));

    // Actions cell with Edit and Delete buttons
    var actions = document.createElement("td");
    actions.appendChild(makeButton("Edit", record, startEdit));
    actions.appendChild(makeButton("Delete", record, deleteRecord));
    row.appendChild(actions);

    body.appendChild(row);
  }
}

function makeCell(text) {
  var cell = document.createElement("td");
  cell.textContent = text;   // textContent is safe: it shows text only, never runs HTML
  return cell;
}

function makeButton(label, record, action) {
  var button = document.createElement("button");
  button.textContent = label;
  button.onclick = function () {
    action(record);
  };
  return button;
}

// Database gives 2026-10-08, we want 08/10/26
function formatDate(dateString) {
  var parts = dateString.split("-");
  return parts[2] + "/" + parts[1] + "/" + parts[0].slice(2);
}

// ---------- 3. ADD OR EDIT A RECORD  (SQL: INSERT / UPDATE) ----------
async function saveRecord() {
  var name = document.getElementById("nameInput").value.trim();
  var location = document.getElementById("locationInput").value.trim();
  var status = document.getElementById("statusInput").value;
  var date = document.getElementById("dateInput").value;

  // Validation
  if (name.length < 3) {
    showMessage("Equipment name must be at least 3 characters.");
    return;
  }
  if (location === "") {
    showMessage("Please enter a location.");
    return;
  }
  if (date === "") {
    showMessage("Please choose a date.");
    return;
  }

  var record = {
    name: name,
    location: location,
    status: status,
    maintenance_date: date
  };

  var result;

  if (editingId === null) {
    // insert into equipment (...) values (...)
    result = await db.from("equipment").insert(record);
  } else {
    // update equipment set ... where id = editingId
    result = await db.from("equipment").update(record).eq("id", editingId);
  }

  if (result.error) {
    showMessage("Could not save: " + result.error.message);
    return;
  }

  clearForm();
  loadRecords();
}

// ---------- 4. EDIT: put the record's values back into the form ----------
function startEdit(record) {
  document.getElementById("nameInput").value = record.name;
  document.getElementById("locationInput").value = record.location;
  document.getElementById("statusInput").value = record.status;
  document.getElementById("dateInput").value = record.maintenance_date;

  editingId = record.id;
  document.getElementById("saveButton").textContent = "Save Changes";
  document.getElementById("cancelButton").classList.remove("hidden");
  showMessage("");
}

function clearForm() {
  document.getElementById("nameInput").value = "";
  document.getElementById("locationInput").value = "";
  document.getElementById("statusInput").value = "Working";
  document.getElementById("dateInput").value = "";

  editingId = null;
  document.getElementById("saveButton").textContent = "Add Record";
  document.getElementById("cancelButton").classList.add("hidden");
  showMessage("");
}

// ---------- 5. DELETE A RECORD  (SQL: DELETE) ----------
async function deleteRecord(record) {
  var sure = confirm("Delete " + record.name + "?");
  if (!sure) {
    return;
  }

  // delete from equipment where id = record.id
  var result = await db.from("equipment").delete().eq("id", record.id);

  if (result.error) {
    showMessage("Could not delete: " + result.error.message);
    return;
  }

  loadRecords();
}

// ---------- 6. SMALL HELPER ----------
function showMessage(text) {
  document.getElementById("message").textContent = text;
}

// ---------- 7. START ----------
document.getElementById("search").addEventListener("input", loadRecords);
loadRecords();