const JOBS_SCRIPT_URL = window.EMAS_CONFIG.RECRUITMENT_SCRIPT_URL;

async function jobsApi_(payload) {
    const readServerJobs = async () => {
        const response = await fetch(`${JOBS_SCRIPT_URL}?type=job&_=${Date.now()}`, { cache: "no-store" });
        const result = await response.json();
        if (!result.ok || !Array.isArray(result.jobs)) {
            throw new Error(result.message || "Gagal membaca daftar lowongan dari server.");
        }
        return result.jobs;
    };

    const action = String(payload.action || "list").toLowerCase();
    const beforeJobs = await readServerJobs();
    if (action === "list") return { ok: true, jobs: beforeJobs };

    const params = new URLSearchParams({ type: "job" });
    Object.entries(payload).forEach(([key, value]) => {
        params.set(key, Array.isArray(value) ? value.join("\n") : String(value == null ? "" : value));
    });

    // Apps Script membalas POST dengan halaman HTML, jadi kirim tanpa membaca
    // respons POST, lalu konfirmasi perubahan dengan membaca daftar JSON.
    await fetch(JOBS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        body: params,
    });
    const jobs = await readServerJobs();
    const byId = new Map(jobs.map((job) => [String(job.id), job]));
    const beforeIds = new Set(beforeJobs.map((job) => String(job.id)));
    const qualificationsText = (value) => (Array.isArray(value) ? value : String(value || "").split(/\r?\n/))
        .map((item) => String(item).trim()).filter(Boolean).join("\n");
    const matchesPayload = (job) => job &&
        String(job.title || "") === String(payload.title || "") &&
        qualificationsText(job.qualifications) === qualificationsText(payload.qualifications) &&
        Boolean(job.active) === (String(payload.active).toLowerCase() === "true") &&
        (payload.imageBase64 ? /^https:\/\/drive\.google\.com\/thumbnail\?id=/.test(job.image || "") :
            String(job.image || "") === String(payload.image || ""));

    let confirmed = false;
    if (action === "create") {
        confirmed = jobs.some((job) => !beforeIds.has(String(job.id)) && matchesPayload(job));
    } else if (action === "update") {
        confirmed = matchesPayload(byId.get(String(payload.id)));
    } else if (action === "delete") {
        confirmed = !byId.has(String(payload.id));
    } else if (action === "toggle") {
        confirmed = Boolean(byId.get(String(payload.id)) &&
            Boolean(byId.get(String(payload.id)).active) === (String(payload.active).toLowerCase() === "true"));
    }

    if (!confirmed) {
        throw new Error("Server belum mengonfirmasi perubahan. Periksa Log Lowongan sebelum mencoba ulang agar tidak membuat perubahan ganda.");
    }
    return { ok: true, jobs };
}
let serverJobsCache = [];

