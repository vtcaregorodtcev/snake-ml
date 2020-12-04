const id = 'game';
const size = 30;
const tick = 1;
const GOAL = 10;

class Table {
  size;
  cells;

  candy;

  constructor(size) {
    this.size = size;

    this.cells = (() => {
      let cells = []

      for (let i = 0; i < this.size; i++) {
        for (let j = 0; j < this.size; j++) {
          if (!cells[i]) cells[i] = [];

          cells[i][j] = this.getCell(i, j)
        }
      }

      return cells;
    })()
  }

  static getCoordsSelector = (x, y) => `x:${x}_y:${y}`;

  getCell = (x, y) => {
    const div = document.createElement('div')
    div.classList.add('cell')
    div.id = Table.getCoordsSelector(x, y)

    return div.outerHTML
  };

  draw = () => {
    const game = document.getElementById('game');

    for (let i = 0; i < this.size; i++) {
      const row = document.createElement('div')

      row.classList.add('row')
      row.innerHTML = this.cells[i].join('');

      game.appendChild(row)
    }
  }

  toggleSnakeClass = (x, y, id) => {
    const cell = document.getElementById(
      Table.getCoordsSelector(x, y)
    )

    cell.classList.toggle(`snake_${id}`)
  }

  isCandy = ([x, y]) => {
    return document.getElementById(
      Table.getCoordsSelector(x, y)
    ).classList.contains('candy')
  }

  isSnake = ([x, y], id) => {
    return document.getElementById(
      Table.getCoordsSelector(x, y)
    ).className.split(' ').some(c => new RegExp(`snake_${id}`).test(c))
  }

  putCandy = () => {
    const x = Math.floor(Math.random() * Math.floor(this.size));
    const y = Math.floor(Math.random() * Math.floor(this.size));

    document.getElementById(
      Table.getCoordsSelector(x, y)
    ).classList.add('candy')

    this.candy = { x, y }
  }

  candyFound = () => {
    document.getElementById(
      Table.getCoordsSelector(this.candy.x, this.candy.y)
    ).classList.remove('candy');

    this.putCandy();
  }

  getDistanceToCandy = ([x1, y1]) => {
    return Math.sqrt(Math.pow(Math.abs(x1 - this.candy.x), 2) + Math.pow(Math.abs(y1 - this.candy.y), 2))
  }
}

class Snake {
  body;
  direction;
  table;

  brain;

  id = Snake.rand();
  isDead = false;
  score = 0;
  lifeTime = 1;
  fitness;
  canCrossBorders = false;

  constructor(
    table,
    brain,
    canCrossBorders = false,
    body = [[0, 0], [0, 1], [0, 2]],
    direction = 'right'
  ) {
    this.table = table;
    this.body = body;
    this.direction = direction;
    this.canCrossBorders = canCrossBorders;

    if (brain instanceof NeuralNetwork) {
      this.brain = brain.copy();
      this.brain.mutate(x => gaussianRandom(x - 0.2, x + 0.2));
    } else {
      // Parameters are number of inputs, number of units in hidden Layer, number of outputs
      this.brain = new NeuralNetwork(4, 12, 3);
    }
  }

  static moves = ['up', 'right', 'down', 'left'];

  static rand = () => Math.floor(Math.random() * Math.floor(Date.now()));

  getDistanceToHead(x1, y1) {
    const [x2, y2] = this.body.slice(-1)[0]

    return Math.sqrt(Math.pow(Math.abs(x1 - x2), 2) + Math.pow(Math.abs(y1 - y2), 2))
  }

  get speedScore() {
    return this.score / this.lifeTime;
  }

  get isCollisionDetected() {
    const coordsToSelector = coords => Table.getCoordsSelector(coords[0], coords[1]);

    return new Set(
      this.body.map(coordsToSelector)
    ).size !== this.body.length
  }

  coordsGonnaIntersect([x, y]) {
    return x < 0 || x >= this.table.size || y < 0 || y >= this.table.size
  }

  get isBordersIntersected() {
    return this.body.filter(x => this.coordsGonnaIntersect(x)).length > 0
  }

