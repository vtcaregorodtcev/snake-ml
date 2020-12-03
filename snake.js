const id = 'game';
const size = 30;
const tick = 10;
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

  getDistanceToCandy = (x1, y1) => {
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

  constructor(
    table,
    brain = new NeuralNetwork(16, 32, 4),
    body = [[0, 0], [0, 1], [0, 2]],
    direction = 'right'
  ) {
    this.table = table;
    this.body = body;
    this.direction = direction;

    this.brain = brain;
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

  get inputs() {
    const [x, y] = this.body.slice(-1)[0]
    /*
        const distanceToCandy = this.table.getDistanceToCandy(x, y);
        const bodyLen = this.body.length;

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
    */

    let myBodyIsAbove = 0;
    let nearestDistanceToMyBodyAbove = this.table.size;
    let candyIsAbove = 0;
    let distanceToCandyAbove = this.table.size;

    for (let i = 0; i < x; i++) {
      if (this.table.isCandy([i, y], this.id)) {
        candyIsAbove = 1;
        distanceToCandyAbove = this.table.getDistanceToCandy(x, y)
      }
      if (this.table.isSnake([i, y], this.id)) {
        myBodyIsAbove = 1;
        nearestDistanceToMyBodyAbove = Math.min(
          nearestDistanceToMyBodyAbove,
          this.getDistanceToHead(i, y)
        )
      }
    }

    let myBodyIsRight = 0;
    let nearestDistanceToMyBodyRight = this.table.size;
    let candyIsRight = 0;
    let distanceToCandyRight = this.table.size;

    for (let i = y + 1; i < this.table.size; i++) {
      if (this.table.isCandy([x, i], this.id)) {
        candyIsRight = 1;
        distanceToCandyRight = this.table.getDistanceToCandy(x, y)
      }
      if (this.table.isSnake([x, i], this.id)) {
        myBodyIsRight = 1;
        nearestDistanceToMyBodyRight = Math.min(
          nearestDistanceToMyBodyRight,
          this.getDistanceToHead(x, i)
        )
      }
    }

    let myBodyIsBelow = 0;
    let nearestDistanceToMyBodyBelow = this.table.size;
    let candyIsBelow = 0;
    let distanceToCandyBelow = this.table.size;

    for (let i = x + 1; i < this.table.size; i++) {
      if (this.table.isCandy([i, y], this.id)) {
        candyIsBelow = 1;
        distanceToCandyBelow = this.table.getDistanceToCandy(x, y)
      }
      if (this.table.isSnake([i, y], this.id)) {
        myBodyIsBelow = 1;
        nearestDistanceToMyBodyBelow = Math.min(
          nearestDistanceToMyBodyBelow,
          this.getDistanceToHead(i, y)
        )
      }
    }

    let myBodyIsLeft = 0;
    let nearestDistanceToMyBodyLeft = this.table.size;
    let candyIsLeft = 0;
    let distanceToCandyLeft = this.table.size;

    for (let i = 0; i < y; i++) {
      if (this.table.isCandy([x, i], this.id)) {
        candyIsLeft = 1;
        distanceToCandyLeft = this.table.getDistanceToCandy(x, y)
      }
      if (this.table.isSnake([x, i], this.id)) {
        myBodyIsLeft = 1;
        nearestDistanceToMyBodyLeft = Math.min(
          nearestDistanceToMyBodyLeft,
          this.getDistanceToHead(x, i)
        )
      }
    }

    return [ // check directions from head, if there snake body or candy
      /*+candyBeforeX, // ^
      +snakeBeforeX,

      +candyAfterY, // >
      +snakeAfterY,

      +candyAfterX, // \/
      +snakeAfterX,

      +candyBeforeY, // <
      +snakeBeforeY,

      distanceToCandy,
      bodyLen*/

      myBodyIsAbove,
      myBodyIsRight,
      myBodyIsBelow,
      myBodyIsLeft,

      nearestDistanceToMyBodyAbove,
      nearestDistanceToMyBodyRight,
      nearestDistanceToMyBodyBelow,
      nearestDistanceToMyBodyLeft,

      candyIsAbove,
      candyIsRight,
      candyIsBelow,
      candyIsLeft,

      distanceToCandyAbove,
      distanceToCandyRight,
      distanceToCandyBelow,
      distanceToCandyLeft
    ];
  }

  think() {
    const result = this.brain.predict(this.inputs)

    let max = result[0];
    let move = Snake.moves[0];

    Snake.moves.map((m, i) => {
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

    this.allowCrossBorders();

    if (this.isCollisionDetected)
      this.isDead = true;
    else
      this.lifeTime++;

    this.reDrawSnake()
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
}

init();
