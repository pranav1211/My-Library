var apiKey = 'AIzaSyA04MfGxy'+'cBuwJ0Oq'+'IL2x_6JsKoJCDU7gk';
let startScanButton = document.querySelector('#scanButton');
let stopScanButton = document.querySelector('#stopscan');
let video = document.querySelector('#video');
let barcodeResult = document.querySelector('#barcodeResult');
let confirm = document.querySelector('#confirm');
var isbn = 9780099560432;
let barcodeDetector;
let scanInterval;
let stream;
let imagesource = document.querySelector("thumbnail")

document.addEventListener('DOMContentLoaded', () => {
    // if (!('BarcodeDetector' in window)) {
    //     alert('Barcode Detector is not supported by this browser, Sorry  :( ');
    //     return;
    // }

    // startScanButton.addEventListener('click', () => {
    //     if (stream) {            
    //         return;
    //     }

    //     navigator.mediaDevices.getUserMedia({
    //         video: {
    //             facingMode: { exact: 'environment' },
    //             width: { ideal: 1920 },
    //             height: { ideal: 1080 }
    //         }, audio: false,
    //     }).then((mediaStream) => {
    //         stream = mediaStream;
    //         video.srcObject = stream;
    //         video.addEventListener("loadedmetadata", () => {
    //             video.play();
    //             startBarcodeDetection();
    //         });
    //     }).catch(alert);
    // });

    // stopScanButton.addEventListener('click', () => {
    //     if (stream) {
    //         let tracks = stream.getTracks();
    //         tracks.forEach(track => track.stop());
    //         video.srcObject = null;
    //         stream = null;

    //         if (scanInterval) {
    //             clearInterval(scanInterval);
    //             scanInterval = null;
    //         }
    //     }
    // });

    // function startBarcodeDetection() {
    //     barcodeDetector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });

    //     function detectBarcodes() {
    //         barcodeDetector.detect(video).then((barcodes) => {
    //             if (barcodes.length > 0) {
    //                 barcodes.forEach(barcode => {
    //                     console.log("Barcode detected and decoded: ", barcode.rawValue);
    //                     isbn = barcode.rawValue;
    //                     barcodeResult.innerHTML = isbn;
    //                     barcodeResult.style.fontSize = '5vw';
    //                 });
    //             }
    //         }).catch(err => {
    //             console.error('Barcode detection failed:', err);
    //         });
    //     }
    //     scanInterval = setInterval(detectBarcodes, 1000);
    // }

    confirm.addEventListener('click', () => {        
        if (!isbn) {
            alert('No barcode scanned or barcode value is empty.');
            return;
        }
    
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
                    console.log(data)
                } else {
                    alert('No book information found for the given ISBN.');
                }
            })
            .catch(error => {
                alert('There was a problem with the fetch operation');
                console.error('Fetch error:', error);
            });
    });
    
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

        var imagethumb = book.volumeInfo.imageLinks.thumbnail
        imagesource.src=imagethumb

        bookname.style.fontSize = '4vw';
        authorname.style.fontSize = '4vw';
        genrename.style.fontSize = '4vw';
        yearofpublish.style.fontSize = '4vw';
    }
});
