function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, (character) => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
        };
        return entities[character];
    });
}

const JOBS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxvdNV0jmoaSP9kPDtCpqM2VcrLsFSBxmd7yevY4ctCf9V9ZEmmO45gu9SiUQ6iTGeO/exec";
//const JOBS_SCRIPT_URL = "COPAS URL SCRIPT GOOGLE APPS ANDA DISINI";
document.addEventListener("DOMContentLoaded", async() => {
    const careerGrid = document.getElementById("career-grid");
    if (!careerGrid) return;

    careerGrid.addEventListener("click", (event) => {
        const applyButton = event.target.closest("[data-apply-title]");
        if (!applyButton) return;

        openApplyModal(
            applyButton.dataset.applyTitle,
            applyButton.dataset.applyPoster || "",
        );
    });

    let jobs = [];
    try {
        const response = await fetch(`${JOBS_SCRIPT_URL}?type=job&_=${Date.now()}`, { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        if (!result.ok || !Array.isArray(result.jobs)) {
            throw new Error(result.message || "Respons daftar lowongan tidak valid.");
        }
        jobs = result.jobs;
    } catch (error) {
        console.error("Gagal memuat lowongan dari Spreadsheet:", error);
        careerGrid.innerHTML = `
            <div class="col-span-full rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-800">
                Daftar lowongan belum dapat dimuat. Silakan muat ulang halaman atau hubungi administrator.
            </div>
        `;
        return;
    }
    // Filter only active jobs
    const activeJobs = jobs.filter((job) => job.active);

    // Render Jobs
    if (activeJobs.length === 0) {
        careerGrid.innerHTML = `
            <div class="col-span-full text-center py-16 fade-in-up">
                <span class="material-symbols-outlined text-6xl text-surface-variant mb-4 block">work_off</span>
                <h3 class="font-bold text-2xl text-[#122338] mb-2">Belum ada lowongan tersedia</h3>
                <p class="text-on-surface-variant">Saat ini belum ada posisi yang sedang kami butuhkan. Silakan periksa kembali nanti.</p>
            </div>
        `;
        return;
    }

    careerGrid.innerHTML = "";

    activeJobs.forEach((job, index) => {
        // Stagger animation delay
        const delay = index * 100;

        const qualifications = (job.qualifications || [])
            .slice(0, 4)
            .map(
                (qualification) => `
          <li class="flex items-start gap-2 text-sm leading-6 text-on-surface-variant">
            <span class="material-symbols-outlined mt-0.5 text-base text-primary-container" aria-hidden="true">check_circle</span>
            <span>${escapeHtml(qualification)}</span>
          </li>
        `,
            )
            .join("");

        const jobCard = `
            <div class="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col overflow-hidden fade-in-up hover:shadow-xl transition-all duration-300" style="transition-delay: ${delay}ms;">
                <div class="p-6 flex flex-col flex-grow">
                    <h3 class="font-headline-md text-xl text-[#122338] font-bold mb-4">${escapeHtml(job.title)}</h3>
                    <h4 class="font-label-caps text-sm font-bold uppercase tracking-wide text-primary-container mb-3">Kualifikasi utama</h4>
                    <ul class="space-y-2 flex-grow mb-6">${qualifications || '<li class="text-sm text-on-surface-variant">Kualifikasi belum tersedia.</li>'}</ul>
                    <div class="flex gap-3 mt-auto">
                        <button type="button" data-apply-title="${escapeHtml(job.title)}" data-apply-poster="${escapeHtml(job.image || "")}"
                            class="flex-1 text-center py-2.5 bg-primary-container text-white font-label-caps text-sm rounded-DEFAULT hover:bg-primary transition-colors">Apply Now</button>
                    </div>
                </div>
            </div>
        `;
        careerGrid.innerHTML += jobCard;
    });

    // We can assume main.js has an observer for fade-in-up if it does,
    // but the observer might only run once on load.
    // The easiest way is to add the 'visible' class manually if needed,
    // or if intersection observer handles new elements, we do nothing.
    // Let's just make them visible instantly or trigger observer.
    setTimeout(() => {
        const newElements = careerGrid.querySelectorAll(".fade-in-up");
        newElements.forEach((el) => {
            // We assume the observer adds an inline style opacity or class.
            // A simple fallback is:
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
        });
    }, 100);
});

