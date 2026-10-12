const JOBS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxvdNV0jmoaSP9kPDtCpqM2VcrLsFSBxmd7yevY4ctCf9V9ZEmmO45gu9SiUQ6iTGeO/exec";
//const JOBS_SCRIPT_URL = "COPAS URL SCRIPT GOOGLE APPS ANDA DISINI";

async function jobsApi_(payload) {
    const params = new URLSearchParams({ type: "job" });
    Object.entries(payload).forEach(([key, value]) => {
        params.set(key, Array.isArray(value) ? value.join("\n") : String(value == null ? "" : value));
    });
    // Halaman yang dibuka langsung dari file:// tidak boleh membaca
    // respons lintas-origin Apps Script. Request-nya tetap terkirim,
    // tetapi response akan diblokir browser dan terlihat sebagai
    // "Failed to fetch" walaupun Sheet sudah berhasil ditulis.
    if (window.location.protocol === "file:") {
        await fetch(JOBS_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            body: params,
        });
        return { ok: true, accepted: true };
    }

    const response = await fetch(JOBS_SCRIPT_URL, {
        method: "POST",
        body: params,
    });
    return response.json();
}

async function loadJobsFromServer_() {
    const response = await fetch(`${JOBS_SCRIPT_URL}?type=job`);
    const result = await response.json();
    if (!result.ok) throw new Error(result.message || "Gagal memuat lowongan.");
    if (Array.isArray(result.jobs) && result.jobs.length > 0) {
        const localJobs = getJobs();
        const serverById = new Map(result.jobs.map((job) => [String(job.id), job]));
        const merged = localJobs
            .filter((job) => !serverById.has(String(job.id)))
            .concat(result.jobs);
        saveToLocalStorage(merged);
        return merged;
    }
    return getJobs();
}

document.addEventListener("DOMContentLoaded", async() => {
    try { await loadJobsFromServer_(); } catch (error) { console.warn("Memakai data lokal sementara:", error); }
    loadAdminJobs();

    // Handle form submission for Add / Edit
    document.getElementById("jobForm").addEventListener("submit", function(e) {
        e.preventDefault();
        saveJob();
    });
});

function getJobs() {
    return JSON.parse(localStorage.getItem("emas_jobs")) || [];
}

function saveToLocalStorage(jobs) {
    localStorage.setItem("emas_jobs", JSON.stringify(jobs));
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
                <button onclick="toggleJobStatus(${job.id})" class="px-3 py-1 text-xs font-bold rounded-full transition-colors ${job.active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200"}">
                    ${job.active ? "Aktif" : "Nonaktif"}
                </button>
            </td>
            <td class="p-4 text-right">
                <div class="flex items-center justify-end gap-2">
                    <button onclick="editJob(${job.id})" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                        <span class="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <button onclick="deleteJob(${job.id})" class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
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
function isValidJobImage_(value) {
    const image = String(value || "").trim();
    if (!image) return false;
    if (/^https?:\/\/[^\s]+$/i.test(image)) return true;
    return /^(?:\.\/)?[\w./-]+\.(?:png|jpe?g|webp|gif|svg)$/i.test(image);
}

async function saveJob() {
    const id = document.getElementById("job-id").value;
    const title = document.getElementById("job-title").value;
    const image = document.getElementById("job-image").value;
    const qualifications = document
        .getElementById("job-desc")
        .value
        .split(/\r?\n/)
        .map((value) => value.trim())
        .filter(Boolean);
    const active = document.getElementById("job-active").checked;

    if (!isValidJobImage_(image)) {
        alert("Masukkan URL gambar http/https atau path lokal seperti img/Career/flyer.png.");
        return;
    }

    let jobs = getJobs();

    if (id) {
        // Edit existing
        const index = jobs.findIndex((j) => j.id == id);
        if (index !== -1) {
            jobs[index].title = title;
            jobs[index].image = image;
            jobs[index].qualifications = qualifications;
            jobs[index].active = active;
        }
    } else {
        // Add new
        const newId = jobs.length > 0 ? Math.max(...jobs.map((j) => j.id)) + 1 : 1;
        jobs.push({
            id: newId,
            title: title,
            image: image,
            qualifications: qualifications,
            active: active,
        });
    }

    try {
        const result = await jobsApi_(id ? { action: "update", id, title, image, qualifications, active } : { action: "create", title, image, qualifications, active });
        if (!result.ok) throw new Error(result.message || "Gagal menyimpan lowongan.");
        saveToLocalStorage(result.jobs || jobs);
    } catch (error) {
        console.error(error);
        alert("Lowongan belum tersimpan ke server: " + error.message);
        return;
    }
    closeJobModal();
    loadAdminJobs();
}

function editJob(id) {
    const jobs = getJobs();
    const job = jobs.find((j) => j.id == id);
    if (!job) return;

    document.getElementById("modal-title").innerText = "Edit Loker";
    document.getElementById("job-id").value = job.id;
    document.getElementById("job-title").value = job.title;
    document.getElementById("job-image").value = job.image;
    document.getElementById("job-desc").value = Array.isArray(job.qualifications) ?
        job.qualifications.join("\n") :
        job.qualifications || job.description || "";
    document.getElementById("job-active").checked = job.active;

    const modal = document.getElementById("jobModal");
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    document.body.style.overflow = "hidden";
}

async function deleteJob(id) {
    if (confirm("Apakah Anda yakin ingin menghapus lowongan ini?")) {
        let jobs = getJobs();
        jobs = jobs.filter((j) => j.id != id);
        try {
            const result = await jobsApi_({ action: "delete", id });
            if (!result.ok) throw new Error(result.message || "Gagal menghapus lowongan.");
            saveToLocalStorage(result.jobs || jobs);
        } catch (error) { alert("Lowongan belum terhapus dari server: " + error.message); return; }
        loadAdminJobs();
    }
}

async function toggleJobStatus(id) {
    let jobs = getJobs();
    const index = jobs.findIndex((j) => j.id == id);
    if (index !== -1) {
        jobs[index].active = !jobs[index].active; // Toggle
        try {
            const result = await jobsApi_({ action: "toggle", id });
            if (!result.ok) throw new Error(result.message || "Gagal mengubah status.");
            saveToLocalStorage(result.jobs || jobs);
        } catch (error) { alert("Status belum tersimpan ke server: " + error.message); return; }
        loadAdminJobs();
    }
}
