// Play with the Xorshift pseudo random number generator,
// as described by Marsaglia in
// https://www.jstatsoft.org/article/view/v008i14.

// See https://www.jstatsoft.org/article/view/v008i14.
const TRIPLES = [
  [1, 3, 10],
  [1, 5, 16],
  [1, 5, 19],
  [1, 9, 29],
  [1, 11, 6],
  [1, 11, 16],
  [1, 19, 3],
  [1, 21, 20],
  [1, 27, 27],
  [2, 5, 15],
  [2, 5, 21],
  [2, 7, 7],
  [2, 7, 9],
  [2, 7, 25],
  [2, 9, 15],
  [2, 15, 17],
  [2, 15, 25],
  [2, 21, 9],
  [3, 1, 14],
  [3, 3, 26],
  [3, 3, 28],
  [3, 3, 29],
  [3, 5, 20],
  [3, 5, 22],
  [3, 5, 25],
  [3, 7, 29],
  [3, 13, 7],
  [3, 23, 25],
  [3, 25, 24],
  [3, 27, 11],
  [4, 3, 17],
  [4, 3, 27],
  [4, 5, 15],
  [5, 3, 21],
  [5, 7, 22],
  [5, 9, 7],
  [5, 9, 28],
  [5, 9, 31],
  [5, 13, 6],
  [5, 15, 17],
  [5, 17, 13],
  [5, 21, 12],
  [5, 27, 8],
  [5, 27, 21],
  [5, 27, 25],
  [5, 27, 28],
  [6, 1, 11],
  [6, 3, 17],
  [6, 17, 9],
  [6, 21, 7],
  [6, 21, 13],
  [7, 1, 9],
  [7, 1, 18],
  [7, 1, 25],
  [7, 13, 25],
  [7, 17, 21],
  [7, 25, 12],
  [7, 25, 20],
  [8, 7, 23],
  [8, 9, 23],
  [9, 5, 1],
  [9, 5, 25],
  [9, 11, 19],
  [9, 21, 16],
  [10, 9, 21],
  [10, 9, 25],
  [11, 7, 12],
  [11, 7, 16],
  [11, 17, 13],
  [11, 21, 13],
  [12, 9, 23],
  [13, 3, 17],
  [13, 3, 27],
  [13, 5, 19],
  [13, 17, 15],
  [14, 1, 15],
  [14, 13, 15],
  [15, 1, 29],
  [17, 15, 20],
  [17, 15, 23],
  [17, 15, 26],
];

const UPDATE_STEPS = [
  "y^=y<<a; y^=y>>b; y^=y<<c;",
  "y^=y<<c; y^=y>>b; y^=y<<a;",
  "y^=y>>a; y^=y<<b; y^=y>>c;",
  "y^=y>>c; y^=y<<b; y^=y>>a;",
  "y^=y<<a; y^=y<<c; y^=y>>b;",
  "y^=y<<c; y^=y<<a; y^=y>>b;",
  "y^=y>>a; y^=y>>c; y^=y<<b;",
  "y^=y>>c; y^=y>>a; y^=y<<b;",
];

const UPDATE_STEP_FUNCTIONS = UPDATE_STEPS.map(
  (code) => new Function("y,a,b,c", code + "return y;"),
);

function addIndexValuedRadios({ parentElemId, labels, name }) {
  parentElem = document.getElementById(parentElemId);
  let radios = [];
  for (let index in labels) {
    const label = document.createElement("label");
    const radio = document.createElement("input");
    radios.push(radio);
    radio.type = "radio";
    radio.name = name;
    radio.value = index;
    if (index == 0) {
      radio.checked = true;
    }
    label.appendChild(radio);
    label.appendChild(document.createTextNode(labels[index]));
    parentElem.appendChild(label);
  }
  return radios;
}

function getSelectedValue(radios) {
  for (let radio of radios) {
    if (radio.checked) {
      return radio.value;
    }
  }
  return null;
}

const abcRadios = addIndexValuedRadios({
  parentElemId: "abc-radio-buttons",
  labels: TRIPLES.map((triple) => triple.join(", ")),
  name: "abc",
});

const stepRadios = addIndexValuedRadios({
  parentElemId: "step-radio-buttons",
  labels: UPDATE_STEPS,
  name: "step",
});

const seedInput = document.getElementById("seed");
const lastDrawDisplay = document.getElementById("last-draw");
const numSamplesDisplay = document.getElementById("num-samples");
const delayInput = document.getElementById("delay");
const scatterPlotElem = document.getElementById("scatter");

class XorshiftRng {
  constructor({ seed, a, b, c, step }) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.step = step;
    this.y = seed;
  }

  next() {
    this.y = this.step(this.y, this.a, this.b, this.c);
    return this.y;
  }
}

function getRngForInputs() {
  const seed = parseInt(seedInput.value);
  const [a, b, c] = TRIPLES[parseInt(getSelectedValue(abcRadios))];
  const step = UPDATE_STEP_FUNCTIONS[parseInt(getSelectedValue(stepRadios))];
  return new XorshiftRng({ seed, a, b, c, step });
}

let rng = getRngForInputs();
let lowerHalves = [];
let upperHalves = [];
let numSamples = 0;

function sampleAndPlot() {
  const y = rng.next();
  numSamples += 1;
  numSamplesDisplay.textContent = numSamples;
  lastDrawDisplay.textContent = y;
  lowerHalves.push(y & 0xffff);
  upperHalves.push((y >> 16) & 0xffff);
  Plotly.newPlot(
    scatterPlotElem,
    [{ mode: "markers", x: lowerHalves, y: upperHalves }],
    {
      width: 500,
      height: 500,
      xaxis: { title: { text: "lower half" }, range: [0, 0xffff] },
      yaxis: { title: { text: "upper half" }, range: [0, 0xffff] },
    },
  );
}

document.body.addEventListener("change", function (event) {
  rng = getRngForInputs();
  lowerHalves = [];
  upperHalves = [];
  numSamples = 0;
  sampleAndPlot();
});

let interval = null;

function updateDelay() {
  if (interval) {
    clearInterval(interval);
  }
  const delay = parseInt(delayInput.value);
  delayInput.title = delay + " milliseconds";
  interval = setInterval(sampleAndPlot, delay);
}

delayInput.addEventListener("change", function (event) {
  event.stopPropagation();
  updateDelay();
});

updateDelay();
