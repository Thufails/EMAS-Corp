fetch("https://script.google.com/macros/s/AKfycbw.../exec", {
    method: "POST",
    body: JSON.stringify({
        type: "contact",
        nama: "Nama Pengunjung",
        wa: "08123456789",
        email: "email@contoh.com",
        pesan: "Isi pesan..."
    })
})
