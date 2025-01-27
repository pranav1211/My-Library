var apiKey = 'AIzaSyA04MfGxy' + 'cBuwJ0Oq' + 'IL2x_6JsKoJCDU7gk';

// Button elements
let startScanButton = document.querySelector('#scanButton'); // open camera
let stopScanButton = document.querySelector('#stopscan'); // close camera
let addButton = document.querySelector('#addButton'); // add book to library
let viewButton = document.querySelector('#viewButton'); // view library

// Video elements
let video = document.querySelector('#video');  // video itself
let videoTrack;
let stream; // the video stream
let videodiv = document.querySelector('#videodiv'); // video div
let flashOn = true;

// Barcode and book info elements
let barcodeResult = document.querySelector('#barcodeResult'); // barcode result div
let scanstatus = document.querySelector('#barcode-status'); // scan status using border of video
let imagesource = document.querySelector("#imagesource"); // book cover
let bookinfo = document.querySelector('#bookinfo'); // book information section
let loader = document.querySelector('.loader'); // buffer animator
let addtolib = document.querySelector("#addtolib"); // add to library section

// Feedback elements
let error1 = document.querySelector('#error1'); // error animation
let added1 = document.querySelector('#added1'); // added animation

// Book details variables
var isbn;
let books_in_storage = [];
let booknames, authornames, genre, publish, imagethumb;

// flash control
let flashcontrol = document.querySelector('#flashcontrol')
let isflash = false;
let flashimg = document.querySelector("#flashimg");

// constant fetching
let lastScannedBarcode = null; // Store the last scanned barcode
let isFetching = false; // Prevent multiple fetches at once

