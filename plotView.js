
PlotViewer = function () {


    this.lineObjects = []
    this.segments = []

    var boundingBox = null
    var container = null
    var scaleWidget = null

    this.renderer = new THREE.WebGLRenderer();
    this.camera = new THREE.OrthographicCamera(0, 500, 0, 500, 1, 10000);
    this.controls = null;
    this.scene = new THREE.Scene();
    this.dragables = []
    var _this = this;

    this.parseNodes = function (paths, polyline) {
        console.log(paths)
        console.log(polyline)

        const material = new THREE.LineBasicMaterial({
            color: 0xff0000
        });

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
            const line = new THREE.Line(geometry, material);
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
            // console.log(this.boundingBox.matrix)
            posBuffer.applyMatrix4(this.boundingBox.matrix)

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
        const originmaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true, transparent: true, opacity: 0.5 });


        const bbgeometry = new THREE.BoxGeometry(1, 1, 1);
        const bbmaterial = new THREE.MeshBasicMaterial({ color: 0x88ff88, wireframe: true, transparent: true, opacity: 0.5 });

        var dragable = {
            node: node,
            boundingBox: new THREE.Mesh(bbgeometry, bbmaterial),
            scaleWidget: new THREE.Mesh(sphereGeo, bbmaterial),
            originDot : new THREE.Mesh(sphereGeo, originmaterial),
            pos: new THREE.Vector3(),
            dim: new THREE.Vector3(),
            baseDistance : 1
        }
        // dragable.boundingBox.renderOrder = 100

        var bbox = new THREE.Box3().setFromObject(node);
        bbox.getCenter(dragable.boundingBox.position)
        bbox.getSize(dragable.boundingBox.scale)
        dragable.node.add(dragable.boundingBox)

        dragable.originDot.scale.set(1, 1, 1)
        this.scene.add(dragable.originDot)
        this.scene.add(dragable.scaleWidget)
        

        // var bottomRight = dragable.boundingBox.localToWorld(new THREE.Vector3(100,100,1))
        // dragable.scaleWidget.position.copy(bottomRight)

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
        this.controls.registerObject(dragable.scaleWidget)

        this.dragables.push(dragable)
    }

    this.lastbboxpos = new THREE.Vector3()

    this.updateDragNDrop = function () {
        this.dragables.forEach(d => {
            if ( d.scaleWidget.isMoving) {
                const aspect = d.boundingBox.scale.x/d.boundingBox.scale.y
                const aspectCurrent = (d.scaleWidget.position.x - d.originDot.position.x) / (d.scaleWidget.position.y- d.originDot.position.y)
    
                const p0 = d.originDot.position
                const p1 = d.scaleWidget.position
                if (aspectCurrent > aspect) {
                    d.scaleWidget.position.x = p0.x + aspect * (p1.y- p0.y) 
                }
                if (aspectCurrent < aspect) {
                    d.scaleWidget.position.y = p0.y + (p1.x- p0.x) /aspect
                }
    
            }

            if ( d.originDot.isMoving) {
                d.scaleWidget.position.copy(d.dim).multiplyScalar(d.node.scale.x).add(d.originDot.position)
            }
          
    
            // var dist = d.scaleWidget.position.distanceTo(d.boundingBox.position)
            var pos = new THREE.Vector3(0,0,0)

            var s = d.originDot.position.distanceTo(d.scaleWidget.position) / d.baseDistance
            d.node.scale.set(s,s,s)


            // pos.copy(d.originDot.position)
            // pos.sub(d.offset)
            d.node.position.copy(d.pos).multiplyScalar(-s).add(d.originDot.position)

    

        })


        // if (d != this.boundingBox.scale.x) {
        //     this.boundingBox.scale.set(d, d, d)
        // }
        // if (this.lastbboxpos.x != 0) {
        //     var tmp = new THREE.Vector3()
        //     tmp.subVectors(this.boundingBox.position, this.lastbboxpos)

        //     this.scaleWidget.position.add(tmp)
        // }

        // this.lastbboxpos.copy(this.boundingBox.position)
    }


    this.CreatePaths = function (paths) {
        this.container = new THREE.Object3D()
        const material = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: false });

        paths.forEach(path => {
            const points = path.map(s => new THREE.Vector3(s[0] / 100, s[1] / 100, 0))
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, material);

            this.lineObjects.push(line)
            this.container.add(line);
            this.segments.push(points)
        })

        this.scene.add(this.container)
        this.addDragNDrop(this.container)
    }

    this.setupScene = function () {
        view = document.getElementById("plotViewContainer")

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById("plotViewContainer").appendChild(this.renderer.domElement);

        this.camera.lookAt(new THREE.Vector3());
        this.controls = new THREE.InteractiveControls(this.camera, this.renderer.domElement);

        const geometry = new THREE.PlaneGeometry(a3Height, a3Width, a3Height / 10, a3Width / 10);
        const material = new THREE.MeshBasicMaterial({ wireframe: true, color: 0x333333, side: THREE.DoubleSide });
        const plane = new THREE.Mesh(geometry, material);
        plane.position.set(a3Height / 2, a3Width / 2, 0)
        this.scene.add(plane);

        const linematerial = new THREE.LineBasicMaterial({ color: 0xe61d5f });

        const points = [];
        points.push(new THREE.Vector3(a3Height, 0, 0));
        points.push(new THREE.Vector3(0, 0, 0));
        points.push(new THREE.Vector3(0, a3Width, 0));

        const linegeometry = new THREE.BufferGeometry().setFromPoints(points);

        const line = new THREE.Line(linegeometry, linematerial);
        this.scene.add(line);

        const points2 = [];
        points2.push(new THREE.Vector3(230, 0, 0));
        points2.push(new THREE.Vector3(230, 170, 0));
        points2.push(new THREE.Vector3(0, 170, 0));

        const linegeometry2 = new THREE.BufferGeometry().setFromPoints(points2);

        const line2 = new THREE.Line(linegeometry2, linematerial);
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