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

    this.rectPath = function (x, y, w, h) {
        return [
            [x + 0, y + 0],
            [x + w, y + 0],
            [x + w, y + h],
            [x + 0, y + h],
            [x + 0, y + 0]]
    }

    // this.crossPath = function (x, y, w) {
    //     return [
    //         [x + w, y + 0],
    //         [x - w, y + 0],
    //         [x + 0, y - w],
    //         [x + 0, y + w]]
    // }

    this.dragonPath = function () {
        var n = 13
        var c = c1 = c2 = c2x = c2y = x = y = 0, d = 1, n = 1 << n;
        x = y = 0
        var scale = 200
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
        return (path)
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

        var scale = 18000 / N
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
        // paths = paths.map(path => path.map(p => [p[0] + tx, p[1] + ty]))
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

    this.sierpinski  = function () {
        const that = this;
        sqrt32 = Math.sqrt(3) / 2
        paths = []

        tri = [[-0.5, 0], [0.5, 0], [0, sqrt32], [-0.5, 0]]

        function subdivide(pos, level) {

            var scale = 1 / Math.pow(2.0, level)

            if (level > 6) {
                // paths.push(tri.map(p => [p[0] * scale *2 + pos[0], p[1] * scale *2 + pos[1]]))
                paths.push(that.circlePath(pos[0], pos[1], scale, 10))
                return
            }

            subdivide([pos[0] + tri[0][0] * scale, pos[1] + tri[0][1] * scale], level+1)
            subdivide([pos[0] + tri[1][0] * scale, pos[1] + tri[1][1] * scale], level+1)
            subdivide([pos[0] + tri[2][0] * scale, pos[1] + tri[2][1] * scale], level+1)
        }


        subdivide([0,0], 1)


        var scale = 15000
        paths = paths.map(path => path.map(p => [p[0] * scale, p[1] * scale]))
        tx = 5000
        ty = 100
        paths = paths.map(path => path.map(p => [p[0] + tx, p[1] + ty]))

        console.log(paths)
        return paths


    }

    this.cyrb128 = function(str) {
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
        return [(h1^h2^h3^h4)>>>0, (h2^h1)>>>0, (h3^h1)>>>0, (h4^h1)>>>0];
    }


    this.mulberry32 = function(a) {
        return function() {
          var t = a += 0x6D2B79F5;
          t = Math.imul(t ^ t >>> 15, t | 1);
          t ^= t + Math.imul(t ^ t >>> 7, t | 61);
          return ((t ^ t >>> 14) >>> 0) / 4294967296;
        }
    }

    // Only one 32-bit component hash is needed for mulberry32.
    this.rand = function() {return this.mulberry32(this.cyrb128("mouse")[0])};

    this.voronoi  = function () {
        const rand = this.rand()
        function gauss() {
            let sigma = 2
            let val = 1
            for (var i = 0; i < sigma; i ++) {
                val *= 2.0 * (rand() - 0.5)
            }
            return val
        }

        nPoints = 100
        points = []
        for(var i = 0; i < nPoints; i ++) {
            p = [gauss(), gauss()]
            points.push(p)
        }
        paths = []
        paths = points.map(p => this.circlePath(p[0], p[1], 0.01, 30))
        
        bbox= {xl:-1,xr:1,yt:-1,yb:1}
        voronoi = new Voronoi()
        sites = points.map(p => {return {x:p[0], y:p[1]}})
        diagram = voronoi.compute(sites, bbox);

        diagram.edges.forEach(edge => {
           paths.push([[edge.va.x, edge.va.y], [edge.vb.x, edge.vb.y]])
        });

        var scale = 5000
        paths = paths.map(path => path.map(p => [p[0] * scale, p[1] * scale]))
        tx = 3000
        ty = 3000
        paths = paths.map(path => path.map(p => [p[0] + tx, p[1] + ty]))

        console.log(paths)
        return paths


    }

}
