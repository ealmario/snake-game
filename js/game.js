import { 
  update as updateSnake, 
  draw as drawSnake,
  getSnakeHead,
  snakeIntersection
} from './snake.js';
import { update as updateFood, draw as drawFood } from './food.js';
import { outsideGrid } from './grid.js';
import { RATE_INCREASE } from './constants.js';

// GAME LOOP
const gameBoard = document.getElementById('gameBoard');
let deltaTime = 0;
let gameOver = false;
let snakeSpeed = 5; //how many times the snake moves per second
let score = 0;

console.log(score);

function main (currentTime) {
  if (gameOver) {
    if (confirm('You lost. Press ok to restart')) {
      window.location = '/';
      score = 0;
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
  console.log(snakeSpeed);
}

window.requestAnimationFrame(main);

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

export function increaseSpeed() {
  snakeSpeed += RATE_INCREASE;
}

export function addScore() {
  score += Math.floor(snakeSpeed) + 10;
  console.log(score);
}