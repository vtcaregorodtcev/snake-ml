const id = 'game';
const size = 30;
const tick = 90;
let gameTimeout;

const toggleSnake = (body) => {
  for (let i = 0; i < body.length; i++) {
    const [x, y] = body[i];

    document.getElementById(getCoordsSelector(x, y)).classList.toggle('snake')
  }
}

const snake = {
  body: [[0, 0], [0, 1], [0, 2]],
  direction: 'right',

  checkCollision() {
    return new Set(this.body.map(coords => getCoordsSelector(coords[0], coords[1]))).size !== this.body.length
  },

  normalize([x, y], size) {
    return [x >= 0 ? (x % size) : (size + x), y >= 0 ? (y % size) : (size + y)]
  },

  noDeth(size) {
    this.body = this.body.map(([x, y]) => this.normalize([x, y], size))
  },

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
    if (['right', 'left', 'up', 'down'].includes(dir))
      this.direction = dir;
  },

  move(size, replace, isCandy, candyFound, gameOver) {
    replace(this.body)

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

    if (!isCandy(this.normalize(newHead, size))) {
      this.body.shift();
    } else {
      candyFound(newHead);
    }

    this.body.push(newHead);

    this.noDeth(size);

    if (this.checkCollision()) gameOver()

    replace(this.body)
  }
}

const getCoordsSelector = (x, y) => `x:${x}_y:${y}`;

const getCell = (x, y) => {
  const div = document.createElement('div')
  div.classList.add('cell')
  div.id = getCoordsSelector(x, y)

  return div.outerHTML
};

const cells = (() => {
  let cells = []

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (!cells[i]) cells[i] = [];

      cells[i][j] = getCell(i, j)
    }
  }

  return cells;
})()

const fillGame = () => {
  const game = document.getElementById('game');

  for (let i = 0; i < size; i++) {
    const row = document.createElement('div')

    row.classList.add('row')
    row.innerHTML = cells[i].join('');

    game.appendChild(row)
  }
}

const listenClicks = () => {
  document.addEventListener('keydown', (e) => {
    const callback = {
      "ArrowLeft": () => snake.setDirection('left'),
      "ArrowRight": () => snake.setDirection('right'),
      "ArrowUp": () => snake.setDirection('up'),
      "ArrowDown": () => snake.setDirection('down'),
    }[e.key]
    callback?.()
  })
}

const putCandy = (size) => {
  const x = Math.floor(Math.random() * Math.floor(size));
  const y = Math.floor(Math.random() * Math.floor(size));

  document.getElementById(getCoordsSelector(x, y)).classList.add('candy')
}

const isCandy = ([x, y]) => {
  return document.getElementById(getCoordsSelector(x, y)).classList.contains('candy')
}

const candyFound = ([x, y]) => {
  document.getElementById(getCoordsSelector(x, y)).classList.remove('candy');

  putCandy(size);
}

const gameOver = () => {
  clearTimeout(gameTimeout)
}

const idle = () => {
  gameTimeout = setTimeout(idle, tick)

  snake.move(size, toggleSnake, isCandy, candyFound, gameOver);
}

const init = () => {
  fillGame();
  toggleSnake(snake.body);

  putCandy(size);

  listenClicks();
  setTimeout(idle, tick);
}

init();
