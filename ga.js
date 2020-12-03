const TOTAL = 100;
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

  newSnake.brain.mutate(x => Math.random() > 0.5 ? x + 0.01 : x - 0.01)

  return newSnake;
}

const calculateFitness = (snakes) => {
  let sumSpeedScore = 0;

  snakes.map(s => sumSpeedScore += s.speedScore)
  snakes.map(s => s.fitness = s.speedScore / sumSpeedScore)
}
