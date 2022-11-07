
PlotViewer = function () {


    var segments = []
    var lineObjects = []

    var boundingBox = null
    var container = null
    var scaleWidget = null

    this.renderer = new THREE.WebGLRenderer();
    this.camera = new THREE.OrthographicCamera(0, 500, 0, 500, 1, 10000);
    this.controls = null;
    this.scene = new THREE.Scene();

    var _this = this;

    function parseNodes(paths, scene) {
        console.log(paths)

        const material = new THREE.LineBasicMaterial({
            color: 0xff0000
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
                }
            })
        })

        container = new THREE.Object3D()
        segments.forEach(segment => {
            const points = segment.map(s => new THREE.Vector3(s[0], s[1], 0))
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, material);
            lineObjects.push(line)
            container.add(line);
        })

        scene.add(container)

        var bbox = new THREE.Box3().setFromObject(container);

        const bbgeometry = new THREE.BoxGeometry(1, 1, 1);
        const bbmaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true });
        boundingBox = new THREE.Mesh(bbgeometry, bbmaterial);
        var scale = new THREE.Vector3()
        var position = new THREE.Vector3()

        bbox.getSize(scale)
        bbox.getCenter(position)
        var scaleScalar = 300 / Math.max(scale.x, scale.y)

        container.position.set(-position.x / 2 * scaleScalar, -position.y / 2 * scaleScalar, -position.z / 2 * scaleScalar)
        container.scale.set(scaleScalar, scaleScalar, scaleScalar)
        container.updateMatrix()

        console.log(container.matrix)

        container.children.forEach(obj => {
            obj.geometry.applyMatrix4(container.matrix);
        });

        container.position = new THREE.Vector3()
        container.scale.set(1, 1, 1)
        container.updateMatrix()

        var bbox = new THREE.Box3().setFromObject(container);
        // bbox.getSize(boundingBox.scale)
        boundingBox.scale.set(100, 100, 100)
        bbox.getCenter(boundingBox.position)
        boundingBox.updateMatrix()
        boundingBox.geometry.applyMatrix4(boundingBox.matrix);

        boundingBox.position = new THREE.Vector3()
        boundingBox.scale.set(1, 1, 1)
        boundingBox.updateMatrix()

        scene.add(boundingBox)

        const sphereGeo = new THREE.SphereGeometry(5, 4, 4);
        scaleWidget = new THREE.Mesh(sphereGeo, bbmaterial);
        boundingBox.add(scaleWidget)
        scaleWidget.position.set(100, 100, 0)

        controls.registerObject(scaleWidget)
        controls.registerObject(boundingBox)

    }

    function createPlotList() {

        const bbgeometry = new THREE.BoxGeometry(1, 1, 1);
        const bbmaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true });
        container.updateMatrix()

        commands = []
        lineObjects.forEach(line => {
            line.geometry.applyMatrix4(container.matrix)
            line.removeFromParent()
            scene.add(line)

            const x = line.geometry.attributes.position.array[0]
            const y = line.geometry.attributes.position.array[1]
            var debugBox = new THREE.Mesh(bbgeometry, bbmaterial);
            debugBox.position.set(Math.round(x * 100) / 100, Math.round(y * 100) / 100, 0)
            coords = []
            coords.push([x, y])

            scene.add(debugBox)
            for (var i = 3; i < line.geometry.attributes.position.count; i += 3) {
                const x = line.geometry.attributes.position.array[i * 3 + 0]
                const y = line.geometry.attributes.position.array[i * 3 + 1]
                var debugBox = new THREE.Mesh(bbgeometry, bbmaterial);
                debugBox.position.set(Math.round(x * 100) / 100, Math.round(y * 100) / 100, 0)
                scene.add(debugBox)
                coords.push([x, y])
            }

            commands.push(["path", coords])

        })
        sendCommands(commands)
    }

    const a3Width = 297
    const a3Height = 420

    this.addDragNDrop = function (node) {
        var bbox = new THREE.Box3().setFromObject(node);

        const bbgeometry = new THREE.BoxGeometry(1, 1, 1);
        const bbmaterial = new THREE.MeshBasicMaterial({ color: 0x888888, wireframe: true, transparent: true, opacity: 0.5 });

        this.boundingBox = new THREE.Mesh(bbgeometry, bbmaterial);
        this.boundingBox.renderOrder = -1


        var bbox = new THREE.Box3().setFromObject(node);
        bbox.getCenter(this.boundingBox.position)
        bbox.getSize(this.boundingBox.scale)
        this.originalScale = this.boundingBox.scale.clone()
        this.boundingBox.updateMatrix()
        this.boundingBox.geometry.applyMatrix4(this.boundingBox.matrix);
        this.boundingBox.updateMatrix()

        this.boundingBox.position = new THREE.Vector3()
        this.boundingBox.scale.set(1, 1, 1)

        this.boundingBox.updateMatrix()
        this.scene.add(this.boundingBox)

        // const sphereGeo = new THREE.SphereGeometry(5, 4, 4);
        // this.scaleWidget = new THREE.Mesh(sphereGeo, bbmaterial);
        // this.this.boundingBox.add(scaleWidget)
        // scaleWidget.position.set(100, 100, 0)
        node.removeFromParent()
        this.boundingBox.add(node)

        const sphereGeo = new THREE.SphereGeometry(5, 4, 4);
        this.scaleWidget = new THREE.Mesh(sphereGeo, bbmaterial);
        this.scene.add(this.scaleWidget)
        this.scaleWidget.position.set(1, 1, 0)

        this.controls.registerObject(this.scaleWidget)
        this.controls.registerObject(this.boundingBox)
    }

    this.updateDragNDrop = function () {

        if (this.boundingBox == null || this.scaleWidget == null) {
            return
        }
        
        var scalePos = this.scaleWidget.position.distanceTo(this.boundingBox.position);

        console.log(this.boundingBox.scale)
        console.log(scalePos)
        
        var s = scalePos / this.originalScale.x

        this.boundingBox.scale.set(s, s, s)

        this.scaleWidget.position.set(this.originalScale.x, this.originalScale.y, 0)
        this.scaleWidget.position.add(this.boundingBox.position)

    }

    this.AddPath = function (path) {
        this.lineObjects = []

        this.container = new THREE.Object3D()
        const material = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: false });

        const points = path.map(s => new THREE.Vector3(s[0] / 100, s[1] / 100, 0))
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, material);
        console.log(line)
        this.lineObjects.push(line)
        this.container.add(line);

        this.scene.add(this.container)
        this.addDragNDrop(this.container)
    }

    this.setupScene = function () {
        view = document.getElementById("plotViewContainer")


        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById("plotViewContainer").appendChild(this.renderer.domElement);

        this.camera.lookAt(new THREE.Vector3());
        this.controls = new THREE.InteractiveControls(this.camera, this.renderer.domElement);


        const geometry = new THREE.PlaneGeometry(a3Width, a3Height, a3Width / 10, a3Height / 10);
        const material = new THREE.MeshBasicMaterial({ wireframe: true, color: 0x333333, side: THREE.DoubleSide });
        const plane = new THREE.Mesh(geometry, material);
        plane.position.set(a3Width / 2, a3Height / 2, 0)
        this.scene.add(plane);


        const linematerial = new THREE.LineBasicMaterial({
            color: 0xe61d5f
        });

        const points = [];
        points.push(new THREE.Vector3(a3Width, 0, 0));
        points.push(new THREE.Vector3(0, 0, 0));
        points.push(new THREE.Vector3(0, a3Height, 0));

        const linegeometry = new THREE.BufferGeometry().setFromPoints(points);

        const line = new THREE.Line(linegeometry, linematerial);
        this.scene.add(line);

        render()

        function render() {
            _this.renderer.render(_this.scene, _this.camera);
            _this.controls.update()

            _this.updateDragNDrop()

            requestAnimationFrame(render)
        }
    }


    function setupPlotView(doc) {

        paths = document.querySelectorAll("#svgContainer path")

        parseNodes(paths, this.scene)


    }

}