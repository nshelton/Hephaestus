

driver = new PlotterDriver()

viewer = new PlotViewer()
customGui = new PlotterGUI()

app_model = new AppModel()

pathUtils = new PathUtils()

function createPlot(paths, args) {
    // currentPlotObjects.push(paths)
    const s = args.scale || 1
    const x = args.x || 0
    const y = args.y || 0

    const new_model = new PlotModel(paths, { x: x, y: y }, s)

    if (args.locked) {
        new_model.locked = args.locked
    }


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

    function saveCurrent() {
        delete app_model.camera
        app_model.plot_models.forEach(p => { delete p.bbox })
        fileExplorer.saveProject(app_model)
    }

    document.addEventListener('keydown', e => {
        if (e.keyCode === 83 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
            e.preventDefault();
            saveCurrent()
        }

        if (e.keyCode === 83) {
            saveCurrent()
        }
    });

    fileExplorer = new FileExplorer(function (loaded_file) {

        if (loaded_file.plot_models) {
            app_model = loaded_file
            app_model.camera = viewer.camera
            app_model.dom_element = viewer.renderer.domElement
            controls.initFromModel(app_model);
        }

        console.log("bad file!", loaded_file)
        return

    }, () => {
        saveCurrent()
    })

    viewer.setupScene(app_model)

    driver.plot = function () {
        // this is storing the data in the plot instead of the "model"
        driver.plotPath(viewer.createPlotList())
    }

    customGui.init(driver)

    controls = new CanvasControls(app_model);

    render_loop = function () {

        viewer.render()
        requestAnimationFrame(render_loop)
        controls.update()
        viewer.updateFromModel(app_model)
        customGui.update(this.driver.queue, this.driver.plotter);

    }

    render_loop()


    setTimeout(() => {
        customGui.loadSettings()

        var textPath = pathUtils.text(new Date().toLocaleString())
        // var textPath = pathUtils.text("Los Angeles County EPSG:900913")
        createPlot(textPath, { x: 10, y:10, scale: 0.006 })


     
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