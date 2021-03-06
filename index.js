import * as bodyPix from '@tensorflow-models/body-pix';
import { getInputSize, ensureOffscreenCanvasCreated, drawAndBlurImageOnOffScreenCanvas, renderImageToOffScreenCanvas, renderImageDataToOffScreenCanvas, drawWithCompositing } from './demo_util';

import virtualBGSrc from '/imgs/sample.jpg';
import videoPath1 from '/imgs/video_test.mp4';
import blackBG from '/imgs/black.jpg';
import abstract_images from './imgs/abstract/*.jpg';
import interior_images from './imgs/interior/*.jpg';
import nature_images from './imgs/nature/*.jpg';
import publicspaces_images from './imgs/publicspaces/*.jpg';
import workspaces_images from './imgs/workspaces/*.jpg';
import funny_images from './imgs/funny/*.jpg';
import trait_videos from './imgs/videos/*.mp4';

var currentBGSrc = virtualBGSrc;
var blurredImage //virtual background
var isWebcam = true;

var defaultCategory = 'abstract';
var currentCategory = "";
var currentBGFilename = "";

const state = {
    video: null,
    stream: null,
    net: null
};


async function loadBodyPix() {
    //TODO allow dynamic changing
    state.net = await bodyPix.load({
        architecture: 'MobileNetV1',
        outputStride: 16,
        multiplier: 0.75,
        quantBytes: 4
    });
}

async function estimateSegmentation(mode = 'person') {
    let multiPersonSegmentation = null;
    // BodyPix setup, TODO: dynamic change it
    const segmentPersonConfig = {
        flipHorizontal: false,     // Flip for webcam
        maxDetections: 1,                   // only look at one person in this model
        scoreThreshold: 0.5,
        segmentationThreshold: 0.6,         // default is 0.7
    };

    switch (mode) {
        case 'multi-person-instance':
            return await state.net.segmentMultiPerson(state.video, segmentPersonConfig);
        case 'person':
            return await state.net.segmentPerson(state.video, segmentPersonConfig);
        default:
            break;
    };
    return multiPersonSegmentation;
}

async function estimatePartSegmentation(mode = 'person') {
    let multiPersonPartSegmentation = null;
    // BodyPix setup, TODO: dynamic change it
    const segmentPersonConfig = {
        flipHorizontal: false,     // Flip for webcam
        maxDetections: 1,                   // only look at one person in this model
        scoreThreshold: 0.5,
        segmentationThreshold: 0.6,         // default is 0.7
    };

    switch (mode) {
        case 'multi-person-instance':
            return await state.net.segmentMultiPersonParts(state.video, segmentPersonConfig);
        case 'person':
            return await state.net.segmentPersonParts(state.video, segmentPersonConfig);
        default:
            break;
    };
    return multiPersonPartSegmentation;
}



/**
 * Feeds an image to BodyPix to estimate segmentation - this is where the
 * magic happens. This function loops with a requestAnimationFrame method.
 */
