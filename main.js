
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

var queue = []

function circlePath(center, radius) {

    var points = []
    for (var i = 0; i < 100; i++) {
        var theta = i / 100 * Math.PI * 2
        points.push([radius * Math.cos(theta) + center[0], radius * Math.sin(theta) + center[1]])
    }

    console.log(points)
    return points

}

async function plotPath(path) {

    var last = path[0]

    for (var i = 1; i < path.length; i++) {
        dx = Math.round(path[i][0] - last[0])
        dy = Math.round(path[i][1] - last[1])

        queue.push(plotter.move(dx, dy))

        last = path[i]
    }

    this.setPenUp()
}

async function testPlot() {
    plotter.speed = 4

    await plotter.penDown()
    for (var x = 0; x < 5; x++) {
        for (var y = 0; y < 5; y++) {

            path = circlePath([x * 1000, y * 1000], 300)
            plotPath(path)
        }
    }

    await plotter.penUp()

    }

    async function consumeQueue() {
        console.log("update", queue.length)
        if (queue.length > 0) {
            for (var i = 0; i < 10; i++) {
                var next = queue.shift()
                if (next) {
                    next()
                }
            }
        }
        requestAnimationFrame(consumeQueue)
    }



    function init() {
        var guiParams = {
            connect: function () { plotter.connect() },
            stop: function () { plotter.stop() },
            plot: function () { testPlot() },
            penUp: function () { plotter.penUp() },
            upPosition : 24017,
            penDown: function () { plotter.penDown() },
            downPosition : 12000,
            disconnect: function () { plotter.close() },
            scale: 1,
            bakeScale: function () { bakeScale() },
        };

        var gui = new dat.GUI(guiParams);

        gui.add(guiParams, 'connect')
        gui.add(guiParams, 'stop')
        gui.add(guiParams, 'penUp')
        gui.add(guiParams, 'upPosition', 0, 65535).onChange((val) => plotter.setPenUp(val))
        gui.add(guiParams, 'penDown')
        gui.add(guiParams, 'downPosition', 0, 65535).onChange((val) => plotter.setPenDown(val))
        
        gui.add(guiParams, 'plot')
        gui.add(guiParams, 'disconnect')
        gui.add(guiParams, 'scale', 0.001, 10).onChange(val => scalePlot(val))
        gui.add(guiParams, 'bakeScale')

        setupScene()
        consumeQueue()

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