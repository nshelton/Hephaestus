
THREE.InteractiveControls = function (camera, domElement) {

    this.screen = { left: 0, top: 0, width: 0, height: 0 };

    var _this = this;
    this.domElement = (domElement !== undefined) ? domElement : document;
    this.camera = camera

    this.a3Width = 297
    this.a3Height = 420
    var box = this.domElement.getBoundingClientRect();
    this.aspect = box.height / box.width
    this.zoom = 300

    this.position = { x: this.zoom / 2, y: this.zoom / 2 };
    this.mouseDown = false;
    this.dragging = false;
    var _selectedObject = null

    var _raycaster = new THREE.Raycaster();
    var _intersectObjects = []

    this.registerObject = function (obj) {
        obj.geometry.computeBoundingBox()
        _intersectObjects.push(obj)
    }

    this.unregisterObject = function(obj) {
        const index = _intersectObjects.indexOf(obj);
        if (index > -1) {
            _intersectObjects.splice(index, 1);
        }
    }

    this.updateCamera = function () {
        camera.left = this.position.x - this.zoom / 2
        camera.right = this.position.x + this.zoom / 2
        camera.top = this.position.y - this.zoom / 2 * this.aspect
        camera.bottom = this.position.y + this.zoom / 2 * this.aspect
        camera.position.set(0, 0, 10)

        camera.updateProjectionMatrix()
    }


    _panStart = new THREE.Vector2(),
        _panEnd = new THREE.Vector2();

    this.updateCamera();
    // methods
    this.handleResize = function () {

        if (this.domElement === document) {

            this.screen.left = 0;
            this.screen.top = 0;
            this.screen.width = window.innerWidth;
            this.screen.height = window.innerHeight;

        } else {

            var box = this.domElement.getBoundingClientRect();
            // adjustments come from similar code in the jquery offset() function
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

                this.updateCamera()
            }
        }

    }());

    this.dragObject = (function () {


        var mouseChange = new THREE.Vector2()

        return function () {

            mouseChange.copy(_panEnd).sub(_panStart);

            if (mouseChange.lengthSq() && _selectedObject != null) {

                // this.position.x -= mouseChange.x * this.zoom
                // this.position.y -= mouseChange.y * this.zoom

                _selectedObject.position.set(
                    _selectedObject.position.x + mouseChange.x * this.zoom,
                    _selectedObject.position.y + mouseChange.y * this.zoom,
                    0);
            }
        }

    }());

    this.update = function () {
        if (this.canvasMove) {
            this.panCamera()
            _panStart.copy(_panEnd)
        }

        if (this.dragging) {
            this.dragObject()
            _panStart.copy(_panEnd)
        }

    };

    this.reset = function () {



    };

    // listeners

    function keydown(event) {


    }

    function keyup(event) {


    }

    function mousedown(event) {

        event.preventDefault();
        event.stopPropagation();
        _panStart.copy(getMouseOnScreen(event.pageX, event.pageY));
        _panEnd.copy(_panStart)

        var _mouse = new THREE.Vector2()
        var rect = domElement.getBoundingClientRect();

        _mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        _mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        var intersects = []
        _raycaster.setFromCamera(_mouse, camera);
        if (_intersectObjects.length > 0) {
            intersects = _raycaster.intersectObjects(_intersectObjects);
            console.log(intersects)
        }

        if (intersects.length > 0) {
            _this.dragging = true;
            _selectedObject = intersects[0].object
            _selectedObject.isMoving = true

            domElement.style.cursor = 'move';

        } else {
            _this.canvasMove = true;

        }
        document.addEventListener('mousemove', mousemove, false);
        document.addEventListener('mouseup', mouseup, false);
    }

    function mousemove(event) {
        _panEnd.copy(getMouseOnScreen(event.pageX, event.pageY));
        event.preventDefault();
        event.stopPropagation();

    }

    function mouseup(event) {

        event.preventDefault();
        event.stopPropagation();

        _this.canvasMove = false;
        _this.dragging = false;
        domElement.style.cursor = 'default';
        if (_selectedObject) 
            _selectedObject.isMoving = false
        _selectedObject = null;

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
        _this.zoom = Math.min(_this.zoom, 1000000)
        _this.zoom = Math.max(_this.zoom, 50)
        _this.updateCamera()

    }

    this.domElement.addEventListener('contextmenu', function (event) { event.preventDefault(); }, false);

    this.domElement.addEventListener('mousedown', mousedown, false);

    this.domElement.addEventListener('mousewheel', mousewheel, false);
    this.domElement.addEventListener('DOMMouseScroll', mousewheel, false); // firefox

    window.addEventListener('keydown', keydown, false);
    window.addEventListener('keyup', keyup, false);

    // force an update at start
    this.update();

};