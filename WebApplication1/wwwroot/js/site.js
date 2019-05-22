// Please see documentation at https://docs.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.
// Write your JavaScript code.
$(document).ready(function () {
    var app = document.getElementById('app');
    var ios = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);
    var instaCaptureSupport = 'mediaDevices' in navigator;
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

    if (promptCaptureSupport != false) {
        $(cameraLabel).css('display', 'inline-block');
        $(uploadLabel).css('display', 'inline-block');
    } else {
        $(uploadLabel).css('display', 'inline-block');
        $(cameraLabel).hide();
    }

    function getOrientation(image) {
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
                    mediaWrapper.style.marginBottom = '18%';
                    mediaWrapper.style.height = 'auto';
                    mediaWrapper.style.width = '100%';
                }
                mediaWrapper.style.backgroundColor = '#a2a2a2';
            } else if (tags.Orientation == 8) {
                if (ios) {
                    mediaWrapper.style.cssText = '-webkit-transform: rotate(0deg);';
                    mediaWrapper.style.height = 'auto';
                    mediaWrapper.style.width = '97%';
                    controlsWrapper.style.position = 'relative';
                    controlsWrapper.style.top = (mediaWrapper / 2) + 'px';
                } else {
                    mediaWrapper.style.cssText = 'transform: rotate(-90deg) translate(12.3%);';
                    mediaWrapper.style.marginBottom = '18%';
                    mediaWrapper.style.height = 'auto';
                    mediaWrapper.style.width = '100%';
                }
                mediaWrapper.style.backgroundColor = '#a2a2a2';
            } else if (tags.Orientation == 3) {
                if (ios) {
                    mediaWrapper.style.cssText = '-webkit-transform: rotate(0deg);';
                    mediaWrapper.style.height = 'auto';
                    mediaWrapper.style.width = '97%';
                } else {
                    mediaWrapper.style.cssText = 'transform: rotate(180deg) translate(0%);';
                    mediaWrapper.style.height = 'auto';
                    mediaWrapper.style.width = '97%';
                }
                mediaWrapper.style.backgroundColor = '#a2a2a2';
            }
        });
    }

    function convertToImage(fileInput) {
        var file = fileInput.files[0];
        var image = new Image();
        var imageElement = document.createElement('IMG');
        image.src = URL.createObjectURL(file);
        image.id = 'vehicleImage';
        mediaWrapper.appendChild(vehicleWrapper);

        image.onload = function () {

            getOrientation(image);

            $('#loader').css('display', 'block');
            vehicleWrapper.append(image);
            vehicleWrapper.style.height = 'auto';
            vehicleWrapper.style.width = '100%';
            uploadLabel.style.display = 'none';
            mediaWrapper.style.backgroundColor = '#a2a2a2';

            if (cameraLabel) {
                cameraLabel.style.display = 'none';
                uploadLabel.style.display = 'none';
            } else {
                uploadLabel.style.display = 'none';
            }
        }
        // if(file.size > 1000000){
        //     compress(file, vehicleWrapper.offsetWidth, vehicleWrapper.offsetHeight);
        // } else {
        upload(file);
        // getOrientation(image);
        // }
    }

    function retry() {
        vehicleWrapper.innerHTML = '';
        vehicleWrapper.style = '';
        mediaWrapper.style = '';
        confirmWrapper.style.display = 'none';
        controlsWrapper.style.height = "100%";

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
        confirmWrapper.style.display = 'none';
    }

    function compress(f, w, h) {
        var width = w;
        var height = h;
        var fileName = f.name;
        var reader = new FileReader();
        var newFile;
        reader.readAsDataURL(f);
        reader.onload = function (event) {
            var img = new Image();
            img.src = event.target.result;
            img.onload = function () {
                var elem = document.createElement('canvas');
                elem.width = width;
                elem.height = height;
                var ctx = elem.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                ctx.canvas.toBlob(function (blob) {
                    newFile = new File([blob], 'image.jpg', {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    });
                    upload(newFile);

                }, 'image/jpeg', 1);
            };
        };
    }

    function upload(file) {
        var formData = new FormData();
        formData.append('imageData', file, 'rssImageUpload');
        formData.append('Mode', 'BestPair');
        formData.append('IncludeStatistics', 'true');

        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://api-alpha.ridestyler.net/Imaging/ExtractWheelInformation');

        xhr.upload.addEventListener("progress", function (evt) {
            $('#loader').css('display', 'block');
        }, false);

        xhr.addEventListener("progress", function () {
            // File is done uploading, waiting for server
            $('#loader').css('display', 'block');
        }, false);

        xhr.onload = function () {
            var response = JSON.parse(xhr.response);
            // document.body.append(JSON.stringify(response));
            if (response.Success === false) {
                showModal("Image is not valid. Please try again.");
                $('#loader').css('display', 'none');
                retry();
            }
            showVehicleViewport(response.Result);
            $('#loader').hide();
            $('#mediaWrapper').show();
        }
        xhr.send(formData);
    }

    var wheelsElements = [document.getElementsByClassName('wheel')[0], document.getElementsByClassName('wheel')[1]];

    function selectWheel(elem) {
        var selectedWheels = document.getElementsByClassName('wheel-div');

        for (var i = 0; i < selectedWheels.length; i++) {
            if (selectedWheels[i].classList.value.includes('selected-wheel') && selectedWheels[i] != elem) {
                selectedWheels[i].classList.remove('selected-wheel');
            }
        }

        elem.classList.add('selected-wheel');

        if (isVehicleActive === false) return;

        var url = elem.firstChild.src.replace('catalog', 'side');
        if (url) {
            for (var i = 0; i < wheelsElements.length; i++) {
                wheelsElements[i].src = url;
                wheelsElements[i].className = 'wheel active';
            }
        }
    }

    function startOver() {
        var wheelSelector = document.getElementsByClassName("wheel-container")[0];
        var wrapper = document.querySelector('.canvas-wrapper');
        var vehicleViewport = document.getElementsByClassName('vehicle-viewport')[0];
        wrapper.style.display = 'none';
        vehicleViewport.style.display = 'none';
        wheelSelector.classList.remove("active");
        this.upload();
    }

    function showModal(text) {
        var modal = document.getElementsByClassName('ar-modal')[0];
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'ar-modal';
            modal.innerHTML = '<p id="ar-modal-text">Error: ' + text + '</p>';
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
            vehicleWrapper.appendChild(wheelsElements[0] = createWheelElement(r.RelativeBounds[0].Bounds));
            vehicleWrapper.appendChild(wheelsElements[1] = createWheelElement(r.RelativeBounds[1].Bounds));
            confirmWrapper.style.display = 'flex';
            controlsWrapper.style.height = 'auto';
        } else {
            showModal("Could not detect wheels. Try another image.");
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
            var vehicleImage = document.getElementById('vehicleImage');
            var wrapper = document.getElementById('vehicleWrapper');
            mediaWrapper.style.height = wrapper.height;
            mediaWrapper.style.width = wrapper.width;
            controlsWrapper.style = '';
            controlsWrapper.style.height = 'auto';
        } else {
            controlsWrapper.style.position = 'relative';
            controlsWrapper.style.top = (mediaWrapper / 2) + 'px';
        }
    });
});

