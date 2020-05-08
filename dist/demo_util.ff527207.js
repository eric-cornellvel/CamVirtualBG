// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"demo_util.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getInputSize = getInputSize;
exports.ensureOffscreenCanvasCreated = ensureOffscreenCanvasCreated;
exports.drawAndBlurImageOnOffScreenCanvas = drawAndBlurImageOnOffScreenCanvas;
exports.renderImageDataToOffScreenCanvas = renderImageDataToOffScreenCanvas;
exports.renderImageToOffScreenCanvas = renderImageToOffScreenCanvas;
exports.drawWithCompositing = drawWithCompositing;

function getSizeFromImageLikeElement(input) {
  if (input.offsetHeight !== 0 && input.offsetWidth !== 0) {
    return [input.offsetHeight, input.offsetWidth];
  } else if (input.height != null && input.width != null) {
    return [input.height, input.width];
  } else {
    throw new Error("HTMLImageElement must have height and width attributes set.");
  }
}

function getSizeFromVideoElement(input) {
  if (input.height != null && input.width != null) {
    return [input.height, input.width];
  } else {
    return [input.videoHeight, input.videoWidth];
  }
}

function getInputSize(input) {
  if (typeof HTMLCanvasElement !== 'undefined' && input instanceof HTMLCanvasElement || typeof HTMLImageElement !== 'undefined' && input instanceof HTMLImageElement) {
    return getSizeFromImageLikeElement(input);
  } else if (typeof ImageData !== 'undefined' && input instanceof ImageData) {
    return [input.height, input.width];
  } else if (typeof HTMLVideoElement !== 'undefined' && input instanceof HTMLVideoElement) {
    return getSizeFromVideoElement(input);
  } else if (input instanceof tf.Tensor) {
    return [input.shape[0], input.shape[1]];
  } else {
    throw new Error("error: Unknown input type: " + input + ".");
  }
}

var offScreenCanvases = {};

function isSafari() {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

function assertSameDimensions(_a, _b, nameA, nameB) {
  var widthA = _a.width,
      heightA = _a.height;
  var widthB = _b.width,
      heightB = _b.height;

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

function ensureOffscreenCanvasCreated(id) {
  if (!offScreenCanvases[id]) {
    offScreenCanvases[id] = createOffScreenCanvas();
  }

  return offScreenCanvases[id];
}

function drawAndBlurImageOnCanvas(image, blurAmount, canvas) {
  var height = image.height,
      width = image.width;
  var ctx = canvas.getContext('2d');
  canvas.width = width;
  canvas.height = height;
  ctx.clearRect(0, 0, width, height);
  ctx.save();

  if (isSafari()) {
    cpuBlur(canvas, image, blurAmount);
  } else {
    ctx.filter = "blur(" + blurAmount + "px)";
    ctx.drawImage(image, 0, 0, width, height);
  }

  ctx.restore();
}

function drawAndBlurImageOnOffScreenCanvas(image, blurAmount, offscreenCanvasName) {
  var canvas = ensureOffscreenCanvasCreated(offscreenCanvasName);

  if (blurAmount === 0) {
    renderImageToCanvas(image, canvas);
  } else {
    drawAndBlurImageOnCanvas(image, blurAmount, canvas);
  }

  return canvas;
}

function renderImageToCanvas(image, canvas) {
  var width = image.width,
      height = image.height;
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

function renderImageDataToOffScreenCanvas(image, canvasName) {
  var canvas = ensureOffscreenCanvasCreated(canvasName);
  renderImageDataToCanvas(image, canvas);
  return canvas;
}

function renderImageToOffScreenCanvas(image, canvasName) {
  var canvas = ensureOffscreenCanvasCreated(canvasName);
  renderImageToCanvas(image, canvas);
  return canvas;
}

function drawWithCompositing(ctx, image, compositOperation) {
  ctx.globalCompositeOperation = compositOperation;
  ctx.drawImage(image, 0, 0);
}
},{}]},{},["demo_util.js"], null)
//# sourceMappingURL=/demo_util.ff527207.js.map