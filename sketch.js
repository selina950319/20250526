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

  // 印出偵測狀況
  // 方便看debug直接寫在畫面上
  fill(0);
  noStroke();
  textSize(16);
  textAlign(LEFT, TOP);
  text("手部偵測數量: " + handLandmarks.length, 10, 10);
  text("臉部偵測數量: " + faceLandmarks.length, 10, 30);
  text("目前手勢: " + currentGesture, 10, 50);

  if (faceLandmarks.length > 0) {
    let keypoints = faceLandmarks[0];

    // 畫紅色臉部輪廓
    stroke('red');
    strokeWeight(15);
    noFill();
    beginShape();
    for (let i of faceIndexes1) {
      if (keypoints[i]) vertex(keypoints[i].x * width, keypoints[i].y * height);
    }
    endShape();

    // 黃色區域
    fill('yellow');
    stroke('red');
    strokeWeight(1);
    beginShape();
    for (let i of faceIndexes2) {
      if (keypoints[i]) vertex(keypoints[i].x * width, keypoints[i].y * height);
    }
    endShape(CLOSE);

    // 綠色中間區域
    fill('green');
    stroke('red');
    strokeWeight(1);
    beginShape();
    for (let i of faceIndexes1.concat(faceIndexes2)) {
      if (keypoints[i]) vertex(keypoints[i].x * width, keypoints[i].y * height);
    }
    endShape(CLOSE);

    // 預設鼻子位置
    if (!circlePos && keypoints[1]) {
      circlePos = createVector(keypoints[1].x * width, keypoints[1].y * height);
      console.log("初始圓圈位置設定為鼻子: ", circlePos.x, circlePos.y);
    }

    detectHandGesture();

    // 根據手勢移動圓圈位置
    if (currentGesture === "rock" && keypoints[10]) {
      circlePos.set(keypoints[10].x * width, keypoints[10].y * height);  // 額頭
      console.log("拳頭 - 移到額頭: ", circlePos.x, circlePos.y);
    } else if (currentGesture === "paper" && keypoints[33]) {
      circlePos.set(keypoints[33].x * width, keypoints[33].y * height);  // 左眼 (你說左臉頰，33 是左眼附近)
      console.log("布 - 移到左眼: ", circlePos.x, circlePos.y);
    } else if (currentGesture === "scissors" && keypoints[234]) {
      circlePos.set(keypoints[234].x * width, keypoints[234].y * height); // 右臉頰
      console.log("剪刀 - 移到右臉頰: ", circlePos.x, circlePos.y);
    }

    // 確認 circlePos 是否有效，並畫圓圈
    if (circlePos && !isNaN(circlePos.x) && !isNaN(circlePos.y)) {
      noStroke();
      fill(255, 0, 0, 150);
      ellipse(circlePos.x, circlePos.y, 50, 50);
    } else {
      console.log("circlePos 無效，不畫圓");
    }
  } else {
    // 臉部沒偵測到就清除circlePos
    circlePos = null;
  }

  // 畫手部骨架點，幫助你 debug 手勢
  if (handLandmarks.length > 0) {
    stroke(0, 0, 255);
    strokeWeight(5);
    for (let i = 0; i < handLandmarks[0].length; i++) {
      let x = handLandmarks[0][i].x * width;
      let y = handLandmarks[0][i].y * height;
      point(x, y);
    }
  }
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
