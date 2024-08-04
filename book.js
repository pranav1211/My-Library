var apiKey = 'AIzaSyA04MfGxy' + 'cBuwJ0Oq' + 'IL2x_6JsKoJCDU7gk';
let scanButton = document.querySelector('#scanButton');
let video = document.querySelector('#video');
let barcodeResult = document.querySelector('#barcodeResult');
let confirm = document.querySelector('#confirm');
var isbn;

document.addEventListener('DOMContentLoaded', () => {
    if (!('BarcodeDetector' in window)) {
        alert('Barcode Detector is not supported by this browser, Sorry  :( ');
        return;
    }

    let mediaDevices = navigator.mediaDevices;

    function start() {
        mediaDevices.getUserMedia({
            video: {
                facingMode: { exact: 'environment' },
                width: { ideal: 1920 },  // Landscape width
                height: { ideal: 1080 }  // Landscape height
            }, audio: false,
        }).then((stream) => {
            video.srcObject = stream;
            video.addEventListener("loadedmetadata", () => {
                video.play();
                startBarcodeDetection();
            });
        }).catch(alert);

        function startBarcodeDetection() {
            const barcodeDetector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });

            function detectBarcodes() {
                barcodeDetector.detect(video).then((barcodes) => {
                    if (barcodes.length > 0) {
                        barcodes.forEach(barcode => {
                            console.log("Barcode detected and decoded: ", barcode.rawValue);
                            isbn = barcode.rawValue;
                            barcodeResult.innerHTML = isbn; // Update to use isbn directly

                            scanButton.style.visibility = 'visible';
                            scanButton.style.marginTop = '1vh';
                            confirm.style.visibility = 'visible';
                        });
                    }
                }).catch(err => {
                    console.error('Barcode detection failed:', err);
                });
            }
            setInterval(detectBarcodes, 1000);
        }

        scanButton.addEventListener('click', () => {
            startBarcodeDetection();
        });

        window.addEventListener('beforeunload', function () {
            if (video.srcObject) {
                let tracks = video.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            }
        });
    }
});
scanButton.addEventListener('click',start())
confirm.addEventListener('click', () => {
    var node = document.getElementById('barcodeResult');
    codess = node.textContent;
    var apiUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${codess}&key=${apiKey}`;

    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                alert('Network response was not ok');
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            bookdata(data);
        })
        .catch(error => {
            alert('There was a problem with the fetch operation');
            console.error('Fetch error:', error);
        });
});

var bookname = document.querySelector('#bookname');
var authorname = document.querySelector('#authorname');
var genrename = document.querySelector('#genrename');
var yearofpublish = document.querySelector('#yearofpublish');

function bookdata(data) {
    window.scrollTo(0, document.body.scrollHeight);
    const book = data.items[0];
    bookname.innerHTML = 'Book Name: ' + book.volumeInfo.title;

    const authors = book.volumeInfo.authors;
    var authortext = authors ? authors.join(',') : 'unknown';
    authorname.innerHTML = 'Author: ' + authortext;

    const categories = book.volumeInfo.categories;
    var category = categories ? categories.join(',') : 'unknown';
    genrename.innerHTML = 'Genre: ' + category;

    yearofpublish.innerHTML = 'Year of Publish: ' + book.volumeInfo.publishedDate;
}
