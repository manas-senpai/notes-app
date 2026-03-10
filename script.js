const template = {
  categories: ["work", "personal", "Study"],
  notes: []
};

function getPayload() {
  const data = localStorage.getItem("data");
  if (!data) {
    return template;
  }

  return JSON.parse(data);
}

function savePayload(payload) {
  localStorage.setItem("data", JSON.stringify(payload));
}

function ensureNoteId(note) {
  if (note && (note.id === undefined || note.id === null)) {
    note.id = Math.floor(Math.random() * 1000000000);
  }
  return note;
}

function createNoteCard(note) {
  ensureNoteId(note);

  const card = document.createElement("article");
  card.className = "card";
  card.dataset.noteId = String(note.id);

  const title = document.createElement("h3");
  title.className = "card-title";
  title.textContent = note?.title || "Untitled";

  const category = document.createElement("div");
  category.className = "card-category";
  category.textContent = note?.category || "uncategorized";

  const description = document.createElement("div");
  description.className = "card-description";
  description.textContent = note?.description || "";

  const date = document.createElement("p");
  date.className = "card-date";
  date.textContent = note?.date ? `created at: ${note.date.slice(0, 10)}` : "";


  const actions = document.createElement("div");
  actions.className = "card-actions";

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "card-button-edit";
  editBtn.textContent = "Edit";

  editBtn.dataset.noteId = String(note.id);

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "card-button-delete";
  deleteBtn.textContent = "Delete";
  deleteBtn.dataset.noteId = String(note.id);

  actions.append(editBtn, deleteBtn);
  card.append(title, category, description, date, actions);
  return card;
}

function setupNoteEvents() {
  const container = document.getElementById("notes-grid");

  container.addEventListener("click", (e) => {
    const target = e.target;
    if (!target) return;

    const deleteBtn = target.closest?.(".card-button-delete");
    if (deleteBtn) {
      const noteIdAttr = deleteBtn.dataset.noteId;
      if (!noteIdAttr) return;
      const noteId = Number(noteIdAttr);
      if (!Number.isFinite(noteId)) return;

      const payload = getPayload();
      const notes = Array.isArray(payload.notes) ? payload.notes : [];
      const noteIndex = notes.findIndex((n) => n && n.id === noteId);
      if (noteIndex === -1) return;

      const note = notes[noteIndex];
      const ok = confirm(`Are you sure you want to delete ${(note && note.title) || "Untitled"} ?`);
      if (!ok) return;

      notes.splice(noteIndex, 1);
      payload.notes = notes;
      savePayload(payload);
      renderNotes();
      return;
    }

    const editBtn = target.closest?.(".card-button-edit");
    if (editBtn) {
      const noteIdAttr = editBtn.dataset.noteId;
      if (!noteIdAttr) return;
      const noteId = Number(noteIdAttr);
      if (!Number.isFinite(noteId)) return;
      window.location.href = `/add-note.html?edit=${encodeURIComponent(
        String(noteId)
      )}`;
    }
  });
}

function renderNotes() {
  const container = document.getElementById("notes-grid");


  if (!container) return;

  const payload = getPayload();
  const allNotes = Array.isArray(payload.notes) ? payload.notes : [];

  const searchInput = document.getElementById("notes-search");
  const rawQuery = searchInput && "value" in searchInput ? searchInput.value : "";
  const query = String(rawQuery || "").toLowerCase().trim();


  const sortSelect = document.getElementById("notes-sort");
  const sortValue = sortSelect && "value" in sortSelect ? sortSelect.value : "latest";

  const categorySelect = document.getElementById("notes-category-filter");
  const selectedCategory =
    categorySelect && "value" in categorySelect ? categorySelect.value : "all";

  const notesFiltered = allNotes.filter((note) => {
    if (!note) return false;

    if (selectedCategory !== "all") {
      const cat = (note.category || "").toLowerCase();
      if (cat !== selectedCategory.toLowerCase()) return false;
    }

    if (query) {
      const title = (note.title || "").toLowerCase();
      const description = (note.description || "").toLowerCase();
      if (!title.includes(query) && !description.includes(query)) return false;
    }

    return true;
  });

  const notes = notesFiltered.sort((a, b) => {
    const aDate = a?.date || "";
    const bDate = b?.date || "";

    if (!aDate && !bDate) return 0;
    if (!aDate) return 1;
    if (!bDate) return -1;

    const cmp = aDate.localeCompare(bDate);
    return sortValue === "oldest" ? cmp : -cmp;
  });


  container.innerHTML = "";

  if (notes.length === 0) {
    const empty = document.createElement("div");
    empty.className = "notes-empty";
    empty.textContent = "No notes yet. Add a note to see it here.";
    container.appendChild(empty);
    return;
  }

  let rendered = 0;
  notes.forEach((note) => {
    container.appendChild(createNoteCard(note));
    rendered += 1;
  });

}

