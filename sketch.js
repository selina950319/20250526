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

  drawFace();
  detectHandGesture();
  drawCircle();
}

function drawFace() {
  for (let prediction of predictions) {
    const keypoints = prediction.scaledMesh;

    // 第一組紅色線條
    stroke('red');
    strokeWeight(15);
    noFill();
    beginShape();
    for (let i of faceIndexes1) {
      const [x, y] = keypoints[i];
      vertex(x, y);
    }
    endShape();

    // 第二組黃色填色
    fill('yellow');
    stroke('red');
    strokeWeight(1);
    beginShape();
    for (let i of faceIndexes2) {
      const [x, y] = keypoints[i];
      vertex(x, y);
    }
    endShape(CLOSE);

    // 中間綠色區域
    fill('green');
    beginShape();
    for (let i of faceIndexes1.concat(faceIndexes2)) {
      const [x, y] = keypoints[i];
      vertex(x, y);
    }
    endShape(CLOSE);

    if (!circlePos) {
      // 預設放鼻子，通常是點 1 或 4（選 1）
      const [x, y] = keypoints[1];
      circlePos = createVector(x, y);
    } else {
      // 根據手勢移動圓圈位置
      if (currentGesture === 'rock') {
        let [x, y] = keypoints[10]; // 額頭（點10）
        circlePos.set(x, y);
      } else if (currentGesture === 'paper') {
        let [x, y] = keypoints[33]; // 左眼
        circlePos.set(x, y);
      } else if (currentGesture === 'scissors') {
        let [x, y] = keypoints[234]; // 左臉頰
        circlePos.set(x, y);
      }
    }
  }
}

function drawCircle() {
  if (circlePos) {
    noStroke();
    fill(255, 0, 0, 150);
    ellipse(circlePos.x, circlePos.y, 50);
  }
}

function detectHandGesture() {
  if (handPredictions.length > 0) {
    const hand = handPredictions[0];
    const fingers = hand.annotations;
    const tips = ['indexFinger', 'middleFinger', 'ringFinger', 'pinky'];
    let extended = 0;

    for (let tip of tips) {
      const tipPos = fingers[tip][3];
      const basePos = fingers[tip][0];
      if (tipPos[1] < basePos[1]) extended++; // 判斷是否伸直
    }

    // 粗略判斷手勢
    if (extended === 0) {
      currentGesture = 'rock';
    } else if (extended === 4) {
      currentGesture = 'paper';
    } else if (extended === 2) {
      currentGesture = 'scissors';
    } else {
      currentGesture = 'none';
    }
  }
}
