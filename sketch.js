let video;
let faceMesh;
let hands;
let camera;

let faceLandmarks = [];
let handLandmarks = [];

let circlePos = null;
let currentGesture = "none";

// 臉部輪廓點
let faceIndexes1 = [409,270,269,267,0,37,39,40,185,61,146,91,181,84,17,314,405,321,375,291];
let faceIndexes2 = [76,77,90,180,85,16,315,404,320,307,306,408,304,303,302,11,72,73,74,184];

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  setupFaceMesh();
  setupHands();
}

function draw() {
  background(220);
  image(video, 0, 0, width, height);

  if (faceLandmarks.length > 0) {
    const nose = faceLandmarks[0][1];
    if (nose) {
      fill(255, 0, 0, 180);
      noStroke();
      ellipse(nose.x * width, nose.y * height, 50, 50);
      console.log('鼻子座標', nose.x * width, nose.y * height);
    }
  }

  fill(0);
  textSize(24);
  text("手勢: " + currentGesture, 10, 10);
}



function setupFaceMesh() {
  faceMesh = new FaceMesh({
    locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
  });
  faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.5 });
  faceMesh.onResults(results => {
    faceLandmarks = results.multiFaceLandmarks || [];
  });
}

function setupHands() {
  hands = new Hands({
    locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });
  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
  });
  hands.onResults(results => {
    handLandmarks = results.multiHandLandmarks || [];
  });

  camera = new Camera(video.elt, {
    onFrame: async () => {
      await faceMesh.send({ image: video.elt });
      await hands.send({ image: video.elt });
    },
    width: 640,
    height: 480
  });
  camera.start();
}

function detectHandGesture() {
  if (handLandmarks.length === 0) {
    currentGesture = "none";
    return;
  }

  let landmarks = handLandmarks[0];
  let extended = 0;
  const fingers = [8, 12, 16, 20]; // 指尖編號

  for (let tip of fingers) {
    if (landmarks[tip].y < landmarks[tip - 2].y) {
      extended++;
    }
  }

  if (extended === 0) {
    currentGesture = "rock";
  } else if (extended === 4) {
    currentGesture = "paper";
  } else if (extended === 2) {
    currentGesture = "scissors";
  } else {
    currentGesture = "none";
  }
  console.log("手指伸直數量:", extended, "判斷手勢:", currentGesture);
}