  get inputs() {
    const [x, y] = this.body.slice(-1)[0]
    const [xPrev, yPrev] = this.body.slice(-2)[0]

    // surroundings
    const toRight = [x, y + 1]
    const toLeft = [x, y - 1]
    const toTop = [x - 1, y]
    const toBottom = [x + 1, y]

    // moves related to snake direction
    let leftMove = toTop, frontMove = toRight, rightMove = toBottom;

    if (xPrev == toLeft[0] && yPrev == toLeft[1]) { // neak of snake is left
      leftMove = toTop;
      frontMove = toRight;
      rightMove = toBottom;
    } else if (xPrev == toTop[0] && yPrev == toTop[1]) { // neak of snake is top
      leftMove = toRight;
      frontMove = toBottom;
      rightMove = toLeft;
    } else if (xPrev == toRight[0] && yPrev == toRight[1]) { // neak of snake is right
      leftMove = toBottom;
      frontMove = toLeft;
      rightMove = toTop;
    } else if (xPrev == toBottom[0] && yPrev == toBottom[1]) { // neak of snake is bottom
      leftMove = toRight;
      frontMove = toTop;
      rightMove = toRight;
    }

    const obstacleFromLeft = (this.coordsGonnaIntersect(leftMove) || this.table.isSnake(this.normalize(leftMove), this.id)) ? 1 : 0;
    const obstacleFromFront = (this.coordsGonnaIntersect(frontMove) || this.table.isSnake(this.normalize(frontMove), this.id)) ? 1 : 0;
    const obstacleFromRight = (this.coordsGonnaIntersect(rightMove) || this.table.isSnake(this.normalize(rightMove), this.id)) ? 1 : 0;

    const distanceToCandy = this.table.getDistanceToCandy(this.normalize([x, y]));

    const distanceToCandyAfterRightMove = this.table.getDistanceToCandy(this.normalize(rightMove));
    const distanceToCandyAfterLeftMove = this.table.getDistanceToCandy(this.normalize(leftMove));
    const distanceToCandyAfterFrontMove = this.table.getDistanceToCandy(this.normalize(frontMove));

    const nextMinDistance = Math.min(distanceToCandyAfterRightMove, distanceToCandyAfterLeftMove, distanceToCandyAfterFrontMove)

    let suggestedMove = 0;
    if (nextMinDistance == distanceToCandyAfterRightMove && !obstacleFromRight)
      suggestedMove = 1;
    else if (nextMinDistance == distanceToCandyAfterLeftMove && !obstacleFromLeft)
      suggestedMove = -1;
    else if (nextMinDistance == distanceToCandyAfterFrontMove && !obstacleFromFront)
      suggestedMove = 0;


    /*
        const distanceToCandy = this.table.getDistanceToCandy(this.normalize([x, y]));

        const distanceToCandyAfterRight = this.table.getDistanceToCandy(this.normalize([x, y + 1]));
        const distanceToCandyAfterLeft = this.table.getDistanceToCandy(this.normalize([x, y - 1]));
        const distanceToCandyAfterUp = this.table.getDistanceToCandy(this.normalize([x - 1, y]));
        const distanceToCandyAfterDown = this.table.getDistanceToCandy(this.normalize([x + 1, y]));

        const nextMinDistance = Math.min(distanceToCandyAfterRight, distanceToCandyAfterLeft, distanceToCandyAfterUp, distanceToCandyAfterDown)

        let candyBeforeX = false;
        let snakeBeforeX = false;
        let candyAfterX = false;
        let snakeAfterX = false;

        let candyBeforeY = false;
        let snakeBeforeY = false;
        let candyAfterY = false;
        let snakeAfterY = false;

        for (let i = 0; i < x; i++) {
          if (this.table.isCandy([i, y], this.id)) candyBeforeX = true;
          if (this.table.isSnake([i, y], this.id)) snakeBeforeX = true;
        }

        for (let i = 0; i < y; i++) {
          if (this.table.isCandy([x, i], this.id)) candyBeforeY = true;
          if (this.table.isSnake([x, i], this.id)) snakeBeforeY = true;
        }

        for (let i = x + 1; i < this.table.size; i++) {
          if (this.table.isCandy([i, y], this.id)) candyAfterX = true;
          if (this.table.isSnake([i, y], this.id)) snakeAfterX = true;
        }

        for (let i = y + 1; i < this.table.size; i++) {
          if (this.table.isCandy([x, i], this.id)) candyAfterY = true;
          if (this.table.isSnake([x, i], this.id)) snakeAfterY = true;
        }

        //const distanceToCandy = this.table.getDistanceToCandy(x, y);

        let distanceToDeathAbove = x;
        let candyIsAbove = 0;

        for (let i = 0; i < x; i++) {
          if (this.table.isCandy([i, y], this.id)) {
            candyIsAbove = 1;
          }
          if (this.table.isSnake([i, y], this.id)) {
            distanceToDeathAbove = Math.min(
              distanceToDeathAbove,
              this.getDistanceToHead(i, y)
            )
          }
        }

        let distanceToDeathRight = this.table.size - y;
        let candyIsRight = 0;

        for (let i = y + 1; i < this.table.size; i++) {
          if (this.table.isCandy([x, i], this.id)) {
            candyIsRight = 1;
          }
          if (this.table.isSnake([x, i], this.id)) {
            distanceToDeathRight = Math.min(
              distanceToDeathRight,
              this.getDistanceToHead(x, i)
            )
          }
        }

        let distanceToDeathBelow = this.table.size - x;
        let candyIsBelow = 0;

        for (let i = x + 1; i < this.table.size; i++) {
          if (this.table.isCandy([i, y], this.id)) {
            candyIsBelow = 1;
          }
          if (this.table.isSnake([i, y], this.id)) {
            distanceToDeathBelow = Math.min(
              distanceToDeathBelow,
              this.getDistanceToHead(i, y)
            )
          }
        }

        let distanceToDeathLeft = y;
        let candyIsLeft = 0;

        for (let i = 0; i < y; i++) {
          if (this.table.isCandy([x, i], this.id)) {
            candyIsLeft = 1;
          }
          if (this.table.isSnake([x, i], this.id)) {
            distanceToDeathLeft = Math.min(
              distanceToDeathLeft,
              this.getDistanceToHead(x, i)
            )
          }
        }
        */

    return [ // check directions from head, if there snake body or candy -> check every line with shift to one cell
      /*+candyBeforeX, // ^
      +snakeBeforeX,

      +candyAfterY, // >
      +snakeAfterY,

      +candyAfterX, // \/
      +snakeAfterX,

      +candyBeforeY, // <
      +snakeBeforeY,*/


      /*
            distanceToCandy,
            distanceToCandyAfterUp,
            distanceToCandyAfterRight,
            distanceToCandyAfterDown,
            distanceToCandyAfterLeft,
            nextMinDistance
            */


      obstacleFromLeft,
      obstacleFromFront,
      obstacleFromRight,

      suggestedMove


      /*candyIsAbove,
      candyIsRight,
      candyIsBelow,
      candyIsLeft,

      this.table.candy.x < x ? 1 : 0, // needTurnUp
      this.table.candy.y > y ? 1 : 0, // needTurnRight
      this.table.candy.x > x ? 1 : 0, // needTurnDown
      this.table.candy.y < y ? 1 : 0, // needTurnLeft


      distanceToDeathAbove,
      distanceToDeathRight,
      distanceToDeathBelow,
      distanceToDeathLeft,

      distanceToDeathAbove > 0 ? 1 : 0, // canTurnAbove
      distanceToDeathRight > 0 ? 1 : 0, // canTurnRight
      distanceToDeathBelow > 0 ? 1 : 0, // canTurnBelow
      distanceToDeathLeft > 0 ? 1 : 0, // canTurnLeft
      */
    ];
  }

