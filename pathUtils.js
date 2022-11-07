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
        var n = 7
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


}