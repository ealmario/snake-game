import { SNAKE_SPEED, 
  update as updateSnake,
  draw as drawSnake,
} from './snake.js';

// GAME LOOP
let deltaTime = 0;

function main (currentTime) {
  window.requestAnimationFrame(main);
  const secondsSinceLastRender = (currentTime - deltaTime) / 1000;
  
  // # of seconds between each move
  if (secondsSinceLastRender < 1 / SNAKE_SPEED) return
  deltaTime = currentTime;
  console.log("render");

  update();
  draw();
}

window.requestAnimationFrame(main);

function update() {
  updateSnake();
}

function draw() {
  drawSnake();
}