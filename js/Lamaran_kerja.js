fetch("https://script.google.com/macros/s/AKfycbw.../exec", {
    method: "POST",
    body: JSON.stringify({
        name: "Nama Pelamar",
        position: "Posisi",
        // ... data lainnya
    })
})
