document.addEventListener("DOMContentLoaded", function() {
    // OpenStreetMap view with the existing PEUBA coordinates; location opens in Google Maps.
    const mapElement = document.getElementById("emas-location-map");
    if (mapElement && window.L) {
        const location = [-7.8720158, 112.5604001];
        const googleMapsUrl = "https://maps.app.goo.gl/4dDwp62LidvBhLM48";
        const map = L.map(mapElement, { scrollWheelZoom: false }).setView(location, 17);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
        }).addTo(map);
        L.marker(location).addTo(map)
            .bindPopup('<strong>PEUBA Usman Bin Affan</strong><br><a href="' + googleMapsUrl + '" target="_blank" rel="noopener noreferrer">Buka di Google Maps</a>')
            .openPopup();
    }
    // Mobile navigation toggle and close-on-navigation behavior.
    const mobileMenuButton = document.querySelector('nav button[aria-controls="mobile-navigation"]');
    const mobileNavigation = document.getElementById("mobile-navigation");
    if (mobileMenuButton && mobileNavigation) {
        mobileMenuButton.addEventListener("click", () => {
            const isExpanded = mobileMenuButton.getAttribute("aria-expanded") === "true";
            mobileMenuButton.setAttribute("aria-expanded", String(!isExpanded));
            mobileMenuButton.setAttribute("aria-label", isExpanded ? "Buka menu navigasi" : "Tutup menu navigasi");
            mobileNavigation.classList.toggle("hidden", isExpanded);
            mobileMenuButton.querySelector(".material-symbols-outlined").textContent = isExpanded ? "menu" : "close";
        });

        mobileNavigation.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", () => {
                mobileNavigation.classList.add("hidden");
                mobileMenuButton.setAttribute("aria-expanded", "false");
                mobileMenuButton.setAttribute("aria-label", "Buka menu navigasi");
                mobileMenuButton.querySelector(".material-symbols-outlined").textContent = "menu";
            });
        });
    }

    const observerOptions = {
        root: null,
        rootMargin: "0px",
        threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll(".fade-in-up").forEach((element) => {
        observer.observe(element);
    });

    // Interactive mouse background
    document.addEventListener("mousemove", (e) => {
        const follower = document.querySelector(".mouse-follower");
        if (follower) {
            follower.style.setProperty("--mouse-x", `${e.clientX}px`);
            follower.style.setProperty("--mouse-y", `${e.clientY}px`);
        }
    });

    // Animated Counter logic
    const counterObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.getAttribute("data-target"));
                const duration = 2000;
                let startTime = null;

                const updateCount = (timestamp) => {
                    if (!startTime) startTime = timestamp;
                    const progress = timestamp - startTime;
                    const increment = (target * progress) / duration;

                    if (progress < duration) {
                        entry.target.innerText = Math.ceil(increment);
                        requestAnimationFrame(updateCount);
                    } else {
                        entry.target.innerText = target;
                    }
                };

                requestAnimationFrame(updateCount);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const counterElement = document.getElementById("animated-counter");
    if (counterElement) {
        counterObserver.observe(counterElement);
    }

    // Testimonial Carousel Auto-slide
    const track = document.getElementById("testimonial-track");
    if (track) {
        let currentIndex = 0;
        const totalCards = 5;

        const slide = () => {
            const getVisibleCards = () => {
                if (window.innerWidth >= 1024) return 3; // lg
                if (window.innerWidth >= 768) return 2; // md
                return 1; // sm
            };

            const visibleCards = getVisibleCards();
            const maxIndex = totalCards - visibleCards;

            currentIndex++;
            if (currentIndex > maxIndex) {
                currentIndex = 0;
            }

            const cardWidth = 100 / visibleCards;
            track.style.transform = `translateX(-${currentIndex * cardWidth}%)`;
        };

        setInterval(slide, 4000);
    }

    // Form KONTAK to Google Sheets integration
    const contactForm = document.getElementById("contactForm");
    const submitBtn = document.getElementById("submitBtn");
    const formStatus = document.getElementById("formStatus");

    if (contactForm) {
        contactForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const scriptURL = window.EMAS_CONFIG.API_URL;
            if (!scriptURL || scriptURL.indexOf("PASTE_") !== -1) {
                formStatus.textContent =
                    "Harap lengkapi URL Apps Script kontak di js/config.js";
                formStatus.classList.remove("hidden");
                formStatus.className =
                    "mt-4 text-center text-sm font-bold text-red-500";
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = "Mengirim...";

            fetch(scriptURL, {
                    method: "POST",
                    body: new FormData(contactForm),
                    mode: "no-cors",
                })
                .then((response) => {
                    formStatus.textContent = "Pesan berhasil dikirim!";
                    formStatus.classList.remove("hidden");
                    formStatus.className =
                        "mt-4 text-center text-sm font-bold text-green-600";
                    contactForm.reset();
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Kirim Pesan";
                    setTimeout(() => {
                        formStatus.classList.add("hidden");
                    }, 5000);
                })
                .catch((error) => {
                    formStatus.textContent = "Terjadi kesalahan! Silakan coba lagi.";
                    formStatus.classList.remove("hidden");
                    formStatus.className =
                        "mt-4 text-center text-sm font-bold text-red-500";
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Kirim Pesan";
                    console.error("Error!", error.message);
                });
        });
    }

    // Hero Slideshow
    const heroSlides = document.querySelectorAll(".hero-slide");
    const heroDots = document.querySelectorAll(".hero-dot");
    if (heroSlides.length > 0 && heroDots.length > 0) {
        let currentSlide = 0;
        const totalSlides = heroSlides.length;

        const showSlide = (index) => {
            heroSlides.forEach((slide, i) => {
                if (i === index) {
                    slide.classList.replace("opacity-0", "opacity-100");
                    slide.classList.replace("z-0", "z-10");
                } else {
                    slide.classList.replace("opacity-100", "opacity-0");
                    slide.classList.replace("z-10", "z-0");
                }
            });

            heroDots.forEach((dot, i) => {
                if (i === index) {
                    dot.classList.replace("bg-white/50", "bg-white");
                } else {
                    dot.classList.replace("bg-white", "bg-white/50");
                }
            });
            currentSlide = index;
        };

        heroDots.forEach((dot, index) => {
            dot.addEventListener("click", () => {
                showSlide(index);
            });
        });

        setInterval(() => {
            let nextSlide = (currentSlide + 1) % totalSlides;
            showSlide(nextSlide);
        }, 5000);
    }

    // --- Lightbox Feature ---
    // Membuat elemen lightbox secara dinamis
    const lightbox = document.createElement('div');
    lightbox.id = 'lightbox';
    lightbox.className = 'fixed inset-0 z-[100] bg-black/95 hidden opacity-0 flex items-center justify-center transition-opacity duration-300';
    lightbox.innerHTML = `
    <button id="lightbox-close" class="absolute top-6 right-6 text-white/70 hover:text-white transition-colors cursor-pointer">
      <span class="material-symbols-outlined text-4xl">close</span>
    </button>
    <img id="lightbox-img" class="max-w-[95%] max-h-[95vh] object-contain rounded-xl shadow-2xl scale-95 transition-transform duration-300" src="" />
  `;
    document.body.appendChild(lightbox);

    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.getElementById('lightbox-close');

    const openLightbox = (src) => {
        lightboxImg.src = src;
        lightbox.classList.remove('hidden');
        // Trigger reflow untuk animasi
        void lightbox.offsetWidth;
        lightbox.classList.replace('opacity-0', 'opacity-100');
        lightboxImg.classList.replace('scale-95', 'scale-100');
    };

    const closeLightbox = () => {
        lightbox.classList.replace('opacity-100', 'opacity-0');
        lightboxImg.classList.replace('scale-100', 'scale-95');
        setTimeout(() => {
            lightbox.classList.add('hidden');
            lightboxImg.src = '';
        }, 300);
    };

    // Tutup saat tombol close ditekan
    lightboxClose.addEventListener('click', closeLightbox);

    // Tutup saat area hitam di luar gambar ditekan
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    // Pasang event click ke semua gambar di galeri
    const galleryImages = document.querySelectorAll('.cursor-pointer img');
    galleryImages.forEach(img => {
        const parentContainer = img.closest('.cursor-pointer');
        if (parentContainer && !img.closest('.hero-slide')) {
            parentContainer.addEventListener('click', (e) => {
                e.preventDefault();
                openLightbox(img.src);
            });
        }
    });

});