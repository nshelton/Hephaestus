
THREE.InteractiveControls = function (appmodel) {

    this.screen = { left: 0, top: 0, width: 0, height: 0 };
    this.appmodel = appmodel
    var _this = this;
    
    this.domElement = appmodel.dom_element
    var box = this.domElement.getBoundingClientRect()

    this.aspect = box.height / box.width
    this.zoom = 300

    this.position = { x: this.zoom / 2, y: this.zoom / 2 };
    this.mouseDown = false;
    this.dragging = false;
    this.enabled = true;

    this.updateModel = function () {
        this.appmodel.zoom = this.zoom
        this.appmodel.aspect = this.aspect
        this.appmodel.camera_position = [this.position.x, this.position.y]
        console.log(this.appmodel)
    }

    _panStart = new THREE.Vector2(),
        _panEnd = new THREE.Vector2();

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

    this.handleResize();

    var getMouseOnScreen = (function () {

        var vector = new THREE.Vector2();

        return function (pageX, pageY) {

            vector.set(
                (pageX - _this.screen.left) / _this.screen.width,
                (pageY - _this.screen.top) / _this.screen.height
            );

            return vector;

        };

    }());


    this.panCamera = (function () {

        var mouseChange = new THREE.Vector2()

        return function () {

            mouseChange.copy(_panEnd).sub(_panStart);

            if (mouseChange.lengthSq()) {

                this.position.x -= mouseChange.x * this.zoom
                this.position.y -= mouseChange.y * this.zoom

                this.updateModel()
            }
        }

    }());

    this.dragObject = (function () {


        var mouseChange = new THREE.Vector2()

        return function () {
            mouseChange.copy(_panEnd).sub(_panStart);
        }

    }());

    this.update = function () {

        // if (!this.enabled) {
        //     return
        // }
        
        if (this.canvasMove) {
            this.panCamera()
            _panStart.copy(_panEnd)
        }

    };

    this.disable = function() {
        // this.enabled = false
        // document.removeEventListener('mousemove', mousemove);
        // document.removeEventListener('mouseup', mouseup);
    }

    this.enable = function() {
        // this.enabled = true
    }

    function mousedown(event) {
        if (!_this.enabled ) return;

        event.preventDefault();
        event.stopPropagation();
        _panStart.copy(getMouseOnScreen(event.pageX, event.pageY));
        _panEnd.copy(_panStart)

        var _mouse = new THREE.Vector2()
        var rect = _this.domElement.getBoundingClientRect();

        _mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        _mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        _this.canvasMove = true;

        document.addEventListener('mousemove', mousemove, false);
        document.addEventListener('mouseup', mouseup, false);
    }

    function mousemove(event) {
        if (!_this.enabled ) return;

        _panEnd.copy(getMouseOnScreen(event.pageX, event.pageY));
        event.preventDefault();
        event.stopPropagation();
    }

    function mouseup(event) {
        if (!_this.enabled ) return;

        event.preventDefault();
        event.stopPropagation();

        _this.canvasMove = false;
        _this.dragging = false;
        this.domElement.style.cursor = 'default';

        document.removeEventListener('mousemove', mousemove);
        document.removeEventListener('mouseup', mouseup);

    }

    function mousewheel(event) {

        event.preventDefault();
        event.stopPropagation();

        var delta = 0;

        if (event.wheelDelta) { // WebKit / Opera / Explorer 9

            delta = event.wheelDelta / 40;

        } else if (event.detail) { // Firefox

            delta = - event.detail / 3;

        }

        _this.zoom *= (1 - 0.05 * delta)
        _this.zoom = Math.min(_this.zoom, 1000)
        _this.zoom = Math.max(_this.zoom, 50)
        _this.updateModel()

    }

    this.domElement.addEventListener('contextmenu', function (event) { event.preventDefault(); }, false);

    this.domElement.addEventListener('mousedown', mousedown, false);

    this.domElement.addEventListener('mousewheel', mousewheel, false);
    this.domElement.addEventListener('DOMMouseScroll', mousewheel, false); // firefox

    this.update();
};