function segmentBodyInRealTime() {
    // Canvas setup
    const canvas = document.getElementById('output-canvas');
    //const ctx = canvas.getContext('2d');

    async function bodySegmentationFrame() {

        var mode = 'person';
        const multiPersonSegmentation = await estimateSegmentation(mode);

        /*
        const multiPersonPartSegmentation = await estimatePartSegmentation(mode); //test
        const backgroundBlurAmount = 10;
        var webcamBlurredImage = drawAndBlurImageOnOffScreenCanvas(state.video, backgroundBlurAmount, 'webcam'); //test
        */

        canvas.width = blurredImage.width;
        canvas.height = blurredImage.height;
        var ctx = canvas.getContext('2d');
        if (Array.isArray(multiPersonSegmentation) &&
            multiPersonSegmentation.length === 0) {
            ctx.drawImage(blurredImage, 0, 0);
            return;
        }
        //create person mask
        const edgeBlurAmount = 3;
        var backgroundMaskImage = bodyPix.toMask(multiPersonSegmentation, { r: 0, g: 0, b: 0, a: 255 }, { r: 0, g: 0, b: 0, a: 0 });
        var backgroundMask = renderImageDataToOffScreenCanvas(backgroundMaskImage, 'mask');
        var personMask;
        if (edgeBlurAmount === 0) {
            personMask = backgroundMask;
        }
        else {
            personMask = drawAndBlurImageOnOffScreenCanvas(backgroundMask, edgeBlurAmount, 'blurred-mask');
        }

        //test facemask
        /*
        const bodyPartIdsToMask = [0, 1]; // (left-face and right-face)
        var backgroundMaskImageBodyParts = bodyPix.toMask(multiPersonPartSegmentation, { r: 0, g: 0, b: 0, a: 0 }, { r: 0, g: 0, b: 0, a: 255 }, true, bodyPartIdsToMask);
        var backgroundMaskBodyParts = renderImageDataToOffScreenCanvas(backgroundMaskImageBodyParts, 'mask-bodypart');
        var bodyPartMask;
        if (edgeBlurAmount === 0) {
            bodyPartMask = backgroundMaskBodyParts;
        }
        else {
            bodyPartMask = drawAndBlurImageOnOffScreenCanvas(backgroundMaskBodyParts, edgeBlurAmount, 'blurred-mask-bodypart');
        }
        */

        ctx.save();
        var _a = getInputSize(state.video), height = _a[0], width = _a[1];
        ctx.drawImage(state.video, 0, 0, width, height);

        //drawWithCompositing(ctx, bodyPartMask, 'destination-in');
        //drawWithCompositing(ctx, webcamBlurredImage, 'destination-over');

        drawWithCompositing(ctx, personMask, 'destination-in');
        drawWithCompositing(ctx, blurredImage, 'destination-over');
        ctx.restore();

        requestAnimationFrame(bodySegmentationFrame);
    }

    bodySegmentationFrame();
}

function segmentBodyAndBlurFace() {
    // Canvas setup
    var canvas = ensureOffscreenCanvasCreated('blur-face');

    async function bodySegmentationFrame() {

        var mode = 'person';
        const multiPersonSegmentation = await estimateSegmentation(mode);
        const multiPersonPartSegmentation = await estimatePartSegmentation(mode); //test
        const backgroundBlurAmount = 10;
        var webcamBlurredImage = drawAndBlurImageOnOffScreenCanvas(state.video, backgroundBlurAmount, 'webcam'); //test

        //var blurredImage = drawAndBlurImageOnOffScreenCanvas(state.video, backgroundBlurAmount, 'blurred');
        canvas.width = blurredImage.width;
        canvas.height = blurredImage.height;
        var ctx = canvas.getContext('2d');
        if (Array.isArray(multiPersonSegmentation) &&
            multiPersonSegmentation.length === 0) {
            ctx.drawImage(webcamBlurredImage, 0, 0);
            return;
        }
        //create person mask
        const edgeBlurAmount = 3;
        var backgroundMaskImage = bodyPix.toMask(multiPersonSegmentation, { r: 0, g: 0, b: 0, a: 255 }, { r: 0, g: 0, b: 0, a: 0 });
        var backgroundMask = renderImageDataToOffScreenCanvas(backgroundMaskImage, 'mask');
        var personMask;
        if (edgeBlurAmount === 0) {
            personMask = backgroundMask;
        }
        else {
            personMask = drawAndBlurImageOnOffScreenCanvas(backgroundMask, edgeBlurAmount, 'blurred-mask');
        }

        //test facemask
        const bodyPartIdsToMask = [0, 1]; // (left-face and right-face)
        var backgroundMaskImageBodyParts = bodyPix.toMask(multiPersonPartSegmentation, { r: 0, g: 0, b: 0, a: 0 }, { r: 0, g: 0, b: 0, a: 255 }, true, bodyPartIdsToMask);
        var backgroundMaskBodyParts = renderImageDataToOffScreenCanvas(backgroundMaskImageBodyParts, 'mask-bodypart');
        var bodyPartMask;
        if (edgeBlurAmount === 0) {
            bodyPartMask = backgroundMaskBodyParts;
        }
        else {
            bodyPartMask = drawAndBlurImageOnOffScreenCanvas(backgroundMaskBodyParts, edgeBlurAmount, 'blurred-mask-bodypart');
        }

        ctx.save();
        var _a = getInputSize(state.video), height = _a[0], width = _a[1];
        ctx.drawImage(state.video, 0, 0, width, height);

        drawWithCompositing(ctx, bodyPartMask, 'destination-in');
        drawWithCompositing(ctx, webcamBlurredImage, 'destination-over');

        drawWithCompositing(ctx, personMask, 'destination-in');
        drawWithCompositing(ctx, blurredImage, 'destination-over');
        ctx.restore();
    }

    bodySegmentationFrame().then(() => {
        canvas.toBlob(download, 'image/jpeg', 0.95);
    }
    );

}