function saveServerJobs_(jobs) {
    serverJobsCache = Array.isArray(jobs) ? jobs : [];
}
async function loadJobsFromServer_() {
    const response = await fetch(`${JOBS_SCRIPT_URL}?type=job&_=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    if (!result.ok) throw new Error(result.message || "Gagal memuat lowongan.");
    if (!Array.isArray(result.jobs)) throw new Error("Respons daftar lowongan tidak valid.");
    saveServerJobs_(result.jobs.map((job) => ({ ...job, source: "server" })));
    return getJobs();
}
document.addEventListener("DOMContentLoaded", () => {
    const tbody = document.getElementById("admin-job-list");
    tbody.innerHTML = `<tr><td colspan="4" class="p-8 text-center text-on-surface-variant">Memuat lowongan dari Spreadsheet...</td></tr>`;
    loadJobsFromServer_()
        .then(() => loadAdminJobs())
        .catch((error) => {
            console.error("Gagal memuat lowongan dari Spreadsheet:", error);
            const row = document.createElement("tr");
            const cell = document.createElement("td");
            cell.colSpan = 4;
            cell.className = "p-8 text-center text-red-700";
            cell.textContent = "Gagal memuat lowongan dari Spreadsheet: " + error.message + ". Muat ulang halaman setelah koneksi diperiksa.";
            row.appendChild(cell);
            tbody.replaceChildren(row);
        });
    document.getElementById("jobForm").addEventListener("submit", function(e) {
        e.preventDefault();
        saveJob();
    });
});

function getJobs() {
    return serverJobsCache;
}
function showAdminToast_(message) {
    const toast = document.createElement("div");
    toast.setAttribute("role", "status");
    toast.className = "fixed top-20 right-4 z-[150] flex max-w-sm items-center gap-3 rounded-xl bg-emerald-700 px-5 py-4 text-white shadow-xl";
    const icon = document.createElement("span");
    icon.className = "material-symbols-outlined";
    icon.textContent = "check_circle";
    const text = document.createElement("span");
    text.className = "font-medium";
    text.textContent = message;
    toast.append(icon, text);
    document.body.appendChild(toast);
    window.setTimeout(() => {
        toast.classList.add("opacity-0", "transition-opacity", "duration-300");
        window.setTimeout(() => toast.remove(), 350);
    }, 3500);
}
function loadAdminJobs() {
    const tbody = document.getElementById("admin-job-list");
    const jobs = getJobs();

    if (jobs.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="p-8 text-center text-on-surface-variant">Belum ada data loker.</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = "";

    jobs.forEach((job) => {
        const tr = document.createElement("tr");
        tr.className = "hover:bg-surface-container/30 transition-colors";

        tr.innerHTML = `
            <td class="p-4">
                <div class="flex items-center gap-3">
                    <img src="${job.image}" class="w-12 h-12 rounded object-cover shadow-sm">
                    <span class="font-bold text-[#122338]">${job.title}</span>
                </div>
            </td>
            <td class="p-4 text-sm text-on-surface-variant max-w-xs truncate">${Array.isArray(job.qualifications) ? job.qualifications.join(", ") : job.qualifications || job.description || ""}</td>
            <td class="p-4 text-center">
                <button onclick='toggleJobStatus(${JSON.stringify(String(job.id))})' class="px-3 py-1 text-xs font-bold rounded-full transition-colors ${job.active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200"}">
                    ${job.active ? "Aktif" : "Nonaktif"}
                </button>
            </td>
            <td class="p-4 text-right">
                <div class="flex items-center justify-end gap-2">
                    <button onclick='editJob(${JSON.stringify(String(job.id))})' class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                        <span class="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <button onclick='deleteJob(${JSON.stringify(String(job.id))})' class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                        <span class="material-symbols-outlined text-sm">delete</span>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Modal Logic
function openJobModal() {
    document.getElementById("modal-title").innerText = "Tambah Loker";
    document.getElementById("jobForm").reset();
    document.getElementById("job-id").value = ""; // Clear ID for new

    const modal = document.getElementById("jobModal");
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    document.body.style.overflow = "hidden";
}

function closeJobModal() {
    const modal = document.getElementById("jobModal");
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    document.body.style.overflow = "";
}

// CRUD Operations
function readImageFileAsBase64_(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
        reader.onerror = () => reject(new Error("File flyer tidak dapat dibaca."));
        reader.readAsDataURL(file);
    });
}

function isValidJobImage_(value) {
    const image = String(value || "").trim();
    if (!image) return false;
    if (/^https?:\/\/[^\s]+$/i.test(image)) return true;
    return /^(?:\.\/)?[\w./-]+\.(?:png|jpe?g|webp|gif|svg)$/i.test(image);
}

async function saveJob() {
    const id = document.getElementById("job-id").value;
    const title = document.getElementById("job-title").value.trim();
    const image = document.getElementById("job-image").value.trim();
    const imageFile = document.getElementById("job-image-file").files[0];
    const qualifications = document.getElementById("job-desc").value
        .split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
    const active = document.getElementById("job-active").checked;

    if (imageFile) {
        const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedImageTypes.includes(imageFile.type)) {
            alert("Format flyer harus JPG, PNG, atau WEBP.");
            return;
        }
        if (imageFile.size > 5 * 1024 * 1024) {
            alert("Ukuran flyer maksimal 5 MB.");
            return;
        }
    } else if (!isValidJobImage_(image)) {
        alert("Masukkan URL gambar http/https atau path lokal seperti img/Career/flyer.png, atau pilih file flyer.");
        return;
    }

    let imageBase64 = "";
    if (imageFile) {
        try {
            imageBase64 = await readImageFileAsBase64_(imageFile);
        } catch (error) {
            alert(error.message);
            return;
        }
    }

    try {
        const payload = id
            ? { action: "update", id, title, image, qualifications, active }
            : { action: "create", title, image, qualifications, active };
        if (imageFile) {
            payload.imageFileName = imageFile.name;
            payload.imageMimeType = imageFile.type;
            payload.imageBase64 = imageBase64;
        }
        const result = await jobsApi_(payload);
        if (!result.ok || !Array.isArray(result.jobs)) {
            throw new Error(result.message || "Gagal menyimpan lowongan.");
        }
        saveServerJobs_(result.jobs.map((job) => ({ ...job, source: "server" })));
    } catch (error) {
        console.error(error);
        alert("Lowongan belum tersimpan ke server: " + error.message);
        return;
    }
    closeJobModal();
    loadAdminJobs();
    showAdminToast_(id ? "Data lowongan berhasil diperbarui di Spreadsheet." : "Lowongan berhasil ditambahkan ke Spreadsheet.");
}
function editJob(id) {
    const jobs = getJobs();
    const job = jobs.find((j) => j.id == id);
    if (!job) return;

    document.getElementById("modal-title").innerText = "Edit Loker";
    document.getElementById("job-id").value = job.id;
    document.getElementById("job-title").value = job.title;
    document.getElementById("job-image").value = job.image;
    document.getElementById("job-image-file").value = "";
    document.getElementById("job-desc").value = Array.isArray(job.qualifications) ?
        job.qualifications.join("\n") :
        job.qualifications || job.description || "";
    document.getElementById("job-active").checked = job.active;

    const modal = document.getElementById("jobModal");
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    document.body.style.overflow = "hidden";
}

