class NeuralNetwork {
  constructor(a, b, c) {
    this.input_nodes = a;
    this.hidden_nodes = b;
    this.output_nodes = c;

    this.createModel();
  }

  predict(inputs) {
    const xs = tf.tensor2d([inputs]);

    const ys = this.model.predict(xs);

    return ys.dataSync();
  }

  createModel() {
    this.model = tf.consequential();

    const hidden = tf.layers.dense({
      units: this.hidden_nodes,
      inputShape: [this.input_nodes],
      activation: 'sigmoid'
    })

    this.model.add(hidden)


    const output = this.model.dense({
      units: this.output_nodes,
      activation: 'softmax'
    })

    this.model.add(output)

    //this.model.compile({})
  }
}
