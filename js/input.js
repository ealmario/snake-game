const arrowUp = document.getElementById('arrowUp');
const arrowLeft = document.getElementById('arrowLeft');
const arrowRight = document.getElementById('arrowRight');
const arrowDown = document.getElementById('arrowDown');

let inputDirection = { x: 0, y: 0 };
let lastInputDirection = { x: 0, y: 0};

window.addEventListener('keydown', handleDirection);
window.addEventListener('click', handleMobileDirection);

function handleDirection(e) {
  switch (e.keyCode) {
    case 87:
      if (lastInputDirection.y !== 0) break;
      inputDirection = { x: 0, y: -1 };
      break;
    case 83:
      if (lastInputDirection.y !== 0) break;
      inputDirection = { x: 0, y: 1 };
      break;
    case 65:
      if (lastInputDirection.x !== 0) break;
      inputDirection = { x: -1, y: 0 };
      break;
    case 68:
      if (lastInputDirection.x !== 0) break;
      inputDirection = { x: 1, y: 0 };
      break;
  }
}

function handleMobileDirection(e) {
  switch(e.target) {
    case arrowUp:
      if (lastInputDirection.y !== 0) break;
      inputDirection = { x: 0, y: -1 };
      break;
    case arrowDown:
      if (lastInputDirection.y !== 0) break;
      inputDirection = { x: 0, y: 1 };
      break;
    case arrowLeft:
      if (lastInputDirection.x !== 0) break;
      inputDirection = { x: -1, y: 0 };
      break;
    case arrowRight:
      if (lastInputDirection.x !== 0) break;
      inputDirection = { x: 1, y: 0 };
      break;
  }
}

export function getInputDirection () {
  lastInputDirection = inputDirection;
  return inputDirection;
}