function showDeleteConfirmation_(jobTitle) {
    return new Promise((resolve) => {
        const overlay = document.createElement("div");
        overlay.className = "fixed inset-0 z-[160] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4";

        const dialog = document.createElement("section");
        dialog.className = "w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl";
        dialog.setAttribute("role", "alertdialog");
        dialog.setAttribute("aria-modal", "true");
        dialog.setAttribute("aria-labelledby", "delete-confirm-title");
        dialog.setAttribute("aria-describedby", "delete-confirm-description");

        const iconWrap = document.createElement("div");
        iconWrap.className = "mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600";
        const icon = document.createElement("span");
        icon.className = "material-symbols-outlined";
        icon.textContent = "delete";
        iconWrap.appendChild(icon);

        const heading = document.createElement("h2");
        heading.id = "delete-confirm-title";
        heading.className = "text-xl font-bold text-[#122338]";
        heading.textContent = "Hapus lowongan?";

        const description = document.createElement("p");
        description.id = "delete-confirm-description";
        description.className = "mt-2 text-sm leading-6 text-gray-600";
        description.textContent = "Lowongan “" + jobTitle + "” akan dihapus. Tindakan ini tidak dapat dibatalkan.";

        const actions = document.createElement("div");
        actions.className = "mt-6 flex justify-end gap-3";

        const cancelButton = document.createElement("button");
        cancelButton.type = "button";
        cancelButton.className = "rounded-xl border border-gray-300 px-4 py-2.5 font-semibold text-gray-700 transition-colors hover:bg-gray-100";
        cancelButton.textContent = "Batal";

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "rounded-xl bg-red-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-red-700";
        deleteButton.textContent = "Hapus";

        actions.append(cancelButton, deleteButton);
        dialog.append(iconWrap, heading, description, actions);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        deleteButton.focus();

        const finish = (confirmed) => {
            document.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = previousOverflow;
            overlay.remove();
            resolve(confirmed);
        };
        const onKeyDown = (event) => {
            if (event.key === "Escape") finish(false);
            if (event.key === "Tab") {
                event.preventDefault();
                (document.activeElement === deleteButton ? cancelButton : deleteButton).focus();
            }
        };

        cancelButton.addEventListener("click", () => finish(false));
        deleteButton.addEventListener("click", () => finish(true));
        overlay.addEventListener("click", (event) => {
            if (event.target === overlay) finish(false);
        });
        document.addEventListener("keydown", onKeyDown);
    });
}
async function deleteJob(id) {
    const job = getJobs().find((item) => String(item.id) === String(id));
    if (!job) return;
    if (!await showDeleteConfirmation_(job.title)) return;

    const jobId = String(id);
    try {
        const result = await jobsApi_({ action: "delete", id: jobId });
        if (!result.ok || !Array.isArray(result.jobs)) throw new Error(result.message || "Gagal menghapus lowongan.");
        saveServerJobs_(result.jobs.map((job) => ({ ...job, source: "server" })));
        loadAdminJobs();
    } catch (error) {
        alert("Lowongan belum terhapus dari server: " + error.message);
    }
}
async function toggleJobStatus(id) {
    const jobId = String(id);
    const job = getJobs().find((item) => String(item.id) === jobId);
    if (!job) return;
    const active = !job.active;
    try {
        const result = await jobsApi_({ action: "toggle", id: jobId, active });
        if (!result.ok || !Array.isArray(result.jobs)) throw new Error(result.message || "Gagal mengubah status.");
        saveServerJobs_(result.jobs.map((item) => ({ ...item, source: "server" })));
        loadAdminJobs();
    } catch (error) {
        alert("Status belum tersimpan ke server: " + error.message);
    }
}
