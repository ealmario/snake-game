import { update as updateSnake, draw as drawSnake } from './snake.js';
import { update as updateFood, draw as drawFood } from './food.js';
import { SNAKE_SPEED } from './constants.js';

// GAME LOOP
const gameBoard = document.getElementById('gameBoard');
let deltaTime = 0;

function main (currentTime) {
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
}

function draw() {
  gameBoard.innerHTML = '';
  drawSnake(gameBoard);
  drawFood(gameBoard);
}