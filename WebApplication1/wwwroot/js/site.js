var startSession = $.get("http://192.168.1.185:3000/Session/Start", function () { });
startSession.done(function (data) {
    $('#controlsWrapper').css('display', 'flex');
    var appSession = data;
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
    var confirmButton = document.getElementById('confirmButton');
    var imageOrientation;
    var imageURL;

    if (promptCaptureSupport != false) {
        $(cameraLabel).css('display', 'inline-block');
        $(uploadLabel).css('display', 'inline-block');
    } else {
        $(uploadLabel).css('display', 'inline-block');
        $(cameraLabel).hide();
    }

    function sessionWaiting() {
        $.get("http://192.168.1.185:3000/Session/ScanStarted", { id: appSession.id } )
            .done(function (data) {
                return;
            });
    }

    function sessionEnd() {
        $.get("http://192.168.1.185:3000/Session/End", { id: appSession.id });
    }

    function sessionUploadImage() {
        $.post("http://192.168.1.185:3000/Session/UploadImage", { id: appSession.id, imageData: imageURL })
            .done(function (data) {
                if (data == true) {
                    showModal("Image has been uploaded to RideStyler.");
                    retry();
                    sessionEnd();
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
            $('#loader').hide();
        }

        xhr.send(formData);
    }

    function getOrientation(image) {
        var wheelWrapper = document.createElement('div');
        wheelWrapper.id = 'wheelWrapper';
        vehicleWrapper.appendChild(wheelWrapper);
        $(wheelWrapper).css('height', vehicleWrapper.Height + 'px');
        $(wheelWrapper).css('width', vehicleWrapper.width + 'px');
        EXIF.getData(image, function () {
            var tags = EXIF.getAllTags(this);
            if (tags.Orientation == 6) {
                if (ios) {
                    mediaWrapper.style.cssText = '-webkit-transform: rotate(0deg);'
                    mediaWrapper.style.height = 'auto';
                    mediaWrapper.style.width = '97%';
                    controlsWrapper.style.position = 'relative';
                    controlsWrapper.style.top = (mediaWrapper / 2) + 'px';
                } else {
                    mediaWrapper.style.cssText = 'transform: rotate(90deg) translate(12.3%);';
                    mediaWrapper.style.marginBottom = '25%';
                    mediaWrapper.style.height = 'auto';
                    mediaWrapper.style.width = '100%';
                }
            } else if (tags.Orientation == 8) {
                if (ios) {
                    mediaWrapper.style.cssText = '-webkit-transform: rotate(0deg);';
                    mediaWrapper.style.height = 'auto';
                    mediaWrapper.style.width = '97%';
                    mediaWrapper.style.marginBottom = '25%';
                    controlsWrapper.style.position = 'relative';
                    controlsWrapper.style.top = (mediaWrapper / 2.5) + 'px';
                } else {
                    mediaWrapper.style.cssText = 'transform: rotate(-90deg) translate(12.3%);';
                    mediaWrapper.style.marginBottom = '25%';
                    mediaWrapper.style.height = 'auto';
                    mediaWrapper.style.width = '100%';
                }
            } else if (tags.Orientation == 3) {
                if (ios) {
                    mediaWrapper.style.cssText = '-webkit-transform: rotate(0deg);';
                    mediaWrapper.style.height = 'auto';
                    mediaWrapper.style.width = '97%';
                    wheelWrapper.style.cssText = 'transform: rotate(180deg)';
                    wheelWrapper.style.position = 'absolute';
                    console.log(vehicleWrapper.width)
                    console.log(vehicleWrapper.height)
                    wheelWrapper.style.width = vehicleImage.width + 'px';
                    wheelWrapper.style.height = vehicleImage.height + 'px';
                } else {
                    mediaWrapper.style.cssText = 'transform: rotate(180deg) translate(0%);';
                    mediaWrapper.style.height = 'auto';
                }
            } else if (tags.Orientation == 1) {
                if (ios) {
                    $(wheelWrapper).css('height', height);
                    $(wheelWrapper).css('width', width);
                    $(wheelWrapper).css('position', absolute);
                }
            }
            mediaWrapper.style.backgroundColor = '#a2a2a2';
            mediaWrapper.style.display = 'block';
        });
    }

    function compress(f, w, h) {
        var width = 650;
        var height = parseInt(h * width / w);
        var reader = new FileReader();
        reader.readAsDataURL(f);
        reader.onload = function (event) {
            var img = new Image();
            img.src = event.target.result;
            img.width = width;
            img.height = height;
            img.onload = function () {
                var canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                canvas.style.width = width + 'px';
                canvas.style.height = height + 'px';
                var ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                imageURL = ctx.canvas.toDataURL(img, '*', 1);
                ctx.canvas.toBlob(function (blob) {
                    if (blob.size < f.size) {
                        upload(blob);
                        console.log('compressed');
                    } else {
                        upload(f);
                        console.log('not compressed');
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
        mediaWrapper.appendChild(vehicleWrapper);
        image.onload = function() {

            getOrientation(image);

            $('#loader').css('display', 'block');
            vehicleWrapper.append(image);
            vehicleWrapper.style.height = 'auto';
            vehicleWrapper.style.width = '100%';
            uploadLabel.style.display = 'none';
            mediaWrapper.style.backgroundColor = '#a2a2a2';
            mediaWrapper.style.display = 'block';

            if (cameraLabel) {
                cameraLabel.style.display = 'none';
                uploadLabel.style.display = 'none';
            } else {
                uploadLabel.style.display = 'none';
            }

            compress(file, vehicleWrapper.offsetWidth, vehicleWrapper.offsetHeight);
        }
    }

    var wheelsElements = [document.getElementsByClassName('wheel')[0], document.getElementsByClassName('wheel')[1]];

    function retry() {
        vehicleWrapper.innerHTML = '';
        vehicleWrapper.style = '';
        mediaWrapper.style = '';
        mediaWrapper.style.display = "none";
        confirmWrapper.style.display = 'none';
        controlsWrapper.style.height = "100%";
        $('#wheelWrapper').removeAttr('style');

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

    window.addEventListener("orientationchange", function (e) {
        if (screen.orientation.angle == 0) {
            controlsWrapper.style.height = 'auto';
            controlsWrapper.style.display = 'bock';
        } else {
            controlsWrapper.style.position = 'relative';
            controlsWrapper.style.top = (mediaWrapper / 2) + 'px';
            controlsWrapper.style.height = 'block';
        }
    });
});

