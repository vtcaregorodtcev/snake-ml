let modelIsTrained = false;
let modal;
let cover;
let knn;
let featureExtractor; let classifier; let video; let loss;

const onUseGesturesClick = () => {
  if (!modelIsTrained) {
    openTrainGesturesModal();
  }
}

const classify = () => {
  const logits = classifier.infer(video)
  knn.classify(logits, gotResults);
}

const addButtonsForGestureTraining = () => {
  const btnContainer = document.createElement('div');
  const rightBtn = document.createElement('button')
  const leftBtn = document.createElement('button')
  const downBtn = document.createElement('button')
  const upBtn = document.createElement('button')

  btnContainer.classList.add('btn-container');
  rightBtn.classList.add('btn');
  rightBtn.innerHTML = 'Right ->'
  leftBtn.classList.add('btn');
  leftBtn.innerHTML = '<- Left'
  downBtn.classList.add('btn');
  downBtn.innerHTML = "\\/ Down"
  upBtn.classList.add('btn');
  upBtn.innerHTML = "^ UP"

  btnContainer.append(leftBtn, upBtn, downBtn, rightBtn)

  modal.appendChild(btnContainer);

  return { rightBtn, leftBtn, upBtn, downBtn }
}

function gotResults(err, results) {
  // Display any error
  if (err) {
    console.error(err);
  }
  if (results) {
    const label = results.label;

    switch (label) {
      case 'RIGHT': snake.setDirection('right')
        break;
      case 'LEFT': snake.setDirection('left')
        break;
      case 'DOWN': snake.setDirection('down')
        break;
      case 'UP': snake.setDirection('up')
        break;
    }

    classify();
  }
}

const addExample = (label) => {
  const logits = classifier.infer(video)
  knn.addExample(logits, label)
}

const openTrainGesturesModal = () => {
  openModal();

  video.parent('modal')
  video.show();

  const { rightBtn, leftBtn, upBtn, downBtn } = addButtonsForGestureTraining();

  rightBtn.onclick = () => addExample("RIGHT");
  leftBtn.onclick = () => addExample("LEFT");
  upBtn.onclick = () => addExample("UP");
  downBtn.onclick = () => addExample("DOWN");

  const btnContainer = document.createElement('div');
  btnContainer.classList.add('btn-container');

  const trainBtn = document.createElement('button')
  trainBtn.classList.add('btn');
  trainBtn.innerHTML = "Train and Play!"

  btnContainer.append(trainBtn)
  modal.appendChild(btnContainer);

  trainBtn.onclick = () => {
    closeModal();
    classify();
  }
}

const openModal = () => {
  modal = document.createElement('div');
  cover = document.createElement('div');

  modal.classList.add('modal')
  cover.classList.add('cover')

  modal.id = 'modal';
  cover.onclick = closeModal;

  document.body.appendChild(cover);
  document.body.appendChild(modal);
}

const closeModal = () => {
  video.parent('body')
  video.hide();

  document.body.removeChild(modal);
  document.body.removeChild(cover);
}

const assignHandlers = () => {
  document.getElementById('gestures').onclick = onUseGesturesClick
}

assignHandlers();


const modelReady = () => { }

const videoReady = () => { }

// ml5
function setup() {
  noCanvas();
  // Create a video element
  video = createCapture({
    video: {
      mandatory: {
        maxWidth: 280,
        maxHeight: 200
      },
    },
  });

  video.hide();
  // Append it to the videoContainer DOM element
  //video.parent('modal');
  // Extract the already learned features from MobileNet
  featureExtractor = ml5.featureExtractor('MobileNet', modelReady);
  // Create a new classifier using those features and give the video we want to use
  classifier = featureExtractor.classification(video, videoReady);
  knn = ml5.KNNClassifier();

  ////

  const soundClassifier = ml5.soundClassifier('SpeechCommands18w', { probabilityThreshold: 0.7 }, () => {
    soundClassifier.classify((err, result) => {
      if (err) console.log(err);

      snake.setDirection(result[0].label)
    });
  });
}
