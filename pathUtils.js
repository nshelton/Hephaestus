const { math } = require("canvas-sketch-util")

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


    this.gridTest = function() {
        noiseScale = 1500
        noiseFreq = 0.0002

        function fbm(x, y) {
            return noise.simplex2(x*noiseFreq, y*noiseFreq) * noiseScale;
        }

  
        paths = []
        for(var x = 0; x < 100; x ++) {
            path = []
            for(var y = 0; y < 100; y ++) {
                var px = x * 100
                var py = y * 100
                var value = fbm(px,py) * sin(y/100 * math.PI)
                path.push([px + value, py])
            }
            paths.push(path)
        }


        return(paths)
    }


}