// new
function addCategoryUI(payload) {
  const select = document.getElementById("note-category");
  if (!select) return;
  select.innerHTML = "";

  const categories = Array.isArray(payload.categories) ? payload.categories : (Array.isArray(payload.category) ? payload.category : []);

  const placeholderOption = document.createElement("option");
  placeholderOption.value = "";
  placeholderOption.textContent = "Select category";
  placeholderOption.disabled = true;
  placeholderOption.selected = true;
  select.appendChild(placeholderOption);

  categories.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });

}

function addNote() {
  const form = document.getElementById("add-note-form");
  if (!form) return;

  const payload = getPayload();
  addCategoryUI(payload);

  const params = new URLSearchParams(window.location.search);
  const editParam = params.get("edit");
  const isEdit = editParam !== null;
  const editId = isEdit ? Number(editParam) : NaN;

  const titleInput = form.querySelector("#note-title");
  const categorySelect = form.querySelector("#note-category");
  const newcategorySelectInput = form.querySelector("#note-new-category");
  const descriptionInput = form.querySelector("#note-description");

  if (!(titleInput && categorySelect && newcategorySelectInput && descriptionInput)) return;

  if (isEdit && Number.isFinite(editId) && Array.isArray(payload.notes)) {
    const existingIndex = payload.notes.findIndex((n) => n && n.id === editId);
    const existingNote = existingIndex >= 0 ? payload.notes[existingIndex] : null;
    if (existingNote) {
      const heading = document.querySelector(".page-title");
      if (heading) heading.textContent = "EDIT NOTE";

      titleInput.value = existingNote.title || "";

      const categories = Array.isArray(payload.categories)
        ? payload.categories
        : (Array.isArray(payload.category) ? payload.category : []);

      const noteCategory = existingNote.category || "";
      if (noteCategory && !categories.includes(noteCategory)) {
        categories.push(noteCategory);
        payload.categories = categories;
        localStorage.setItem("data", JSON.stringify(payload));
        addCategoryUI(payload);
      }

      if (noteCategory) {
        categorySelect.value = noteCategory;
      }

      descriptionInput.value = existingNote.description || "";
    }
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const selectedCategory = categorySelect ? categorySelect.value.trim() : "";
    const newCategoryValue = newcategorySelectInput ? newcategorySelectInput.value.trim() : "";
    const category = selectedCategory || newCategoryValue;


    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();

    if (!title || !category || !description) {
      return;
    }

    if (newCategoryValue && !selectedCategory) {
      if (!Array.isArray(payload.categories)) {
        payload.categories = payload.category ? [...payload.category] : [];
      }
      if (!payload.categories.includes(newCategoryValue)) {
        payload.categories.push(newCategoryValue);
      }
    }

    if (!Array.isArray(payload.notes)) {
      payload.notes = [];
    }

    if (isEdit && Number.isFinite(editId)) {
      const idx = payload.notes.findIndex((n) => n && n.id === editId);
      if (idx >= 0) {
        const existing = payload.notes[idx];
        payload.notes[idx] = {
          ...existing,
          title,
          category,
          description,
        };
      }
    } else {
      const date = new Date();
      const newNote = {
        id: Math.floor(Math.random() * 1000000000),
        title,
        category,
        description,
        date,
      };
      payload.notes.push(newNote);
    }
    addCategoryUI(payload)
    localStorage.setItem("data", JSON.stringify(payload));

    if (isEdit) {
      window.location.href = "index.html";
      return;
    }

    titleInput.value = "";
    categorySelect.value = "";
    newcategorySelectInput.value = "";
    descriptionInput.value = "";
    alert("note has been added successfully");

  });
}