  think() {
    const result = this.brain.predict(this.inputs)
    const dir = this.direction;

    let toLeft = 'up';
    let toFront = 'right';
    let toRight = 'down'

    if (dir == 'right') {
      toLeft = 'up';
      toFront = 'right';
      toRight = 'down'
    } else if (dir == 'down') {
      toLeft = 'right'
      toFront = 'down';
      toRight = 'left';
    } else if (dir == 'left') {
      toLeft = 'down'
      toFront = 'left';
      toRight = 'up';
    } else if (dir == 'up') {
      toLeft = 'left'
      toFront = 'up';
      toRight = 'right';
    }

    const moves = [toLeft, toFront, toRight]

    let max = result[0];
    let move = moves[0];

    moves.map((m, i) => {
      if (result[i] > max) {
        max = result[i];
        move = m;
      }
    })

    return move;
  }

  normalize([x, y]) {
    return [
      x >= 0
        ? (x % this.table.size)
        : (this.table.size + x),
      y >= 0
        ? (y % this.table.size)
        : (this.table.size + y)
    ]
  }

  allowCrossBorders() {
    this.body = this.body.map(([x, y]) => this.normalize([x, y]))
  }

  normalizeSnake = this.allowCrossBorders;

  setDirection(dir) {
    switch (dir) {
      case 'right': {
        if (this.direction === 'left') return;
        break;
      }
      case 'left': {
        if (this.direction === 'right') return;
        break;
      }
      case 'up': {
        if (this.direction === 'down') return;
        break;
      }
      case 'down': {
        if (this.direction === 'up') return;
        break;
      }
    }
    if (Snake.moves.includes(dir))
      this.direction = dir;
  }

