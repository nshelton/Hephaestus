
class CanvasControls {
    MODE = {
        NONE:0,
        HOVER_CANVAS:1,
        HOVER_OBJECT_SCALE:2,
        HOVER_OBJECT_MOVE:3,
        MOVE_CANVAS:4,
        MOVE_OBJECT:5,
        SCALE_OBJECT:6,
    }

    constructor(appmodel) {

        this.screen = { left: 0, top: 0, width: 0, height: 0 };
        this.appmodel = appmodel

        this.domElement = appmodel.dom_element
        var box = this.domElement.getBoundingClientRect()

        this.aspect = box.height / box.width
        this.zoom = 300

        this.mouseOnScreen = new THREE.Vector2();
        this.raycasterMouse = new THREE.Vector2();
        this.hover_id = ""

        this.initialScale = 1
        this.initialDistance = 0

        this.raycaster = new THREE.Raycaster();
        this.intersection = new THREE.Vector3();
        this.offset = new THREE.Vector3();
        this.backplane = new THREE.Plane();
        this.backplane.setFromNormalAndCoplanarPoint(
            new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 0, 0));

        this.canvasPosition = { x: this.appmodel.camera_position.x, y: this.appmodel.camera_position.y };

        this.mode = this.MODE.NONE;
        this.enabled = true;

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

    updateModel() {
        this.appmodel.zoom = this.zoom
        this.appmodel.aspect = this.aspect
        this.appmodel.camera_position = [this.canvasPosition.x, this.canvasPosition.y]
    }

    panCamera() {

        var mouseChange = new THREE.Vector2()
        mouseChange.copy(this.panEnd).sub(this.panStart);

        if (mouseChange.lengthSq()) {

            this.canvasPosition.x -= mouseChange.x * this.zoom
            this.canvasPosition.y -= mouseChange.y * this.zoom

            this.updateModel()
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

        if (this.mode == this.MODE.MOVE_CANVAS) {
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

        const plot_model = this.appmodel.getPlotById(this.hover_id)

        if (plot_model) {
            if (this.mode == this.MODE.HOVER_OBJECT_MOVE) {
                this.mode = this.MODE.MOVE_OBJECT;
                this.offset.copy(this.intersection).sub(plot_model.position);
            }
            if (this.mode == this.MODE.HOVER_OBJECT_SCALE) {
                this.mode = this.MODE.SCALE_OBJECT;
                this.initialScale = plot_model.scale;
                const center = plot_model.bbox.getCenter(new THREE.Vector3());
                this.initialDistance = this.intersection.distanceTo(center);
            }

        } else {
            this.panStart.copy(this.mouseOnScreen);
            this.panEnd.copy(this.panStart)
            this.mode = this.MODE.MOVE_CANVAS;
        }

        document.addEventListener('mouseup', this.mouseup.bind(this), false);
    }

    isInBox(p, bbox) {
        return p.x > bbox.min.x && p.x < bbox.max.x && p.y > bbox.min.y && p.y < bbox.max.y
    }

    mousemove(event) {

        var rect = document.documentElement.getBoundingClientRect()

        this.mouseOnScreen.set(
            (event.pageX - this.screen.left) / this.screen.width,
            (event.pageY - this.screen.top) / this.screen.height
        )

        this.raycasterMouse.set(
            (event.clientX / window.innerWidth) * 2 - 1,
            - (event.clientY / window.innerHeight) * 2 + 1)

        this.raycaster.setFromCamera(this.raycasterMouse, this.appmodel.camera);
        this.raycaster.ray.intersectPlane(this.backplane, this.intersection)

        if (this.mode == this.MODE.MOVE_CANVAS) {

            this.panEnd.copy(this.mouseOnScreen);

        } else if (this.mode == this.MODE.MOVE_OBJECT) {

            const plot_model = this.appmodel.getPlotById(this.hover_id)

            this.intersection.sub(this.offset)
            plot_model.position.x = this.intersection.x
            plot_model.position.y = this.intersection.y
            
        } else if (this.mode == this.MODE.SCALE_OBJECT) {
            const plot_model = this.appmodel.getPlotById(this.hover_id)
            const center = plot_model.bbox.getCenter(new THREE.Vector3());
    
            const currentDistance = this.intersection.distanceTo(center);
            const scaleFactor = currentDistance / this.initialDistance;
    
            plot_model.scale = this.initialScale * scaleFactor;

        } else {
            this.mode = this.MODE.NONE;

            this.hover_id = ""
            this.appmodel.plot_models.forEach(plot_model => {
    
                if (!plot_model.bbox) return
    
                if (this.isInBox(this.intersection, plot_model.bbox)) {
                    this.hover_id = plot_model.id

                    const center = plot_model.bbox.getCenter(new THREE.Vector3());
                    const distToCenter = center.distanceTo(this.intersection);
                    var bbox_dim =  plot_model.bbox.getSize(new THREE.Vector3());
                    const largest_edge = Math.max(bbox_dim.x, bbox_dim.y) / 4;

                    if (distToCenter <= largest_edge) {
                        this.domElement.style.cursor = 'move'; 
                        this.mode = this.MODE.HOVER_OBJECT_MOVE;
                        plot_model.state = "hover_move"
        
                    } else {
                        this.mode = this.MODE.HOVER_OBJECT_SCALE;
                        this.domElement.style.cursor = 'n-resize';
                        plot_model.state = "hover_scale"
                    }
                    
    
                } else {
                    plot_model.state = "none"
                    this.domElement.style.cursor = 'default';
    
                }
    
            })


        }



    }

    mouseup(event) {
        if (!this.enabled) return;

        event.preventDefault();
        event.stopPropagation();

        if (this.mode) { this.mode = false }
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