function stopExistingVideoCapture() {
    if (state.video && state.video.srcObject) {
        state.video.srcObject.getTracks().forEach(track => {
            track.stop();
        })
        state.video.srcObject = null;
    }
}

/**
 * Loads a the camera to be used in the demo
 *
 */
async function setupCamera(getWebcam = true) {

    const videoElement = document.getElementById('video');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
            'Browser API navigator.mediaDevices.getUserMedia not available');
    }

    stopExistingVideoCapture();

    const videoConstraints = { width: 640, height: 360 }; //TODO-check whether we need this or set it on canvas

    const stream = await navigator.mediaDevices.getUserMedia(
        { 'audio': false, 'video': videoConstraints });
    videoElement.srcObject = stream;

    return new Promise((resolve) => {
        videoElement.onloadedmetadata = () => {
            videoElement.width = videoElement.videoWidth;
            videoElement.height = videoElement.videoHeight;
            resolve(videoElement);
        };
    });
    
}

async function loadVideo() {
    try {
        if(isWebcam){
            state.video = await setupCamera();
        }else{
            const videoElement = document.getElementById('video');
            state.video = videoElement;
            console.log("test: "+ videoElement.videoWidth + "," + videoElement.videoHeight);
            //state.video.play();
        }
    } catch (e) {
        //let info = document.getElementById('info');
        //info.textContent = 'this browser does not support video capture,' +
        //    'or this device does not have a camera';
        //info.style.display = 'block';
        throw e;
    }
    
    if(isWebcam){
        state.video.play();
    }
}


/**
 * Kicks off the demo.
 */
async function bindPage() {
    // Load the BodyPix model weights with our pre-defined settings
    await loadBodyPix();

    //document.getElementById('main').style.display = 'inline-block';

    await loadVideo();

    //setupFPS();

    //prepare default virtual background
    var bgimg = new Image();
    bgimg.crossorigin = "anonymous";
    bgimg.onload = () => {
        console.log('loaded bg');
        blurredImage = renderImageToOffScreenCanvas(bgimg, 'blurred');
        segmentBodyInRealTime();
    };
    bgimg.src = currentBGSrc;

    //segmentBodyInRealTime();
}

//testing upload feature
var upload_canvas = document.createElement("canvas");
var upload_ctx = upload_canvas.getContext("2d");
var imageData;
document.getElementById('myFile').onchange = function (evt) {
    var tgt = evt.target || window.event.srcElement,
        files = tgt.files;

    // FileReader support
    if (FileReader && files && files.length) {
        var fr = new FileReader();
        fr.onload = () => showImage(fr);
        fr.readAsDataURL(files[0]);
    }
}

function showImage(fileReader) {
    crop(fileReader.result, 16 / 9).then(canvas => {
        var image = document.createElement("img");
        image.id = "uploadPic";
        image.onload = () => {
            //testing update background
            blurredImage = renderImageToOffScreenCanvas(image, 'blurred');
        };
        image.src = canvas.toDataURL();
        currentBGFilename = "custom";
        //document.body.appendChild(canvas);
        document.body.appendChild(image);
    });
}

/**
 * @param {string} url - The source image
 * @param {number} aspectRatio - The aspect ratio
 * @return {Promise<HTMLCanvasElement>} A Promise that resolves with the resulting image as a canvas element
 */
