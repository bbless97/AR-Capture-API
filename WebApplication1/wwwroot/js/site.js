var sessionId = window.location.search.split('?sessionID=')[1];
if (sessionId != null) {
    var ios = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);
    var testInput = document.createElement('input');
    var promptCaptureSupport = testInput.capture != undefined;
    var mediaWrapper = document.getElementById('mediaWrapper'); $('#mediaWrapper').css('display', 'none');
    var controlsWrapper = document.getElementById('controlsWrapper'); $('#controlsWrapper').css('display', 'flex');
    var vehicleWrapper = document.getElementById('vehicleWrapper');
    var uploadInput = document.getElementById('uploadInput');
    var uploadLabel = document.getElementById('uploadLabel');
    var cameraLabel = document.getElementById('cameraLabel');
    var cameraInput = document.getElementById('cameraInput');
    var confirmWrapper = document.getElementById('confirm');
    var retryButton = document.getElementById('retryButton');
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

    function sessionWaiting() {
        $.get("http://192.168.1.185:3000/Session/ScanStarted", { id: sessionId })
            .done(function (data) {
                return;
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
                    console.log(data)
                } else {
                    showModal("There was a problem uploading your image. Please try again with a different image.");
                    retry();
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
                showModal("Error: Image is not valid. Please try again.");
                $('#loader').css('display', 'none');
                retry();
            }

            sessionWaiting();
            showVehicleViewport(response.Result);
            wheelBounds = JSON.stringify(response.Result);

            $('#loader').hide();
        }

        xhr.send(formData);
    }

    function getOrientation(image) {
        EXIF.getData(image, function () {
            var tags = EXIF.getAllTags(this);
            mediaWrapper.style.background = 'white';
            userImageOrientation = tags.Orientation;
            console.log(userImageOrientation);

            if (tags.Orientation == 6) {
                if (ios) {
                    mediaWrapper.style.cssText += '-webkit-transform: rotate(0deg);'
                    mediaWrapper.style.height = 'auto';
                    mediaWrapper.style.width = '97%';
                    controlsWrapper.style.display = 'flex';
                    controlsWrapper.style.position = 'relative';
                    controlsWrapper.style.top = (mediaWrapper / 2) + 'px';
                    $(wheelWrapper).css('transform-origin', 'center');
                    wheelWrapper.style.cssText = 'transform: rotate(90deg) translate(12.5%, 16.6%);';
                    $(wheelWrapper).css('width', (image.height + "px"));
                    $(wheelWrapper).css('height', (image.width + "px"));
                } else {
                    mediaWrapper.style.cssText += 'transform: rotate(90deg) translate(12.3%);';
                    mediaWrapper.style.marginBottom = '25%';
                    mediaWrapper.style.height = 'auto';
                    mediaWrapper.style.width = '100%';
                }
            } else if (tags.Orientation == 8) {
                if (ios) {
                    mediaWrapper.style.cssText += '-webkit-transform: rotate(0deg);';
                    mediaWrapper.style.height = 'auto';
                    mediaWrapper.style.width = '97%';
                    mediaWrapper.style.marginBottom = '25%';
                    controlsWrapper.style.position = 'relative';
                    controlsWrapper.style.top = (mediaWrapper / 2.5) + 'px';
                } else {
                    mediaWrapper.style.cssText += 'transform: rotate(-90deg) translate(12.3%);';
                    mediaWrapper.style.marginBottom = '25%';
                    mediaWrapper.style.height = 'auto';
                    mediaWrapper.style.width = '100%';
                }
            } else if (tags.Orientation == 3) {
                if (ios) {
                    mediaWrapper.style.cssText += '-webkit-transform: rotate(0deg);';
                    mediaWrapper.style.height = 'auto';
                    mediaWrapper.style.width = '97%';
                    wheelWrapper.style.cssText = 'transform: rotate(180deg)';
                } else {
                    mediaWrapper.style.cssText += 'transform: rotate(180deg) translate(0%);';
                    mediaWrapper.style.height = 'auto';
                }
            } else if (tags.Orientation == 1) {
                if (ios) {
                    wheelWrapper.style.cssText = 'transform: rotate(0deg)';
                }
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
            mediaWrapper.style.backgroundColor = 'white';
            mediaWrapper.style.display = 'block';

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

    function retry() {
        vehicleWrapper.innerHTML = '';
        vehicleWrapper.style = '';
        wheelWrapper.innerHTML = '';
        wheelWrapper.style = '';
        mediaWrapper.style = '';
        mediaWrapper.style.display = "none";
        confirmWrapper.style.display = 'none';
        controlsWrapper.style.height = "100%";
        uploadDescription.style.display = 'inline-block';
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

    function confirm() {
        $('#loader').css('display', 'block');
        sessionUploadImage();
    }

    function showModal(text) {
        var modal = document.getElementsByClassName('ar-modal')[0];
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'ar-modal';
            modal.innerHTML = '<p id="ar-modal-text">' + text + '</p>';
            document.body.appendChild(modal);
        } else {
            modal.style.display = "flex";
        }
        modal.addEventListener('click', function () {
            modal.style.display = "none";
        });
    }

    function showVehicleViewport(r) {
        if (r.RelativeBounds.length != 0) {
            $('#wheelWrapper').append(wheelsElements[0] = createWheelElement(r.RelativeBounds[0].Bounds));
            $('#wheelWrapper').append(wheelsElements[1] = createWheelElement(r.RelativeBounds[1].Bounds));
            confirmWrapper.style.display = 'flex';
            controlsWrapper.style.height = 'auto';
        } else {
            showModal("Error: Could not detect wheels. Try another image.");
            retry();
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

    confirmButton.addEventListener('click', function () {
        confirm();
    });

    retryButton.addEventListener('click', function () {
        retry();
    });
}
