
class PlotViewer {



    a3Width = 297
    a3Height = 420

    constructor() {
        this.lineObjects = []
        this.segments = []

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.camera = new THREE.OrthographicCamera(0, 100, 0, 100, 1, 100);
        this.scene = new THREE.Scene();


        this.redFillMeshMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: false, side: THREE.DoubleSide });
        this.yellowMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: false });
        this.reddishMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: false });
        this.backgroundMaterial = new THREE.MeshBasicMaterial({ color: 0x333333, wireframe: true });
        this.greenMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true, transparent: true, opacity: 0.5 });
        this.bbmaterial = new THREE.MeshBasicMaterial({ color: 0x88ff88, wireframe: true, transparent: true, opacity: 0.5 });

        this.upMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
        this.downMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });


        this.darkScheme = false

        this.id_to_container = {}
    }

    clipBounds(x) {
        return Math.max(0,  Math.min(x, 200))
    }

    inBounds(x, y) {
        return x > 0 && x < 180 && y > 0 && y < 250
    }

    createPlotView(plot_model) {
        console.log("CREATED PLOT", plot_model.id)
        var container = new THREE.Object3D()
        container.paths = []

        plot_model.paths.forEach(path => {
            path = path.filter(p => this.inBounds(p[0], p[1]))
            const points = path.map(s => new THREE.Vector3(s[0], s[1], 0))
             
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, this.yellowMaterial);

            this.lineObjects.push(line)
            this.segments.push(points)

            container.add(line)
            container.paths.push(line)
        })

        this.scene.add(container)

        var bbox = new THREE.Box3().setFromObject(container);

        var geometry = new THREE.PlaneGeometry(bbox.max.x - bbox.min.x, bbox.max.y - bbox.min.y, 1, 1);
        var container_outline = new THREE.Mesh(geometry, 
            new THREE.MeshBasicMaterial({ color: 0x888888, wireframe: true }));

        container_outline.position.copy(bbox.getCenter(new THREE.Vector3()));
        container.add(container_outline);

        var dotgeometry = new THREE.PlaneGeometry(10, 10, 1, 1);
        var originDot = new THREE.Mesh(dotgeometry, this.greenMaterial);
        container.add(originDot);
        container.uiOutline = container_outline

        this.id_to_container[plot_model.id] = container
    }

    getIdsInView() {
        return Object.getOwnPropertyNames(this.id_to_container)
    }

    removeViewWithId(id) {
        this.scene.remove(this.id_to_container[id])
        delete this.id_to_container[id]
    }

    updateFromModel(app_model) {

        this.camera.left = - app_model.zoom / 2
        this.camera.right = app_model.zoom / 2
        this.camera.top = - app_model.zoom / 2 * this.aspect
        this.camera.bottom = app_model.zoom / 2 * this.aspect
        this.camera.position.set(app_model.camera_position[0], app_model.camera_position[1], 2)
        this.camera.updateProjectionMatrix()

        app_model.camera = this.camera

        let current_ids = this.getIdsInView()
        app_model.plot_models.forEach(plot_model => {

            let idx = current_ids.indexOf(plot_model.id)
            if (idx == -1) {
                this.createPlotView(plot_model)
            }

            const container = this.id_to_container[plot_model.id]
            
            if (!plot_model.bbox) {
                plot_model.bbox = new THREE.Box3()
            }

            plot_model.bbox.setFromObject(container);
            container.position.set(plot_model.position.x, plot_model.position.y, 0)
            container.scale.set(plot_model.scale, plot_model.scale, plot_model.scale)

            if (plot_model.state == "hover_move") {
                container.uiOutline.material.color.setHex(0x00ff00);
            } else if (plot_model.state == "hover_scale") {
                container.uiOutline.material.color.setHex(0x00bbff);
            }else {
                container.uiOutline.material.color.setHex(0x888888);
            }
            current_ids.splice(idx, 1)

        })

        // remove stale ids
        current_ids.forEach(guid => { this.removeViewWithId(guid) })

        var box = this.renderer.domElement.getBoundingClientRect()
        this.aspect = box.height / box.width
    }

    toggleColors() {
        this.darkScheme = !this.darkScheme

        if (this.darkScheme) {
            this.scene.background = new THREE.Color("#000000")
            this.outlineMaterial.color = new THREE.Color("#ff0000")
            this.yellowMaterial.color = new THREE.Color("#ffff00")
            this.reddishMaterial.color = new THREE.Color("#e61d5f")
            this.backgroundMaterial.color = new THREE.Color("#333333")
            this.greenMaterial.color = new THREE.Color("#00ff00")
            this.bbmaterial.color = new THREE.Color("#88ff88")

        } else {
            this.scene.background = new THREE.Color("#ffffff")
            this.outlineMaterial.color = new THREE.Color("#000000")
            this.yellowMaterial.color = new THREE.Color("#666600")
            this.reddishMaterial.color = new THREE.Color("#e61d5f")
            this.backgroundMaterial.color = new THREE.Color("#aaaaaa")
            this.greenMaterial.color = new THREE.Color("#00ff00")
            this.bbmaterial.color = new THREE.Color("#88ff88")
        }
    }

    createPlotList() {



        var transformed = []

        this.lineObjects.forEach(line => {
            var posBuffer = line.geometry.attributes.position.clone()
            posBuffer.applyMatrix4(line.matrixWorld)

            var coords = []

            for (var i = 0; i < posBuffer.count; i++) {
                const x = (posBuffer.array[i * 3 + 0])
                const y = (posBuffer.array[i * 3 + 1])
                if (this.inBounds(x, y) ) {
                    coords.push([x * 100, y * 100])
                }
            }
            transformed.push(coords)
        })
        return transformed
    }

    drawPlotterMovements(paths) {
        offset = 0
        this.debugContainer = new THREE.Object3D()
        lastpos = new THREE.Vector3(0, 0, 2)
        paths.forEach(path => {

            const pathpts = path.map(s => new THREE.Vector3(s[0] / 100 + offset, s[1] / 100 + offset, 2))
            upLine = [lastpos, pathpts[0]]
            geometry = new THREE.BufferGeometry().setFromPoints(upLine);
            line = new THREE.Line(geometry, this.downMaterial);
            this.debugContainer.add(line);

            const sphereGeo = new THREE.SphereGeometry(1, 4, 4);
            var upBall = new THREE.Mesh(sphereGeo, this.reddishMaterial);
            upBall.position.set(path[0][0] / 100, path[0][1] / 100, 0)
            this.debugContainer.add(upBall)


            // var upBall = new THREE.Mesh(sphereGeo, this.yellowMaterial);
            // upBall.position.set(lastpos[0]/ 100, lastpos[1]/ 100, 0)
            // this.debugContainer.add(upBall)
            // points = points.concat(pathpts)
            geometry = new THREE.BufferGeometry().setFromPoints([lastpos, pathpts[0]]);
            line = new THREE.Line(geometry, this.upMaterial);
            this.debugContainer.add(line);
            lastpos = pathpts[pathpts.length - 1]
        })


        this.scene.add(this.debugContainer)
    }

    setupScene(app_model) {

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById("plotViewContainer").appendChild(this.renderer.domElement);

        this.camera.lookAt(new THREE.Vector3());

        const geometry = new THREE.PlaneGeometry(420, 230, 420 / 10, 230 / 10);
        const plane = new THREE.Mesh(geometry, this.backgroundMaterial);
        plane.position.set(420 / 2, 230 / 2, -0.001)
        this.scene.add(plane);

        // todo wtf are these numbers and why are they not a3width/height
        const points2 = [];
        points2.push(new THREE.Vector3(280, 0, 0));
        points2.push(new THREE.Vector3(280, 190, 0));
        points2.push(new THREE.Vector3(0, 190, 0));

        const linegeometry2 = new THREE.BufferGeometry().setFromPoints(points2);

        const line2 = new THREE.Line(linegeometry2, this.reddishMaterial);
        this.scene.add(line2);


        var dotgeometry = new THREE.PlaneGeometry(1, 1, 1, 1);
        var originDot = new THREE.Mesh(dotgeometry, this.greenMaterial);
        this.scene.add(originDot);

        this.updateFromModel(app_model)
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    parseSVGNodes(paths, polyline) {
        console.log(paths)
        console.log(polyline)
        var segments = []
        polyline.forEach(path => {
            var points = path.attributes.points.value.split(" ")
            var segment = points.map(p => [Number(p.split(",")[0]), Number(p.split(",")[1])])
            this.segments.push(segment)
        });

        paths.forEach(path => {
            parsed = window.PathConverter.parse(path.attributes.d.value);

            console.log(parsed)
            if (parsed.current != null) {
                var segment = parsed.current.points.map(p => [p.main.x, p.main.y])
                segments.push(segment)
            }

            parsed.curveshapes.forEach(c => {
                if (c && c.points != null) {
                    curve = c.points.map(p => [p.main.x, p.main.y])
                    segments.push(curve)
                    console.log(curve)
                }
            })
        })

        this.container = new THREE.Object3D()
        segments.forEach(segment => {
            const points = segment.map(s => new THREE.Vector3(s[0], s[1], 0))
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, this.outlineMaterial);
            this.lineObjects.push(line)
            this.container.add(line);
        })
        this.scene.add(this.container)
    }

    setupPlotFromSVG(doc) {
        paths = document.querySelectorAll("#svgContainer path")
        polyline = document.querySelectorAll("#svgContainer polyline")
        this.parseSVGNodes(paths, polyline)
    }

    gradient = [0x321141, 0x311345, 0x31154a, 0x30174d, 0x2e1951, 0x2d1b55, 0x2b1e58, 0x29215b, 0x27235e, 0x252660, 0x232963, 0x202d65, 0x1e3066, 0x1b3367, 0x183768, 0x163b68, 0x133e69, 0x114268, 0x0f4667, 0x0c4966, 0x0a4d65, 0x085163, 0x075461, 0x06585e, 0x055b5b, 0x045f58, 0x036255, 0x036551, 0x04684d, 0x046b49, 0x066d45, 0x077041, 0x09723c, 0x0b7438, 0x0e7634, 0x11782f, 0x15792b, 0x197a27, 0x1e7b23, 0x237c1f, 0x287c1b, 0x2e7c18, 0x347c15, 0x3a7c13, 0x407c10, 0x477b0f, 0x4e7a0d, 0x55790c, 0x5d780c, 0x64770c, 0x6c760c, 0x74740e, 0x7b720f, 0x837111, 0x8a6f14, 0x926d17, 0x996b1b, 0xa0691f, 0xa76824, 0xad6629, 0xb4642f, 0xba6335, 0xbf613c, 0xc46043, 0xc95e4a, 0xcd5d51, 0xd15d59, 0xd55c61, 0xd85b6a, 0xda5b72, 0xdc5b7b, 0xdd5b83, 0xde5c8c, 0xdf5d95, 0xdf5e9d, 0xde5fa5, 0xdd61ae, 0xdc63b6, 0xda65be, 0xd867c5, 0xd56acc, 0xd26dd3, 0xcf70d9, 0xcb73df, 0xc876e5, 0xc37aea, 0xbf7eef, 0xbb82f3, 0xb786f6, 0xb28bf9, 0xae8ffc, 0xa994fe, 0xa598ff, 0xa09dff, 0x9ca2ff, 0x98a6ff, 0x95abff, 0x91b0ff, 0x8eb4fe, 0x8bb9fc, 0x89bdfa, 0x86c1f7, 0x85c6f5, 0x83caf1, 0x82cdee, 0x82d1eb, 0x82d4e7, 0x82d8e3, 0x83dbdf, 0x84dedc, 0x85e0d8, 0x87e3d4, 0x8ae5d0, 0x8ce7cd, 0x90e8ca, 0x93eac6, 0x97ebc4, 0x9becc1, 0x9fedbf, 0xa4eebd, 0xa9efbb, 0xadefba, 0xb2efb9, 0xb8f0b9, 0xbdf0b9, 0xc2f0b9, 0xc7f0ba, 0xccf0bb]
    getGradient(t) {
        var i = Math.floor(t * 128)
        return this.gradient[i]
    }

}