var sessionId = window.location.search.split('?sessionID=')[1];
if (sessionId != null) {
    var testInput = document.createElement('input');
    var promptCaptureSupport = testInput.capture != undefined;
    var appWrap = document.getElementById('app');
    var errorWrapper = document.getElementById('errorWrapper');
    var errorMessage = document.getElementById('errorMessage');
    var mediaWrapper = document.getElementById('mediaWrapper');
    var controlsWrapper = document.getElementById('controlsWrapper');
    var promptWrapper = document.getElementById('promptWrapper');
    var vehicleWrapper = document.getElementById('vehicleWrapper');
    var vehicleImage = document.getElementById('vehicleImage');
    var uploadInput = document.getElementById('uploadInput');
    var uploadLabel = document.getElementById('uploadLabel');
    var cameraLabel = document.getElementById('cameraLabel');
    var cameraInput = document.getElementById('cameraInput');
    var loader = document.getElementById('loader');
    var retryButton = document.getElementById('retryButton');
    var tryAgain = document.getElementById('tryAgain');
    var confirmButton = document.getElementById('confirmButton');
    var completeWrapper = document.getElementById('completeWrapper');
    var wheelWrapper = document.getElementById('wheelWrapper');
    var uploadDescription = document.getElementById('uploadDescription');
    var ImageUrl;
    var wheelBounds;
    checkSessionStatus();

    // Checking session state
    function checkSessionStatus() {
        var url = 'http://192.168.1.185:3000/Session/Get?id=' + sessionId;
        var requestType = 'GET';

        function handleResponse(response) {
            if (response == null || response.state == 3 || response.state == 4) {
                errorHandling('Session is Invalid');
                tryAgain.style.display = 'none';
                loader.style.display = 'none';
            } else if (response == 3) {
                loader.style.display = 'block';
            } else if (response.state == 1 || response.state == 2) {
                promptUser();
                scanStarted();
                loader.style.display = 'none';
                mediaWrapper.style.display = 'none';
            }
        }

        sendRequest(url, handleResponse, requestType);
    }

    // Sets session status to "Waiting for upload"
    function scanStarted() {
        var url = 'http://192.168.1.185:3000/Session/ScanStarted?id=' + sessionId;
        var requestType = 'GET';

        function handleResponse(response) {
            return;
        }

        sendRequest(url, handleResponse, requestType);
    }

    // Uploads user's image to the session
    function sessionUploadImage() {
        var url = 'http://192.168.1.185:3000/Session/Upload';
        var requestType = 'POST';
        var formData = new FormData();
        formData.append('id', sessionId);
        formData.append('imageData', ImageUrl);
        formData.append('wheelData', wheelBounds);

        function handleResponse(response) {
            if (response == true) {
                loader.style.display = 'none';
                completeWrapper.style.display = 'flex';
                controlsWrapper.style.display = 'none';
                mediaWrapper.style.display = 'none';
                appWrap.classList.add('getStarted');
                appWrap.classList.remove('confirmPage');
            } else if (response == false) {
                errorHandling("There was a problem uploading your image. Please try again with a different image.");
            } else {
                loader.style.display = 'block';
            }
        }

        sendRequest(url, handleResponse, requestType, formData);
    }

    // Sets session to state to "Ended"
    function sessionEnd() {
        var url = 'http://192.168.1.185:3000/Session/End?id=' + sessionId;
        var requestType = 'GET';

        function handleResponse() {
            return;
        }

        sendRequest(url, handleResponse, requestType)
    }

    // Prompt user to upload or take an image from phone
    function promptUser() {
        if (promptCaptureSupport != false) {
            promptWrapper.style.display = 'inline-block';
            cameraLabel.style.display = 'inline-block';
            uploadLabel.style.display = 'inline-block';
            uploadDescription.innerHTML = 'Capture or Upload a photo of your vehicle.';
        } else {
            promptWrapper.style.display = 'inline-block';
            uploadLabel.style.display = 'inline-block';
            cameraLabel.style.display = 'none';
            uploadDescription.innerHTML = 'Upload a photo of your vehicle.';
        }
        uploadInput.value = null;
        cameraInput.value = null;
    }

    // Resize image, rotate if necessary
    function prepareCanvas(image, fw, fh, sw, sh, rotation) {
        if (rotation == 90 || rotation == -90) {
            var tempWidth = sw;
            sw = sh;
            sh = tempWidth;
        }
        var canvas = document.createElement('canvas');
        canvas.width = sw;
        canvas.height = sh;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, fw, fh, 0, 0, sw, sh);

        return canvas
    }

    // Convert file to image
    function convertToImage(fileInput) {
        var file = fileInput.files[0];

        var image = new Image();
        image.src = URL.createObjectURL(file);
        image.crossOrigin = "Anonymous";

        image.onload = function () {
            prepareImage(image);
        }
    }

    // Get images orientation at the time of capture
    function prepareImage(img) {
        EXIF.getData(img, function () {
            var rotation = 0;
            var orientation = EXIF.getTag(this, 'Orientation');

            if (orientation == 6) {
                rotation = 90;
            } else if (orientation == 8) {
                rotation = -90;
            } else if (orientation == 3) {
                rotation = 180;
            }

            processImage(img, rotation);
        });
    }

    // Scale image to a fixed size to prevent large images being uploaded
    function processImage(img, rotation) {
        var maxRes = 1024;
        var scale = 1;
        var maxDimension = Math.max(img.width, img.height);

        // Compute scale if needed
        if (maxRes < maxDimension) {
            scale = maxRes / maxDimension;
        }

        // Scale dimensions to fit in max resolution
        var sw = img.width * scale;
        var sh = img.height * scale;

        var canvas = createScaledImageCanvas(img, rotation, sw, sh);

        // Storing image to display after wheel bounds confirm
        ImageUrl = canvas.toDataURL('image/png', 1);

        // Convert canvas to blob for upload
        convertCanvasToBlob(canvas);

    }

    // Create image canvas based off of scale
    function createScaledImageCanvas(img, rotation, sw, sh) {

        var canvas = document.createElement('canvas');

        // Rotate dimensions if needed
        var rotateType = 'none';
        if (rotation == 90 || rotation == -90) {
            rotateType = 'portrait';
            canvas.width = sh;
            canvas.height = sw;
        } else if (rotation == 180) {
            rotateType = 'landscape';
            canvas.width = sw;
            canvas.height = sh;
        } else {
            canvas.width = sw;
            canvas.height = sh;
        }

        var ctx = canvas.getContext('2d');

        if (rotateType == 'portrait') {
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(rotation * Math.PI / 180);
            ctx.drawImage(img, -canvas.height / 2, -canvas.width / 2, canvas.height, canvas.width);
        } else if (rotateType == 'landscape') {
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(rotation * Math.PI / 180);
            ctx.drawImage(img, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
        } else {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }

        return canvas
    }

    // Convert canvas to blob for upload
    function convertCanvasToBlob(canvas) {
        canvas.toBlob(function (blob) {
            upload(blob);
        }, '*', 0);
    }

    // Upload file to get wheel bound info
    function upload(file) {
        var url = 'http://api-alpha.ridestyler.net/Imaging/ExtractWheelInformation';
        var requestType = 'POST';
        var formData = new FormData();
        formData.append('imageData', file, 'rssImageUpload');
        loader.style.display = 'block';

        function handleResponse(response) {
            if (response.Success === false) {
                errorHandling("Image is not valid. Please try again.");
                retrySelection();
                appWrap.classList.add('confirmPage');
                appWrap.classList.remove('getStarted');
                loader.style.display = 'none';
            } else if (response == 3) {
                return;
            } else {
                displayVehicle(response.Result);
                wheelBounds = JSON.stringify(response.Result);
                appWrap.classList.add('confirmPage');
                appWrap.classList.remove('getStarted');
                loader.style.display = 'none';
            }
        }

        sendRequest(url, handleResponse, requestType, formData);
    }

    // Display vehicle along with wheel bounds
    function displayVehicle(r) {
        var wheelsElements = [document.getElementsByClassName('wheel')[0], document.getElementsByClassName('wheel')[1]];
        if (r.RelativeBounds.length != 0) {
            vehicleImage.src = ImageUrl;
            wheelWrapper.append(wheelsElements[0] = createWheelElement(r.RelativeBounds[0].Bounds));
            wheelWrapper.append(wheelsElements[1] = createWheelElement(r.RelativeBounds[1].Bounds));
            controlsWrapper.style.display = 'block';
            controlsWrapper.style.height = 'auto';
            mediaWrapper.style.display = 'block';
            promptWrapper.style = '';
        } else {
            errorHandling("Could not detect wheels. Try another image.");
            appWrap.classList.add('getStarted');
            appWrap.classList.remove('confirmPage');
            promptWrapper.style = '';
        }

        vehicleImage.onload = function () {
            if (vehicleImage.height > vehicleImage.width) {
                mediaWrapper.classList.add('portrait');
            } else {
                mediaWrapper.classList.remove('portrait');
            }
        }

    }

    // Create Wheel elements from wheel bounds
    function createWheelElement(bounds) {
        var wheel = document.createElement('div');
        wheel.className = 'wheel marker';
        wheel.style.left = (bounds.X * 100) + '%';
        wheel.style.top = (bounds.Y * 100) + '%';
        wheel.style.width = (bounds.Width * 100) + '%';
        wheel.style.height = (bounds.Height * 100) + '%';

        return wheel;
    }

    // Send requests to api
    function sendRequest(url, callback, requestType, formData) {

        var xhr = new XMLHttpRequest();
        xhr.open(requestType, url);

        xhr.addEventListener("progress", function () {
            callback(xhr.readyState);
        }, false);

        xhr.onload = function () {
            var response = JSON.parse(xhr.response);
            if (response.Success === false) {
                callback(xhr.readyState);
            } else {
                callback(response)
            }
        }

        if (formData) {
            xhr.send(formData);
        } else {
            xhr.send();
        }
    }

    // Users clicks retry or tryAgain button, starts process over
    function retrySelection(buttonId) {
        if (buttonId == 'tryAgain') {
            controlsWrapper.style = '';
            controlsWrapper.style.display = 'block';
        }
        wheelWrapper.innerHTML = '';
        vehicleImage.src = '';
        mediaWrapper.style.display = 'none';
        mediaWrapper.classList = '';
        controlsWrapper.style = '';
        uploadDescription.style.display = 'block';
        errorWrapper.style.display = 'none';
        promptWrapper.style = '';
        appWrap.classList.add('getStarted');
        appWrap.classList.remove('confirmPage');

        promptUser();
    }

    // User clicks confirm button, sends session new image and wheel bounds
    function comfirmSelection() {
        loader.style.display = 'block';
        sessionUploadImage();
    }

    // Shows modal with message
    function errorHandling(message) {
        errorWrapper.style.display = 'flex';
        errorMessage.innerHTML = message;
        controlsWrapper.style.display = 'none';
        mediaWrapper.style.display = 'none';
    }

    // Upload file input event listener
    if (uploadInput) {
        uploadInput.addEventListener('change', function () {
            if (uploadInput.files.length > 0) {
                convertToImage(uploadInput);
            } else {
                uploadLabel.style.display = 'inline-block';
            }
        });
    }

    // Camera file input event listener
    if (cameraInput) {
        cameraInput.addEventListener('change', function () {
            if (cameraInput.files.length > 0) {
                convertToImage(cameraInput);
            } else {
                cameraLabel.style.display = 'inline-block';
            }
        });
    }

    // Confirm button click listener
    confirmButton.addEventListener('click', function () {
        comfirmSelection();
    });

    // Confirm button click listener
    retryButton.addEventListener('click', function () {
        retrySelection();
        scanStarted();
    });

    // Try again button click listener
    tryAgain.addEventListener('click', function () {
        retrySelection('tryAgain');
        scanStarted();
    })
}
