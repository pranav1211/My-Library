var apiKey = 'AIzaSyA04MfGxy' + 'cBuwJ0Oq' + 'IL2x_6JsKoJCDU7gk';

let startScanButton = document.querySelector('#scanButton'); // open camera
let stopScanButton = document.querySelector('#stopscan'); //close camera

let video = document.querySelector('#video');  // video itself

let barcodeResult = document.querySelector('#barcodeResult'); // barcode result div
//let confirm = document.querySelector('#confirm');
var isbn;

let stream; // the video stream

let imagesource = document.querySelector("#imagesource"); // book cover

let scanstatus = document.querySelector('#barcode-status') // scan status using border of video

let videodiv = document.querySelector('#videodiv') //video div

let loader = document.querySelector('.loader') // buffer animator

let bookinfo = document.querySelector('#bookinfo') // book information section

let addButton = document.querySelector('#addButton') //add book to library
let viewButton = document.querySelector('#viewButton') // view library

let error1 = document.querySelector('#error1') // error aniamation
let added1 = document.querySelector('#added1') // added animation

let addtolib = document.querySelector("#addtolib"); // add to library section

let videoTrack;
let flashOn = true;

let books_in_storage = [];

function getBooks() {
    for (let i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i);
        if (key.includes('userbooktitle')) {
            let val = localStorage.getItem(key);
            if (val !== null) {
                books_in_storage.push(val);
            }
        }
    }
    console.log(books_in_storage);
}
getBooks()

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

    
    function toggleFlash() {
        if (videoTrack) {
            const capabilities = videoTrack.getCapabilities();
            if (capabilities.torch) {
                videoTrack.applyConstraints({
                    advanced: [{ torch: !flashOn }]
                }).then(() => {
                    flashOn = !flashOn;
                }).catch((error) => {
                    console.error('Error toggling flash:', error);
                });
            } else {
                console.log('Flash control is not available.');
            }
        }
    }
    
    function startScan() {
        if (stream) return;
    
        navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: { exact: 'environment' },
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            },
            audio: false
        }).then((mediaStream) => {
            stream = mediaStream;
            video.srcObject = stream;
            video.addEventListener("loadedmetadata", () => {
                video.play();
                videoTrack = stream.getVideoTracks()[0];
    
                // Check if the camera supports flash control
                if (videoTrack.getCapabilities().torch) {
                    console.log('Flash is supported.');
                    
                    // Enable flash by default
                    videoTrack.applyConstraints({
                        advanced: [{ torch: true }]
                    }).then(() => {
                        console.log('Flash is enabled.');
                    }).catch((error) => {
                        console.error('Error enabling flash:', error);
                    });
    
                } else {
                    console.log('Flash is not supported.');
                }
    
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

                        bookinfo.style.visibility = 'hidden';
                        addtolib.style.visibility = 'hidden'
                        viewButton.style.visibility = 'hidden'

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

            bookinfo.style.visibility = 'hidden';
            addtolib.style.visibility = 'hidden'
            viewButton.style.visibility = 'hidden'

            barcodeResult.innerHTML = `Barcode Detected<br>${isbn}<br>`;
            barcodeResult.style.fontSize = '3vw';
            fetchinfo();
            Quagga.stop();
        });
    }


});

function fetchinfo() {
    if (!isbn) {
        alert('No barcode scanned or barcode value is empty.');
        return;
    }
    loader.style.visibility = 'visible'
    loader.style.animation = 'l17 3s infinite steps(6)';

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

let booknames;
let authornames;
let genre;
let publish;
let imagethumb;

function bookdata(data) {

    setTimeout(() => {
        loader.style.visibility = 'hidden'
        loader.style.animation = 'none';
        bookinfo.style.visibility = 'visible'
        addtolib.style.visibility = 'visible'
        viewButton.style.visibility = 'visible'
    }, 2500);

    const book = data.items[0];
    booknames = book.volumeInfo.title;

    const authors = book.volumeInfo.authors;
    var authortext = authors ? authors.join(',') : 'unknown';
    authornames = authortext;

    bookname.innerHTML = `<strong>${booknames}</strong><br> By <br><em>${authornames}</em>`;

    const categories = book.volumeInfo.categories;
    var category = categories ? categories.join(',') : 'unknown';
    genre = category;
    genrename.innerHTML = `Genre : <strong>${genre}</strong>`;

    publish = book.volumeInfo.publishedDate;
    yearofpublish.innerHTML = `Year Published : <strong>${publish}</strong>`;

    imagethumb = book.volumeInfo.imageLinks ? book.volumeInfo.imageLinks.thumbnail : '';
    imagesource.src = imagethumb ? imagethumb : 'notfound.jpg';

    bookname.style.fontSize = '5vw';
    genrename.style.fontSize = '5vw';
    yearofpublish.style.fontSize = '5vw';

}

addButton.addEventListener('click', () => {

    if (books_in_storage.includes(booknames)) {
        added1.innerHTML = 'Error!'
        added1.style.background = 'red'
        alert('Book already exists');

    }
    else if (!localStorage.getItem('noofbooks')) {
        localStorage.setItem('noofbooks', 0);
        added1.innerHTML = 'Added!'
        added1.style.background = 'rgb(42, 197, 108)'
        addinfo()
        getBooks()
    }
    else {
        added1.innerHTML = 'Added!'
        added1.style.background = 'rgb(42, 197, 108)'
        addinfo()
        getBooks()
    }

    added1.style.animation = 'moveup 2s'
    setTimeout(() => {
        added1.style.animation = 'none'
    }, 2000);


});

// function addinfo() {
//     var booknumber = localStorage.getItem('noofbooks');
//     localStorage.setItem("userbooktitle" + booknumber, booknames);
//     localStorage.setItem("userbookauthor" + booknumber, authornames);
//     localStorage.setItem("userbookgenre" + booknumber, genre);
//     localStorage.setItem("userbookpublish" + booknumber, publish);
//     localStorage.setItem("userbookimagethumb" + booknumber, imagethumb);
//     booknumber = Number(booknumber)
//     booknumber += 1;
//     localStorage.setItem("noofbooks", booknumber)
// }

viewButton.addEventListener('click', () => {
    viewButton.style.backgroundPosition = "-100% 0";
})