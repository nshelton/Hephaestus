
PathUtils = function () {

    this.circlePath = function (cx, cy, radius, segments = 100) {

        var points = []
        for (var i = 0; i < segments; i++) {
            var theta = i / segments * Math.PI * 2
            points.push([radius * Math.cos(theta) + cx, radius * Math.sin(theta) + cy])
        }
        //close loop
        points.push(points[0])

        console.log(points)
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


    this.gridTest = function () {
        let N = 200
        noise.seed(Math.random());
        noiseScale = N / 5
        noiseFreq = 0.002

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

                var px = x
                var py = y

                var valuex = fbm(px, py) * Math.sin(y / N * Math.PI)
                var valuey = fbm(px + 553, py + 123) * Math.sin(y / N * Math.PI)
                row.push([px + valuex, py + valuey])
            }
            points.push(row)
        }
        console.log(points)


        paths = this.createGridFromPoints(points)

        var scale = 8000 / N
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

        field = []
        dim = 50

        for (var y = 0; y < 50; y++) {
            row = []
            for (var x = 0; x < 50; x++) {
                row.push([Math.sin(x / 10), 1])
            }
            field.push(row)
        }

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
        const dd = 20
        const lineLength = 50
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

                    tooclose= false
                    for(var j = 0; j < points.length; j ++) {
                        dx = points[j][0] - pnew[0]
                        dy = points[j][1] - pnew[1]
                        len = Math.sqrt(dx *dx + dy * dy)
                        if(len < 0.01) {
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


        var scale = 5000
        paths = paths.map(path => path.map(p => [p[0] * scale, p[1] * scale]))

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

}

