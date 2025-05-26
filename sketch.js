let video;
let faceMesh;
let handpose;
let predictions = [];
let handPredictions = [];

let circlePos = null;
let currentGesture = 'none';

let faceIndexes1 = [409,270,269,267,0,37,39,40,185,61,146,91,181,84,17,314,405,321,375,291];
let faceIndexes2 = [76,77,90,180,85,16,315,404,320,307,306,408,304,303,302,11,72,73,74,184];

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  faceMesh = ml5.facemesh(video, () => console.log('FaceMesh ready'));
  faceMesh.on('predict', results => predictions = results);

  handpose = ml5.handpose(video, () => console.log('Handpose ready'));
  handpose.on('predict', results => handPredictions = results);
}

function draw() {
  background(220);
  image(video, 0, 0, width, height);

  if (predictions.length > 0) {
    const keypoints = predictions[0].scaledMesh;

    // 紅色臉部輪廓
    stroke('red');
    strokeWeight(15);
    noFill();
    beginShape();
    for (let i of faceIndexes1) {
      if (i < keypoints.length) {
        const [x, y] = keypoints[i];
        vertex(x, y);
      }
    }
    endShape();

    // 黃色區域
    drawFilledArea(faceIndexes2, 'yellow');

    // 綠色中間區域
    drawFilledArea(faceIndexes1.concat(faceIndexes2), 'green');

    // 根據手勢移動圓圈
    detectHandGesture();
    if (!circlePos) {
      const [x, y] = keypoints[4]; // 預設鼻子
      circlePos = createVector(x, y);
    } else {
      if (currentGesture === 'rock') {
        const [x, y] = keypoints[10]; // 額頭
        circlePos.set(x, y);
      } else if (currentGesture === 'paper') {
        const [x, y] = keypoints[33]; // 左眼
        circlePos.set(x, y);
      } else if (currentGesture === 'scissors') {
        const [x, y] = keypoints[234]; // 左臉頰
        circlePos.set(x, y);
      }
    }

    drawCircle();
  }
}

// 畫圓圈
function drawCircle() {
  if (circlePos) {
    noStroke();
    fill(255, 0, 0, 150);
    ellipse(circlePos.x, circlePos.y, 50, 50);
  }
}

// 畫指定區域
function drawFilledArea(indexArray, colorFill) {
  if (predictions.length === 0) return;
  const keypoints = predictions[0].scaledMesh;

  fill(colorFill);
  stroke('red');
  strokeWeight(1);
  beginShape();
  for (let i of indexArray) {
    if (i < keypoints.length) {
      const [x, y] = keypoints[i];
      vertex(x, y);
    }
  }
  endShape(CLOSE);
}

// 偵測手勢：拳頭=rock，張開=paper，2指=scissors
function detectHandGesture() {
  if (handPredictions.length > 0) {
    const hand = handPredictions[0];
    const fingers = hand.annotations;
    const tips = ['indexFinger', 'middleFinger', 'ringFinger', 'pinky'];
    let extended = 0;

    for (let tip of tips) {
      const tipPos = fingers[tip][3];
      const basePos = fingers[tip][0];
      if (tipPos[1] < basePos[1]) extended++;
    }

    if (extended === 0) {
      currentGesture = 'rock';
    } else if (extended === 4) {
      currentGesture = 'paper';
    } else if (extended === 2) {
      currentGesture = 'scissors';
    } else {
      currentGesture = 'none';
    }

    console.log('偵測到手勢：', currentGesture);
  }
}
