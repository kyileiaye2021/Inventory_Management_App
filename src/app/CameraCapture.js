import React, { useRef, useEffect, useState } from "react";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage"
import * as cocoSsd from '@tensorflow-models/coco-ssd'; //COCO-SSD is a pre-trained obj detection model that can identify 90 different classes of objects
import '@tensorflow/tfjs';

const CameraCapture = ({ onCapture }) =>{
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const tracksRef = useRef(null); // Use ref to store tracks
    const [isCameraOn, setIsCameraOn] = useState(false); //at first the camera on bool val is false

    useEffect(() => {
        console.log("CameraCapture component mounted");
      }, []);
    /**
     * This func starts the video feed and turning on the camera
     * When the startCamera func is called, it first updates the state to indicate that the camera is on.
     * It then requests access to the camera using the 'getUserMedia' API
     * If access is granted, it sets the video element's source to the camera stream
     * It then plays the video element and display the video feed to the user
     * If there is an error accessing the camera, it catches
     */
    const startCamera = () => {
        console.log("Start button clicked");
        setIsCameraOn(true); //set the isCameraOn state true to indicate that the camera is on 
        
        //Handling the camera stream
        //request access to the camera using the getUserMedia API
        navigator.mediaDevices.getUserMedia({ video: true }) //video constraint is used to specify that the video feed wants to be accessed instead of audio
        .then(stream => {
            //if the access is granted, set the video element's source to the camera stream
            videoRef.current.srcObject = stream;

            //start playing the video stream, ensuriing that the video feed is displayed to the user
            videoRef.current.play();
            console.log("Camera started");
        })
        .catch(err => {
            //handle any errors that occur while trying to access the camera
            console.error("Error accessing the camera: ", err);
        });
    };

    /**
     * This func stops the video feed from the camera and releases the camera resources
     * When the stopCamera func is called, it first updates the state to indicate that the camera is off
     * Get media stream from the video element
     * Get an array of all media tracks (video in this case) from the stream
     */
    const stopCamera = () => {
        console.log("Stopping camera...");
        setIsCameraOn(false); //set the isCameraOn state false to indicate that the camera is

        if (videoRef.current){
            console.log("Video element exists.");

            if (videoRef.current.srcObject){
                console.log("Video element has a srcObject.");
                let stream = videoRef.current.srcObject; // get the current media stream from the video element
                tracksRef.current = stream.getTracks(); //get all the tracks (video and/or audio) from the media stream using getTracks method of MediaStream obj
                tracksRef.current.forEach(track => {
                    console.log("Stopping track:", track);
                    track.stop()
                }); //stop each track to turn off the camera
            
            videoRef.current.srcObject = null; // Clear the srcObject
            console.log("Camera stopped and srcObject cleared.");

            } else {
                console.log("Video element does not have a srcObject.");
            }
        } else {
            console.log("Video element does not exist.");
        }
    };

    /**
     * This function captures a frame from the video feed, convert it into image, upload the image to firebase, and detects objects in the image using an object detection model
     * Retrieve the 2D drawing context of the canvas element
     * Draw current frame of the video feed on the context
     * Convert the canvas context into image data URL
     * Upload the image data to Firebase
     * Detect the objects in the image with the detection model
     */
    const capturePhoto = async () => {
        try {
            const context = canvasRef.current.getContext('2d'); //get the 2D drawing context of the canvas element
            console.log("Got 2D drawing context from canvas.");

            context.drawImage(videoRef.current, 0, 0, 640, 480); //draw the current frame from the video element onto the canvas
            console.log("Drew current video frame to canvas.");

            const imageData = canvasRef.current.toDataURL('image/png');//convert the canvas content to a data URL (base64-encoded image)
            console.log("Converted canvas content to data URL.");

            console.log("Uploading image to Firebase...");
            await uploadImageToFirebase(imageData); //upload the image to the Firebase
            console.log("Image uploaded to Firebase.");

            console.log("Detecting objects in image...");
            detectObjectsInImage(canvasRef.current); //detect objects in the image using an object's detection model
            console.log("Object detection complete.");

        } catch (error) {
            console.error("Error capturing photo: ", err);
        }
    };

    /**
     * This function uploads the base64-encoded imageData to Firebase Storage
     * Initialize a firebase storage and make a ref to a location in the storage to store the image
     * Upload the string data_url to the database
     * Download the url 
     * @param {*} imageData 
     * @returns 
     */
    const uploadImageToFirebase = async (imageData) => {
        const storage = getStorage(); //initialize Firebase Storage

        //create a ref to the location in Firebase storage where the image will be stored
        //he image path is constructed using the current date and time (converted to an ISO string) to ensure a unique filename for each uploaded image
        const storageRef = ref(storage, `images/${new Date().toISOString()}.png`);

        //upload the base64-encoded image string to Firebase storage
        return uploadString(storageRef, imageData, 'data_url').then((snapshot) => {

            //get the download URL of the uploaded image
            return getDownloadURL(snapshot.ref).then((downloadURL) => {

                //call the onCapture callback with the download URL
                onCapture(downloadURL, []); //capture without objects for now
            });
        })
        .catch((error) => {
            console.error("Error uploading image to Firebase:", error);
        });
    };

    /**
     * This function uses the COCO-SSD model from TensorFlow.js to detect objects in image
     * @param {*} canvas 
     */
    const detectObjectsInImage = async (canvas) => {
        try{
            //get the 2D drawing context of the canvas element
            //load the COCO-SSD model using Tensorflow.js
            const model = await cocoSsd.load();

            //perform obj detection on the canvas image
            const predictions = await model.detect(canvas);

            //log the predictions to the console
            console.log('Predictions: ', predictions);

            //handle the detected objects
            onCapture(null, predictions);
        } catch (error) {
            console.error("Error detecting objects in image:", error);
        }
    };

    const buttonStyle = {
        fontSize: '18px',
        padding: '15px 30px',
        margin: '10px'
    };
    
    return(
        <div>
            {isCameraOn ? (
                <div>
                    <video ref ={videoRef} width="640" height="480"/>
                    <canvas ref={canvasRef} width="640" height="480" style={{ display: 'none' }}/>
                    <button style={buttonStyle} onClick={capturePhoto}>Capture</button>
                    <button style={buttonStyle} onClick={stopCamera}>Stop Camera</button>
                </div>
            ) : (
                <button style={buttonStyle} onClick={startCamera}>Start Camera</button>
            )}
        </div>
    )
};

export default CameraCapture;