
plotter = new Axidraw()
viewer = new PlotViewer()
pathUtils = new PathUtils()
customGui = new PlotterGUI()

var queue = []
plotterPos = [0, 0]
paused = false

function goHome() {


}

function moveTo(p) {
    dx = Math.round(p[0] - plotterPos[0])
    dy = Math.round(p[1] - plotterPos[1])
    queue.push(["move", dx, dy])
    plotterPos = p
}

async function plotPath(paths) {
    paths.forEach(path => {
        moveTo(path[0])
        queue.push(["down"])
        for (var i = 1; i < path.length; i++) {
            moveTo(path[i])
        }
        queue.push(["up"])
    })
    moveTo([0, 0])

    console.log(queue)
}

async function testPlot() {

    var startpos = plotterPos
    for (var x = 0; x < 10; x++) {
        for (var y = 0; y < 10; y++) {

            var dim = 1000
            // path = circlePath(x * 1000, y * 1000, 1000, 30)
            path = pathUtils.rectPath(x * dim, y * dim, dim, dim)
            plotPath(path)

        }
    }
    queue.push(["move", dx, dy])
}

function pause() { paused = true }
function resume() { paused = false }

window.addEventListener("keydown", (event) => {

    if (event.isComposing || event.key === "229") {
        return;
    }

    if (event.key == "b") {
        var count = 0
        while (true) {
            var next = queue.shift()
            if (next)
                switch (next[0]) {
                    case "move": plotter.move(next[1], next[2]); break;
                    case "up": plotter.penUp(); break;
                    case "down": plotter.penDown(); break;
                }
            count++

            if (count > 1000 || next[0] == "up") {
                break;
            }
        }

    }
    // do something
});


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

        if (plotter.commandsSent - plotter.commandsCompleted < 500) {
            for (var i = 0; i < 100; i++) {
                if (queue.length > 0) {
                    var next = queue.shift()
                    if (next) {
                        customGui.update(queue, plotter);
                        switch (next[0]) {
                            case "move": await plotter.move(next[1], next[2]); break;
                            case "up": await plotter.penUp(); break;
                            case "down": await plotter.penDown(); break;
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
        console.log(pix)

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
        stop: function () { plotter.stop() },
        pause: function () { pause() },
        resume: function () { resume() },

        grid: function () { viewer.AddPaths(pathUtils.gridTest()) },
        rect: function () { viewer.AddPath(pathUtils.rectPath(100, 100, 1000, 1000)) },
        circleGrid: function () { viewer.AddPaths(pathUtils.circleGrid()) },
        dragon: function () { viewer.AddPath(pathUtils.dragonPath()) },
        circle: function () { viewer.AddPath(pathUtils.circlePath(2000, 2000, 4000, 5)) },
        flowField: function () { viewer.AddPaths(pathUtils.flowField()) },
        speed: 4,
        penUp: function () { plotter.penUp() },
        upPosition: 24017,
        penDown: function () { plotter.penDown() },
        downPosition: 12000,
        disconnect: function () { plotter.close() },
        createPlot: function () { plotPath(viewer.createPlotList()) },
    };

    //load Settings

    ["speed", "upPosition", "downPosition"].forEach(key => {
        if (window.localStorage.getItem("plotter_" + key) != null) {
            guiParams[key] = Number(window.localStorage.getItem("plotter_" + key))

        }
    })

    var gui = new dat.GUI(guiParams);

    gui.add(guiParams, 'speed', 1, 10).onChange((val) => { plotter.speed = val; saveSettings("speed", val) })
    gui.add(guiParams, 'upPosition', 0, 33250).onChange((val) => {  })
    gui.add(guiParams, 'downPosition', 0, 33250).onChange((val) => { plotter.setPenDown(Math.round(val)); saveSettings("downPosition", val) })
    gui.add(guiParams, 'rect')
    gui.add(guiParams, 'grid')
    gui.add(guiParams, 'dragon')
    gui.add(guiParams, 'flowField')
    gui.add(guiParams, 'circleGrid')
    gui.add(guiParams, 'circle')


    app = {
        plot: function () { plotPath(viewer.createPlotList()) },
        disengage: function () {
            plotter.penUp();
            plotter.close();
        },
        penUp: function () { plotter.penUp() },
        penDown: function () { plotter.penDown() },

        setPenUpValue: function (value) { 
            console.log("setPenUpValue", value)
            plotter.setPenDown(Math.round(val)); saveSettings("downPosition", val)
        },
        setPenDownValue: function (value) { 
            
            console.log("setPenDownValue", value) 
            plotter.setPenDown(Math.round(val)); saveSettings("downPosition", val)
        }

    }

    viewer.setupScene()
    customGui.init(app);

    consumeQueue()
    readStatus()

    setTimeout(() => {
        plotter.connect()
    }, "400")

    // setTimeout(() => {
    //     // viewer.AddPath(pathUtils.circlePath(3000, 3000, 4000, 100))
    //     viewer.AddPaths(pathUtils.flowField())

    //     // list = viewer.createPlotList()
    //     // console.log(list)

    // }, "1000")
}