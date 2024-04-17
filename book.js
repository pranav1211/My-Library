let thecode

document.addEventListener('DOMContentLoaded', () => {
    let scanButton = document.querySelector('#scanButton');
    let video = document.querySelector('#vid');
    let barcodeResult = document.querySelector('#barcodeResult');
    let mediaDevices = navigator.mediaDevices;

    mediaDevices.getUserMedia({
        video: {
            facingMode: { exact: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 980 },
            zoom: 1.0 // Set initial zoom level to 1.0
        }, audio: false,
    }).then((stream) => {
        video.srcObject = stream;
        video.addEventListener("loadedmetadata", () => {
            video.play()
        })
    }).catch(alert)

    // Configure QuaggaJS

    function quaggajss() {
        Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: video
            },
            decoder: {
                readers: ["ean_reader", "ean_8_reader", "upc_reader", "upc_e_reader"] // List of barcode formats to scan
            }
        }, function (err) {
            if (err) {
                console.error("Quagga initialization failed: ", err);
                return;
            }
            console.log("Quagga initialization succeeded");

            // Start QuaggaJS when the "Scan Barcode" button is clicked
            function startcan() {
                Quagga.start();
            }

            setInterval(startcan, 3000)

            // Detect barcode
            Quagga.onDetected(function (result) {
                console.log("Barcode detected and decoded: ", result.codeResult.code);
                barcodeResult.textContent = result.codeResult.code;                
                
                var p = document.createElement('p')
                p.id = ('barcoderesult')
                barcodeResult.appendChild(p)

                // Perform actions based on the detected barcode
                // Example: Redirect to a URL based on the barcode value
                // if (result.codeResult.code === "SOME_BARCODE_VALUE") {
                //     window.location.href = "https://example.com/" + result.codeResult.code;
                // }

                // Stop QuaggaJS after a barcode is detected
                Quagga.stop();
            });

        });
    }
    quaggajss()
    scanButton.addEventListener('click', () => {
        quaggajss() 
    })


    // Stop QuaggaJS and release camera when leaving the page
    window.addEventListener('beforeunload', function () {
        Quagga.stop();
    });
});

var confirm = document.querySelector('#confirm')

var ApiKey
 
fetch('/api/key')
    .then(response => response.text())
    .then(apiKey => {
        ApiKey = apiKey;
    })
    .catch(error => {
        alert('Error fetching API key:', error);
    });


confirm.addEventListener('click', () => {

    var node = document.getElementById('barcodeResult')
    codess = node.textContent
    var apiUrl = 'https://www.googleapis.com/books/v1/volumes?q=isbn:' + codess + '&key=' + ApiKey;
    alert(codess);
    alert(apiUrl);

    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                alert('Network response was not ok');
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {         
            const book = data.items[0];
            barcodeResult.textContent = book.volumeInfo.title;            
        })
        .catch(error => {
            alert('There was a problem with the fetch operation');
            console.error('Fetch error:', error);
        });
});