document.addEventListener('DOMContentLoaded', () => {
    // Initialize books from localStorage
    getBooks();    

    let flashOn = true;

    // Button event listeners
    startScanButton.addEventListener('click', startScan);
    stopScanButton.addEventListener('click', stopScan);
    addButton.addEventListener('click', handleAddBook);
    viewButton.addEventListener('click', () => {
        window.location = 'yourlibrary.html'
        viewButton.style.backgroundPosition = "-100% 0"
    });

    // Set initial scan status based on BarcodeDetector support
    if ('BarcodeDetector' in window) {
        videodiv.style.borderColor = 'green';
    } else {
        videodiv.style.borderColor = 'red';
    }
    setcssstatus();

    // Start scan and initialize camera
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

                // Check for flash support
                if (videoTrack.getCapabilities().torch) {
                    flashcontrol.addEventListener('click', () => {
                        if (!isflash) {
                            flashimg.src = 'images/flash_on.png'
                            videoTrack.applyConstraints({
                                advanced: [{ torch: true }]
                            })
                            isflash = true;
                        }
                        else{
                            flashimg.src = 'images/flash_off.png'
                            videoTrack.applyConstraints({
                                advanced: [{ torch: false }]
                            })
                            isflash = false;
                        }
                    })
                } else {
                    console.log('Flash is not supported.');
                }

                // Start appropriate barcode detection
                if ('BarcodeDetector' in window) {
                    startBarcodeDetection();
                } else {
                    startQuaggaDetection();
                }
            });
        }).catch(alert);
    }
    // Stop scan and camera
    function stopScan() {
        if (stream) {
            let tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
            video.srcObject = null;
            stream = null;
        }

        if (scanInterval) {
            clearInterval(scanInterval);
            scanInterval = null;
        }
        Quagga.stop();
        flashimg.src = 'images/flash_off.png'
    }

    // activate loader animation
    function showLoader() {
        loader.style.visibility = 'visible';

        const loaderPages = loader.querySelectorAll('div');
        loaderPages.forEach((page, index) => {
            let delay = 0.15 * (index + 1);
            page.style.animation = `whirl-book 3s infinite`;
            page.style.animationDelay = `${delay}s`;
        });
    }

    //deactivate loader animation
    function hideLoader() {
        loader.style.visibility = 'hidden';
        loader.style.animation = 'none';

        const loaderPages = loader.querySelectorAll('div');
        loaderPages.forEach(page => {
            page.style.animation = 'none';
        });
    }


    // handling duplicate barcode scanned
    function handlebarcode(barcode) {
        if (barcode === lastScannedBarcode) {
            console.log("duplicate barcode, skipping fetch")
            hideLoader()
            return;
        }
        else {
            addtolib.style.visibility = 'hidden';
            viewButton.style.visibility = 'hidden';
            fetchinfo();
        }
        lastScannedBarcode = barcode
    }

    // Barcode detection using BarcodeDetector API
    function startBarcodeDetection() {
        const barcodeDetector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });

        function detectBarcodes() {
            barcodeDetector.detect(video).then((barcodes) => {
                if (barcodes.length > 0) {
                    barcodes.forEach(barcode => {
                        isbn = barcode.rawValue;
                        barcodeResult.innerHTML = `Barcode Detected : ${isbn}<br>`;
                        barcodeResult.style.fontSize = '3vw';
                        handlebarcode(isbn);
                    });
                }
            }).catch(err => {
                console.error('Barcode detection failed:', err);
            });
        }
        scanInterval = setInterval(detectBarcodes, 1000);
    }

    // Barcode detection using QuaggaJS
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
            handlebarcode(isbn);
            Quagga.stop();
        });
    }

    // Fetch book information based on ISBN
    function fetchinfo() {
        if (!isbn) {
            console.log('No barcode scanned or barcode value is empty.');
            return;
        }
        showLoader()

        var apiUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${apiKey}`;
        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    alert('Network response was not ok');
                    hideLoader()
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {

                if (data.items && data.items.length > 0) {
                    hideLoader()
                    bookdata(data);
                } else {
                    hideLoader()
                    console.log('No book information found for the given ISBN.');
                }
            })
            .catch(error => {
                hideLoader()
                console.log('There was a problem with the fetch operation');
                console.error('Fetch error:', error);
            });
    }

    // extract and display book information
    function bookdata(data) {
        const book = data.items[0]; 
        booknames = book.volumeInfo.title;
        authornames = book.volumeInfo.authors ? book.volumeInfo.authors.join(',') : 'unknown';
        genre = book.volumeInfo.categories ? book.volumeInfo.categories.join(',') : 'unknown';
        publish = book.volumeInfo.publishedDate;
        imagethumb = book.volumeInfo.imageLinks ? book.volumeInfo.imageLinks.thumbnail : 'images/nocover.jpg';
        // description = book.

        bookname.innerHTML = `<strong>${booknames}</strong><br> By <br><em>${authornames}</em>`;
        genrename.innerHTML = `<strong>Genre:</strong> ${genre}`;
        yearofpublish.innerHTML = `<strong>Published:</strong> ${publish}`;
        imagesource.src = imagethumb;

        

        // Set font sizes for better readability
        bookname.style.fontSize = '5.5vw';
        genrename.style.fontSize = '5.5vw';
        yearofpublish.style.fontSize = '5.5vw';

        addtolib.style.visibility = 'visible';
        viewButton.style.visibility = 'visible';
    }

    // Add book to library
    function handleAddBook() {
        // Check if the book already exists in books_in_storage
        if (books_in_storage.includes(booknames)) {
            added1.innerHTML = 'Error!';
            added1.style.background = 'red';
            alert('Book already exists in your library.');
        } else {
            // Check if the book already exists in localStorage by looking for existing keys with 'book'
            let isBookExists = false;
            for (let i = 1; i <= localStorage.getItem('noofbooks'); i++) {
                let storedBook = JSON.parse(localStorage.getItem(`book${i}`));
                if (storedBook && storedBook.title === booknames) {
                    isBookExists = true;
                    break;
                }
            }
    
            if (isBookExists) {
                added1.innerHTML = 'Error!';
                added1.style.background = 'red';
                alert('Book already exists in storage.');
            } else {
                if (!localStorage.getItem('noofbooks')) {
                    localStorage.setItem('noofbooks', 0);
                }
                addinfo();  // Adds the book to localStorage
                getBooks(); // Refreshes the book list from localStorage
                added1.innerHTML = 'Added!';
                added1.style.background = 'rgb(42, 197, 108)';
            }
    
            added1.style.animation = 'moveup 1s';
            setTimeout(() => {
                added1.style.animation = 'none';
            }, 2000);
        }
    }
    

    // Get books from localStorage
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

    // // Add book information to localStorage
    function addinfo() {
        let bookIndex = parseInt(localStorage.getItem('noofbooks')) + 1;
    
        // Create a book object with all the necessary information
        let book = {
            title: booknames,
            author: authornames,
            genre: genre,
            publish: publish,
            thumb: imagethumb
        };
    
        // Store each book's information using a consistent key pattern
        localStorage.setItem(`book${bookIndex}`, JSON.stringify(book));
    
        // Update the total number of books in localStorage
        localStorage.setItem('noofbooks', bookIndex);
    }
    

    // Additional helper functions
    function setcssstatus() {
        scanstatus.style.borderRadius = '10px';
    }

    function clearStream() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    }    
    window.onbeforeunload = clearStream;
});
