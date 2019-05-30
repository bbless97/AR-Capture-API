var sessionId = window.location.search.split('?sessionID=')[1];
if (sessionId != null) {
    checkSessionStatus();
    var appWrap = document.getElementById('app');
    var errorWrapper = document.getElementById('errorWrapper');
    var errorMessage = document.getElementById('errorMessage');
    var tryAgainButton = document.getElementById('tryAgain');
    var ios = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);
    var testInput = document.createElement('input');
    var promptCaptureSupport = testInput.capture != undefined;
    var mediaWrapper = document.getElementById('mediaWrapper');
    var controlsWrapper = document.getElementById('controlsWrapper');
    var vehicleWrapper = document.getElementById('vehicleWrapper');
    var uploadInput = document.getElementById('uploadInput');
    var uploadLabel = document.getElementById('uploadLabel');
    var cameraLabel = document.getElementById('cameraLabel');
    var cameraInput = document.getElementById('cameraInput');
    var confirmWrapper = document.getElementById('confirm');
    var retryButton = document.getElementById('retryButton');
    var tryAgain = document.getElementById('tryAgain');
    var confirmButton = document.getElementById('confirmButton');
    var completeWrapper = document.getElementById('completeWrapper');
    var wheelWrapper = document.createElement('div'); wheelWrapper.id = 'wheelWrapper';
    var uploadDescription = document.getElementById('uploadDescription');
    var imageURL;
    var userImageOrientation;
    var wheelBounds;

    if (promptCaptureSupport != false) {
        $(cameraLabel).css('display', 'inline-block');
        $(uploadLabel).css('display', 'inline-block');
        $(uploadDescription).html('Capture or Upload a photo of your vehicle.');
    } else {
        $(uploadLabel).css('display', 'inline-block');
        $(uploadDescription).html('Upload a photo of your vehicle.');
        $(cameraLabel).hide();
    }

    function scanStarted() {
        $.get("http://192.168.1.185:3000/Session/ScanStarted", { id: sessionId })
            .done(function (data) {
                return;
            });
    }

    function checkSessionStatus() {
        $.get('http://192.168.1.185:3000/Session/Get', { id: sessionId })
            .done(function (data) {
                if (data.imageData != null) {
                    errorHandling('Session is Invalid');
                    tryAgainButton.style.display = 'none';
                    $('#controlsWrapper').css('display', 'none');
                } else {
                    scanStarted();
                    $('#mediaWrapper').css('display', 'none');
                    $('#controlsWrapper').css('display', 'block');
                }
            });
    }

    function sessionEnd() {
        $.get("http://192.168.1.185:3000/Session/End", { id: sessionId });
    }

    function sessionUploadImage() {
        $.post("http://192.168.1.185:3000/Session/Upload", { id: sessionId, imageData: imageURL, imageOrientation: userImageOrientation, wheelData: wheelBounds })
            .done(function (data) {
                $('#loader').css('display', 'none');
                if (data == true) {
                    completeWrapper.style.display = 'flex';
                    controlsWrapper.style.display = 'none';
                    mediaWrapper.style.display = 'none';
                    appWrap.classList.add('getStarted');
                    appWrap.classList.remove('confirmPage');
                    console.log(data)
                } else {
                    errorHandling("There was a problem uploading your image. Please try again with a different image.");
                }
            });
    }

    function upload(file) {
        var formData = new FormData();
        formData.append('imageData', file, 'rssImageUpload');

        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'http://api-alpha.ridestyler.net/Imaging/ExtractWheelInformation');

        xhr.upload.addEventListener("progress", function (evt) {
            $('#loader').css('display', 'block');
        }, false);

        xhr.addEventListener("progress", function () {
            $('#loader').css('display', 'block');
        }, false);

        xhr.onload = function () {
            var response = JSON.parse(xhr.response);
            if (response.Success === false) {
                errorHandling("Image is not valid. Please try again.");
                appWrap.classList.add('getStarted');
                appWrap.classList.remove('confirmPage');
                $('#loader').css('display', 'none');
            } else {
                appWrap.classList.add('confirmPage');
                appWrap.classList.remove('getStarted');
                showVehicleViewport(response.Result);
                wheelBounds = JSON.stringify(response.Result);

                $('#loader').hide();
            }
        }

        xhr.send(formData);
    }

    function getOrientation(image) {
        EXIF.getData(image, function () {
            var tags = EXIF.getAllTags(this);
            mediaWrapper.style.background = '#323232';
            userImageOrientation = tags.Orientation;

            if (tags.Orientation == 6) {
                if (ios) {
                    mediaWrapper.style.cssText += '-webkit-transform: rotate(0deg);'
                    mediaWrapper.style.height = 'auto';
                    mediaWrapper.style.width = '97%';
                    controlsWrapper.style.display = 'inline-flex';
                    controlsWrapper.style.position = 'relative';
                    controlsWrapper.style.top = (mediaWrapper / 2) + 'px';
                    $(wheelWrapper).css('transform-origin', 'center');
                    wheelWrapper.style.cssText = 'transform: rotate(90deg) translate(12.5%, 16.6%);';
                    $(wheelWrapper).css('width', (image.height + "px"));
                    $(wheelWrapper).css('height', (image.width + "px"));
                    mediaWrapper.classList.add('portrait');
                } else {
                    mediaWrapper.style.cssText += 'transform: rotate(90deg) translate(12.3%);';
                    mediaWrapper.style.marginBottom = '25%';
                    mediaWrapper.style.height = 'auto';
                    mediaWrapper.style.width = '100%';
                    mediaWrapper.classList.add('portrait');
                }
            } else if (tags.Orientation == 8) {
                if (ios) {
                    mediaWrapper.style.cssText += '-webkit-transform: rotate(0deg);';
                    mediaWrapper.style.height = 'auto';
                    mediaWrapper.style.width = '97%';
                    mediaWrapper.style.marginBottom = '25%';
                    controlsWrapper.style.position = 'relative';
                    controlsWrapper.style.top = (mediaWrapper / 2.5) + 'px';
                    mediaWrapper.classList.add('portrait');
                } else {
                    mediaWrapper.style.cssText += 'transform: rotate(-90deg) translate(12.3%);';
                    mediaWrapper.style.marginBottom = '25%';
                    mediaWrapper.style.height = 'auto';
                    mediaWrapper.style.width = '100%';
                    mediaWrapper.classList.add('portrait');
                }
            } else if (tags.Orientation == 3) {
                if (ios) {
                    mediaWrapper.style.cssText += '-webkit-transform: rotate(0deg);';
                    mediaWrapper.style.height = 'auto';
                    mediaWrapper.style.width = '97%';
                    wheelWrapper.style.cssText = 'transform: rotate(180deg)';
                    mediaWrapper.classList.remove('portrait');
                } else {
                    mediaWrapper.style.cssText += 'transform: rotate(180deg) translate(0%);';
                    mediaWrapper.style.height = 'auto';
                    mediaWrapper.classList.remove('portrait');
                }
            } else if (tags.Orientation == 1 || tags.Orientation == undefined) {
                wheelWrapper.style.cssText = 'transform: rotate(0deg)';
                mediaWrapper.classList.remove('portrait');
            }
        });
    }

    function compress(f, w, h) {
        var width = 485;
        var height = parseInt(h * width / w);
        var reader = new FileReader();
        reader.readAsDataURL(f);
        reader.onload = function (event) {
            var img = new Image();
            img.src = event.target.result;
            img.width = width;
            img.height = height;
            img.crossOrigin = "Anonymous";
            img.onload = function () {
                var canvas = document.createElement('canvas');
                if (ios && h > w) {
                    canvas.width = height;
                    canvas.height = width;
                    canvas.style.width = height + 'px';
                    canvas.style.height = width + 'px';
                    var ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, img.height, img.width);
                } else {
                    canvas.width = width;
                    canvas.height = height;
                    canvas.style.width = width + 'px';
                    canvas.style.height = height + 'px';
                    var ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                }
                imageURL = canvas.toDataURL();
                ctx.canvas.toBlob(function (blob) {
                    if (blob.size < f.size) {
                        upload(blob);
                    } else {
                        upload(f);
                    }
                }, '*', 0);
            };
        };
    }

    function convertToImage(fileInput) {
        var file = fileInput.files[0];
        var image = new Image();
        image.src = URL.createObjectURL(file);
        image.id = 'vehicleImage';
        image.onload = function () {

            $('#loader').css('display', 'block');
            vehicleWrapper.append(image);
            vehicleWrapper.style.height = 'auto';
            vehicleWrapper.style.width = '100%';
            vehicleWrapper.append(wheelWrapper);
            uploadLabel.style.display = 'none';
            uploadDescription.style.display = 'none';
            mediaWrapper.style.backgroundColor = '#323232';
            mediaWrapper.style.display = 'inline-flex';
            controlsWrapper.style = '';
            controlsWrapper.style.display = 'block';

            compress(file, vehicleWrapper.offsetWidth, vehicleWrapper.offsetHeight);
            getOrientation(image);

            if (cameraLabel) {
                cameraLabel.style.display = 'none';
                uploadLabel.style.display = 'none';
            } else {
                uploadLabel.style.display = 'none';
            }

            $('#mediaWrapper').show();
        }
    }

    var wheelsElements = [document.getElementsByClassName('wheel')[0], document.getElementsByClassName('wheel')[1]];

    function retry(buttonId) {
        if (buttonId == 'tryAgain') {
            controlsWrapper.style = '';
            controlsWrapper.style.display = 'block';
        } else {
            confirmWrapper.style.display = 'none';
        }
        vehicleWrapper.innerHTML = '';
        vehicleWrapper.style = '';
        wheelWrapper.innerHTML = '';
        wheelWrapper.style = '';
        mediaWrapper.style = '';
        mediaWrapper.style.display = 'none';
        controlsWrapper.style.height = '100%';
        uploadDescription.style.display = 'block';
        errorWrapper.style.display = 'none';
        $('#wheelWrapper').removeAttr('style');
        $('#mediaWrapper').removeAttr('style');
        $('#mediaWrapper').hide();

        if (promptCaptureSupport != false) {
            cameraLabel.style.display = 'inline-block';
            uploadLabel.style.display = 'inline-block';
            uploadInput.value = null;
            cameraInput.value = null;
        } else {
            uploadLabel.style.display = 'inline-block';
            uploadInput.value = null;
            cameraInput.value = null;
        }
    }

    function errorHandling(message) {
        errorWrapper.style.display = 'flex';
        errorMessage.innerHTML = message;
        controlsWrapper.style.display = 'none';
        mediaWrapper.style.display = 'none';
    }

    function confirm() {
        $('#loader').css('display', 'block');
        sessionUploadImage();
    }

    function showVehicleViewport(r) {
        if (r.RelativeBounds.length != 0) {
            $('#wheelWrapper').append(wheelsElements[0] = createWheelElement(r.RelativeBounds[0].Bounds));
            $('#wheelWrapper').append(wheelsElements[1] = createWheelElement(r.RelativeBounds[1].Bounds));
            confirmWrapper.style.display = 'inline-flex';
            controlsWrapper.style.height = 'auto';
        } else {
            errorHandling("Could not detect wheels. Try another image.");
            appWrap.classList.add('getStarted');
            appWrap.classList.remove('confirmPage');
        }
    }

    function createWheelElement(bounds) {
        var wheel = document.createElement('img');
        wheel.className = 'wheel marker';
        wheel.style.left = (bounds.X * 100) + '%';
        wheel.style.top = (bounds.Y * 100) + '%';
        wheel.style.width = (bounds.Width * 100) + '%';
        wheel.style.height = (bounds.Height * 100) + '%';

        return wheel;
    }

    if (uploadInput) {
        uploadInput.addEventListener('change', function () {
            if (uploadInput.files.length > 0) {
                convertToImage(uploadInput);
            } else {
                uploadLabel.style.display = 'inline-block';
            }
        });
    }

    if (cameraInput) {
        cameraInput.addEventListener('change', function () {
            if (cameraInput.files.length > 0) {
                convertToImage(cameraInput);
            } else {
                cameraLabel.style.display = 'inline-block';
            }
        });
    }

    var mql = window.matchMedia("(orientation: portrait)");

    mql.addListener(function () {
        var image = document.getElementById('vehicleImage');
        if (ios && image && mediaWrapper.classList.contains('portrait')) {
            $(wheelWrapper).css('width', (image.height + "px"));
            $(wheelWrapper).css('height', (image.width + "px"));
        }
    });

    confirmButton.addEventListener('click', function () {
        confirm();
    });

    retryButton.addEventListener('click', function () {
        retry();
        scanStarted();
    });

    tryAgain.addEventListener('click', function () {
        retry('tryAgain');
        scanStarted();
    })
}
