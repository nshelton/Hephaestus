PathUtils = function () {

    this.circlePath = function (cx, cy, radius, segments = 100) {

        var points = []
        for (var i = 0; i < segments; i++) {
            var theta = i / segments * Math.PI * 2
            points.push([radius * Math.cos(theta) + cx, radius * Math.sin(theta) + cy])
        }
        //close loop
        points.push(points[0])
        return points
    }

    this.wgs84ToWebMercator = function (lon, lat) {
        var x = lon * 20037508.34 / 180;
        var y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180);
        y = y * 20037508.34 / 180;
        return [x, -y];
    }

    this.convertLatLon = function (paths) {
        // Define the constants for the Albers Equal-Area Conic Projection
        var lon0 = -96; // Central meridian
        var lat0 = 37.5; // Latitude of origin
        var lat1 = 29.5; // First standard parallel
        var lat2 = 45.5; // Second standard parallel



        // Function to convert WGS84 coordinates to Albers Equal-Area Conic Projection
        function wgs84ToAlbers(lon, lat) {
            // Convert degrees to radians
            var lonRad = lon * Math.PI / 180;
            var latRad = lat * Math.PI / 180;
            var lon0Rad = lon0 * Math.PI / 180;
            var lat0Rad = lat0 * Math.PI / 180;
            var lat1Rad = lat1 * Math.PI / 180;
            var lat2Rad = lat2 * Math.PI / 180;

            // Calculate the projection constants
            var n = 0.5 * (Math.sin(lat1Rad) + Math.sin(lat2Rad));
            var C = Math.pow(Math.cos(lat1Rad), 2) + 2 * n * Math.sin(lat1Rad);
            var rho0 = Math.sqrt(C - 2 * n * Math.sin(lat0Rad)) / n;

            // Calculate the projection variables
            var theta = n * (lonRad - lon0Rad);
            var rho = Math.sqrt(C - 2 * n * Math.sin(latRad)) / n;

            // Calculate the projected coordinates
            var x = rho * Math.sin(theta);
            var y = rho0 - rho * Math.cos(theta);

            return [x, y];
        }

        return paths.map(path => path.map(p => this.wgs84ToWebMercator(p[0], p[1])))
    }


    this.getCenter = function (paths) {

        let x_sum = 0, count = 0, y_sum = 0;

        paths.forEach(path => path.forEach(p => {
            x_sum += p[0]
            y_sum += p[1]
            count += 1
        }))

        return [x_sum / count, y_sum / count]
    }



    this.getTopLeft = function (paths) {

        let x_min = 0, y_min = 0;

        paths.forEach(path => path.forEach(p => {
            x_min = Math.min(p[0], x_min)
            y_min = Math.min(p[1], y_min)
        }))

        return [x_min, y_min]
    }

    this.computeBoundingBoxes = function (labels) {
        let boundingBoxes = [];

        // Iterate over each array of points
        for (let label of labels) {
            let minX = Number(label[0][0][0]);
            let minY = Number(label[0][0][1]);
            let maxX = Number(label[0][0][0]);
            let maxY = Number(label[0][0][1]);

            // Find minimum and maximum coordinates in the array
            for (let letter of label) {
                for (let point of letter) {

                    if (typeof point === 'string') {
                        console.log("string point", point[0], point[1])
                    }

                    minX = Math.min(minX, point[0]);
                    minY = Math.min(minY, point[1]);
                    maxX = Math.max(maxX, point[0]);
                    maxY = Math.max(maxY, point[1]);
                }
            }
            // console.log(minX, minY, maxX, maxY)

            // Add the bounding box to the result array
            boundingBoxes.push({
                minX: minX,
                minY: minY,
                maxX: maxX,
                maxY: maxY
            });
        }

        return boundingBoxes;
    }

    this.repositionNonOverlappingBoundingBoxes = function (pointsArray) {

        // Compute bounding boxes
        let boundingBoxes = this.computeBoundingBoxes(pointsArray);

        // Calculate maximum width and height of bounding boxes
        let maxWidth = 0;
        let maxHeight = 0;
        for (let box of boundingBoxes) {
            let width = box.maxX - box.minX;
            let height = box.maxY - box.minY;
            maxWidth = Math.max(maxWidth, width);
            maxHeight = Math.max(maxHeight, height);
        }

        // Reposition points to avoid overlapping bounding boxes
        let xOffset = 0;
        let yOffset = 0;
        for (let i = 0; i < pointsArray.length; i++) {
            let points = pointsArray[i];
            let box = boundingBoxes[i];

            // Adjust x offset if the next bounding box overlaps with the previous one
            if (i > 0) {
                let prevBox = boundingBoxes[i - 1];
                let overlapX = (prevBox.maxX + xOffset) - (box.minX);
                if (overlapX > 0) {
                    xOffset += overlapX + 1;
                }
            }

            // Adjust y offset if the next bounding box overlaps with the previous one
            if (i > 0 && xOffset === 0) {
                let prevBox = boundingBoxes[i - 1];
                let overlapY = (prevBox.maxY + yOffset) - (box.minY);
                if (overlapY > 0) {
                    yOffset += overlapY + 1;
                }
            }

            // Reposition points
            for (let j = 0; j < points.length; j++) {
                points[j][0] += xOffset;
                points[j][1] += yOffset;
            }
        }
        console.log(pointsArray)
        return pointsArray;
    }

    this.relaxBoundingBoxes = function (pointsArray, iterations = 1, k = 0.1) {

        // Compute force between two bounding boxes

        function computeForce(box1, box2) {
            let midX1 = (box1.minX + box1.maxX) / 2;
            let midY1 = (box1.minY + box1.maxY) / 2;
            let midX2 = (box2.minX + box2.maxX) / 2;
            let midY2 = (box2.minY + box2.maxY) / 2;
            // console.log("bbox comp", midX1, midY1, midX2, midY2)

            let dx = midX2 - midX1;
            let dy = midY2 - midY1;

            return [dx, dy];
        }

        // Initialize forces for each array of points
        let forces = new Array(pointsArray.length).fill([0, 0]);

        console.log("pointsArray in", JSON.parse(JSON.stringify(pointsArray)));

        // Perform relaxation iterations
        for (let iter = 0; iter < iterations; iter++) {

            // Compute bounding boxes

            let boundingBoxes = this.computeBoundingBoxes(pointsArray);
            // console.log("boundingBoxes", iter,  JSON.parse(JSON.stringify(boundingBoxes)))
            // Update forces between arrays

            for (let i = 0; i < pointsArray.length; i++) {
                for (let j = 0; j < pointsArray.length; j++) {
                    if (i == j) continue;

                    let force = computeForce(boundingBoxes[i], boundingBoxes[j]);
                    forces[i][0] += force[0];
                    forces[i][1] += force[1];
                }
            }

            // move all points (triple nested array) by respective bounding box force
            pointsArray = pointsArray.map((label, bbox_id) =>  label.map( paths =>  paths.map(point => 
                 [point[0] + forces[bbox_id][0] * k, point[1] + forces[bbox_id][1] * k]
             )))


        }

        return pointsArray;
    }


    this.plotGeoJson = function (geojson) {

        var label_text = []
        var label_pos = []

        var outline_paths = []
        var label_paths = []

        geojson.features.forEach((f, idx) => {
 
            if (idx <80 ||idx >115) return
            if (f.geometry.type == "Polygon") {
                outline_paths.push(f.geometry.coordinates[0])
            }

            else if (f.geometry.type == "MultiPolygon") {
                f.geometry.coordinates.forEach(c => {
                    outline_paths.push(c[0])
                })
            } else if (f.geometry.type == "MultiLineString") {
                f.geometry.coordinates.forEach(c => {
                    outline_paths.push(c)
                })
            } else if (f.geometry.type == "LineString") {
                outline_paths.push(f.geometry.coordinates)

            }

            if (f.properties.name) {
                feature_path = outline_paths[outline_paths.length - 1]
                center = this.getCenter([feature_path])

                label_text.push(f.properties.name)
                label_pos.push(this.wgs84ToWebMercator(center[0], center[1]))
            }
        })

        outline_paths = this.convertLatLon(outline_paths)
        outline_paths = this.transform(outline_paths, 0.001, 0, 0)
        // outline_paths = this.transform(outline_paths, 0.1, 0, 0)
        labels = []


        for (var idx = 0; idx < label_pos.length; idx++) {
            var textPath = pathUtils.text(label_text[idx])

            text_center = this.getCenter(textPath)
            
            let fonstscale = 2

            textPath = this.transform(textPath, fonstscale,
                label_pos[idx][0],
                label_pos[idx][1])

            textPath = this.transform(textPath, 1,
                -text_center[0] * 2,
                -text_center[1] * 2)

            // console.log("textsPath before", textPath)

            textPath = this.transform(textPath, 0.001, 1,1)
            
            // console.log("textsPath after", textPath)

            labels.push(textPath)
        }

        // something is wrong here...
        // labels = this.relaxBoundingBoxes(labels)

        labels.forEach(label => label.forEach(p => label_paths.push(p)))

        return [outline_paths, label_paths]
    }

    this.upDownTest = function () {
        let result = []

        result.push(this.rectPath(-30, -30, 10, 10))
        result.push(this.rectPath(20, 20, 10, 10))

        result.push(this.rectPath(20, -30, 10, 10))
        result.push(this.rectPath(-30, 20, 10, 10))

        nLines = 10
        r = 20
        for (var i = 0; i < nLines; i++) {
            theta = Math.PI * i / nLines
            x = r * Math.cos(theta)
            y = r * Math.sin(theta)
            result.push([[x, y], [-x, -y]])
        }

        return result;

    }


    this.wolfram = function (rule) {
        // Define initial state
        generations = 200
        const width = 200
        const initialState = Array(width).fill(0);
        initialState[Math.floor(initialState.length / 2)] = 1;

        // const initialState = Array.from({ length: width  }, () => Math.round(Math.random()));
        console.log(initialState)
        function applyRule(rule, left, center, right) {
            const num = 4 * left + 2 * center + right;
            return (rule >> num) & 1;
        }

        const coordinates = [];
        let currentState = initialState.slice();

        for (let i = 1; i < generations; i++) {
            for (let j = 1; j < initialState.length - 1; j++) {
                if (applyRule(rule, currentState[j - 1], currentState[j], currentState[j + 1])) {
                    // Push coordinates for each cell that is "on"
                    coordinates.push([j, i]);
                }
            }
            // Update the current state for the next generation
            currentState = currentState.map((_, idx) => {
                if (idx === 0 || idx === currentState.length - 1) {
                    return 0; // Padding cells are always "off"
                }
                return applyRule(rule, currentState[idx - 1], currentState[idx], currentState[idx + 1]);
            });
        }
        let result = []
        circles = coordinates.forEach(p => {
            // result.push(this.circlePath(p[0], p[1], 0.5, 10)) 
            result.push(this.rectPath(p[0], p[1], 1, 0.1))
        })
        return result;


    }

    this.lorenz = function (steps) {

        const sigma = 10;
        const rho = 37;
        const beta = 2;
        const dt = 0.005;

        let x = 0.1;
        let y = 0;
        let z = 0;
        let points = [];

        for (let i = 0; i < steps; i++) {
            let dx = sigma * (y - x);
            let dy = x * (rho - z) - y;
            let dz = x * y - beta * z;
            x += dx * dt;
            y += dy * dt;
            z += dz * dt;
            points.push([x, y]);
        }

        return [points];
    }


    this.rectPath = function (x, y, w, h) {
        return [
            [x + 0, y + 0],
            [x + w, y + 0],
            [x + w, y + h],
            [x + 0, y + h],
            [x + 0, y + 0]]
    }

    this.transform = function (paths, scale, tx, ty) {
        return paths.map(path => path.map(p => [p[0] * scale, p[1] * scale]))
            .map(path => path.map(p => [p[0] + tx, p[1] + ty]))
    }

    this.dragonPath = function () {
        var n = 13
        var c = c1 = c2 = c2x = c2y = x = y = 0, d = 1, n = 1 << n;
        x = y = 0
        var scale = 1
        var hsh = 0
        var vsh = 0
        path = []

        for (i = 0; i <= n;) {
            path.push([(x + hsh) * scale, (y + vsh) * scale])
            c1 = c & 1; c2 = c & 2;
            c2x = 1 * d; if (c2 > 0) { c2x = (-1) * d }; c2y = (-1) * c2x;
            if (c1 > 0) { y += c2y } else { x += c2x }
            i++; c += i / (i & -i);
        }
        console.log(path)

        return ([path])
    }

    this.createGridFromPoints = function (points) {

        paths = []

        for (var row = 0; row < points.length; row++) {
            path = []
            for (var col = 0; col < points[row].length; col++) {
                if (row % 2 == 0)
                    path.push(points[row][col])
                else
                    path.push(points[row][(points[col].length - 1) - col])
            }
            paths.push(path)
        }

        for (var col = 0; col < points[0].length; col++) {
            path = []
            for (var row = 0; row < points.length; row++) {
                if (col % 2 == 0)
                    path.push(points[row][col])
                else
                    path.push(points[(points.length - 1) - row][col])
            }
            paths.push(path)
        }

        return paths
    }

    this.relaxGrid = function (p) {

        function add(a, b) { return [a[0] + b[0], a[1] + b[1]] }

        for (var x = 1; x < p.length - 1; x++) {
            for (var y = 1; y < p[x].length - 1; y++) {

                sum = [0, 0]
                for (var i = -1; i < 2; i++) {
                    for (var j = -1; j < 2; j++) {
                        sum = add(sum, p[x + i][y + j])
                    }
                }
                p[x][y] = [sum[0] / 9, sum[1] / 9]
            }
        }

        return p
    }

    this.star = function () {
        paths = []
        nLines = 50
        r = 20
        for (var i = 0; i < nLines; i++) {
            theta = Math.PI * i / nLines
            x = r * Math.cos(theta)
            y = r * Math.sin(theta)
            paths.push([[x, y], [-x, -y]])
        }

        // paths = pathUtils.transform(paths, 2, 50 + 20, 130 + 10 * (Math.sqrt(3) / 2))
        // paths = pathUtils.transform(paths, 2, 50 + 20, 50)
        // paths = pathUtils.transform(paths, 2, 50, 50)
        return paths
    }

    this.gridTest = function () {
        let N = 50
        noise.seed(Math.random());
        noiseScale = N / 8
        noiseFreq = 0.01

        function fbm(x, y) {

            var val = 0
            val += noise.simplex2(x * noiseFreq, y * noiseFreq) * noiseScale;
            val += noise.simplex2(x * noiseFreq * 2, y * noiseFreq * 2) * noiseScale / 2;
            val += noise.simplex2(x * noiseFreq * 4, y * noiseFreq * 4) * noiseScale / 4;
            val += noise.simplex2(x * noiseFreq * 8, y * noiseFreq * 8) * noiseScale / 8;
            val += noise.simplex2(x * noiseFreq * 16, y * noiseFreq * 16) * noiseScale / 16;

            return val;
        }

        points = []
        for (var x = 0; x <= N; x++) {
            row = []
            for (var y = 0; y <= N; y++) {
                var valuex = fbm(x, y) * Math.sin(y / N * Math.PI)
                var valuey = fbm(x + 553, y + 123) * Math.sin(y / N * Math.PI)
                row.push([x + valuex, y + valuey])
            }
            points.push(row)
        }
        console.log(points)

        for (var i = 0; i < 3; i++) {
            points = this.relaxGrid(points)
        }

        paths = this.createGridFromPoints(points)

        var scale = 180 / N
        paths = paths.map(path => path.map(p => [p[0] * scale, p[1] * scale]))
        return (paths)
    }

    this.flowField = function () {
        points = [
            [Math.random(), Math.random()],
            [Math.random(), Math.random()],
            [Math.random(), Math.random()],
            [Math.random(), Math.random()],
            [Math.random(), Math.random()]
        ]

        charges = [
            0.1 * (Math.random() - 0.5),
            0.1 * (Math.random() - 0.5),
            0.1 * (Math.random() - 0.5),
            0.1 * (Math.random() - 0.5),
            0.1 * (Math.random() - 0.5),
        ]

        function sampleField(x, y) {

            function gravity(x, y, px, py) {
                dx = x - px
                dy = y - py

                len = Math.sqrt(dx * dx + dy * dy)

                dx /= len
                dy /= len
                len = 0.0001 / len * len

                return [-dx * len, -dy * len]
            }

            function electricity(x, y) {

                EEx = 0
                EEy = 0

                for (var i = 0; i < points.length; i++) {
                    dx = x - points[i][0];
                    dy = y - points[i][1];
                    d1 = Math.sqrt(dx * dx + dy * dy);
                    E1 = charges[i] / (d1 * d1);
                    EEx += dx * E1 / d1;
                    EEy += dy * E1 / d1;
                }

                len = Math.sqrt(EEx * EEx + EEy * EEy);

                deltax = EEx / len;
                deltay = EEy / len;

                return [deltax, deltay]
                // return [deltay, -deltax]
            }


            // var g1 = gravity(x, y, 0.2, 0.3);
            // var g2 = gravity(x, y, 0.7, 0.5);
            // var g3 = gravity(x, y, 0.4, 0.8);

            // return [g1[0] + g2[0] + g3[0], g1[1] + g2[1]+ g3[1]]
            return electricity(x, y);
            // return field[Math.round(y)][Math.round(x)]

        }

        const dd = 15
        const lineLength = 20
        const delta = 0.005
        paths = []

        for (var i = 0; i < dd; i++) {
            for (var k = 0; k < dd; k++) {
                path = []
                // p = [Math.random(), Math.random()]
                p = [(i + Math.random()) / dd, (k + Math.random()) / dd]
                // p = [0,i/200]
                v = [0, 0]

                // Math.random() * 0.01 - 0.005,
                // Math.random() * 0.01 - 0.005]

                for (var j = 0; j < lineLength; j++) {
                    var field = sampleField(p[0], p[1])

                    v[0] = field[0]
                    v[1] = field[1]

                    pnew = [p[0] + v[0] * delta, p[1] + v[1] * delta]

                    tooclose = false
                    for (var j = 0; j < points.length; j++) {
                        dx = points[j][0] - pnew[0]
                        dy = points[j][1] - pnew[1]
                        len = Math.sqrt(dx * dx + dy * dy)
                        if (len < 0.01) {
                            tooclose = true
                            break
                        }
                    }
                    if (tooclose) {
                        break
                    }

                    if (pnew[0] < 0 || pnew[0] > 1 || pnew[1] < 0 || pnew[1] > 1.0)
                        break;

                    path.push(pnew)
                    p = pnew;

                }
                // console.log(path)
                paths.push(path)
            }
        }

        var scale = 8000
        paths = paths.map(path => path.map(p => [p[0] * scale, p[1] * scale]))
        tx = - 1000
        ty = - 1000
        paths = paths.map(path => path.map(p => [p[0] + tx, p[1] + ty]))
        // console.log(paths)
        return (paths)
    }

    this.circleGrid = function () {
        let N = 50
        noise.seed(Math.random());
        noiseScale = N / 13
        noiseFreq = 0.03

        function gauss() {
            return Math.random() * Math.random() * Math.random() + 0.5
        }

        circlePos = [
            [40.5, 20.5],
            [15.5, 15.5],
            [20.5, 36.5],
            [55.5, 36.5],
            [gauss() * N * 1.5, gauss() * N],
            [gauss() * N * 1.5, gauss() * N],
            [gauss() * N * 1.5, gauss() * N],
            [gauss() * N * 1.5, gauss() * N],
        ]
        rad = [34,
            40,
            45,
            40,
            gauss() * 20,
            gauss() * 20,
            gauss() * 20,
            30]

        console.log("pos", circlePos)

        function dist(x, y) {

            var deltax = 0
            var deltay = 0

            circlePos.forEach((c, i) => {
                var dx = x - c[0]
                var dy = y - c[1]
                var len = Math.sqrt(dx * dx + dy * dy)
                dx /= len, dy /= len

                scale = Math.sin(len / 5) * rad[i] * 0.7

                deltax += dx * scale / (2 + len);
                deltay += dy * scale / (2 + len);
            });

            return [deltax, deltay]
        }

        points = []
        for (var x = 0; x <= N * 1.5; x++) {
            row = []
            for (var y = 0; y <= N; y++) {

                var delta = dist(x, y)
                row.push([x + delta[0], y + delta[1]])
            }
            points.push(row)
        }
        console.log(points)


        paths = this.createGridFromPoints(points)


        console.log("paths", paths)
        var scale = 20000 / N
        paths = paths.map(path => path.map(p => [p[0] * scale, p[1] * scale]))
        tx = - 6000
        ty = - 4000
        paths = paths.map(path => path.map(p => [p[0] + tx, p[1] + ty]))
        return (paths)
    }

    this.text = function (theString) {
        paths = []
        offset = 0
        fontWidth = 16
        for (var i = 0; i < theString.length; i++) {

            pathString = fontGlyphs[theString[i]].join(" ")
            parsed = window.PathConverter.parse(pathString);

            if (parsed.current != null) {
                var segment = parsed.current.points.map(p => [p.main.x + offset, p.main.y])
                paths.push(segment)
            }

            parsed.curveshapes.forEach(c => {
                if (c && c.points != null) {
                    curve = c.points.map(p => [p.main.x + offset, p.main.y])
                    paths.push(curve)
                }
            })
            offset += fontWidth

        }

        var scale = 20
        paths = paths.map(path => path.map(p => [p[0] * scale, p[1] * scale]))
        // tx = -2000
        // ty = 5000
        paths = paths.filter(p => p.length > 0)
        return paths
    }

    this.mandala = function () {

        paths = []

        circles = []

        circle = this.circlePath(0, 0, 40, 100)
        paths.push(circle)

        for (var i = 0; i < 6; i++) {
            angle = Math.PI * 2 * i / 6

            // paths.push(this.circlePath(r * Math.cos(angle), r * Math.sin(angle), 50, 50))
            r = 99
            paths.push(this.circlePath(r * Math.cos(angle), r * Math.sin(angle), 10, 50))

        }
        for (var i = 0; i < 12; i++) {
            angle = Math.PI * 2 * i / 12

            r = 40
            paths.push(this.circlePath(r * Math.cos(angle), r * Math.sin(angle), 10, 50))

            r = 80
            circle = this.circlePath(r * Math.cos(angle), r * Math.sin(angle), 40, 50)

            r = 99
            paths.push(this.circlePath(r * Math.cos(angle), r * Math.sin(angle), 20, 50))

            paths.push(circle)
        }

        var scale = 20
        paths = paths.map(path => path.map(p => [p[0] * scale, p[1] * scale]))
        tx = 2000
        ty = 2000
        paths = paths.map(path => path.map(p => [p[0] + tx, p[1] + ty]))
        return paths

    }

    this.noise = function () {

        paths = []

        // field = 

        // for


        var scale = 20
        paths = paths.map(path => path.map(p => [p[0] * scale, p[1] * scale]))
        tx = 2000
        ty = 2000
        paths = paths.map(path => path.map(p => [p[0] + tx, p[1] + ty]))
        return paths

    }

    this.apollonian = function () {

        function getInner(c1, c2, c3) {

            var r = (c1.r * c2.r * c3.r) / (c1.r * c2.r + c1.r * c3.r + c2.r * c3.r + 2 * Math.sqrt(c1.r * c2.r * c3.r * (c1.r + c2.r + c3.r)));

            var a = 2 * (c1.cx - c2.cx);
            var ap = 2 * (c1.cx - c3.cx);

            var b = 2 * (c1.cy - c2.cy);
            var bp = 2 * (c1.cy - c3.cy);

            var C1 = 2 * (0 + c1.r + c2.r);
            var C1p = 2 * (0 + c1.r + c3.r);
            var C2 = 2 * (0 + c1.r - c2.r);
            var C2p = 2 * (0 + c1.r - c3.r);
            var C3 = 2 * (0 - c1.r + c2.r);
            var C3p = 2 * (0 - c1.r + c3.r);
            var C4 = 2 * (0 - c1.r - c2.r);
            var C4p = 2 * (0 - c1.r - c3.r);

            var d = ((c1.cx * c1.cx) + (c1.cy * c1.cy) - (c1.r * c1.r)) - ((c2.cx * c2.cx) + (c2.cy * c2.cy) - (c2.r * c2.r));
            var dp = ((c1.cx * c1.cx) + (c1.cy * c1.cy) - (c1.r * c1.r)) - ((c3.cx * c3.cx) + (c3.cy * c3.cy) - (c3.r * c3.r));

            var x = [(bp * d - b * dp - bp * C1 * r + b * C1p * r) / (a * bp - b * ap), (bp * d - b * dp - bp * C2 * r + b * C2p * r) / (a * bp - b * ap), (bp * d - b * dp - bp * C3 * r + b * C3p * r) / (a * bp - b * ap), (bp * d - b * dp - bp * C4 * r + b * C4p * r) / (a * bp - b * ap)];
            var y = [((0 - ap) * d + a * dp + ap * C1 * r - a * C1p * r) / (a * bp - ap * b), ((0 - ap) * d + a * dp + ap * C2 * r - a * C2p * r) / (a * bp - ap * b), ((0 - ap) * d + a * dp + ap * C3 * r - a * C3p * r) / (a * bp - ap * b), ((0 - ap) * d + a * dp + ap * C4 * r - a * C4p * r) / (a * bp - ap * b)];

            var ci = -1;
            var shortest = 100;

            for (var k = 0; k < x.length; k++) {
                var diff = Math.abs(r + c1.r - Math.sqrt(Math.abs(c1.cx - x[k]) * Math.abs(c1.cx - x[k]) + Math.abs(c1.cy - y[k]) * Math.abs(c1.cy - y[k])));
                if (shortest > diff) {
                    shortest = diff;
                    ci = k;
                }
            }
            console.log("x", x, ci, y)
            return { "cx": x[ci], "cy": y[ci], "r": r };
        }

        minRadius = 1
        function generateGasket(c1, c2, c3, depth) {
            if (depth > 0) {
                var inner = getInner(c1, c2, c3);
                if (inner.r < minRadius) {
                    return;
                }
                circles.push(inner);
                console.log(inner)

                generateGasket(c1, c2, inner, depth - 1);
                generateGasket(c1, inner, c3, depth - 1);
                generateGasket(inner, c2, c3, depth - 1);
            }
        }

        circles = []

        function getCircle(r, angle, rad) {
            return { cx: r * Math.cos(angle), cy: r * Math.sin(angle), r: rad }
        }

        circles.push({ cx: 0, cy: 0, r: 1000 })

        sqrt32 = Math.sqrt(3) / 2
        k = 1000 / (1 + sqrt32)

        circles.push(getCircle(k, Math.PI * 0, k * sqrt32))
        circles.push(getCircle(k, Math.PI * 2 / 3, k * sqrt32))
        circles.push(getCircle(k, Math.PI * 4 / 3, k * sqrt32))

        generateGasket(circles[0], circles[1], circles[2], 1)

        console.log(circles)
        paths = circles.slice(0).map(c => this.circlePath(c.cx, c.cy, c.r, 100))
        console.log(paths)

        var scale = 10
        paths = paths.map(path => path.map(p => [p[0] * scale, p[1] * scale]))
        tx = 5000
        ty = 5000
        paths = paths.map(path => path.map(p => [p[0] + tx, p[1] + ty]))
        return paths
    }

    this.sierpinski = function () {
        const that = this;
        sqrt32 = Math.sqrt(3) / 2
        paths = []

        tri = [[-0.5, 0], [0.5, 0], [0, sqrt32], [-0.5, 0]]

        function subdivide(pos, level) {
            var scale = 1 / Math.pow(2.0, level)

            if (level > 5) {
                // paths.push(tri.map(p => [p[0] * scale *2 + pos[0], p[1] * scale *2 + pos[1]]))
                paths.push(that.circlePath(pos[0], pos[1], scale, 10))
                return
            }

            subdivide([pos[0] + tri[0][0] * scale, pos[1] + tri[0][1] * scale], level + 1)
            subdivide([pos[0] + tri[1][0] * scale, pos[1] + tri[1][1] * scale], level + 1)
            subdivide([pos[0] + tri[2][0] * scale, pos[1] + tri[2][1] * scale], level + 1)
        }

        subdivide([0, 0], 1)

        var scale = 10000
        paths = paths.map(path => path.map(p => [p[0] * scale, p[1] * scale]))
        tx = 9000
        ty = 1500
        paths = paths.map(path => path.map(p => [p[0] + tx, p[1] + ty]))

        console.log(paths)
        return paths
    }

    this.cyrb128 = function (str) {
        let h1 = 1779033703, h2 = 3144134277,
            h3 = 1013904242, h4 = 2773480762;
        for (let i = 0, k; i < str.length; i++) {
            k = str.charCodeAt(i);
            h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
            h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
            h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
            h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
        }
        h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
        h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
        h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
        h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
        return [(h1 ^ h2 ^ h3 ^ h4) >>> 0, (h2 ^ h1) >>> 0, (h3 ^ h1) >>> 0, (h4 ^ h1) >>> 0];
    }

    this.mulberry32 = function (a) {
        return function () {
            var t = a += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        }
    }

    // Only one 32-bit component hash is needed for mulberry32.
    this.seed = new Date().toTimeString()
    this.rand = function () { return this.mulberry32(this.cyrb128(this.seed)[0]) };

    this.voronoi = function () {

        function uniquePoints(value, index, array) { return array.findIndex(v => v.x == value.x && v.y == value.y) === index; }
        function mul(a, b) { return { x: a.x * b, y: a.y * b } }
        function add(a, b) { return { x: a.x + b.x, y: a.y + b.y } }
        function lerp(a, b, t) { return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t } }
        function sub(a, b) { return { x: a.x - b.x, y: a.y - b.y } }
        function length(a) { return Math.sqrt(a.x * a.x + a.y * a.y) }
        function sqDistance(a, b) { return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) }
        function getAngle(a, b) { return Math.atan2((a.x - b.x), (a.y - b.y)) }

        function getOutline(cell, inset = 0) {
            verts = cell.halfedges.map(he => [he.edge.va, he.edge.vb]).flat(2)
            verts = verts.filter(uniquePoints);
            center = verts.reduce(add, { x: 0, y: 0 })
            center = mul(center, 1 / verts.length)
            pointsAndAngles = verts.map(p => { return { point: p, angle: getAngle(p, center) } })
            sorted = pointsAndAngles.sort((a, b) => a.angle - b.angle).map(e => e.point)
            sorted.push(sorted[0])
            if (inset > 0) {
                sorted = sorted.map(p => lerp(p, center, inset))
            }
            return sorted
        }


        const rand = this.rand()
        function gauss() {
            let sigma = 2
            let val = 1
            for (var i = 0; i < sigma; i++) {
                val *= 2.0 * (rand() - 0.5)
            }
            return val
        }

        nPoints = 20
        points = []
        for (var i = 0; i < nPoints; i++) {
            p = [gauss(), gauss()]
            points.push(p)
        }
        paths = []
        // paths = points.map(p => this.circlePath(p[0], p[1], 0.01, 30))

        bbox = { xl: -1, xr: 1, yt: -1, yb: 1 }
        voronoi = new Voronoi()
        sites = points.map(p => { return { x: p[0], y: p[1] } })
        diagram = voronoi.compute(sites, bbox);

        diagram.edges.forEach(edge => {
            paths.push([[edge.va.x, edge.va.y], [edge.vb.x, edge.vb.y]])
        });

        //   diagram.edges.forEach(edge => {
        //     if (edge.lSite != null && edge.rSite != null) {
        //         paths.push([[edge.lSite.x, edge.lSite.y], [edge.rSite.x, edge.rSite.y]])
        //     }
        // });

        function subdivide(path) {

            result = []

            for (var i = 0; i < path.length - 1; i++) {
                result.push(path[i])
                result.push(lerp(path[i], path[i + 1], 0.5))
            }

            result.push(path[path.length - 1])
            result.push(lerp(path[path.length - 1], path[1], 0.5))

            return result
        }

        function smooth(path, amount) {
            var start = lerp(path[1], path[path.length - 2], 0.5)
            start = lerp(path[0], start, amount)
            result = [start]

            for (var i = 1; i < path.length - 1; i++) {
                var avg = lerp(path[i - 1], path[i + 1], 0.5)
                result.push(lerp(path[i], avg, amount))
            }

            result.push(start)
            return result
        }

        // paths = paths.concat(
        //     diagram.cells.map(cell => {
        //         var outline = getOutline(cell, 0)

        //         for (let i = 0; i < 3; i++) {
        //             outline = subdivide(outline)
        //         }

        //         for (let i = 0; i < 100; i++) {
        //             outline = smooth(outline, 0.5)
        //         }

        //         return outline.map(p => [p.x, p.y])
        //     })
        // )


        var scale = 80
        paths = paths.map(path => path.map(p => [p[0] * scale, p[1] * scale]))
        tx = 85
        ty = 110
        paths = paths.map(path => path.map(p => [p[0] + tx, p[1] + ty]))

        console.log(paths)
        return paths


    }

}
