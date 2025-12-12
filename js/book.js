var apiKey = 'AIzaSyA04MfGxy' + 'cBuwJ0Oq' + 'IL2x_6JsKoJCDU7gk';

// Button elements
let startScanButton = document.querySelector('#scanButton');
let stopScanButton = document.querySelector('#stopscan');
let addButton = document.querySelector('#addButton');
let viewButton = document.querySelector('#viewButton');

// Video elements
let video = document.querySelector('#video');
let videoTrack;
let stream;
let videodiv = document.querySelector('#videodiv');

// Barcode and book info elements
let barcodeResult = document.querySelector('#barcodeResult');
let scanstatus = document.querySelector('#barcode-status');
let imagesource = document.querySelector("#imagesource");
let bookinfo = document.querySelector('#bookinfo');
let loader = document.querySelector('.loader');
let skeletonLoader = document.querySelector('.skeleton-loader');
let addtolib = document.querySelector("#addtolib");
let added1 = document.querySelector('#added1');
let scanSuccessIndicator = document.querySelector('#scanSuccessIndicator');

// Book details variables
var isbn;
let books_in_storage = [];
let booknames, authornames, genre, publish, imagethumb;

// Flash control
let flashcontrol = document.querySelector('#flashcontrol');
let isflash = false;
let flashimg = document.querySelector("#flashimg");

// Manual ISBN entry
let toggleManualEntry = document.querySelector('#toggleManualEntry');
let manualEntryForm = document.querySelector('#manualEntryForm');
let manualIsbnInput = document.querySelector('#manualIsbn');
let searchManualIsbn = document.querySelector('#searchManualIsbn');
let cancelManualEntry = document.querySelector('#cancelManualEntry');