function crop(url, aspectRatio) {

    // we return a Promise that gets resolved with our canvas element
    //example : crop(imageURL, 16/9).then(canvas => { document.body.appendChild(canvas);});
    return new Promise(resolve => {

        // this image will hold our source image data
        const inputImage = new Image();
        inputImage.crossorigin = "anonymous";

        // we want to wait for our image to load
        inputImage.onload = () => {

            // let's store the width and height of our image
            const targetWidth = 640;
            const targetHeight = 360;
            const inputWidth = inputImage.naturalWidth;
            const inputHeight = inputImage.naturalHeight;

            // get the aspect ratio of the input image
            const inputImageAspectRatio = inputWidth / inputHeight;
            // if it's bigger than our target aspect ratio

            let outputWidth = inputWidth;
            let outputHeight = inputHeight;
            if (inputImageAspectRatio > aspectRatio) {
                outputWidth = inputHeight * aspectRatio;
            } else if (inputImageAspectRatio < aspectRatio) {
                outputHeight = inputWidth / aspectRatio;
            }
            console.log(outputWidth + ", " + outputHeight);

            // calculate the position to draw the image at
            //const outputX = (outputWidth - inputWidth) * .5;
            //const outputY = (outputHeight - inputHeight) * .5;
            const outputX = (inputWidth - outputWidth) * .5;
            const outputY = (inputHeight - outputHeight) * .5;

            // create a canvas that will present the output image
            const outputImage = document.createElement('canvas');

            // set it to the same size as the image
            //outputImage.width = outputWidth;
            //outputImage.height = outputHeight;
            outputImage.width = targetWidth;
            outputImage.height = targetHeight;

            // draw our image at position 0, 0 on the canvas
            const ctx = outputImage.getContext('2d');
            ctx.drawImage(inputImage, outputX, outputY, outputWidth, outputHeight, 0, 0, targetWidth, targetHeight);
            resolve(outputImage);

        };

        // start loading our image
        inputImage.src = url;
        //console.log(url);
    })

}

//testing download canvas
const btn = document.getElementById("download-link")
btn.onclick = e => {
    segmentBodyAndBlurFace()
};

function download(blob) {
    // uses the <a download> to download a Blob
    let a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = currentCategory + "_" + currentBGFilename +"_screenshot.jpg";
    document.body.appendChild(a);
    a.click();

    //download the originl background
    //var canvasBG = ensureOffscreenCanvasCreated('blurred');
    //canvasBG.toBlob(downloadBG, 'image/jpeg', 0.95);
}

function downloadBG(blob) {
    let a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = currentBGFilename +"_bg.jpg";
    document.body.appendChild(a);
    a.click();
}

function shuffle(array) {
    array.sort(() => Math.random() - 0.5);
}

$.urlParam = function (name) {
    var results = new RegExp('[\?&]' + name + '=([^&#]*)')
                      .exec(window.location.href);
    if (results == null) {
         return 0;
    }
    return results[1] || 0;
}

