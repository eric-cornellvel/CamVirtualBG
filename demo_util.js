function getSizeFromImageLikeElement(input) {
    if (input.offsetHeight !== 0 && input.offsetWidth !== 0) {
        return [input.offsetHeight, input.offsetWidth];
    }
    else if (input.height != null && input.width != null) {
        return [input.height, input.width];
    }
    else {
        throw new Error("HTMLImageElement must have height and width attributes set.");
    }
}
function getSizeFromVideoElement(input) {
    if (input.height != null && input.width != null) {
        return [input.height, input.width];
    }
    else {
        return [input.videoHeight, input.videoWidth];
    }
}
export function getInputSize(input) {
    if ((typeof (HTMLCanvasElement) !== 'undefined' &&
        input instanceof HTMLCanvasElement) ||
        (typeof (HTMLImageElement) !== 'undefined' &&
            input instanceof HTMLImageElement)) {
        return getSizeFromImageLikeElement(input);
    }
    else if (typeof (ImageData) !== 'undefined' && input instanceof ImageData) {
        return [input.height, input.width];
    }
    else if (typeof (HTMLVideoElement) !== 'undefined' &&
        input instanceof HTMLVideoElement) {
        return getSizeFromVideoElement(input);
    }
    else if (input instanceof tf.Tensor) {
        return [input.shape[0], input.shape[1]];
    }
    else {
        throw new Error("error: Unknown input type: " + input + ".");
    }
}

var offScreenCanvases = {};
function isSafari() {
    return (/^((?!chrome|android).)*safari/i.test(navigator.userAgent));
}
function assertSameDimensions(_a, _b, nameA, nameB) {
    var widthA = _a.width, heightA = _a.height;
    var widthB = _b.width, heightB = _b.height;
    if (widthA !== widthB || heightA !== heightB) {
        throw new Error("error: dimensions must match. " + nameA + " has dimensions " + widthA + "x" + heightA + ", " + nameB + " has dimensions " + widthB + "x" + heightB);
    }
}
function flipCanvasHorizontal(canvas) {
    var ctx = canvas.getContext('2d');
    ctx.scale(-1, 1);
    ctx.translate(-canvas.width, 0);
}
function drawWithCompositing(ctx, image, compositOperation) {
    ctx.globalCompositeOperation = compositOperation;
    ctx.drawImage(image, 0, 0);
}
function createOffScreenCanvas() {
    var offScreenCanvas = document.createElement('canvas');
    return offScreenCanvas;
}
export function ensureOffscreenCanvasCreated(id) {
    if (!offScreenCanvases[id]) {
        offScreenCanvases[id] = createOffScreenCanvas();
    }
    return offScreenCanvases[id];
}
function drawAndBlurImageOnCanvas(image, blurAmount, canvas) {
    var height = image.height, width = image.width;
    var ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    if (isSafari()) {
        cpuBlur(canvas, image, blurAmount);
    }
    else {
        ctx.filter = "blur(" + blurAmount + "px)";
        ctx.drawImage(image, 0, 0, width, height);
    }
    ctx.restore();
}
export function drawAndBlurImageOnOffScreenCanvas(image, blurAmount, offscreenCanvasName) {
    var canvas = ensureOffscreenCanvasCreated(offscreenCanvasName);
    if (blurAmount === 0) {
        renderImageToCanvas(image, canvas);
    }
    else {
        drawAndBlurImageOnCanvas(image, blurAmount, canvas);
    }
    return canvas;
}
function renderImageToCanvas(image, canvas) {
    var width = image.width, height = image.height;
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, width, height);
}
function renderImageDataToCanvas(image, canvas) {
    canvas.width = image.width;
    canvas.height = image.height;
    var ctx = canvas.getContext('2d');
    ctx.putImageData(image, 0, 0);
}
export function renderImageDataToOffScreenCanvas(image, canvasName) {
    var canvas = ensureOffscreenCanvasCreated(canvasName);
    renderImageDataToCanvas(image, canvas);
    return canvas;
}
export function renderImageToOffScreenCanvas(image, canvasName) {
    var canvas = ensureOffscreenCanvasCreated(canvasName);
    renderImageToCanvas(image, canvas);
    return canvas;
}
export function drawWithCompositing(ctx, image, compositOperation) {
    ctx.globalCompositeOperation = compositOperation;
    ctx.drawImage(image, 0, 0);
}