// Constant fetching
let lastScannedBarcode = null;
let isFetching = false;
let scanInterval = null;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize books from cookies
    getBooks();

    // Button event listeners
    startScanButton.addEventListener('click', startScan);
    stopScanButton.addEventListener('click', stopScan);
    addButton.addEventListener('click', handleAddBook);
    viewButton.addEventListener('click', () => {
        window.location = 'yourlibrary.html';
    });

    // Manual entry event listeners
    toggleManualEntry.addEventListener('click', () => {
        manualEntryForm.classList.toggle('hidden');
        if (!manualEntryForm.classList.contains('hidden')) {
            manualIsbnInput.focus();
        }
    });

    searchManualIsbn.addEventListener('click', () => {
        const manualIsbn = manualIsbnInput.value.trim();
        if (manualIsbn && /^\d{10,13}$/.test(manualIsbn)) {
            isbn = manualIsbn;
            fetchinfo();
            manualEntryForm.classList.add('hidden');
            manualIsbnInput.value = '';
        } else {
            alert('Please enter a valid 10 or 13 digit ISBN number');
        }
    });

    cancelManualEntry.addEventListener('click', () => {
        manualEntryForm.classList.add('hidden');
        manualIsbnInput.value = '';
    });

    // Allow Enter key to search
    manualIsbnInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchManualIsbn.click();
        }
    });

    // Only allow numbers in ISBN input
    manualIsbnInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });

    // Set initial scan status
    if ('BarcodeDetector' in window) {
        videodiv.classList.add('scanning');
    }

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
            videodiv.classList.add('scanning');

            video.addEventListener("loadedmetadata", () => {
                video.play();
                videoTrack = stream.getVideoTracks()[0];

                // Flash support check (only add listener once)
                if (videoTrack.getCapabilities().torch) {
                    flashcontrol.removeEventListener('click', toggleFlash);
                    flashcontrol.addEventListener('click', toggleFlash);
                } else {
                    console.log('Flash is not supported.');
                }

                // Start barcode detection
                if ('BarcodeDetector' in window) {
                    startBarcodeDetection();
                } else {
                    startQuaggaDetection();
                }
            });
        }).catch(error => {
            console.error('Camera error:', error);
            alert('Unable to access camera. Please check permissions.');
        });
    }

    // Toggle flash
    function toggleFlash() {
        if (!isflash) {
            flashimg.src = 'images/flash_on.png';
            videoTrack.applyConstraints({
                advanced: [{ torch: true }]
            });
            isflash = true;
        } else {
            flashimg.src = 'images/flash_off.png';
            videoTrack.applyConstraints({
                advanced: [{ torch: false }]
            });
            isflash = false;
        }
    }

    // Stop scan and camera
    function stopScan() {
        if (stream) {
            let tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
            video.srcObject = null;
            stream = null;
            videodiv.classList.remove('scanning', 'scan-success');
        }

        if (scanInterval) {
            clearInterval(scanInterval);
            scanInterval = null;
        }

        if (typeof Quagga !== 'undefined') {
            Quagga.stop();
        }

        flashimg.src = 'images/flash_off.png';
        isflash = false;
    }

    // Show skeleton loader
    function showLoader() {
        if (skeletonLoader) {
            skeletonLoader.classList.add('show');
        }
        loader.classList.add('show');
        const loaderPages = loader.querySelectorAll('div');
        loaderPages.forEach((page, index) => {
            let delay = 0.15 * (index + 1);
            page.style.animation = `whirl-book 3s infinite`;
            page.style.animationDelay = `${delay}s`;
        });
    }

    // Hide loader
    function hideLoader() {
        if (skeletonLoader) {
            skeletonLoader.classList.remove('show');
        }
        loader.classList.remove('show');
        loader.style.animation = 'none';
        const loaderPages = loader.querySelectorAll('div');
        loaderPages.forEach(page => {
            page.style.animation = 'none';
        });
    }

    // Show scan success animation
    function showScanSuccess() {
        videodiv.classList.add('scan-success');
        scanSuccessIndicator.classList.add('show');

        setTimeout(() => {
            videodiv.classList.remove('scan-success');
            scanSuccessIndicator.classList.remove('show');
        }, 600);
    }

    // Handle barcode
    function handlebarcode(barcode) {
        if (barcode === lastScannedBarcode) {
            console.log("Duplicate barcode, skipping fetch");
            hideLoader();
            return;
        } else {
            // Hide buttons while fetching
            addButton.classList.remove('show');
            viewButton.classList.remove('show');
            bookinfo.classList.remove('show');
            showScanSuccess();
            fetchinfo();
        }
        lastScannedBarcode = barcode;
    }

    // Barcode detection using BarcodeDetector API
    function startBarcodeDetection() {
        const barcodeDetector = new BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e']
        });

        function detectBarcodes() {
            if (!stream) return;

            barcodeDetector.detect(video).then((barcodes) => {
                if (barcodes.length > 0 && !isFetching) {
                    barcodes.forEach(barcode => {
                        isbn = barcode.rawValue;
                        barcodeResult.innerHTML = `✓ Barcode Detected: ${isbn}`;
                        handlebarcode(isbn);
                    });
                }
            }).catch(err => {
                console.error('Barcode detection failed:', err);
            });
        }

        scanInterval = setInterval(detectBarcodes, 1000);
    }

    // Barcode detection using QuaggaJS (fallback)
    function startQuaggaDetection() {
        if (typeof Quagga === 'undefined') {
            console.error('Quagga library not loaded');
            return;
        }

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
            if (isFetching) return;

            isbn = result.codeResult.code;
            barcodeResult.innerHTML = `✓ Barcode Detected: ${isbn}`;
            handlebarcode(isbn);
        });
    }

    // Fetch book information
    function fetchinfo() {
        if (!isbn) {
            console.log('No barcode scanned or barcode value is empty.');
            return;
        }

        if (isFetching) {
            console.log('Already fetching, please wait...');
            return;
        }

        isFetching = true;
        showLoader();

        var apiUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${apiKey}`;

        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                hideLoader();
                isFetching = false;

                if (data.items && data.items.length > 0) {
                    bookdata(data);
                } else {
                    console.log('No book information found for the given ISBN.');
                    alert(`No book found for ISBN: ${isbn}. Try another book or enter ISBN manually.`);
                }
            })
            .catch(error => {
                hideLoader();
                isFetching = false;
                console.error('Fetch error:', error);
                alert('Failed to fetch book information. Please check your internet connection.');
            });
    }

    // Extract and display book information
    function bookdata(data) {
        const book = data.items[0];
        booknames = book.volumeInfo.title;
        authornames = book.volumeInfo.authors ? book.volumeInfo.authors.join(', ') : 'Unknown';
        genre = book.volumeInfo.categories ? book.volumeInfo.categories.join(', ') : 'Unknown';
        publish = book.volumeInfo.publishedDate || 'Unknown';
        imagethumb = book.volumeInfo.imageLinks ? book.volumeInfo.imageLinks.thumbnail : 'images/nocover.jpg';

        // Display book information
        bookname.innerHTML = `<strong>${booknames}</strong><br> By <br><em>${authornames}</em>`;
        genrename.innerHTML = `<strong>Genre:</strong> ${genre}`;
        yearofpublish.innerHTML = `<strong>Published:</strong> ${publish}`;
        imagesource.src = imagethumb;

        // Show book info card
        bookinfo.classList.add('show');

        // Show action buttons
        addButton.classList.add('show');
        viewButton.classList.add('show');
    }

    // Add book to library
    function handleAddBook() {
        // Check if book exists using StorageManager
        const bookCount = StorageManager.getBookCount();
        let bookExists = false;

        for (let i = 1; i <= bookCount; i++) {
            const storedBook = StorageManager.getBook(i);
            if (storedBook && storedBook.title === booknames) {
                bookExists = true;
                break;
            }
        }

        if (bookExists) {
            added1.innerHTML = '⚠️ Already in Library!';
            added1.style.background = '#ef4444';
            added1.classList.add('show');
            setTimeout(() => {
                added1.classList.remove('show');
            }, 2000);
        } else {
            addinfo();
            getBooks();
            added1.innerHTML = '✓ Added to Library!';
            added1.style.background = '#22c55e';
            added1.classList.add('show');
            setTimeout(() => {
                added1.classList.remove('show');
            }, 2000);
        }
    }

    // Get books from cookies
    function getBooks() {
        books_in_storage = [];
        const allBooks = StorageManager.getAllBooks();
        allBooks.forEach(book => {
            if (book.title) {
                books_in_storage.push(book.title);
            }
        });
        console.log(`Loaded ${books_in_storage.length} books from storage`);
    }

    // Add book information to cookies
    function addinfo() {
        let bookIndex = StorageManager.getBookCount() + 1;

        const book = {
            title: booknames,
            author: authornames,
            genre: genre,
            publish: publish,
            thumb: imagethumb,
            dateAdded: new Date().toISOString()
        };

        StorageManager.setBook(bookIndex, book);
        StorageManager.setBookCount(bookIndex);

        console.log(`Book added at index ${bookIndex}`);
    }

    // Clean up on page unload
    window.onbeforeunload = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    };
});
