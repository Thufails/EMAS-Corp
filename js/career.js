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

    const qualificationsByJobId = {
        1: [
            "Pria",
            "Pendidikan minimal S1 semua jurusan; diutamakan Manajemen, Teknik, atau bidang terkait",
            "Pengalaman kerja minimal 3-5 tahun sebagai Project Manager",
            "Terbukti memimpin dan menyelesaikan proyek dengan skala dan kompleksitas bervariasi",
            "Memahami metodologi manajemen proyek (PMBOK, Agile, atau Scrum)",
            "Mampu menyusun perencanaan proyek menyeluruh: scope, timeline, biaya, sumber daya, dan risiko",
            "Mahir memantau progres dan membuat laporan proyek",
            "Mampu mengelola stakeholder dan komunikasi proyek secara efektif",
            "Mampu memecahkan masalah, mengambil keputusan, dan berpikir strategis",
            "Terbiasa menggunakan tools manajemen proyek seperti MS Project, Trello, Asana, atau Jira",
            "Berorientasi pada hasil, disiplin, mengutamakan kualitas, dan tepat waktu",
            "Bersedia ditempatkan di Batu, Jawa Timur",
        ],
        2: [
            "Pendidikan minimal S1 semua jurusan; diutamakan Marketing, Komunikasi, Jurnalistik, atau bidang terkait",
            "Memahami strategi digital marketing seperti SEO, SEM, media sosial, content marketing, dan email marketing",
            "Mampu menyusun strategi campaign berbasis data dan analisis pasar",
            "Terbiasa menggunakan tools analitik seperti Google Analytics, Meta Business Suite, Google Ads, GA4, atau Looker Studio",
            "Mampu mengelola budget marketing dan mengoptimalkan campaign",
            "Kreatif, mengikuti tren digital, dan memiliki kemampuan copywriting yang baik",
            "Mampu bekerja mandiri maupun dalam tim, komunikatif, dan berorientasi pada hasil",
            "Disiplin, mengutamakan kualitas, dan tepat waktu",
            "Bersedia ditempatkan di Batu, Jawa Timur",
        ],
        3: [
            "Pendidikan minimal D3/S1 semua jurusan",
            "Berpengalaman di bidang terkait; Marketing atau Customer Service diutamakan",
            "Memiliki kemampuan komunikasi yang baik",
            "Mampu membuat konten promosi yang menarik",
            "Kreatif, proaktif, dan berorientasi pada target",
            "Mampu membangun hubungan dengan mitra, klien, dan pelanggan",
            "Komunikatif, ramah, dan solutif",
            "Menguasai Microsoft Office",
            "Bersedia ditempatkan di Batu, Jawa Timur",
        ],
        4: [
            "Pendidikan minimal D3/S1 Akuntansi",
            "Pengalaman minimal 1 tahun di bidang Accounting diutamakan",
            "Memahami prinsip dan standar akuntansi keuangan (SAK)",
            "Menguasai penyusunan laporan keuangan",
            "Menguasai perpajakan: PPN, PPh 21, PPh 23, PPh 25, dan PPh Badan",
            "Menguasai Microsoft Excel, termasuk Pivot Table dan VLOOKUP",
            "Teliti, detail, dan mampu bekerja dengan deadline",
            "Mampu bekerja mandiri maupun dalam tim",
            "Memiliki integritas, jujur, dan bertanggung jawab",
            "Bersedia ditempatkan di Batu, Jawa Timur",
        ],
        5: [
            "Wanita",
            "Pendidikan minimal D3/S1 Akuntansi atau Perpajakan",
            "Usia maksimal 30 tahun",
            "Pengalaman minimal 1 tahun di bidang Tax/Accounting",
            "Memahami peraturan perpajakan Indonesia",
            "Mampu menghitung dan melaporkan pajak perusahaan",
            "Menguasai Microsoft Excel",
            "Teliti, jujur, bertanggung jawab, dan mampu bekerja dalam tim",
            "Pengalaman e-Faktur, e-Bupot, e-SPT, dan Coretax menjadi nilai tambah",
            "Bersedia ditempatkan di Batu, Jawa Timur",
        ],
        6: [
            "Pendidikan minimal D3/S1 Teknik Informatika, Sistem Informasi, Ilmu Komputer, atau bidang relevan",
            "Pengalaman minimal 1 tahun sebagai programmer; fresh graduate dipersilakan melamar",
            "Menguasai satu atau lebih bahasa pemrograman seperti PHP, Laravel, Python, JavaScript, atau React",
            "Memahami OOP, database MySQL/PostgreSQL, dan RESTful API",
            "Terbiasa menggunakan Git dan tools pengembangan modern",
            "Mampu menganalisis masalah dan memberikan solusi teknis yang efektif",
            "Detail, teliti, bertanggung jawab, dan mampu bekerja dalam tim",
            "Memiliki laptop pribadi",
            "Bersedia ditempatkan di Batu, Jawa Timur",
        ],
        7: [
            "Muslim/Muslimah dan berakhlak Islami",
            "Pendidikan minimal S1 semua jurusan",
            "Pengalaman minimal 2 tahun sebagai Supervisor/Koordinator bidang Marketing",
            "Memahami strategi marketing dan pengembangan bisnis",
            "Mampu memimpin tim dan mencapai target",
            "Analitis, komunikatif, dan berorientasi pada hasil",
            "Bersedia ditempatkan di Batu, Jawa Timur",
        ],
        8: [
            "Muslim/Muslimah dan berakhlak Islami",
            "Pendidikan minimal S1 semua jurusan",
            "Pengalaman minimal 2 tahun sebagai Supervisor/Koordinator bidang Commercial, Sales, atau Business Development",
            "Memahami strategi penjualan dan pengembangan bisnis",
            "Mampu memimpin tim dan mencapai target",
            "Analitis, komunikatif, dan berorientasi pada hasil",
            "Bersedia ditempatkan di Batu, Jawa Timur",
        ],
        9: [
            "Pendidikan minimal D3/S1 Desain Komunikasi Visual, Sistem Informasi, atau bidang relevan",
            "Pengalaman minimal 1 tahun sebagai UI/UX Designer; fresh graduate dipersilakan melamar",
            "Memahami prinsip UI/UX, user-centered design, information architecture, dan usability",
            "Menguasai Figma (wajib), Adobe XD, Photoshop, Illustrator, atau tools sejenis",
            "Mampu membuat wireframe, mockup, prototyping, dan user flow",
            "Memahami design system, komponen, dan design guideline",
            "Menguasai dasar HTML/CSS menjadi nilai tambah",
            "Kreatif, detail, dan memiliki sense of design yang baik",
            "Mampu bekerja dalam tim, terbuka terhadap feedback, dan berorientasi pada user",
            "Memiliki laptop pribadi",
            "Bersedia ditempatkan di Batu, Jawa Timur",
        ],
    };

    // Default jobs if local storage is empty
    const defaultJobs = [{
            id: 1,
            title: "Project Manager",
            image: "img/Career/project-manager.png",
            qualifications: ["Memimpin dan mengelola proyek secara menyeluruh mulai dari perencanaan hingga penyelesaian"],
            active: true,
        },
        {
            id: 2,
            title: "Digital Marketing Strategist",
            image: "img/Career/digital-marketing-strategist.png",
            qualifications: ["Merancang dan mengeksekusi strategi pemasaran digital yang kreatif dan berbasis data"],
            active: true,
        },
        {
            id: 3,
            title: "Marketing & CS",
            image: "img/Career/marketing-cs.png",
            qualifications: ["Mampu menangani promosi, layanan pelanggan, dan pertumbuhan bisnis"],
            active: true,
        },
        {
            id: 4,
            title: "Accounting",
            image: "img/Career/accounting.png",
            qualifications: ["Mampu berkontribusi dalam pengelolaan keuangan yang akurat dan terpercaya"],
            active: true,
        },
        {
            id: 5,
            title: "Tax Staff",
            image: "img/Career/tax-staff.png",
            qualifications: ["Memahami peraturan perpajakan Indonesia dan pelaporan pajak perusahaan"],
            active: true,
        },
        {
            id: 6,
            title: "IT Programmer",
            image: "img/Career/it-programmer.jpeg",
            qualifications: ["Mampu menciptakan solusi digital yang berdampak dan bermanfaat"],
            active: true,
        },
        {
            id: 7,
            title: "SPV Marketing",
            image: "img/Career/spv-marketing.jpeg",
            qualifications: ["Memimpin strategi dan kinerja tim marketing untuk mencapai target"],
            active: true,
        },
        {
            id: 8,
            title: "SPV Commercial",
            image: "img/Career/spv-commercial.jpeg",
            qualifications: ["Memimpin strategi dan kinerja tim komersial untuk mencapai target"],
            active: true,
        },
        {
            id: 9,
            title: "Desain UI/UX",
            image: "img/Career/desain-ui-ux.jpeg",
            qualifications: ["Mampu menciptakan solusi digital yang berdampak dan bermanfaat"],
            active: true,
        },
    ];

    // Initialize local storage if empty or has less jobs than default
    let jobs = JSON.parse(localStorage.getItem("emas_jobs"));
    try {
        const response = await fetch(`${JOBS_SCRIPT_URL}?type=job`);
        const result = await response.json();
        if (result.ok && Array.isArray(result.jobs) && result.jobs.length) {
            const existingJobs = Array.isArray(jobs) ? jobs : defaultJobs;
            const serverById = new Map(result.jobs.map((job) => [String(job.id), job]));
            const baseJobs = defaultJobs.map((job) => serverById.get(String(job.id)) || job);
            const extraServerJobs = result.jobs.filter(
                (job) => !defaultJobs.some((defaultJob) => String(defaultJob.id) === String(job.id)),
            );
            const extraLocalJobs = existingJobs.filter(
                (job) => !baseJobs.some((baseJob) => String(baseJob.id) === String(job.id)) &&
                    !extraServerJobs.some((serverJob) => String(serverJob.id) === String(job.id)),
            );
            jobs = baseJobs.concat(extraServerJobs, extraLocalJobs);
            localStorage.setItem("emas_jobs", JSON.stringify(jobs));
        }
    } catch (error) {
        console.warn("Gagal memuat lowongan dari Apps Script; memakai data lokal:", error);
    }
    if (!jobs || jobs.length === 0) {
        jobs = defaultJobs;
    }

    // Add poster-derived qualification text to existing saved jobs too.
    jobs = jobs.map((job) => ({
        ...job,
        qualifications: qualificationsByJobId[job.id] &&
            (!Array.isArray(job.qualifications) || job.qualifications.length <= 1) ?
            qualificationsByJobId[job.id] :
            Array.isArray(job.qualifications) && job.qualifications.length ?
            job.qualifications :
            job.description ?
            [job.description] :
            [],
    }));
    localStorage.setItem("emas_jobs", JSON.stringify(jobs));

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