$(document).ready(function () {
    
    var mode = $.urlParam('mode');
    var vid = $.urlParam('vid');
    //"Nv0-x4K9YFI_004" -lowE
    //"OgPC4wnLJR0_001" = lowA
    //"IQdz0Pd-L2Y_004" = lowC
    //"lnawWqnGpMc_005" = highN
    //4bDOetaLvZs_001 = lowO
    var videoElement = $("#video");
    if(mode == 'video'){
        isWebcam = false;
        currentBGSrc = blackBG;

        videoElement.attr('width', 640);
        videoElement.attr('height', 360);     
        videoElement.attr('loop', true);
        //videoElement.attr('muted', true);
        //videoElement.attr('src', videoPath1);
        videoElement.attr('src', trait_videos[vid]);
        videoElement.get(0).load();  
        
    }else{
        isWebcam = true;
        navigator.getUserMedia = navigator.getUserMedia ||
        navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    }
    
    //add bg images
    
    //testing
    
    for (var key in trait_videos) {
        // check if the property/key is defined in the object itself, not in parent
        if (trait_videos.hasOwnProperty(key)) {           
            //console.log(key, trait_videos[key]);
        }
    }
    
    var gallery = $('#gallery-list');
    var category_array = ["abstract", "interior", "nature", "publicspaces", "workspaces", "funny"];
    var keys_abstract = Object.keys(abstract_images);
    var keys_interior = Object.keys(interior_images);
    var keys_nature = Object.keys(nature_images);
    var keys_publicspaces= Object.keys(publicspaces_images);
    var keys_workspaces= Object.keys(workspaces_images);
    var keys_funny= Object.keys(funny_images);

    shuffle(keys_abstract);
    shuffle(keys_interior);
    shuffle(keys_nature);
    shuffle(keys_publicspaces);
    shuffle(keys_workspaces);
    shuffle(keys_funny);

    console.log(keys_abstract.length);
    for (var i = 0; i < keys_abstract.length; i++){
        var category_str = 'abstract';
        var imgsrc_str =  abstract_images[keys_abstract[i]];       
        var div_str = "<div class=\"gallery-product col-xl-2 col-lg-3 col-sm-4 filter "+ category_str+ "\"><a class=\"virtual-background\" >" + 
                    "<img src=\""+ imgsrc_str + "\" class=\"img-responsive\"/></a> </div>";
        gallery.append(div_str);

        var category_str = 'interior';
        var imgsrc_str =  interior_images[keys_interior[i]];       
        var div_str = "<div class=\"gallery-product col-xl-2 col-lg-3 col-sm-4 filter "+ category_str+ "\"><a class=\"virtual-background\" >" + 
                    "<img src=\""+ imgsrc_str + "\" class=\"img-responsive\"/></a> </div>";
        gallery.append(div_str);

        var category_str = 'nature';
        var imgsrc_str =  nature_images[keys_nature[i]];       
        var div_str = "<div class=\"gallery-product col-xl-2 col-lg-3 col-sm-4 filter "+ category_str+ "\"><a class=\"virtual-background\" >" + 
                    "<img src=\""+ imgsrc_str + "\" class=\"img-responsive\"/></a> </div>";
        gallery.append(div_str);

        var category_str = 'publicspaces';
        var imgsrc_str =  publicspaces_images[keys_publicspaces[i]];       
        var div_str = "<div class=\"gallery-product col-xl-2 col-lg-3 col-sm-4 filter "+ category_str+ "\"><a class=\"virtual-background\" >" + 
                    "<img src=\""+ imgsrc_str + "\" class=\"img-responsive\"/></a> </div>";
        gallery.append(div_str);

        var category_str = 'workspaces';
        var imgsrc_str =  workspaces_images[keys_workspaces[i]];       
        var div_str = "<div class=\"gallery-product col-xl-2 col-lg-3 col-sm-4 filter "+ category_str+ "\"><a class=\"virtual-background\" >" + 
                    "<img src=\""+ imgsrc_str + "\" class=\"img-responsive\"/></a> </div>";
        gallery.append(div_str);

        var category_str = 'funny';
        var imgsrc_str =  funny_images[keys_funny[i]];       
        var div_str = "<div class=\"gallery-product col-xl-2 col-lg-3 col-sm-4 filter "+ category_str+ "\"><a class=\"virtual-background\" >" + 
                    "<img src=\""+ imgsrc_str + "\" class=\"img-responsive\"/></a> </div>";
        gallery.append(div_str);
        
        
    }


    // kick off the demo
    if(isWebcam){
        bindPage();
    }else{
        videoElement.on("loadeddata", function() {
            videoElement.get(0).play();
            bindPage();
        });   
    }

    //update the selected virtual background
    $(".virtual-background").click(function(){

        //it will use the small resolution
        //var image = $(this).children('img');
        //blurredImage = renderImageToOffScreenCanvas(image[0], 'blurred');

        var imgsrc = $(this).children('img').attr('src');
        currentBGFilename = imgsrc.split("/").pop().split(".")[0];
        crop(imgsrc, 16 / 9).then(canvas => {
            var image = document.createElement("img");
            image.id = "uploadPic";
            image.onload = () => {
                //testing update background
                blurredImage = renderImageToOffScreenCanvas(image, 'blurred');
            };
            image.src = canvas.toDataURL();
        });

    });

    //set default category
    //$(".filter").not('.'+defaultCategory).hide('10');
    currentCategory = defaultCategory;

    $(".filter-button").click(function () {
        var value = $(this).attr('data-filter');
        currentCategory = value;
        if (value == "all") {

            $('.filter').show('1000');
        }
        else {

            $(".filter").not('.' + value).hide('3000');
            $('.filter').filter('.' + value).show('3000');

        }
    });

    if ($(".filter-button").removeClass("active")) {
        $(this).removeClass("active");
    }
    $(this).addClass("active");

    
    $('#categorylist a').on('click', function(){
        $('#selected').text($(this).text());
        currentCategory = $(this).text().toLowerCase();
    });

});