const TOTAL = 250;
let currentGeneration = 1;

const newGeneration = (snakes, table) => {
  snakes.map(snake => snake.reDrawSnake()) // erase from board
  const newSnakes = [];

  calculateFitness(snakes);

  for (let i = 0; i < TOTAL; i++) {
    const snake = pickOne(snakes, table);

    snake.draw();
    newSnakes.push(snake);
  }

  console.log(currentGeneration++);
  return newSnakes;
}

const pickOne = (snakes, table) => {
  let index = 0;
  let r = Math.random();

  while (r > 0) {
    r = r - snakes[index].fitness;
    index++;
  }

  index--;

  let snake = snakes[index]
  let newSnake = new Snake(table, snake.brain)

  return newSnake;
}

const calculateFitness = (snakes) => {
  let sumSpeedScore = 0;

  snakes.map(s => sumSpeedScore += s.speedScore)
  snakes.map(s => s.fitness = s.speedScore / sumSpeedScore)
}


function gaussianRand() {
  var rand = 0;

  for (var i = 0; i < 6; i += 1) {
    rand += Math.random();
  }

  return rand / 6;
}

function gaussianRandom(start = 0, end = 1) {
  return Math.floor(start + gaussianRand() * (end - start + 1));
}
