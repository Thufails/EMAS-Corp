fetch("https://script.google.com/macros/s/AKfycbw.../exec")
    .then(res => res.json())
    .then(data => console.log(data.jobs))
