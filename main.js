
plotter = new Axidraw()
viewer = new PlotViewer()
pathUtils = new PathUtils()
customGui = new PlotterGUI()
optomizer = new Optomizer()
imageUtils = new imageUtils()

var queue = []
plotterPos = [0, 0]
paused = false

currentPlotObjects = []

function createPlot(paths) {
    currentPlotObjects.push(paths)
    viewer.CreatePaths(paths)
}

function plotCurrent() {
    plotPath(viewer.createPlotList())
}

function moveTo(p) {
    dx = Math.round(p[0] - plotterPos[0])
    dy = Math.round(p[1] - plotterPos[1])
    queue.push(["move", dx, dy])
    plotterPos = p
}

async function plotPath(paths) {

    console.log(paths)
    paths = optomizer.optomize(paths)

    paths = paths.filter(p => p.length > 0)
    paths.forEach(path => {

        moveTo(path[0])
        queue.push(["down"])
        for (var i = 1; i < path.length; i++) {
            moveTo(path[i])
        }
        queue.push(["up"])
    })

    moveTo([0, 0])
    plotter.startTime = new Date()
    //TODO: clean queue to remove the up / move 0 0 / down pattern
    console.log(queue)
}

function pause() { paused = true }
function resume() { paused = false }

async function readStatus() {
    if (plotter.commandsSent - plotter.commandsCompleted < 500) {
        await plotter.readResult()
        customGui.update(queue, plotter);
    }
    requestAnimationFrame(readStatus)
}

async function consumeQueue() {

    console.log("update", queue.length, plotter.commandsSent, plotter.commandsCompleted)
    if (!paused) {

        if (plotter.commandsSent - plotter.commandsCompleted < 100) {
            for (var i = 0; i < 100; i++) {
                if (queue.length > 0) {
                    var next = queue.shift()
                    if (next) {
                        customGui.update(queue, plotter);
                        switch (next[0]) {
                            case "move": await plotter.move(next[1], next[2]); break;
                            case "up": await plotter.penUp(); break;
                            case "down": await plotter.penDown(); break;
                            case "query": await plotter.query(); break;
                        }
                    }
                }
            }
        }
    }

    requestAnimationFrame(consumeQueue)
}

function saveSettings(key, value) {
    window.localStorage.setItem("plotter_" + key, value)
}

function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

function loadImage(file) {
    createImageBitmap(file).then(data => {

        const canvas = new OffscreenCanvas(data.width, data.height);
        const ctx = canvas.getContext('2d');

        console.log(data)
        ctx.drawImage(data, 0, 0, data.width, data.height);
        console.log(ctx)

        var imgd = ctx.getImageData(0, 0, data.width, data.height);
        var pix = imgd.data;

        createPlot(imageUtils.dither(pix, data.width, data.height))

    })

}

function loadSVG(file) {
    file.text().then(function (response) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(response, "image/svg+xml");
        removeAllChildNodes(document.getElementById("svgContainer"))
        document.getElementById("svgContainer").appendChild(doc.children[0]);
        console.log(doc)
        viewer.setupPlotView(doc)
    });
}

function dropHandler(ev) {
    console.log('File(s) dropped');
    ev.preventDefault();
    if (ev.dataTransfer.items) {
        [...ev.dataTransfer.items].forEach((item, i) => {
            if (item.kind === 'file') {
                const file = item.getAsFile();
                if (file.name.endsWith(".svg")) {
                    loadSVG(file)
                } else {
                    loadImage(file)
                }
            }
        });
    }
}

function dragOverHandler(ev) { ev.preventDefault(); }

function init() {
    var guiParams = {

        grid: function () { createPlot(pathUtils.gridTest()) },
        rect: function () { createPlot([pathUtils.rectPath(100, 100, 1000, 1000)]) },
        circleGrid: function () { createPlot(pathUtils.circleGrid()) },
        dragon: function () { createPlot(pathUtils.dragonPath()) },
        circle: function () { createPlot([pathUtils.circlePath(2000, 2000, 4000, 5)]) },
        flowField: function () { createPlot(pathUtils.flowField()) },
        apollo: function () { createPlot(pathUtils.apollonian()) },
        mandala: function () { createPlot(pathUtils.mandala()) },
        sierpinski: function () { createPlot(pathUtils.sierpinski()) },
        voronoi: function () { createPlot(pathUtils.voronoi()) },
        timestamp: function () { createPlot(pathUtils.timestamp()) },

    };

    //load Settings

    var gui = new dat.GUI(guiParams);

    gui.add(guiParams, 'rect')
    gui.add(guiParams, 'grid')
    gui.add(guiParams, 'dragon')
    gui.add(guiParams, 'flowField')
    gui.add(guiParams, 'circleGrid')
    gui.add(guiParams, 'circle')
    gui.add(guiParams, 'apollo')
    gui.add(guiParams, 'mandala')
    gui.add(guiParams, 'sierpinski')
    gui.add(guiParams, 'voronoi')

    app = {
        plot: plotCurrent,
        disengage: function () {
            plotter.penUp();
            plotter.close();
        },
        penUp: function () { plotter.penUp() },
        penDown: function () { plotter.penDown() },
        pause: function () { paused = !paused },

        setPenUpValue: function (val) {
            if (plotter.connected)
                plotter.setPenUp(Math.round(val));
            saveSettings("upPosition", val)
        },
        setPenDownValue: function (val) {
            if (plotter.connected)
                plotter.setPenDown(Math.round(val));
            saveSettings("downPosition", val)
        },
        setSpeedValue: function (val) {
            console.log("setSpeedValue", val)
            plotter.speed = val;
            saveSettings("speed", val)
        }

    }

    viewer.setupScene()
    customGui.init(app);

    consumeQueue()
    readStatus()
    // plotter.connect()

    setTimeout(() => {
        if (window.localStorage.getItem("plotter_upPosition") != null) {
            customGui.setPenUpValue(Number(window.localStorage.getItem("plotter_upPosition")))
        }
        if (window.localStorage.getItem("plotter_downPosition") != null) {
            customGui.setPenDownValue(Number(window.localStorage.getItem("plotter_downPosition")))
        }
        if (window.localStorage.getItem("plotter_speed") != null) {
            customGui.setSpeedValue(Number(window.localStorage.getItem("plotter_speed")))
        }

        textstring = new Date().toLocaleString()
        var textPath = pathUtils.text(textstring)
        var textPath = pathUtils.transform(textPath, 0.5, 500, 1000)
        createPlot(textPath)

        // createPlot(imageUtils.gradient())
        createPlot(pathUtils.voronoi())

    }, "100")


    // setTimeout(() => {
    //     // viewer.AddPath(pathUtils.circlePath(3000, 3000, 4000, 100))
    //     createPlot(pathUtils.flowField())

    //     // list = viewer.createPlotList()
    //     // console.log(list)

    // }, "1000")
}