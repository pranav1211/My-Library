var apiKey = 'AIzaSyA04MfGxy' + 'cBuwJ0Oq' + 'IL2x_6JsKoJCDU7gk';
let startScanButton = document.querySelector('#scanButton');
let stopScanButton = document.querySelector('#stopscan');
let video = document.querySelector('#video');
let barcodeResult = document.querySelector('#barcodeResult');
let confirm = document.querySelector('#confirm');
var isbn;
let stream;
let imagesource = document.querySelector("#imagesource");
let scanstatus = document.querySelector('#barcode-status')
let videodiv = document.querySelector('#videodiv')
let loader = document.querySelector('.loader')



document.addEventListener('DOMContentLoaded', () => {
    startScanButton.addEventListener('click', startScan);
    stopScanButton.addEventListener('click', stopScan);
    if ('BarcodeDetector' in window) {
        videodiv.style.borderColor = 'green';
        setcssstatus()
    }
    else {
        videodiv.style.borderColor = 'red';
        setcssstatus()
    }

    function setcssstatus() {
        scanstatus.style.color = 'green'
        scanstatus.style.textAlign = 'center'
        scanstatus.style.fontSize = '3vw'
        scanstatus.style.textStyle = 'italic'
    }

    function startScan() {
        if (stream) return;

        navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: { exact: 'environment' },
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            }, audio: false,
        }).then((mediaStream) => {
            stream = mediaStream;
            video.srcObject = stream;
            video.addEventListener("loadedmetadata", () => {
                video.play();
                if ('BarcodeDetector' in window) {
                    startBarcodeDetection();
                } else {
                    startQuaggaDetection();
                }
            });
        }).catch(alert);
    }

    function stopScan() {
        if (stream) {
            let tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
            video.srcObject = null;
            stream = null;

            if (scanInterval) {
                clearInterval(scanInterval);
                scanInterval = null;
            }

            Quagga.stop();
        }
    }

    function startBarcodeDetection() {

        const barcodeDetector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });

        function detectBarcodes() {
            barcodeDetector.detect(video).then((barcodes) => {
                if (barcodes.length > 0) {
                    barcodes.forEach(barcode => {
                        console.log("Barcode detected and decoded: ", barcode.rawValue);
                        isbn = barcode.rawValue;
                        barcodeResult.innerHTML = `Barcode Detected : ${isbn}<br>`;
                        barcodeResult.style.fontSize = '3vw';
                        fetchinfo();
                    });
                }
            }).catch(err => {
                console.error('Barcode detection failed:', err);
            });
        }
        scanInterval = setInterval(detectBarcodes, 1000);
    }

    function startQuaggaDetection() {
        Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: video
            },
            decoder: {
                readers: ["ean_reader", "ean_8_reader", "upc_reader", "upc_e_reader"]
            }
        }, function (err) {
            if (err) {
                console.error("Quagga initialization failed: ", err);
                return;
            }
            Quagga.start();
        });

        Quagga.onDetected(function (result) {
            isbn = result.codeResult.code;
            barcodeResult.innerHTML = `Barcode Detected<br>${isbn}<br>`;
            barcodeResult.style.fontSize = '3vw';
            fetchinfo();
            Quagga.stop();
        });
    }

    function fetchinfo() {
        if (!isbn) {
            alert('No barcode scanned or barcode value is empty.');
            return;
        }
        loader.style.visibility = 'visible'
        loader.style.animation = 'l17 4s infinite steps(6)';

        var apiUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${apiKey}`;

        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    alert('Network response was not ok');
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                if (data.items && data.items.length > 0) {
                    bookdata(data);
                } else {
                    alert('No book information found for the given ISBN.');
                }
            })
            .catch(error => {
                alert('There was a problem with the fetch operation');
                console.error('Fetch error:', error);
            });
    };

    function bookdata(data) {

        setTimeout(() => {
            showdata()
        }, 4000);

        function showdata() {
            const book = data.items[0];
            var booknames = book.volumeInfo.title;

            const authors = book.volumeInfo.authors;
            var authortext = authors ? authors.join(',') : 'unknown';
            var authornames = authortext;

            bookname.innerHTML = `<strong>${booknames}</strong><br> By <br><em>${authornames}</em>`;

            const categories = book.volumeInfo.categories;
            var category = categories ? categories.join(',') : 'unknown';
            var genre = category;
            genrename.innerHTML = `Genre : <strong>${genre}</strong>`;

            var publish = book.volumeInfo.publishedDate;
            yearofpublish.innerHTML = `Year Published : <strong>${publish}</strong>`;

            var imagethumb = book.volumeInfo.imageLinks ? book.volumeInfo.imageLinks.thumbnail : '';
            imagesource.src = imagethumb ? imagethumb : 'notfound.jpg';

            bookname.style.fontSize = '5vw';
            genrename.style.fontSize = '5vw';
            yearofpublish.style.fontSize = '5vw';
        }
    }
});


// loader.style.animation = 'l17 4s infinite steps(6)';