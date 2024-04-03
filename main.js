

driver = new PlotterDriver()

viewer = new PlotViewer()
customGui = new PlotterGUI()
optomizer = new Optomizer()

// imageUtils = new imageUtils()
pathUtils = new PathUtils()

var currentPlotObjects = []
var currentProject = null;

function createPlot(paths, transforms) {
    currentPlotObjects.push(paths)
    viewer.CreatePaths(paths)
}

function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

// function loadImage(file) {

//     createImageBitmap(file).then(data => {

//         const canvas = new OffscreenCanvas(data.width, data.height);
//         const ctx = canvas.getContext('2d');

//         console.log(data)
//         ctx.drawImage(data, 0, 0, data.width, data.height);
//         console.log(ctx)

//         var imgd = ctx.getImageData(0, 0, data.width, data.height);
//         var pix = imgd.data;

//         paths = imageUtils.hatch(pix, data.width, data.height, optomizer)
//         paths = paths.map(path => path.map(p => [p[1], p[0]]))
//         createPlot(paths)
//         // createPlot(imageUtils.dither(pix, data.width, data.height))
//     })
// }

function loadSVG(file) {
    file.text().then(function (response) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(response, "image/svg+xml");
        removeAllChildNodes(document.getElementById("svgContainer"))
        document.getElementById("svgContainer").appendChild(doc.children[0]);
        console.log(doc)
        viewer.setupPlotFromSVG(doc)
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

    this.fileExplorer = new FileExplorer(function (loaded_file) {
        console.log("loaded!", loaded_file)
    })

    var guiParams = {
        saveProject: function () { fileExplorer.saveProject(currentPlotObjects) },
        loadProjects: function () { }
    };

    var gui = new dat.GUI(guiParams);

    gui.add(guiParams, 'saveProject')
    gui.add(guiParams, 'loadProjects')

    // driver.plotPath(viewer.createPlotList())

    viewer.setupScene()
    customGui.init(driver);

    customGui.update(driver.queue, driver.plotter);

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

        textstring = new Date().toLocaleString().split(",")[0]
        textstring = textstring.replace("2023", "23")
        textstring += " "
        textstring += + new Date()
        var textPath = pathUtils.text(textstring + "")
        textPath.flat(2)
        var textPath = pathUtils.transform(textPath, 0.006, 50, 10)
        createPlot(textPath)
        textPath.flat(2)
        var textPath = pathUtils.transform(textPath, 0.01, 50, 10)
        // createPlot(textPath)

        var squares = []

        for (var x = 0; x < 3; x++) {
            for (var y = 0; y < 3; y++) {
                squares.push(pathUtils.rectPath(50 + x * 30, 50 + y * 30, 25, 25))
            }
        }

        // console.log(textPath)
        // console.log(squares)

        driver.consumeQueue()
        driver.readStatus()

        // createPlot(imageUtils.star())
        // image = imageUtils.createImage()
        // createPlot(imageUtils.dither(image.data, image.width, image.height))


        // paths = viewer.createPlotList()
        // console.log(paths)
        // paths1 = optomizer.optomizeKD(paths)
        // // paths1 = optomizer.optomizeGrid(paths)

        // viewer.drawPlotterMovements(paths1)

    }, "100")


    // setTimeout(() => {
    //     // viewer.AddPath(pathUtils.circlePath(3000, 3000, 4000, 100))
    //     createPlot(pathUtils.flowField())

    //     // list = viewer.createPlotList()
    //     // console.log(list)

    // }, "1000")
}