  reDrawSnake = () => {
    for (let i = 0; i < this.body.length; i++) {
      const [x, y] = this.body[i];

      this.table.toggleSnakeClass(x, y, this.id)
    }
  }

  draw = this.reDrawSnake;

  move() {
    if (this.isDead)
      return console.error('snake is dead')

    if (this.lifeTime > 100 && this.score < 1) return this.isDead = true;
    if (this.lifeTime > 200 && this.score < 3) return this.isDead = true;
    if (this.lifeTime > 300 && this.score < 5) return this.isDead = true;
    if (this.lifeTime > 350 && this.score < 7) return this.isDead = true;
    if (this.lifeTime > 400 && this.score < 10) return this.isDead = true;

    this.reDrawSnake()

    const head = this.body.slice(-1)[0]
    let newHead;

    switch (this.direction) {
      case 'right': {
        newHead = [head[0], head[1] + 1]
        break;
      }
      case 'left': {
        newHead = [head[0], head[1] - 1]
        break;
      }
      case 'up': {
        newHead = [head[0] - 1, head[1]]
        break;
      }
      case 'down': {
        newHead = [head[0] + 1, head[1]]
        break;
      }
    }

    if (
      !this.table.isCandy(
        this.normalize(newHead)
      )
    ) {
      this.body.shift();
    } else {
      this.table.candyFound();
      this.score++;
    }

    this.body.push(newHead);

    this.checkState();

    this.reDrawSnake()
  }

  checkState() {
    if (this.canCrossBorders)
      this.allowCrossBorders();
    else if (this.isBordersIntersected) {
      this.normalizeSnake();
      this.isDead = true;
    }

    if (!this.isDead)
      if (this.isCollisionDetected)
        this.isDead = true;
      else
        this.lifeTime++;
  }
}


const init = () => {
  const table = new Table(size);

  table.draw();
  table.putCandy();

  let snakes = [];
  for (let i = 0; i < TOTAL; i++) {
    const snake = new Snake(table);

    snake.draw();
    snakes.push(snake);
  }

  const listen = (e) => {
    const callback = {
      "ArrowLeft": () => snake.setDirection('left'),
      "ArrowRight": () => snake.setDirection('right'),
      "ArrowUp": () => snake.setDirection('up'),
      "ArrowDown": () => snake.setDirection('down'),
    }[e.key]

    callback?.()
  }

  const needNewGeneration = () => {
    let everyoneIsDead = true;
    let someoneIsFinished = false;

    snakes.map(x => {
      everyoneIsDead = everyoneIsDead && x.isDead;
      someoneIsFinished = someoneIsFinished || x.score > GOAL;
    })

    return everyoneIsDead || someoneIsFinished
  }

  const pickBest = () => {
    const best = snakes.sort((a, b) => {
      return (a.score) - (b.score)
    }).reverse()[0]

    snakes.map(snake => snake.id !== best.id && snake.reDrawSnake())
    snakes = [best];
  }

  const idle = () => {

    if (needNewGeneration()) {
      snakes = newGeneration(snakes, table);
    }

    snakes.map((s, i) => {
      const dir = s.think();

      s.setDirection(dir);

      if (!s.isDead)
        s.move();
    })

    setTimeout(idle, tick)
  }

  setTimeout(idle, tick);
  document.addEventListener('keydown', listen)
  document.getElementById('pick').onclick = pickBest;
}

init();
