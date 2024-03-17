
PlotViewer = function () {

    this.lineObjects = []
    this.segments = []

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.camera = new THREE.OrthographicCamera(0, 100, 0, 100, 1, 100);
    this.controls = null;
    this.scene = new THREE.Scene();
    this.dragables = []
    var _this = this;

    this.outlineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });

    this.yellowMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: false });
    this.reddishMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: false });
    this.backgroundMaterial = new THREE.MeshBasicMaterial({ color: 0x333333, wireframe: true });
    this.originmaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true, transparent: true, opacity: 0.5 });
    this.bbmaterial = new THREE.MeshBasicMaterial({ color: 0x88ff88, wireframe: true, transparent: true, opacity: 0.5 });

    this.upMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    this.downMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });

    this.darkScheme = false
    this.plotContainers = new THREE.Object3D()
    this.scene.add(this.plotContainers)

    this.toggleColors = function () {
        this.darkScheme = !this.darkScheme

        if (this.darkScheme) {
            this.scene.background = new THREE.Color("#000000")
            this.outlineMaterial.color = new THREE.Color("#ff0000")
            this.yellowMaterial.color = new THREE.Color("#ffff00")
            this.reddishMaterial.color = new THREE.Color("#e61d5f")
            this.backgroundMaterial.color = new THREE.Color("#333333")
            this.originmaterial.color = new THREE.Color("#00ff00")
            this.bbmaterial.color = new THREE.Color("#88ff88")

        } else {
            this.scene.background = new THREE.Color("#ffffff")
            this.outlineMaterial.color = new THREE.Color("#000000")
            this.yellowMaterial.color = new THREE.Color("#666600")
            this.reddishMaterial.color = new THREE.Color("#e61d5f")
            this.backgroundMaterial.color = new THREE.Color("#aaaaaa")
            this.originmaterial.color = new THREE.Color("#00ff00")
            this.bbmaterial.color = new THREE.Color("#88ff88")
        }
    }

    this.parseNodes = function (paths, polyline) {
        console.log(paths)
        console.log(polyline)

        polyline.forEach(path => {
            var points = path.attributes.points.value.split(" ")
            var segment = points.map(p => [Number(p.split(",")[0]), Number(p.split(",")[1])])
            _this.segments.push(segment)
        });

        paths.forEach(path => {
            parsed = window.PathConverter.parse(path.attributes.d.value);

            console.log(parsed)
            if (parsed.current != null) {
                var segment = parsed.current.points.map(p => [p.main.x, p.main.y])
                _this.segments.push(segment)
            }

            parsed.curveshapes.forEach(c => {
                if (c && c.points != null) {
                    curve = c.points.map(p => [p.main.x, p.main.y])
                    _this.segments.push(curve)
                    console.log(curve)
                }
            })
        })

        this.container = new THREE.Object3D()
        this.segments.forEach(segment => {
            const points = segment.map(s => new THREE.Vector3(s[0], s[1], 0))
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, this.outlineMaterial);
            this.lineObjects.push(line)
            this.container.add(line);
        })

        this.scene.add(this.container)
        this.addDragNDrop(this.container)

    }

    this.createPlotList = function () {

        function clipBounds(x) {
            return Math.max(0, x)
        }

        transformed = []

        this.lineObjects.forEach(line => {
            var posBuffer = line.geometry.attributes.position.clone()
            posBuffer.applyMatrix4(line.matrixWorld)

            coords = []

            for (var i = 0; i < posBuffer.count; i++) {
                const x = clipBounds(posBuffer.array[i * 3 + 0])
                const y = clipBounds(posBuffer.array[i * 3 + 1])
                coords.push([x * 100, y * 100])
            }
            transformed.push(coords)
        })
        return transformed
    }

    const a3Width = 297
    const a3Height = 420

    this.addDragNDrop = function (node) {
        const sphereGeo = new THREE.BoxGeometry(10, 10, 10);
        // const sphereGeo = new THREE.SphereGeometry(5, 4, 4);

        const bbgeometry = new THREE.BoxGeometry(1, 1, 1);

        var dragable = {
            node: node,
            boundingBox: new THREE.Mesh(bbgeometry, this.bbmaterial),
            scaleWidget: new THREE.Mesh(sphereGeo, this.bbmaterial),
            originDot: new THREE.Mesh(sphereGeo, this.originmaterial),
            pos: new THREE.Vector3(),
            dim: new THREE.Vector3(),
            baseDistance: 1
        }
        // dragable.boundingBox.renderOrder = 100

        var bbox = new THREE.Box3().setFromObject(node);
        bbox.getCenter(dragable.boundingBox.position)
        bbox.getSize(dragable.boundingBox.scale)
        dragable.node.add(dragable.boundingBox)

        dragable.originDot.scale.set(1, 1, 1)
        this.scene.add(dragable.originDot)
        this.scene.add(dragable.scaleWidget)

        dragable.scaleWidget.position.copy(dragable.boundingBox.scale)
        dragable.scaleWidget.position.multiplyScalar(0.5)
        dragable.scaleWidget.position.add(dragable.boundingBox.position)

        dragable.dim.copy(dragable.boundingBox.scale)
        dragable.pos.copy(dragable.boundingBox.scale)
        dragable.pos.multiplyScalar(-0.5)
        dragable.pos.add(dragable.boundingBox.position)

        dragable.originDot.position.copy(dragable.pos)

        dragable.baseDistance = dragable.originDot.position.distanceTo(dragable.scaleWidget.position)

        this.controls.registerObject(dragable.originDot)
        this.controls.registerObject(dragable.boundingBox)
        this.controls.registerObject(dragable.scaleWidget)

        this.dragables.push(dragable)
    }

    this.updateDragNDrop = function () {
        this.dragables.forEach(d => {
            if (d.scaleWidget.isMoving) {
                const aspect = d.boundingBox.scale.x / d.boundingBox.scale.y
                const aspectCurrent = (d.scaleWidget.position.x - d.originDot.position.x) / (d.scaleWidget.position.y - d.originDot.position.y)

                const p0 = d.originDot.position
                const p1 = d.scaleWidget.position
                if (aspectCurrent > aspect) {
                    d.scaleWidget.position.x = p0.x + aspect * (p1.y - p0.y)
                }
                if (aspectCurrent < aspect) {
                    d.scaleWidget.position.y = p0.y + (p1.x - p0.x) / aspect
                }
            }

            if (d.originDot.isMoving) {
                d.scaleWidget.position.copy(d.dim).multiplyScalar(d.node.scale.x).add(d.originDot.position)
            }

            var s = d.originDot.position.distanceTo(d.scaleWidget.position) / d.baseDistance
            d.node.scale.set(s, s, s)
            d.node.position.copy(d.pos).multiplyScalar(-s).add(d.originDot.position)
        })

    }

    this.drawPlotterMovements = function (paths) {
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
            upBall.position.set(path[0][0]/ 100, path[0][1]/ 100, 0)
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

    this.ClearAll = function() {
        for( var i = this.plotContainers.children.length - 1; i >= 0; i--) { 
            obj = this.plotContainers.children[i];
            this.plotContainers.remove(obj); 
       }

       this.lineObjects = []
       this.segments = []

       this.dragables.forEach( d => {

        this.scene.remove(d.originDot)
        this.scene.remove(d.scaleWidget)

        this.controls.unregisterObject(d.originDot)
        this.controls.unregisterObject(d.boundingBox)
        this.controls.unregisterObject(d.scaleWidget)
       })

    }

    this.CreatePaths = function (paths) {
        var pathContainer = new THREE.Object3D()

        paths.forEach(path => {
            const points = path.map(s => new THREE.Vector3(s[0], s[1], 1))
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, this.yellowMaterial);

            this.lineObjects.push(line)
            pathContainer.add(line)
            this.segments.push(points)
        })

        this.plotContainers.add(pathContainer)
        this.addDragNDrop(pathContainer)
    }

    this.setupScene = function () {
        view = document.getElementById("plotViewContainer")

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById("plotViewContainer").appendChild(this.renderer.domElement);

        this.camera.lookAt(new THREE.Vector3());
        this.controls = new THREE.InteractiveControls(this.camera, this.renderer.domElement);

        const geometry = new THREE.PlaneGeometry(a3Height, a3Width, a3Height / 10, a3Width / 10);

        const plane = new THREE.Mesh(geometry, this.backgroundMaterial);
        plane.position.set(a3Height / 2, a3Width / 2, 0)
        this.scene.add(plane);


        const points = [];
        points.push(new THREE.Vector3(a3Height, 0, 0));
        points.push(new THREE.Vector3(0, 0, 0));
        points.push(new THREE.Vector3(0, a3Width, 0));

        const linegeometry = new THREE.BufferGeometry().setFromPoints(points);

        const line = new THREE.Line(linegeometry, this.reddishMaterial);
        this.scene.add(line);

        const points2 = [];
        points2.push(new THREE.Vector3(280, 0, 0));
        points2.push(new THREE.Vector3(280, 190, 0));
        points2.push(new THREE.Vector3(0, 190, 0));

        const linegeometry2 = new THREE.BufferGeometry().setFromPoints(points2);

        const line2 = new THREE.Line(linegeometry2, this.reddishMaterial);
        this.scene.add(line2);

        render()

        function render() {
            _this.renderer.render(_this.scene, _this.camera);
            _this.controls.update()

            _this.updateDragNDrop()

            requestAnimationFrame(render)
        }
    }


    this.setupPlotView = function (doc) {

        paths = document.querySelectorAll("#svgContainer path")
        polyline = document.querySelectorAll("#svgContainer polyline")

        this.parseNodes(paths, polyline)
    }

    this.gradient = [0x321141, 0x311345, 0x31154a, 0x30174d, 0x2e1951, 0x2d1b55, 0x2b1e58, 0x29215b, 0x27235e, 0x252660, 0x232963, 0x202d65, 0x1e3066, 0x1b3367, 0x183768, 0x163b68, 0x133e69, 0x114268, 0x0f4667, 0x0c4966, 0x0a4d65, 0x085163, 0x075461, 0x06585e, 0x055b5b, 0x045f58, 0x036255, 0x036551, 0x04684d, 0x046b49, 0x066d45, 0x077041, 0x09723c, 0x0b7438, 0x0e7634, 0x11782f, 0x15792b, 0x197a27, 0x1e7b23, 0x237c1f, 0x287c1b, 0x2e7c18, 0x347c15, 0x3a7c13, 0x407c10, 0x477b0f, 0x4e7a0d, 0x55790c, 0x5d780c, 0x64770c, 0x6c760c, 0x74740e, 0x7b720f, 0x837111, 0x8a6f14, 0x926d17, 0x996b1b, 0xa0691f, 0xa76824, 0xad6629, 0xb4642f, 0xba6335, 0xbf613c, 0xc46043, 0xc95e4a, 0xcd5d51, 0xd15d59, 0xd55c61, 0xd85b6a, 0xda5b72, 0xdc5b7b, 0xdd5b83, 0xde5c8c, 0xdf5d95, 0xdf5e9d, 0xde5fa5, 0xdd61ae, 0xdc63b6, 0xda65be, 0xd867c5, 0xd56acc, 0xd26dd3, 0xcf70d9, 0xcb73df, 0xc876e5, 0xc37aea, 0xbf7eef, 0xbb82f3, 0xb786f6, 0xb28bf9, 0xae8ffc, 0xa994fe, 0xa598ff, 0xa09dff, 0x9ca2ff, 0x98a6ff, 0x95abff, 0x91b0ff, 0x8eb4fe, 0x8bb9fc, 0x89bdfa, 0x86c1f7, 0x85c6f5, 0x83caf1, 0x82cdee, 0x82d1eb, 0x82d4e7, 0x82d8e3, 0x83dbdf, 0x84dedc, 0x85e0d8, 0x87e3d4, 0x8ae5d0, 0x8ce7cd, 0x90e8ca, 0x93eac6, 0x97ebc4, 0x9becc1, 0x9fedbf, 0xa4eebd, 0xa9efbb, 0xadefba, 0xb2efb9, 0xb8f0b9, 0xbdf0b9, 0xc2f0b9, 0xc7f0ba, 0xccf0bb]
    this.getGradient = function (t) {
        var i = Math.floor(t * 128)
        return this.gradient[i]
    }

}