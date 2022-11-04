
// import { parse } from 'svg-parser';

function ApiRequest(command, params = {}) {
    fetch('http://127.0.0.1:5000/' + command, { method: 'POST', body: JSON.stringify(params) })
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            console.log(data);
        });
}


plotter = new Axidraw()


async function testPlot() {

    var rad = 300

    var points = []
    for (var i = 0; i < 100; i++) {
        var theta = i / 100 * Math.PI * 2
        points.push([rad * Math.cos(theta), rad * Math.sin(theta)])
    }

    var last = points[0]

    for (var i = 1; i < 100; i++) {
        dx = points[i][0] - last[0]
        dy = points[i][1] - last[1]

        console.log(dx, dy)
        plotter.move(100, 100)

        last = points[i]

    }

}
async function move() {

    plotter.move(100, 100)

}
function init() {
    var guiParams = {
        connect: function () { plotter.connect() },
        move: function () { move() },
        plot: function () { testPlot() },
        disconnect: function () { plotter.close() },
        scale: 1,
        bakeScale: function () { bakeScale() },
    };

    var gui = new dat.GUI(guiParams);

    gui.add(guiParams, 'connect')
    gui.add(guiParams, 'move')
    gui.add(guiParams, 'plot')
    gui.add(guiParams, 'disconnect')
    gui.add(guiParams, 'scale', 0.001, 10).onChange(val => scalePlot(val))
    gui.add(guiParams, 'bakeScale')

    setupScene()

}

function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

function dropHandler(ev) {
    console.log('File(s) dropped');
    ev.preventDefault();
    if (ev.dataTransfer.items) {
        [...ev.dataTransfer.items].forEach((item, i) => {
            if (item.kind === 'file') {
                const file = item.getAsFile();
                file.text().then(function (response) {
                    var parser = new DOMParser();
                    var doc = parser.parseFromString(response, "image/svg+xml");
                    removeAllChildNodes(document.getElementById("svgContainer"))
                    document.getElementById("svgContainer").appendChild(doc.children[0]);
                    console.log(doc)
                    setupPlotView(doc)

                });
            }
        });
    }
}

function dragOverHandler(ev) { ev.preventDefault(); }