addNote();


// theme for add note page got it from AI
(function initTheme() {
  const themeToggle = document.getElementById("checkbox");

  const applyTheme = (theme) => {
    document.documentElement.dataset.theme = theme;
  };

  const getPreferredTheme = () => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved;
    if (document.documentElement.dataset.theme) return document.documentElement.dataset.theme;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  };

  const currentTheme = getPreferredTheme();
  applyTheme(currentTheme);

  if (themeToggle) {
    themeToggle.checked = currentTheme === "light";

    themeToggle.addEventListener("change", (e) => {
      const newTheme = e.target.checked ? "light" : "dark";

      if (document.startViewTransition) {
        const rect = e.target.getBoundingClientRect();
        const x = rect.left + rect.width / 2 + "px";
        const y = rect.top + rect.height / 2 + "px";
        document.documentElement.style.setProperty("--theme-circle-x", x);
        document.documentElement.style.setProperty("--theme-circle-y", y);
        document.startViewTransition(() => applyTheme(newTheme));
      } else {
        applyTheme(newTheme);
      }

      localStorage.setItem("theme", newTheme);
    });
  }
})();

// old event listner

document.addEventListener("DOMContentLoaded", () => {
  setupNoteEvents();
  renderNotes();

  const searchInput = document.getElementById("notes-search");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      renderNotes();
    });
  }
  const sortSelect = document.getElementById("notes-sort");
  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      renderNotes();
    });
  }

  const categorySelect = document.getElementById("notes-category-filter");
  if (categorySelect) {
    const payload = getPayload();
    const categories = Array.isArray(payload.categories)
      ? payload.categories
      : Array.isArray(payload.category)
        ? payload.category
        : [];

    const existing = new Set();
    Array.from(categorySelect.options).forEach((opt) => {
      if (opt.value && opt.value !== "all") existing.add(opt.value.toLowerCase());
    });

    categories.forEach((cat) => {
      if (!cat) return;
      const key = String(cat).toLowerCase();
      if (existing.has(key)) return;
      const opt = document.createElement("option");
      opt.value = cat.toLowerCase();
      opt.textContent = cat;
      categorySelect.appendChild(opt);
      existing.add(key);
    });

    categorySelect.addEventListener("change", () => {
      renderNotes();
    });
  }




  // theme stuff got it from docs
  const themeToggle = document.getElementById("checkbox");
  const applyTheme = (theme) => {
    document.documentElement.dataset.theme = theme;
  };
  const getPreferredTheme = () => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved;
    if (document.documentElement.dataset.theme) return document.documentElement.dataset.theme;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  };

  const currentTheme = getPreferredTheme();
  applyTheme(currentTheme);

  if (themeToggle) {
    themeToggle.checked = currentTheme === "light";

    themeToggle.addEventListener("change", (e) => {
      const newTheme = e.target.checked ? "light" : "dark";

      if (document.startViewTransition) {
        const rect = e.target.getBoundingClientRect();
        const x = rect.left + rect.width / 2 + "px";
        const y = rect.top + rect.height / 2 + "px";
        document.documentElement.style.setProperty("--theme-circle-x", x);
        document.documentElement.style.setProperty("--theme-circle-y", y);
        document.startViewTransition(() => applyTheme(newTheme));
      } else {
        applyTheme(newTheme);
      }

      localStorage.setItem("theme", newTheme);
    });
  }
});

