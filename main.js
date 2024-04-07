

driver = new PlotterDriver()

viewer = new PlotViewer()
customGui = new PlotterGUI()

app_model = new AppModel()

// imageUtils = new imageUtils()
pathUtils = new PathUtils()


function createPlot(paths) {
    // currentPlotObjects.push(paths)
    const new_model = new PlotModel(paths, { x: 0, y: 0 }, 1)
    app_model.plot_models.push(new_model)
    viewer.updateFromModel(app_model)

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

// function loadSVG(file) {
//     file.text().then(function (response) {
//         var parser = new DOMParser();
//         var doc = parser.parseFromString(response, "image/svg+xml");
//         removeAllChildNodes(document.getElementById("svgContainer"))
//         document.getElementById("svgContainer").appendChild(doc.children[0]);
//         console.log(doc)
//         viewer.setupPlotFromSVG(doc)
//     });
// }

// function dropHandler(ev) {
//     console.log('File(s) dropped');
//     ev.preventDefault();
//     if (ev.dataTransfer.items) {
//         [...ev.dataTransfer.items].forEach((item, i) => {
//             if (item.kind === 'file') {
//                 const file = item.getAsFile();
//                 if (file.name.endsWith(".svg")) {
//                     loadSVG(file)
//                 } else {
//                     loadImage(file)
//                 }
//             }
//         });
//     }
// }

function dragOverHandler(ev) { ev.preventDefault(); }

function init() {

    this.fileExplorer = new FileExplorer(function (loaded_file) {

        if (loaded_file.app_model) {
            app_model = loaded_file.app_model
            return
        }

        if (!loaded_file.paths) {
            console.log("bad file!", loaded_file)
            return
        }
        
        app_model.paths = []
        loaded_file.paths.forEach((path, i) => {
            createPlot(path)
        })
    })

    viewer.setupScene(app_model)

    driver.plot = function () {
        // this is storing the data in the plot instead of the "model"
        driver.plotPath(viewer.createPlotList())
    }

    customGui.init(driver)
    customGui.update(driver.queue, driver.plotter);

    controls = new THREE.InteractiveControls(app_model);


    render_loop = function () {
        viewer.render()
        requestAnimationFrame(render_loop)
        controls.update()

        viewer.updateFromModel(app_model)
    }


    render_loop()

    setTimeout(() => {




        customGui.loadSettings()


        var textPath = pathUtils.text(new Date().toLocaleString())
        textPath.flat(2)
        var textPath = pathUtils.transform(textPath, 0.006, 50, 10)
        createPlot(textPath, [0, 0])
        createPlot(pathUtils.star(), [0, 0])
        // textPath.flat(2)
        // var textPath = pathUtils.transform(textPath, 0.01, 50, 10)
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