import { 
  update as updateSnake, 
  draw as drawSnake,
  getSnakeHead,
  snakeIntersection
} from './snake.js';
import { update as updateFood, draw as drawFood } from './food.js';
import { outsideGrid } from './grid.js';
import { SNAKE_SPEED } from './constants.js';

// GAME LOOP
const gameBoard = document.getElementById('gameBoard');
let deltaTime = 0;
let gameOver = false;

function main (currentTime) {
  if (gameOver) {
    return alert('You lost!');
  }
  
  window.requestAnimationFrame(main);
  const secondsSinceLastRender = (currentTime - deltaTime) / 1000;
  
  // # of seconds between each move
  if (secondsSinceLastRender < 1 / SNAKE_SPEED) return
  deltaTime = currentTime;

  update();
  draw();
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