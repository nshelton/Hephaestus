
class CanvasControls {
    constructor(appmodel) {
        this.screen = { left: 0, top: 0, width: 0, height: 0 };
        this.appmodel = appmodel
        var _this = this;

        this.domElement = appmodel.dom_element
        var box = this.domElement.getBoundingClientRect()

        this.aspect = box.height / box.width
        this.zoom = 300

        this.mouse = new THREE.Vector2();
        this.mouseOnScreen = new THREE.Vector2();

        this.raycaster = new THREE.Raycaster();
        this.intersection = new THREE.Vector3();
        this.offset = new THREE.Vector3();
        this.backplane = new THREE.Plane();
        this.backplane.setFromNormalAndCoplanarPoint(
            new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0));

        this.canvasPosition = { x: this.zoom / 2, y: this.zoom / 2 };

        this.canvasMove = false;
        this.enabled = true;

        this.updateModel = function () {
            this.appmodel.zoom = this.zoom
            this.appmodel.aspect = this.aspect
            this.appmodel.camera_position = [this.canvasPosition.x, this.canvasPosition.y]
        }

        this.panStart = new THREE.Vector2()
        this.panEnd = new THREE.Vector2()

        this.updateModel();
        // methods
        this.handleResize = function () {
            if (this.domElement === document) {
                this.screen.left = 0;
                this.screen.top = 0;
                this.screen.width = window.innerWidth;
                this.screen.height = window.innerHeight;
            } else {
                var box = this.domElement.getBoundingClientRect();
                var d = this.domElement.ownerDocument.documentElement;
                this.screen.left = box.left + window.pageXOffset - d.clientLeft;
                this.screen.top = box.top + window.pageYOffset - d.clientTop;
                this.screen.width = box.width;
                this.screen.height = box.height;
            }
        };

        this.domElement.addEventListener('contextmenu', function (event) { event.preventDefault(); }, false);

        this.domElement.addEventListener('mousedown', this.mousedown.bind(this), false);
        this.domElement.addEventListener('mousemove', this.mousemove.bind(this), false);

        this.domElement.addEventListener('mousewheel', this.mousewheel.bind(this), false);
        this.domElement.addEventListener('DOMMouseScroll', this.mousewheel.bind(this), false); // firefox

        this.handleResize();
        this.update();
    }

    panCamera() {

        var mouseChange = new THREE.Vector2()
        mouseChange.copy(this.panEnd).sub(this.panStart);

        if (mouseChange.lengthSq()) {

            this.canvasPosition.x -= mouseChange.x * this.zoom
            this.canvasPosition.y -= mouseChange.y * this.zoom

            this.updateModel()

            console.log("app_model.camera_position", app_model.camera_position)
        }

    }

    dragObject() {


        var mouseChange = new THREE.Vector2()

        return function () {
            mouseChange.copy(this.panEnd).sub(this.panStart);
        }

    }

    update() {

        // if (!this.enabled) {
        //     return
        // }

        if (this.canvasMove) {
            this.panCamera()
            this.panStart.copy(this.panEnd)
        }

    };

    disable() {
        // this.enabled = false
        // document.removeEventListener('mousemove', mousemove);
        // document.removeEventListener('mouseup', mouseup);
    }

    enable() {
        // this.enabled = true
    }

    mousedown(event) {
        if (!this.enabled) return;

        event.preventDefault();
        event.stopPropagation();

        this.panStart.copy(this.mouseOnScreen);
        this.panEnd.copy(this.panStart)
        this.canvasMove = true;

        document.addEventListener('mouseup', this.mouseup.bind(this), false);
    }

    mousemove(event) {

        var rect = document.documentElement.getBoundingClientRect()
        this.mouse.set(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            ((event.clientY - rect.top) / rect.height) * 2 + 1
        )

        this.mouseOnScreen.set(
            (event.pageX - this.screen.left) / this.screen.width,
            (event.pageY - this.screen.top) / this.screen.height
        )
        this.raycaster.setFromCamera(this.mouse, this.appmodel.camera);
        this.intersection = this.raycaster.ray.intersectPlane(this.backplane, this.intersection)

        if (this.canvasMove) {
            this.panEnd.copy(this.mouseOnScreen);
        }

        this.appmodel.plot_models.forEach(plotModel => {

            if (!plotModel.bbox) return

            // const intersects = this.raycaster.intersectObject(
            // plotModel.bbox);
            // console.log(plotModel.bbox)

            // if (intersects.length > 0) {
            //     print("intersects", plotModel.id)
            //     if (!this.isHovering) {
            //        console.log("hover")
            //     }
            // } else {
            //     if (this.isHovering) {
            //         this.isHovering = false
            //         this.onMouseExit()
            //     }
            //     this.domElement.style.cursor = 'auto';
            // }

        })


    }

    mouseup(event) {
        if (!this.enabled) return;

        event.preventDefault();
        event.stopPropagation();

        if (this.canvasMove) { this.canvasMove = false }
        // this.dragging = false;

        document.removeEventListener('mouseup', this.mouseup);
    }

    mousewheel(event) {

        event.preventDefault();
        event.stopPropagation();

        var delta = 0;

        if (event.wheelDelta) { // WebKit / Opera / Explorer 9

            delta = event.wheelDelta / 40;

        } else if (event.detail) { // Firefox

            delta = - event.detail / 3;

        }

        this.zoom *= (1 - 0.05 * delta)
        this.zoom = Math.min(this.zoom, 1000)
        this.zoom = Math.max(this.zoom, 50)
        this.updateModel()

    }

};