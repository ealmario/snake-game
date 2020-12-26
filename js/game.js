import { 
  update as updateSnake, 
  draw as drawSnake,
  getSnakeHead,
  snakeIntersection
} from './snake.js';
import { update as updateFood, draw as drawFood } from './food.js';
import { outsideGrid } from './grid.js';
import { RATE_INCREASE, ADD_SCORE } from './constants.js';

// DOM
const gameBoard = document.getElementById('gameBoard');
const scoreContainer = document.getElementById('score');
const highScoreContainer = document.getElementById('highScore');
const playBtn = document.getElementById('play');
const instBtn = document.getElementById('instructions');
const backBtn = document.getElementById('back');
const instModal = document.getElementById('instModal');
const titleModal = document.getElementById('titleModal');
const overlayModal = document.getElementById('overlayModal');

// GAME LOOP
let deltaTime = 0;
let gameOver = false;
let snakeSpeed = 5; //how many times the snake moves per second
let score = 0;
let highScore =  0;
scoreContainer.innerHTML = score;
highScoreContainer.innerHTML = score;

console.log(score);

function main (currentTime) {
  if (gameOver) {
    if (score > highScore) {
      highScore = score;
      localStorage.setItem("highScore", highScore);
    }

    if (confirm('You lost. Press ok to restart')) {
      score = 0;
      highScore = 0;
      window.location = "/";
    }
    return 
  }
  
  window.requestAnimationFrame(main);
  const secondsSinceLastRender = (currentTime - deltaTime) / 1000;
  
  // # of seconds between each move
  if (secondsSinceLastRender < 1 / snakeSpeed) return
  deltaTime = currentTime;

  update();
  draw();
}

function startGame() {
  if (localStorage.getItem('highScore') !== null) {
    highScore = parseInt(localStorage.getItem('highScore'));
    highScoreContainer.innerHTML = highScore;
  }

  overlayModal.style.display = 'none';
  window.requestAnimationFrame(main);
}

function instructions() {
  instModal.classList.remove('display-none');
  titleModal.classList.add('display-none');
}

function back() {
  instModal.classList.add('display-none');
  titleModal.classList.remove('display-none');
}

function update() {
  updateSnake();
  updateFood();
  checkDeath();
}

function draw() {
  gameBoard.innerHTML = '';
  drawSnake(gameBoard);
  drawFood(gameBoard);
}

function checkDeath() {
  gameOver = outsideGrid(getSnakeHead()) || snakeIntersection();
}

function compareScore(score, highScore) {
  if (score > highScore) {
    highScore = score;
    console.log('highscore in compareScore is', highScore)
    highScoreContainer.innerHTML = highScore;
  } return
}

export function increaseSpeed() {
  snakeSpeed += RATE_INCREASE;
  if (snakeSpeed >= 6) {
    snakeSpeed += RATE_INCREASE * 4;
  }
  console.log(snakeSpeed);
}

export function addScore() {
  score += Math.floor(snakeSpeed) + ADD_SCORE;
  if (snakeSpeed >= 10) {
    score += Math.floor(snakeSpeed) + ADD_SCORE * 2;
  }
  scoreContainer.innerHTML = score;
  compareScore(score, highScore);
}

playBtn.addEventListener('click', startGame);
instBtn.addEventListener('click', instructions);
backBtn.addEventListener('click', back);